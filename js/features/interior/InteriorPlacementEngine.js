/**
 * InteriorPlacementEngine — đặt nội thất có xoay & quy đổi đơn vị (SDD Phase 1)
 */
class InteriorPlacementEngine {
  static worldScale(app) {
    const wu = app.drawing.worldUnit || app.drawing.unit || 'mm';
    return UnitEngine.fromDisplay(1, wu, 'cm');
  }

  static worldFromCm(cm, app) {
    return cm * InteriorPlacementEngine.worldScale(app);
  }

  static insert(app, templateId, insertPoint = { x: 0, y: 0 }, options = {}) {
    const tpl = BlockLibrary.templates[templateId];
    if (!tpl) return { success: false, message: 'Không tìm thấy mẫu' };

    const scale = options.scale ?? InteriorPlacementEngine.worldScale(app);
    const rotation = options.rotation ?? 0;
    const groupId = options.groupId || ('int_' + Date.now().toString(36));
    const asset = InteriorAssetManager.get(templateId);
    const defs = typeof tpl.entities === 'function' ? tpl.entities(tpl.width, tpl.height) : tpl.entities;
    const layerId = app.layerManager.currentLayerId;
    const entities = [];

    for (const def of defs) {
      const e = BlockLibrary._createEntity(def, layerId);
      if (!e) continue;
      if (scale !== 1) InteriorPlacementEngine._scaleEntity(e, scale);
      e.move(insertPoint.x, insertPoint.y);
      ArchPlanStyle.styleBlockEntity(e, templateId);
      InteriorPlacementEngine._tagEntity(e, templateId, groupId, asset, options.styleId);
      app.drawing.addEntity(e);
      entities.push(e);
    }

    if (rotation && entities.length) {
      InteriorPlacementEngine.rotateEntities(entities, insertPoint.x, insertPoint.y, rotation);
    }

    if (entities.length && app.cadCore?.history) {
      app.cadCore.history.push(entities.length === 1
        ? { type: 'ADD_ENTITY', entity: entities[0] }
        : { type: 'ADD_ENTITIES', entities });
    }

    app.requestRender();
    app.updateStatusBar();
    return { success: true, entities, name: tpl.name, id: templateId, groupId };
  }

  static rotateEntities(entities, cx, cy, angleRad) {
    for (const e of entities) e.rotate(cx, cy, angleRad);
  }

  static _scaleEntity(entity, factor) {
    entity.scale(0, 0, factor);
  }

  static _tagEntity(entity, assetId, groupId, asset, styleId) {
    entity.interiorAssetId = assetId;
    entity.interiorGroupId = groupId;
    entity.interiorCategory = asset?.category || null;
    entity.blockTemplateId = assetId;
    if (styleId) entity.interiorStyleId = styleId;
  }

  static restoreTags(entity, data) {
    if (data.interiorAssetId) entity.interiorAssetId = data.interiorAssetId;
    if (data.interiorGroupId) entity.interiorGroupId = data.interiorGroupId;
    if (data.interiorCategory) entity.interiorCategory = data.interiorCategory;
    if (data.interiorStyleId) entity.interiorStyleId = data.interiorStyleId;
    if (data.interiorMaterialId) entity.interiorMaterialId = data.interiorMaterialId;
  }

  static patchJSON(entity, json) {
    if (entity.interiorAssetId) json.interiorAssetId = entity.interiorAssetId;
    if (entity.interiorGroupId) json.interiorGroupId = entity.interiorGroupId;
    if (entity.interiorCategory) json.interiorCategory = entity.interiorCategory;
    if (entity.interiorStyleId) json.interiorStyleId = entity.interiorStyleId;
    if (entity.interiorMaterialId) json.interiorMaterialId = entity.interiorMaterialId;
    return json;
  }
}
