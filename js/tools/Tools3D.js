class ExtrudeTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'extrude';
    this.height = 2;
  }

  getPrompt() {
    return 'EXTRUDE: Chọn profile 2D kín (rectangle, polyline, circle).';
  }

  onMouseDown(e, worldPos) {
    const tol = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(worldPos.x, worldPos.y, tol);
    if (!hit) return;
    const entity3d = ExtrudeEngine3D.from2DEntity(hit, this.height, {
      layerManager: this.app.layerManager
    });
    if (!entity3d) {
      this.app.cadCore.log('EXTRUDE: Cần hình kín (rectangle, polyline đóng, circle).');
      return;
    }
    this.app.drawing.addEntity3D(entity3d);
    this.app.setMode('3d').then(() => {
      this.app.renderer3D.syncEntities(this.app.drawing.entities3D);
      this.app.renderer3D.fitView();
      this.app.requestRender();
      this.app.logCommand(`EXTRUDE: height=${this.height}`);
      this.app.setTool('select');
    });
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class BooleanTool3D extends Tool {
  constructor(app) {
    super(app);
    this.name = 'boolean3d';
    this.step = 0;
    this.entityA = null;
    this.operation = 'union';
  }

  activate() {
    super.activate();
    this.step = 0;
    this.entityA = null;
  }

  getPrompt() {
    const ops = ['union', 'subtract', 'intersect'];
    if (this.step === 0) return `BOOLEAN (${this.operation}): Chọn solid thứ nhất. Tab đổi op.`;
    return `BOOLEAN (${this.operation}): Chọn solid thứ hai.`;
  }

  onMouseDown3D(e) {
    const id = this.app.renderer3D.pick(e.clientX, e.clientY);
    if (!id) return;
    const entity = this.app.drawing.entities3D.find(en => en.id === id);
    if (!entity) return;

    if (this.step === 0) {
      this.entityA = entity;
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const meshA = this.app.renderer3D.getMesh(this.entityA.id);
      const meshB = this.app.renderer3D.getMesh(entity.id);
      if (!meshA || !meshB) return;

      const result = BooleanEngine3D.operateEntities(this.operation, this.entityA, entity, meshA, meshB);
      if (!result) {
        this.app.cadCore.log('BOOLEAN: Thao tác thất bại.');
      } else {
        this.app.drawing.removeEntity3D(this.entityA);
        this.app.drawing.removeEntity3D(entity);
        this.app.drawing.addEntity3D(result);
        this.app.renderer3D.syncEntities(this.app.drawing.entities3D);
        this.app.logCommand(`BOOLEAN ${this.operation} OK`);
      }
      this.app.setTool('select');
    }
  }

  onKeyDown(e) {
    if (e.key === 'Tab') {
      const ops = ['union', 'subtract', 'intersect'];
      this.operation = ops[(ops.indexOf(this.operation) + 1) % ops.length];
      this.app.updateToolInfo(this.getPrompt());
    }
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class SelectTool3D extends Tool {
  constructor(app) {
    super(app);
    this.name = 'select3d';
  }

  onMouseDown3D(e) {
    const id = this.app.renderer3D.pick(e.clientX, e.clientY);
    const entity = id ? this.app.drawing.entities3D.find(en => en.id === id) : null;
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;

    if (entity) {
      if (additive) {
        this.app.selectionManager3D.toggle(entity);
      } else if (!this.app.selectionManager3D.isSelected(entity)) {
        this.app.selectionManager3D.select(entity);
      }
    } else if (!additive) {
      this.app.selectionManager3D.clearSelection();
    }

    this.app.updatePropertiesPanel();
    this.app.updateStatusBar();
  }
}
