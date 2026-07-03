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
      const entities = this.app.drawing.getVisibleEntities(this.app.layerManager);
      for (let i = entities.length - 1; i >= 0; i--) {
        if (this.app.layerManager.isLocked(entities[i].layerId)) continue;
        if (entities[i].hitTest(snap.x, snap.y, tolerance)) {
          if (!this.entities.includes(entities[i])) {
            this.entities.push(entities[i]);
            this.app.selectionManager.select(entities[i], true);
          }
          break;
        }
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
    this.modifyFn(this.entities, this.basePoint, target, this.name === 'copy');

    if (this.name === 'copy') {
      const copies = this.entities.map(e => e.clone());
      for (const copy of copies) {
        this.app.drawing.addEntity(copy);
      }
      this.app.history.push({ type: 'ADD_ENTITIES', entities: copies });
    } else {
      this.app.history.push({
        type: 'MODIFY_ENTITY',
        entity: this.entities[0],
        before: this.originalStates[0],
        after: this.entities[0].toJSON()
      });
    }
    this.app.requestRender();
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
    const entities = this.app.drawing.getVisibleEntities(this.app.layerManager);
    for (let i = entities.length - 1; i >= 0; i--) {
      if (this.app.layerManager.isLocked(entities[i].layerId)) continue;
      if (entities[i].hitTest(worldPos.x, worldPos.y, tolerance)) {
        this.app.drawing.removeEntity(entities[i]);
        this.app.selectionManager.deselect(entities[i]);
        this.app.history.push({ type: 'REMOVE_ENTITY', entity: entities[i] });
        this.app.requestRender();
        break;
      }
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selected = this.app.selectionManager.getSelected();
      if (selected.length > 0) {
        for (const entity of selected) {
          this.app.drawing.removeEntity(entity);
        }
        this.app.history.push({ type: 'REMOVE_ENTITIES', entities: [...selected] });
        this.app.selectionManager.clearSelection();
        this.app.requestRender();
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
