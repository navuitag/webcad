class ExtrudeEngine3D {
  static from2DEntity(entity2d, height = 1, options = {}) {
    const raw = MeshFactory3D.profileFrom2DEntity(entity2d);
    if (!raw) return null;

    const { profile, center } = MeshFactory3D.centerProfile(raw);

    const entity = new Entity3D('EXTRUDE', options.name || 'Extrude');
    entity.params = {
      profile,
      height,
      bevel: options.bevel || false,
      bevelThickness: options.bevelThickness || 0.1,
      bevelSize: options.bevelSize || 0.1,
      source2DId: entity2d.id,
      archType: entity2d.archType || null
    };

    if (entity2d.getColor && options.layerManager) {
      try {
        entity.material.color = entity2d.getColor(options.layerManager);
      } catch (_) { /* keep default */ }
    } else if (entity2d.style?.color) {
      entity.material.color = entity2d.style.color;
    }

    entity.position = { x: center.x, y: height / 2, z: center.y };
    entity._meshDirty = true;
    return entity;
  }

  static setHeight(entity, height) {
    if (entity.type !== 'EXTRUDE') return false;
    entity.params.height = height;
    entity.position.y = height / 2;
    entity.markDirty();
    return true;
  }
}
