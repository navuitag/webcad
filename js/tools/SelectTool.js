class SelectTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'select';
    this.isDragging = false;
    this.dragStart = null;
    this.selectionRect = null;
  }

  getPrompt() {
    return 'Chọn đối tượng. Giữ Shift để thêm vào vùng chọn. Kéo để chọn nhiều.';
  }

  onMouseDown(e, worldPos) {
    const tolerance = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(worldPos.x, worldPos.y, tolerance);

    if (hit) {
      if (e.shiftKey) {
        this.app.selectionManager.toggle(hit);
      } else if (!this.app.selectionManager.isSelected(hit)) {
        this.app.selectionManager.select(hit);
      }
      this.isDragging = true;
      this.dragStart = { ...worldPos };
      this.dragOriginalStates = this.app.selectionManager.getSelected().map(ent => ent.toJSON());
    } else {
      if (!e.shiftKey) {
        this.app.selectionManager.clearSelection();
      }
      this.isDragging = true;
      this.dragStart = { ...worldPos };
      this.selectionRect = { x1: worldPos.x, y1: worldPos.y, x2: worldPos.x, y2: worldPos.y };
    }
    this.app.updatePropertiesPanel();
  }

  onMouseMove(e, worldPos) {
    if (!this.isDragging || !this.dragStart) return;

    if (this.selectionRect) {
      this.selectionRect.x2 = worldPos.x;
      this.selectionRect.y2 = worldPos.y;
    } else {
      const dx = worldPos.x - this.dragStart.x;
      const dy = worldPos.y - this.dragStart.y;
      const selected = this.app.selectionManager.getSelected();
      for (const entity of selected) {
        entity.move(dx, dy);
      }
      this.dragStart = { ...worldPos };
      this.app.requestRender();
    }
  }

  onMouseUp(e, worldPos) {
    if (this.selectionRect) {
      const minX = Math.min(this.selectionRect.x1, this.selectionRect.x2);
      const maxX = Math.max(this.selectionRect.x1, this.selectionRect.x2);
      const minY = Math.min(this.selectionRect.y1, this.selectionRect.y2);
      const maxY = Math.max(this.selectionRect.y1, this.selectionRect.y2);

      const entities = this.app.drawing.getVisibleEntities(this.app.layerManager);
      for (const entity of entities) {
        const bb = entity.getBoundingBox();
        if (bb && bb.minX >= minX && bb.maxX <= maxX && bb.minY >= minY && bb.maxY <= maxY) {
          this.app.selectionManager.select(entity, true);
        }
      }
      this.selectionRect = null;
      this.app.updatePropertiesPanel();
    } else if (this.isDragging && this.dragStart && this.dragOriginalStates) {
      const dx = worldPos.x - this.dragStart.x;
      const dy = worldPos.y - this.dragStart.y;
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        const selected = this.app.selectionManager.getSelected();
        if (selected.length > 0) {
          for (let i = 0; i < selected.length; i++) {
            const restored = EntityFactory.create(this.dragOriginalStates[i]);
            Object.assign(selected[i], restored);
            selected[i].move(dx, dy);
          }
          this.app.history.push({
            type: 'MODIFY_ENTITY',
            entity: selected[0],
            before: this.dragOriginalStates[0],
            after: selected[0].toJSON()
          });
        }
      }
      this.dragOriginalStates = null;
    }
    this.isDragging = false;
    this.dragStart = null;
    this.app.requestRender();
  }
}
