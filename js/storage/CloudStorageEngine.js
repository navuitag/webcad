class CloudStorageEngine {
  constructor(storageEngine) {
    this.storage = storageEngine;
    this.cloudStoreName = 'cloud_drawings';
    this.db = null;
    this.apiUrl = localStorage.getItem('webcad_cloud_api') || '';
  }

  async init() {
    if (this.storage.db) {
      this.db = this.storage.db;
    }
    await this._ensureCloudStore();
  }

  _ensureCloudStore() {
    return new Promise((resolve) => {
      if (!this.db) { resolve(); return; }
      if (this.db.objectStoreNames.contains(this.cloudStoreName)) {
        resolve();
        return;
      }
      const ver = this.db.version;
      this.db.close();
      const req = indexedDB.open('WebCADDB', ver + 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.cloudStoreName)) {
          db.createObjectStore(this.cloudStoreName, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        this.storage.db = this.db;
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  setApiUrl(url) {
    this.apiUrl = url;
    localStorage.setItem('webcad_cloud_api', url);
  }

  async saveToCloud(drawing, layerManager, blockManager, layoutManager) {
    const data = drawing.toJSON(layerManager, blockManager, layoutManager);
    data.cloudSavedAt = new Date().toISOString();

    await this._putLocal(data);

    if (this.apiUrl) {
      try {
        const res = await fetch(`${this.apiUrl}/drawings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { local: true, remote: true };
      } catch (e) {
        return { local: true, remote: false, error: e.message };
      }
    }
    return { local: true, remote: false };
  }

  async _putLocal(data) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not ready')); return; }
      const tx = this.db.transaction(this.cloudStoreName, 'readwrite');
      tx.objectStore(this.cloudStoreName).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async listCloudDrawings() {
    return new Promise((resolve, reject) => {
      if (!this.db) { resolve([]); return; }
      const tx = this.db.transaction(this.cloudStoreName, 'readonly');
      const req = tx.objectStore(this.cloudStoreName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async loadFromCloud(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not ready')); return; }
      const tx = this.db.transaction(this.cloudStoreName, 'readonly');
      const req = tx.objectStore(this.cloudStoreName).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFromCloud(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not ready')); return; }
      const tx = this.db.transaction(this.cloudStoreName, 'readwrite');
      tx.objectStore(this.cloudStoreName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  generateShareLink(drawing, layerManager, blockManager, layoutManager) {
    const data = drawing.toJSON(layerManager, blockManager, layoutManager);
    const json = JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p) =>
      String.fromCharCode(parseInt(p, 16))
    ));
    const base = location.href.split('#')[0];
    return `${base}#share=${encoded}`;
  }

  parseShareLink() {
    const hash = location.hash;
    if (!hash.startsWith('#share=')) return null;
    try {
      const encoded = hash.slice(7);
      const json = decodeURIComponent(atob(encoded).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  clearShareLink() {
    if (location.hash.startsWith('#share=')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
}
