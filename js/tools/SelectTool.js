class SelectTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'select';
    this.isDragging = false;
    this.dragStart = null;
    this.dragScreenStart = null;
    this.selectionRect = null;
    this.dragOriginalStates = null;
    this.resizeHandle = null;
    this.resizeEntity = null;
    this.resizeAnchor = null;
  }

  getPrompt() {
    return 'Chọn đối tượng. Kéo grip góc/cạnh để đổi kích thước. Shift/Ctrl+click thêm/bỏ chọn.';
  }

  _isAdditive(e) {
    return e.shiftKey || e.ctrlKey || e.metaKey;
  }

  _handleTolerance() {
    return 8 / this.app.drawing.view.zoom;
  }

  _tryStartResize(worldPos) {
    const selected = this.app.selectionManager.getSelected();
    if (selected.length !== 1 || typeof SelectionResizeEngine === 'undefined') return false;
    const entity = selected[0];
    if (!SelectionResizeEngine.canResize(entity)) return false;

    const handles = SelectionResizeEngine.getHandles(entity);
    const hit = SelectionResizeEngine.hitTest(handles, worldPos.x, worldPos.y, this._handleTolerance());
    if (!hit) return false;

    const bb = entity.getBoundingBox();
    this.resizeHandle = hit.id;
    this.resizeEntity = entity;
    this.resizeAnchor = {
      minX: bb.minX,
      minY: bb.minY,
      maxX: bb.maxX,
      maxY: bb.maxY,
      sourceBb: { minX: bb.minX, minY: bb.minY, maxX: bb.maxX, maxY: bb.maxY }
    };
    this.isDragging = true;
    this.dragOriginalStates = [entity.toJSON()];
    this.dragStart = { ...worldPos };
    return true;
  }

  onMouseDown(e, worldPos) {
    if (this._tryStartResize(worldPos)) {
      this.app.canvasContainer.style.cursor = SelectionResizeEngine.getHandles(this.resizeEntity)
        .find(h => h.id === this.resizeHandle)?.cursor || 'crosshair';
      this.app.updatePropertiesPanel();
      this.app.updateStatusBar();
      return;
    }

    const tolerance = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(worldPos.x, worldPos.y, tolerance);
    const additive = this._isAdditive(e);

    if (hit) {
      if (additive) {
        this.app.selectionManager.toggle(hit);
      } else if (!this.app.selectionManager.isSelected(hit)) {
        this.app.selectionManager.select(hit);
      }
      this.isDragging = true;
      this.dragStart = { ...worldPos };
      this.dragScreenStart = { x: e.clientX, y: e.clientY };
      this.dragOriginalStates = this.app.selectionManager.getSelected().map(ent => ent.toJSON());
    } else {
      if (!additive) {
        this.app.selectionManager.clearSelection();
      }
      this.isDragging = true;
      this.dragStart = { ...worldPos };
      this.dragScreenStart = { x: e.clientX, y: e.clientY };
      this.selectionRect = { x1: worldPos.x, y1: worldPos.y, x2: worldPos.x, y2: worldPos.y };
      this.dragOriginalStates = null;
    }
    this.app.updatePropertiesPanel();
    this.app.updateStatusBar();
  }

  onMouseMove(e, worldPos) {
    if (!this.isDragging || !this.dragStart) {
      this._updateHoverCursor(worldPos);
      return;
    }

    if (this.resizeHandle && this.resizeEntity) {
      SelectionResizeEngine.applyHandle(
        this.resizeEntity, this.resizeHandle, worldPos.x, worldPos.y, this.resizeAnchor
      );
      this.app.requestRender();
      return;
    }

    if (this.selectionRect) {
      this.selectionRect.x2 = worldPos.x;
      this.selectionRect.y2 = worldPos.y;
      this.app.renderer2D.setSelectionRect(this.selectionRect, e.clientX >= this.dragScreenStart.x);
      this.app.requestRender();
    } else {
      const dx = worldPos.x - this.dragStart.x;
      const dy = worldPos.y - this.dragStart.y;
      for (const entity of this.app.selectionManager.getSelected()) {
        entity.move(dx, dy);
      }
      this.dragStart = { ...worldPos };
      this.app.requestRender();
    }
  }

  onMouseUp(e, worldPos) {
    if (this.resizeHandle && this.resizeEntity && this.dragOriginalStates) {
      const after = this.resizeEntity.toJSON();
      if (JSON.stringify(this.dragOriginalStates[0]) !== JSON.stringify(after)) {
        this.app.history.push({
          type: 'MODIFY_ENTITY',
          entity: this.resizeEntity,
          before: this.dragOriginalStates[0],
          after
        });
      }
      this.app.updatePropertiesPanel();
      this.app.updateStatusBar();
    } else if (this.selectionRect) {
      const minX = Math.min(this.selectionRect.x1, this.selectionRect.x2);
      const maxX = Math.max(this.selectionRect.x1, this.selectionRect.x2);
      const minY = Math.min(this.selectionRect.y1, this.selectionRect.y2);
      const maxY = Math.max(this.selectionRect.y1, this.selectionRect.y2);
      const windowMode = e.clientX >= this.dragScreenStart.x;
      const entities = this.app.drawing.getVisibleEntities(this.app.layerManager);
      this.app.selectionManager.selectInBox(
        entities, minX, minY, maxX, maxY, windowMode, this._isAdditive(e)
      );
      this.selectionRect = null;
      this.app.renderer2D.setSelectionRect(null);
      this.app.updatePropertiesPanel();
      this.app.updateStatusBar();
    } else if (this.isDragging && this.dragOriginalStates) {
      const selected = this.app.selectionManager.getSelected();
      for (let i = 0; i < selected.length; i++) {
        const before = this.dragOriginalStates[i];
        const after = selected[i].toJSON();
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          this.app.history.push({
            type: 'MODIFY_ENTITY',
            entity: selected[i],
            before,
            after
          });
        }
      }
      this.dragOriginalStates = null;
    }

    this.isDragging = false;
    this.dragStart = null;
    this.dragScreenStart = null;
    this.resizeHandle = null;
    this.resizeEntity = null;
    this.resizeAnchor = null;
    this.app.canvasContainer.style.cursor =
      this.name === 'pan' ? 'grab' : this.name === 'select' ? 'default' : 'crosshair';
    this.app.requestRender();
  }

  _updateHoverCursor(worldPos) {
    if (this.app.currentTool !== this) return;
    const selected = this.app.selectionManager.getSelected();
    if (selected.length !== 1 || typeof SelectionResizeEngine === 'undefined') {
      this.app.canvasContainer.style.cursor = 'default';
      return;
    }
    const entity = selected[0];
    if (!SelectionResizeEngine.canResize(entity)) {
      this.app.canvasContainer.style.cursor = 'default';
      return;
    }
    const handles = SelectionResizeEngine.getHandles(entity);
    const hit = SelectionResizeEngine.hitTest(handles, worldPos.x, worldPos.y, this._handleTolerance());
    this.app.canvasContainer.style.cursor = hit?.cursor || 'default';
  }
}
