class ExtrudeEngine3D {
  static from2DEntity(entity2d, height = 1, options = {}) {
    const profile = MeshFactory3D.profileFrom2DEntity(entity2d);
    if (!profile) return null;

    const entity = new Entity3D('EXTRUDE', options.name || 'Extrude');
    entity.params = {
      profile,
      height,
      bevel: options.bevel || false,
      bevelThickness: options.bevelThickness || 0.1,
      bevelSize: options.bevelSize || 0.1,
      source2DId: entity2d.id
    };
    entity.position = { x: 0, y: height / 2, z: 0 };
    entity._meshDirty = true;
    return entity;
  }

  static setHeight(entity, height) {
    if (entity.type !== 'EXTRUDE') return false;
    entity.params.height = height;
    entity.position.y = height / 2;
    return true;
  }
}
