class Tool3D extends Tool {
  constructor(app, type) {
    super(app);
    this.name = type;
    this.entityType = type.replace('3d', '').toUpperCase();
  }

  getPrompt() {
    return `3D ${this.entityType}: Click để đặt đối tượng tại vị trí.`;
  }

  onMouseDown(e, worldPos) {
    let entity;
    switch (this.entityType) {
      case 'BOX':
        entity = Entity3D.createBox(2, 2, 2);
        break;
      case 'SPHERE':
        entity = Entity3D.createSphere(1);
        break;
      case 'CYLINDER':
        entity = Entity3D.createCylinder(1, 1, 2);
        break;
      case 'CONE':
        entity = Entity3D.createCone(1, 2);
        break;
      default:
        return;
    }

    const count = this.app.drawing.entities3D.length;
    entity.position = {
      x: (count % 5) * 3 - 6,
      y: 1,
      z: Math.floor(count / 5) * 3 - 6
    };

    this.app.drawing.addEntity3D(entity);
    this.app.renderer3D.syncEntities(this.app.drawing.entities3D);
    this.app.requestRender();
    this.app.updateStatusBar();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}
