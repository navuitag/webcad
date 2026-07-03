/**
 * LayerBlockManager — quản lý layer và block thống nhất
 */
class LayerBlockManager {
  constructor(layerManager, blockManager) {
    this.layerManager = layerManager;
    this.blockManager = blockManager;
  }

  getCurrentLayerId() {
    return this.layerManager.currentLayerId;
  }

  getCurrentLayer() {
    return this.layerManager.getCurrentLayer();
  }

  setCurrentLayer(id) {
    return this.layerManager.setCurrentLayer(id);
  }

  createLayer(name, color) {
    return this.layerManager.createLayer(name, color);
  }

  isLocked(layerId) {
    return this.layerManager.isLocked(layerId);
  }

  isVisible(layerId) {
    return this.layerManager.isVisible(layerId);
  }

  createBlock(name, entities, basePoint, attributes) {
    return this.blockManager.createBlock(name, entities, basePoint, attributes);
  }

  instantiateBlock(name, insertPoint, rotation = 0, scale = 1, attributes = {}) {
    return this.blockManager.instantiate(name, insertPoint, rotation, scale, attributes);
  }

  listBlocks() {
    return this.blockManager.listBlocks();
  }

  layersToJSON() {
    return this.layerManager.toJSON();
  }

  blocksToJSON() {
    return this.blockManager.toJSON();
  }

  layersFromJSON(data) {
    this.layerManager.fromJSON(data);
  }

  blocksFromJSON(data) {
    this.blockManager.fromJSON(data);
  }
}
