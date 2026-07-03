class StorageEngine {
  static DB_NAME = 'WebCADDB';
  static DB_VERSION = 2;
  static STORE_DRAWINGS = 'drawings';
  static STORE_CLOUD = 'cloud_drawings';

  constructor() {
    this.dbName = StorageEngine.DB_NAME;
    this.storeName = StorageEngine.STORE_DRAWINGS;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, StorageEngine.DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(StorageEngine.STORE_DRAWINGS)) {
          db.createObjectStore(StorageEngine.STORE_DRAWINGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(StorageEngine.STORE_CLOUD)) {
          db.createObjectStore(StorageEngine.STORE_CLOUD, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async save(drawing, layerManager, blockManager, layoutManager, styleManager, xrefManager) {
    const data = drawing.toJSON(layerManager, blockManager, layoutManager, styleManager, xrefManager);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(data);
      request.onsuccess = () => {
        localStorage.setItem('webcad_last_drawing', data.id);
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async load(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async list() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  saveToFile(drawing, layerManager, blockManager, layoutManager, styleManager, xrefManager) {
    const data = drawing.toJSON(layerManager, blockManager, layoutManager, styleManager, xrefManager);
    data.format = 'webcad-json';
    data.formatVersion = data.version || '1.2';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: FormatRegistry.formats.wcad.mime });
    ExportEngine._downloadBlob(blob, FormatRegistry.filename(drawing.name, 'wcad'));
  }

  loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  autosave(drawing, layerManager, blockManager, layoutManager, styleManager, xrefManager) {
    try {
      const data = drawing.toJSON(layerManager, blockManager, layoutManager, styleManager, xrefManager);
      localStorage.setItem('webcad_autosave', JSON.stringify(data));
    } catch (e) {
      console.warn('Autosave failed:', e);
    }
  }

  loadAutosave() {
    try {
      const data = localStorage.getItem('webcad_autosave');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
}
