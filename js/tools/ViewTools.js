class PanTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'pan';
    this.isPanning = false;
    this.lastPos = null;
  }

  getPrompt() {
    return 'PAN: Kéo chuột để di chuyển view. Giữ chuột giữa cũng có thể pan.';
  }

  onMouseDown(e, worldPos) {
    this.isPanning = true;
    this.lastPos = { x: e.clientX, y: e.clientY };
    this.app.canvasContainer.style.cursor = 'grabbing';
  }

  onMouseMove(e, worldPos) {
    if (this.isPanning && this.lastPos) {
      const dx = e.clientX - this.lastPos.x;
      const dy = e.clientY - this.lastPos.y;
      this.app.drawing.view.offsetX += dx;
      this.app.drawing.view.offsetY += dy;
      this.lastPos = { x: e.clientX, y: e.clientY };
      this.app.requestRender();
    }
  }

  onMouseUp(e, worldPos) {
    this.isPanning = false;
    this.lastPos = null;
    this.app.canvasContainer.style.cursor = 'crosshair';
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class ZoomTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'zoom';
  }

  getPrompt() {
    return 'ZOOM: Click để phóng to, Shift+Click để thu nhỏ.';
  }

  onMouseDown(e, worldPos) {
    const factor = e.shiftKey ? 0.8 : 1.25;
    this.app.zoomAt(e.offsetX, e.offsetY, factor);
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}
