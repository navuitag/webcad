class LineTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'line';
    this.step = 0;
    this.startPoint = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.startPoint = null;
  }

  getPrompt() {
    if (this.step === 0) return 'LINE: Chọn điểm đầu.';
    return 'LINE: Chọn điểm cuối.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.startPoint = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      let end = this._applyOrtho(this.startPoint, snap);
      const layerId = this.app.layerManager.currentLayerId;
      const line = new LineEntity(layerId, this.startPoint.x, this.startPoint.y, end.x, end.y);
      this._addEntity(line);
      this.startPoint = { x: end.x, y: end.y };
      this.app.updateToolInfo(this.getPrompt());
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.startPoint) {
      const snap = this._getSnappedPos(worldPos);
      let end = this._applyOrtho(this.startPoint, snap);
      const layerId = this.app.layerManager.currentLayerId;
      const preview = new LineEntity(layerId, this.startPoint.x, this.startPoint.y, end.x, end.y);
      this.app.renderer2D.setPreview(preview);
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.app.setTool('select');
    }
  }
}

class CircleTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'circle';
    this.step = 0;
    this.center = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.center = null;
  }

  getPrompt() {
    if (this.step === 0) return 'CIRCLE: Chọn tâm.';
    return 'CIRCLE: Chọn bán kính.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.center = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const radius = GeometryEngine.distance(this.center.x, this.center.y, snap.x, snap.y);
      if (radius > 0) {
        const layerId = this.app.layerManager.currentLayerId;
        const circle = new CircleEntity(layerId, this.center.x, this.center.y, radius);
        this._addEntity(circle);
      }
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.center) {
      const snap = this._getSnappedPos(worldPos);
      const radius = GeometryEngine.distance(this.center.x, this.center.y, snap.x, snap.y);
      const layerId = this.app.layerManager.currentLayerId;
      const preview = new CircleEntity(layerId, this.center.x, this.center.y, radius);
      this.app.renderer2D.setPreview(preview);
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class RectangleTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'rectangle';
    this.step = 0;
    this.corner1 = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.corner1 = null;
  }

  getPrompt() {
    if (this.step === 0) return 'RECTANGLE: Chọn góc thứ nhất.';
    return 'RECTANGLE: Chọn góc đối diện.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.corner1 = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      let end = this._applyOrtho(this.corner1, snap);
      const layerId = this.app.layerManager.currentLayerId;
      const rect = new RectangleEntity(layerId, this.corner1.x, this.corner1.y, end.x, end.y);
      this._addEntity(rect);
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.corner1) {
      const snap = this._getSnappedPos(worldPos);
      let end = this._applyOrtho(this.corner1, snap);
      const layerId = this.app.layerManager.currentLayerId;
      const preview = new RectangleEntity(layerId, this.corner1.x, this.corner1.y, end.x, end.y);
      this.app.renderer2D.setPreview(preview);
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class ArcTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'arc';
    this.step = 0;
    this.center = null;
    this.startAngle = null;
    this.radius = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.center = null;
    this.startAngle = null;
    this.radius = null;
  }

  getPrompt() {
    const prompts = ['ARC: Chọn tâm.', 'ARC: Chọn điểm bắt đầu (bán kính).', 'ARC: Chọn điểm kết thúc.'];
    return prompts[this.step] || prompts[0];
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.center = { x: snap.x, y: snap.y };
      this.step = 1;
    } else if (this.step === 1) {
      this.radius = GeometryEngine.distance(this.center.x, this.center.y, snap.x, snap.y);
      this.startAngle = GeometryEngine.angle(this.center.x, this.center.y, snap.x, snap.y);
      this.step = 2;
    } else {
      const endAngle = GeometryEngine.angle(this.center.x, this.center.y, snap.x, snap.y);
      if (this.radius > 0) {
        const layerId = this.app.layerManager.currentLayerId;
        const arc = new ArcEntity(
          layerId, this.center.x, this.center.y,
          this.radius, this.startAngle, endAngle
        );
        this._addEntity(arc);
      }
      this.app.setTool('select');
    }
    this.app.updateToolInfo(this.getPrompt());
  }

  onMouseMove(e, worldPos) {
    if (this.step >= 1 && this.center) {
      const snap = this._getSnappedPos(worldPos);
      const layerId = this.app.layerManager.currentLayerId;
      if (this.step === 1) {
        const radius = GeometryEngine.distance(this.center.x, this.center.y, snap.x, snap.y);
        const preview = new CircleEntity(layerId, this.center.x, this.center.y, radius);
        this.app.renderer2D.setPreview(preview);
      } else if (this.step === 2) {
        const endAngle = GeometryEngine.angle(this.center.x, this.center.y, snap.x, snap.y);
        const preview = new ArcEntity(
          layerId, this.center.x, this.center.y,
          this.radius, this.startAngle, endAngle
        );
        this.app.renderer2D.setPreview(preview);
      }
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class PolylineTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'polyline';
    this.points = [];
  }

  activate() {
    super.activate();
    this.points = [];
  }

  getPrompt() {
    if (this.points.length === 0) return 'PLINE: Chọn điểm đầu. Enter để kết thúc.';
    return `PLINE: Chọn điểm tiếp theo (${this.points.length} điểm). Enter/Click phải để kết thúc.`;
  }

  onMouseDown(e, worldPos) {
    if (e.button === 2) {
      this._finish();
      return;
    }
    const snap = this._getSnappedPos(worldPos);
    this.points.push({ x: snap.x, y: snap.y });
    this.app.updateToolInfo(this.getPrompt());
  }

  onMouseMove(e, worldPos) {
    if (this.points.length > 0) {
      const snap = this._getSnappedPos(worldPos);
      const layerId = this.app.layerManager.currentLayerId;
      const previewPoints = [...this.points, { x: snap.x, y: snap.y }];
      const preview = new PolylineEntity(layerId, previewPoints);
      this.app.renderer2D.setPreview(preview);
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter') this._finish();
    if (e.key === 'Escape') this.app.setTool('select');
  }

  _finish() {
    if (this.points.length >= 2) {
      const layerId = this.app.layerManager.currentLayerId;
      const pline = new PolylineEntity(layerId, [...this.points]);
      this._addEntity(pline);
    }
    this.app.setTool('select');
  }
}

class TextTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'text';
    this.step = 0;
    this.position = null;
  }

  activate() {
    super.activate();
    this.step = 0;
  }

  getPrompt() {
    if (this.step === 0) return 'TEXT: Chọn vị trí.';
    return 'TEXT: Nhập nội dung văn bản.';
  }

  onMouseDown(e, worldPos) {
    if (this.step === 0) {
      const snap = this._getSnappedPos(worldPos);
      this.position = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
      const text = prompt('Nhập văn bản:');
      if (text) {
        const layerId = this.app.layerManager.currentLayerId;
        const textEntity = new TextEntity(layerId, this.position.x, this.position.y, text);
        this._addEntity(textEntity);
      }
      this.app.setTool('select');
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}
