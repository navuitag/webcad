/**
 * VersionHistoryEngine — snapshot chain cho project
 */
class VersionHistoryEngine {
  constructor(app) {
    this.app = app;
    this.maxSnapshots = 20;
  }

  _key(workspaceId) {
    return `webcad_versions_${workspaceId || 'default'}`;
  }

  snapshot(label = '') {
    const ws = this.app.platform?.collab?.workspace?.getCurrent();
    const data = this.app.cadCore?.fileFormat?.serialize();
    if (!data) return null;

    const entry = {
      id: 'ver_' + Date.now().toString(36),
      label: label || `Snapshot ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      data
    };

    const key = this._key(ws?.id);
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.unshift(entry);
    if (list.length > this.maxSnapshots) list.length = this.maxSnapshots;
    localStorage.setItem(key, JSON.stringify(list));
    return entry;
  }

  list(workspaceId) {
    const key = this._key(workspaceId);
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  restore(versionId, workspaceId) {
    const versions = this.list(workspaceId);
    const ver = versions.find(v => v.id === versionId);
    if (!ver) return { success: false, message: 'Version not found' };
    this.app._loadDrawingData(ver.data);
    return { success: true, version: ver };
  }
}
