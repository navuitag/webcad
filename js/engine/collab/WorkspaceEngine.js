/**
 * WorkspaceEngine — Project Workspace (local + cloud metadata)
 */
class WorkspaceEngine {
  constructor(app) {
    this.app = app;
    this.current = null;
    this.workspaces = JSON.parse(localStorage.getItem('webcad_workspaces') || '[]');
  }

  create(name, options = {}) {
    const ws = {
      id: 'ws_' + Date.now().toString(36),
      name: name || 'Untitled Project',
      drawingId: this.app.drawing.id,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      cloudId: options.cloudId || null,
      members: options.members || []
    };
    this.workspaces.push(ws);
    this.current = ws;
    this._save();
    return ws;
  }

  open(id) {
    const ws = this.workspaces.find(w => w.id === id);
    if (ws) {
      this.current = ws;
      ws.modifiedAt = new Date().toISOString();
      this._save();
    }
    return ws;
  }

  list() {
    return [...this.workspaces];
  }

  getCurrent() {
    return this.current;
  }

  touch() {
    if (this.current) {
      this.current.modifiedAt = new Date().toISOString();
      this.current.drawingId = this.app.drawing.id;
      this._save();
    }
  }

  _save() {
    localStorage.setItem('webcad_workspaces', JSON.stringify(this.workspaces));
  }
}
