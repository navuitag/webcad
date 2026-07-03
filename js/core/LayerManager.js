class LayerManager {
  constructor() {
    this.layers = [];
    this.currentLayerId = null;
    this._initDefaultLayer();
  }

  _initDefaultLayer() {
    const defaultLayer = this.createLayer('0', '#ffffff');
    this.currentLayerId = defaultLayer.id;
  }

  _generateId() {
    return 'layer_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  }

  createLayer(name, color = '#ffffff') {
    const layer = {
      id: this._generateId(),
      name: name || `Layer ${this.layers.length}`,
      visible: true,
      locked: false,
      color: color
    };
    this.layers.push(layer);
    return layer;
  }

  deleteLayer(id) {
    if (this.layers.length <= 1) return false;
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx === -1) return false;
    this.layers.splice(idx, 1);
    if (this.currentLayerId === id) {
      this.currentLayerId = this.layers[0].id;
    }
    return true;
  }

  renameLayer(id, newName) {
    const layer = this.getLayer(id);
    if (layer) {
      layer.name = newName;
      return true;
    }
    return false;
  }

  getLayer(id) {
    return this.layers.find(l => l.id === id);
  }

  getCurrentLayer() {
    return this.getLayer(this.currentLayerId);
  }

  setCurrentLayer(id) {
    const layer = this.getLayer(id);
    if (layer) {
      this.currentLayerId = id;
      return true;
    }
    return false;
  }

  toggleVisibility(id) {
    const layer = this.getLayer(id);
    if (layer) {
      layer.visible = !layer.visible;
      return layer.visible;
    }
    return null;
  }

  toggleLock(id) {
    const layer = this.getLayer(id);
    if (layer) {
      layer.locked = !layer.locked;
      return layer.locked;
    }
    return null;
  }

  setColor(id, color) {
    const layer = this.getLayer(id);
    if (layer) {
      layer.color = color;
      return true;
    }
    return false;
  }

  isLocked(id) {
    const layer = this.getLayer(id);
    return layer ? layer.locked : true;
  }

  isVisible(id) {
    const layer = this.getLayer(id);
    return layer ? layer.visible : false;
  }

  toJSON() {
    return this.layers.map(l => ({ ...l }));
  }

  fromJSON(layers) {
    if (Array.isArray(layers) && layers.length > 0) {
      this.layers = layers.map(l => ({ ...l }));
      this.currentLayerId = this.layers[0].id;
    }
  }
}
