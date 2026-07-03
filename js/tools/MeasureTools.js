class DimensionTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'dimension';
    this.step = 0;
    this.startPoint = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.startPoint = null;
  }

  getPrompt() {
    if (this.step === 0) return 'DIM: Chọn điểm đầu.';
    return 'DIM: Chọn điểm cuối.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.startPoint = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      this._run('DRAW_DIMENSION', {
        p1: this.startPoint, p2: { x: snap.x, y: snap.y }
      });
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.startPoint) {
      const snap = this._getSnappedPos(worldPos);
      const preview = this.app.cadCore.dimensions.createLinear(
        this.startPoint, { x: snap.x, y: snap.y }
      );
      this.app.renderer2D.setPreview(preview);
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class DistanceTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'distance';
    this.step = 0;
    this.startPoint = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.startPoint = null;
  }

  getPrompt() {
    if (this.step === 0) return 'DIST: Chọn điểm đầu.';
    return 'DIST: Chọn điểm cuối.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.startPoint = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const dist = GeometryEngine.distance(this.startPoint.x, this.startPoint.y, snap.x, snap.y);
      this.app.logCommand(`Khoảng cách = ${GeometryEngine.formatDistance(dist)}`);
      this.app.renderer2D.setMeasureLine(null);
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.startPoint) {
      const snap = this._getSnappedPos(worldPos);
      this.app.renderer2D.setMeasureLine({
        x1: this.startPoint.x, y1: this.startPoint.y,
        x2: snap.x, y2: snap.y
      });
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.app.renderer2D.setMeasureLine(null);
      this.app.setTool('select');
    }
  }
}
