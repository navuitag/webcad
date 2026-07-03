class CollaborationEngine {
  constructor(app) {
    this.app = app;
    this.userId = 'user_' + Math.random().toString(36).substr(2, 6);
    this.userName = localStorage.getItem('webcad_username') || 'User';
    this.connected = false;
    this.peerCount = 0;
    this.ws = null;
    this.channel = null;
    this.listeners = [];
  }

  init() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('webcad-collab');
      this.channel.onmessage = (e) => this._onMessage(e.data);
      this.connected = true;
    }
  }

  setUserName(name) {
    this.userName = name;
    localStorage.setItem('webcad_username', name);
  }

  connect(serverUrl) {
    if (this.ws) this.disconnect();
    if (!serverUrl) return;

    try {
      this.ws = new WebSocket(serverUrl);
      this.ws.onopen = () => {
        this.connected = true;
        this._notify({ type: 'connected' });
        this.send({ type: 'JOIN', userId: this.userId, userName: this.userName });
        this.broadcastFullSync();
      };
      this.ws.onmessage = (e) => {
        try { this._onMessage(JSON.parse(e.data)); } catch (_) {}
      };
      this.ws.onclose = () => {
        this.connected = this.channel !== null;
        this._notify({ type: 'disconnected' });
      };
      this.ws.onerror = () => {
        this.app.logCommand('Collab: Không kết nối được WebSocket server.');
      };
    } catch (e) {
      this.app.logCommand('Collab: ' + e.message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    data.userId = this.userId;
    data.userName = this.userName;
    data.timestamp = Date.now();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
    if (this.channel) {
      this.channel.postMessage(data);
    }
  }

  broadcastEntityAdded(entity) {
    this.send({ type: 'ADD_ENTITY', entity: entity.toJSON() });
  }

  broadcastEntityRemoved(entity) {
    this.send({ type: 'REMOVE_ENTITY', entityId: entity.id });
  }

  broadcastFullSync() {
    const data = this.app.drawing.toJSON(
      this.app.layerManager, this.app.blockManager, this.app.layoutManager
    );
    this.send({ type: 'FULL_SYNC', drawing: data });
  }

  _onMessage(data) {
    if (data.userId === this.userId) return;

    switch (data.type) {
      case 'JOIN':
        this.peerCount++;
        this._notify({ type: 'peer_join', userName: data.userName });
        break;
      case 'ADD_ENTITY': {
        const entity = EntityFactory.create(data.entity);
        if (entity) {
          this.app.drawing.addEntity(entity);
          this.app.requestRender();
          this.app.updateStatusBar();
        }
        break;
      }
      case 'REMOVE_ENTITY':
        this.app.drawing.entities = this.app.drawing.entities.filter(
          e => e.id !== data.entityId
        );
        this.app.requestRender();
        break;
      case 'FULL_SYNC':
        if (data.drawing) {
          this.app._loadDrawingData(data.drawing);
          this.app.logCommand(`Collab: Đồng bộ từ ${data.userName || 'peer'}`);
        }
        break;
    }
    this._notify(data);
  }

  onEvent(callback) {
    this.listeners.push(callback);
  }

  _notify(event) {
    for (const cb of this.listeners) cb(event);
  }

  getStatus() {
    return {
      connected: this.connected,
      userName: this.userName,
      peerCount: this.peerCount,
      wsActive: this.ws && this.ws.readyState === WebSocket.OPEN
    };
  }
}
