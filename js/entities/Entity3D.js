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
      opacity: 1,
      transparent: false
    };
    this.params = {};
    this.mesh = null;
  }

  createMesh() {
    return null;
  }

  updateMesh() {
    if (!this.mesh) return;
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    this.mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
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
      params: { ...this.params }
    };
  }

  static fromJSON(data) {
    const entity = new Entity3D(data.type, data.name);
    entity.id = data.id;
    entity.position = { ...data.position };
    entity.rotation = { ...data.rotation };
    entity.scale = { ...data.scale };
    entity.material = { ...data.material };
    entity.params = { ...data.params };
    return entity;
  }

  static createBox(width = 2, height = 2, depth = 2) {
    const entity = new Entity3D('BOX', 'Box');
    entity.params = { width, height, depth };
    return entity;
  }

  static createSphere(radius = 1) {
    const entity = new Entity3D('SPHERE', 'Sphere');
    entity.params = { radius };
    return entity;
  }

  static createCylinder(radiusTop = 1, radiusBottom = 1, height = 2) {
    const entity = new Entity3D('CYLINDER', 'Cylinder');
    entity.params = { radiusTop, radiusBottom, height };
    return entity;
  }

  static createCone(radius = 1, height = 2) {
    const entity = new Entity3D('CONE', 'Cone');
    entity.params = { radius, height };
    return entity;
  }
}
