class Drawing {
  constructor() {
    this.id = this._generateId();
    this.name = 'Untitled';
    this.unit = 'mm';
    this.scale = 1;
    this.entities = [];
    this.entities3D = [];
    this.view = {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      gridSize: 10,
      showGrid: true,
      ortho: false,
      snapEnabled: true
    };
    this.metadata = {
      author: '',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
  }

  _generateId() {
    return 'dwg_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  addEntity(entity) {
    this.entities.push(entity);
    this.metadata.modifiedAt = new Date().toISOString();
    return entity;
  }

  addEntity3D(entity) {
    this.entities3D.push(entity);
    this.metadata.modifiedAt = new Date().toISOString();
    return entity;
  }

  removeEntity(entity) {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
      this.metadata.modifiedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  removeEntity3D(entity) {
    const idx = this.entities3D.indexOf(entity);
    if (idx !== -1) {
      this.entities3D.splice(idx, 1);
      this.metadata.modifiedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  updateEntity(entity, data) {
    Object.assign(entity, data);
    this.metadata.modifiedAt = new Date().toISOString();
  }

  getEntitiesByLayer(layerId) {
    return this.entities.filter(e => e.layerId === layerId);
  }

  getVisibleEntities(layerManager) {
    return this.entities.filter(e => {
      const layer = layerManager.getLayer(e.layerId);
      return layer && layer.visible;
    });
  }

  getBoundingBox() {
    if (this.entities.length === 0) {
      return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const entity of this.entities) {
      const bb = entity.getBoundingBox();
      if (bb) {
        minX = Math.min(minX, bb.minX);
        minY = Math.min(minY, bb.minY);
        maxX = Math.max(maxX, bb.maxX);
        maxY = Math.max(maxY, bb.maxY);
      }
    }
    return { minX, minY, maxX, maxY };
  }

  worldToScreen(wx, wy, canvasWidth, canvasHeight) {
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    return {
      x: (wx * this.view.zoom) + this.view.offsetX + cx,
      y: (-wy * this.view.zoom) + this.view.offsetY + cy
    };
  }

  screenToWorld(sx, sy, canvasWidth, canvasHeight) {
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    return {
      x: (sx - this.view.offsetX - cx) / this.view.zoom,
      y: -(sy - this.view.offsetY - cy) / this.view.zoom
    };
  }

  toJSON(layerManager, blockManager, layoutManager, styleManager, xrefManager) {
    return {
      version: '1.2',
      id: this.id,
      name: this.name,
      unit: this.unit,
      scale: this.scale,
      layers: layerManager.toJSON(),
      entities2D: this.entities.map(e => e.toJSON()),
      entities3D: this.entities3D.map(e => e.toJSON()),
      blocks: blockManager ? blockManager.toJSON() : [],
      layouts: layoutManager ? layoutManager.toJSON() : null,
      styles: styleManager ? styleManager.toJSON() : null,
      xrefs: xrefManager ? xrefManager.toJSON() : [],
      view: { ...this.view },
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(data, layerManager, blockManager, layoutManager, styleManager, xrefManager) {
    const drawing = new Drawing();
    drawing.id = data.id || drawing.id;
    drawing.name = data.name || 'Untitled';
    drawing.unit = data.unit || 'mm';
    drawing.scale = data.scale || 1;
    drawing.view = { ...drawing.view, ...(data.view || {}) };
    drawing.metadata = { ...drawing.metadata, ...(data.metadata || {}) };

    if (data.layers) {
      layerManager.fromJSON(data.layers);
    }

    if (data.entities2D) {
      drawing.entities = data.entities2D.map(eData => EntityFactory.create(eData));
    }

    if (data.entities3D) {
      drawing.entities3D = data.entities3D.map(eData => Entity3DFactory.create(eData));
    }

    if (blockManager && data.blocks) {
      blockManager.fromJSON(data.blocks);
    }

    if (layoutManager && data.layouts) {
      layoutManager.fromJSON(data.layouts);
    }

    if (styleManager && data.styles) {
      styleManager.fromJSON(data.styles);
    }

    if (xrefManager && data.xrefs) {
      xrefManager.fromJSON(data.xrefs);
    }

    return drawing;
  }

  clear() {
    this.entities = [];
    this.entities3D = [];
    this.metadata.modifiedAt = new Date().toISOString();
  }
}

const EntityFactory = {
  create(data) {
    switch (data.type) {
      case 'LINE': return LineEntity.fromJSON(data);
      case 'CIRCLE': return CircleEntity.fromJSON(data);
      case 'ARC': return ArcEntity.fromJSON(data);
      case 'POLYLINE': return PolylineEntity.fromJSON(data);
      case 'RECTANGLE': return RectangleEntity.fromJSON(data);
      case 'TEXT': return TextEntity.fromJSON(data);
      case 'DIMENSION': return DimensionEntity.fromJSON(data);
      case 'HATCH': return HatchEntity.fromJSON(data);
      default: return null;
    }
  }
};

const Entity3DFactory = {
  create(data) {
    return Entity3D.fromJSON(data);
  }
};
