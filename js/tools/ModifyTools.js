class ModifyTool extends Tool {
  constructor(app, name, modifyFn) {
    super(app);
    this.name = name;
    this.modifyFn = modifyFn;
    this.step = 0;
    this.basePoint = null;
    this.entities = [];
    this.originalStates = [];
  }

  activate() {
    super.activate();
    this.step = 0;
    this.basePoint = null;
    this.entities = [];
    this.originalStates = [];
  }

  getPrompt() {
    const names = { move: 'MOVE', copy: 'COPY', rotate: 'ROTATE', scale: 'SCALE' };
    const cmd = names[this.name] || this.name.toUpperCase();
    if (this.step === 0) return `${cmd}: Chọn đối tượng. Enter khi hoàn tất.`;
    if (this.step === 1) return `${cmd}: Chọn điểm gốc.`;
    return `${cmd}: Chọn điểm đích.`;
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      const tolerance = 5 / this.app.drawing.view.zoom;
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
      if (hit && !this.entities.includes(hit)) {
        this.entities.push(hit);
        this.app.selectionManager.select(hit, true);
      }
    } else if (this.step === 1) {
      this.basePoint = { x: snap.x, y: snap.y };
      this.originalStates = this.entities.map(e => e.toJSON());
      this.step = 2;
      this.app.updateToolInfo(this.getPrompt());
    } else if (this.step === 2) {
      this._applyModify(snap);
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 2 && this.basePoint) {
      const snap = this._getSnappedPos(worldPos);
      this._restoreOriginal();
      this.modifyFn(this.entities, this.basePoint, snap, false);
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter' && this.step === 0 && this.entities.length > 0) {
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    }
    if (e.key === 'Escape') this.app.setTool('select');
  }

  _restoreOriginal() {
    for (let i = 0; i < this.entities.length; i++) {
      const restored = EntityFactory.create(this.originalStates[i]);
      Object.assign(this.entities[i], restored);
    }
  }

  _applyModify(target) {
    this._restoreOriginal();
    const dx = target.x - this.basePoint.x;
    const dy = target.y - this.basePoint.y;

    if (this.name === 'copy') {
      this._run('COPY', { entities: this.entities, dx, dy });
    } else if (this.name === 'move') {
      this.app.cadCore.entities.move(this.entities, dx, dy);
      this.app.history.push({
        type: 'MODIFY_ENTITY',
        entity: this.entities[0],
        before: this.originalStates[0],
        after: this.entities[0].toJSON()
      });
      this.app.requestRender();
    } else if (this.name === 'rotate') {
      const angle = GeometryKernel.angle(this.basePoint.x, this.basePoint.y, target.x, target.y);
      this.app.cadCore.entities.rotate(this.entities, this.basePoint.x, this.basePoint.y, angle);
      this.app.history.push({
        type: 'MODIFY_ENTITY',
        entity: this.entities[0],
        before: this.originalStates[0],
        after: this.entities[0].toJSON()
      });
      this.app.requestRender();
    } else if (this.name === 'scale') {
      const factor = GeometryKernel.distance(this.basePoint.x, this.basePoint.y, target.x, target.y) / 10;
      this.app.cadCore.entities.scale(this.entities, this.basePoint.x, this.basePoint.y, factor);
      this.app.history.push({
        type: 'MODIFY_ENTITY',
        entity: this.entities[0],
        before: this.originalStates[0],
        after: this.entities[0].toJSON()
      });
      this.app.requestRender();
    }
  }
}

class DeleteTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'delete';
  }

  getPrompt() {
    return 'ERASE: Chọn đối tượng cần xóa.';
  }

  onMouseDown(e, worldPos) {
    const tolerance = 5 / this.app.drawing.view.zoom;
    const entity = this.app.cadCore.entities.hitTest(worldPos.x, worldPos.y, tolerance);
    if (entity) {
      this._run('DELETE', { entities: [entity] });
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selected = this.app.selectionManager.getSelected();
      if (selected.length > 0) {
        this._run('DELETE', { entities: [...selected] });
        this.app.selectionManager.clearSelection();
      }
    }
  }
}

const ModifyTools = {
  createMoveTool(app) {
    return new ModifyTool(app, 'move', (entities, base, target) => {
      const dx = target.x - base.x;
      const dy = target.y - base.y;
      for (const e of entities) e.move(dx, dy);
    });
  },
  createCopyTool(app) {
    return new ModifyTool(app, 'copy', (entities, base, target) => {
      const dx = target.x - base.x;
      const dy = target.y - base.y;
      for (const e of entities) e.move(dx, dy);
    });
  },
  createRotateTool(app) {
    return new ModifyTool(app, 'rotate', (entities, base, target) => {
      const angle = GeometryEngine.angle(base.x, base.y, target.x, target.y);
      for (const e of entities) e.rotate(base.x, base.y, angle);
    });
  },
  createScaleTool(app) {
    return new ModifyTool(app, 'scale', (entities, base, target) => {
      const dist1 = 10;
      const dist2 = GeometryEngine.distance(base.x, base.y, target.x, target.y);
      const factor = dist2 / dist1;
      for (const e of entities) e.scale(base.x, base.y, factor);
    });
  }
};
