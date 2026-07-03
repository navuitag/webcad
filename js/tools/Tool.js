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
    LiveMeasureOverlay.clear(this.app);
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
    return this.app.cadCore.snapPoint(
      worldPos.x, worldPos.y,
      this.app.drawing.view,
      this.app.canvas.width, this.app.canvas.height
    );
  }

  _applyOrtho(start, end) {
    return this.app.cadCore.applyOrtho(start, end, this.app.drawing.view.ortho);
  }

  _addEntity(entity) {
    this.app.cadCore.entities.add(entity);
    this.app.cadCore.requestRender();
  }

  _run(command, params) {
    const result = this.app.cadCore.run(command, params);
    if (result.success) {
      LiveMeasureOverlay.clear(this.app);
      if (typeof AutoDimensionEngine !== 'undefined') {
        AutoDimensionEngine.onCommandResult(this.app, command, result);
      }
    }
    return result;
  }
}
