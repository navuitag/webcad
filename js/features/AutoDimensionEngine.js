/**
 * AutoDimensionEngine — tự động ghi kích thước
 */
class AutoDimensionEngine {
  static dimensionEntity(app, entity) {
    const dims = app.cadCore.dimensions.autoDimension(entity);
    if (!dims) return [];
    const list = Array.isArray(dims) ? dims : [dims];
    for (const d of list) {
      app.drawing.addEntity(d);
      app.cadCore.history?.push({ type: 'ADD_ENTITY', entity: d });
    }
    app.requestRender();
    return list;
  }

  static dimensionAll(app) {
    const entities = app.drawing.getVisibleEntities(app.layerManager);
    const added = [];
    for (const e of entities) {
      if (['LINE', 'RECTANGLE', 'CIRCLE', 'POLYLINE'].includes(e.type)) {
        const dims = AutoDimensionEngine.dimensionEntity(app, e);
        added.push(...dims);
      }
    }
    return { success: true, count: added.length };
  }

  static dimensionSelection(app) {
    const selected = app.selectionManager.getSelected();
    if (!selected.length) return { success: false, message: 'Chọn đối tượng trước' };
    let count = 0;
    for (const e of selected) {
      const dims = AutoDimensionEngine.dimensionEntity(app, e);
      count += dims.length;
    }
    return { success: true, count };
  }
}
