class Entity3D {
  constructor(type, name) {
    this.id = 'ent3d_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    this.type = type;
    this.name = name || type;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
    this.material = {
      color: '#4fc3f7',
      metalness: 0.1,
      roughness: 0.6,
      opacity: 1,
      transparent: false
    };
    this.params = {};
    this.mesh = null;
    this._meshDirty = true;
    this.selected = false;
  }

  markDirty() {
    this._meshDirty = true;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      position: { ...this.position },
      rotation: { ...this.rotation },
      scale: { ...this.scale },
      material: { ...this.material },
      params: JSON.parse(JSON.stringify(this.params))
    };
  }

  static fromJSON(data) {
    const entity = new Entity3D(data.type, data.name);
    entity.id = data.id;
    entity.position = { ...data.position };
    entity.rotation = { ...data.rotation };
    entity.scale = { ...data.scale };
    entity.material = { ...data.material };
    entity.params = data.params || {};
    entity._meshDirty = true;
    return entity;
  }

  static createBox(width = 2, height = 2, depth = 2) {
    const entity = new Entity3D('BOX', 'Box');
    entity.params = { width, height, depth };
    entity.position.y = height / 2;
    return entity;
  }

  static createSphere(radius = 1) {
    const entity = new Entity3D('SPHERE', 'Sphere');
    entity.params = { radius };
    entity.position.y = radius;
    return entity;
  }

  static createCylinder(radiusTop = 1, radiusBottom = 1, height = 2) {
    const entity = new Entity3D('CYLINDER', 'Cylinder');
    entity.params = { radiusTop, radiusBottom, height };
    entity.position.y = height / 2;
    return entity;
  }

  static createCone(radius = 1, height = 2) {
    const entity = new Entity3D('CONE', 'Cone');
    entity.params = { radius, height };
    entity.position.y = height / 2;
    return entity;
  }

  static createExtrude(profile, height = 1, options = {}) {
    const entity = new Entity3D('EXTRUDE', options.name || 'Extrude');
    entity.params = { profile, height, ...options };
    entity.position.y = height / 2;
    return entity;
  }

  static createBoolean(operation, geometry, sourceIds = []) {
    const entity = new Entity3D('BOOLEAN', `Boolean_${operation}`);
    entity.params = { operation, geometry, sourceIds };
    return entity;
  }
}
