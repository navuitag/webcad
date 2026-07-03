class Tool3D extends Tool {
  constructor(app, type) {
    super(app);
    this.name = type;
    this.entityType = type.replace('3d', '').toUpperCase();
  }

  getPrompt() {
    return `3D ${this.entityType}: Click trên mặt phẳng để đặt.`;
  }

  _groundPoint(clientX, clientY) {
    const r = this.app.renderer3D;
    if (!r.initialized) return { x: 0, y: 0, z: 0 };
    const rect = r.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    r.raycaster.setFromCamera(pointer, r.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    r.raycaster.ray.intersectPlane(plane, target);
    return target ? { x: target.x, y: 0, z: target.z } : { x: 0, y: 0, z: 0 };
  }

  onMouseDown3D(e) {
    const pt = this._groundPoint(e.clientX, e.clientY);
    let entity;
    switch (this.entityType) {
      case 'BOX': entity = Entity3D.createBox(2, 2, 2); break;
      case 'SPHERE': entity = Entity3D.createSphere(1); break;
      case 'CYLINDER': entity = Entity3D.createCylinder(1, 1, 2); break;
      case 'CONE': entity = Entity3D.createCone(1, 2); break;
      default: return;
    }
    entity.position = { x: pt.x, y: entity.position.y, z: pt.z };
    const preset = this.app.renderer3D.materialManager.presets[this.app.renderer3D.materialManager.currentPreset];
    if (preset) Object.assign(entity.material, preset);
    this.app.drawing.addEntity3D(entity);
    this.app.renderer3D.syncEntities(this.app.drawing.entities3D);
    this.app.requestRender();
    this.app.updateStatusBar();
    this.app.updatePropertiesPanel();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}
