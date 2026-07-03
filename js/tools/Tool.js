class Tool {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.name = 'tool';
  }

  activate() {
    this.active = true;
    this.app.updateToolInfo(this.getPrompt());
  }

  deactivate() {
    this.active = false;
    this.app.renderer2D.setPreview(null);
    this.app.renderer2D.setMeasureLine(null);
  }

  getPrompt() {
    return 'Chọn công cụ từ thanh công cụ hoặc nhập lệnh.';
  }

  onMouseDown(e, worldPos) {}
  onMouseMove(e, worldPos) {}
  onMouseUp(e, worldPos) {}
  onKeyDown(e) {}
  onKeyUp(e) {}

  _getSnappedPos(worldPos) {
    return this.app.snapEngine.snap(
      worldPos.x, worldPos.y,
      this.app.drawing, this.app.layerManager,
      this.app.drawing.view,
      this.app.canvas.width, this.app.canvas.height
    );
  }

  _applyOrtho(start, end) {
    if (this.app.drawing.view.ortho) {
      return GeometryEngine.applyOrtho(start.x, start.y, end.x, end.y);
    }
    return end;
  }

  _addEntity(entity) {
    this.app.drawing.addEntity(entity);
    this.app.history.push({
      type: 'ADD_ENTITY',
      entity
    });
    this.app.requestRender();
  }
}
