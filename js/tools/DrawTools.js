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
    return 'LINE: Chọn điểm cuối hoặc gõ chiều dài + Enter.';
  }

  _showPreview(end) {
    const preview = this.app.cadCore.entities.create('LINE', {
      x1: this.startPoint.x, y1: this.startPoint.y, x2: end.x, y2: end.y
    });
    this.app.renderer2D.setPreview(preview);
    LiveMeasureOverlay.segment(this.app, this.startPoint.x, this.startPoint.y, end.x, end.y);
  }

  _commitPoint(end) {
    this._run('DRAW_LINE', {
      x1: this.startPoint.x, y1: this.startPoint.y, x2: end.x, y2: end.y
    });
    this.startPoint = { x: end.x, y: end.y };
    this.app.updateToolInfo(this.getPrompt());
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.startPoint = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      let end = this._applyOrtho(this.startPoint, snap);
      this._commitPoint(end);
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.startPoint) {
      const snap = this._getSnappedPos(worldPos);
      let end = this._applyOrtho(this.startPoint, snap);
      this._showPreview(end);
      this._bindLengthInput(this.startPoint, end, {
        label: 'D',
        onPreview: (pt) => this._showPreview(pt),
        onApply: (pt) => this._commitPoint(pt)
      });
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
    return 'CIRCLE: Chọn bán kính hoặc gõ R + Enter.';
  }

  _showPreview(radius) {
    const preview = this.app.cadCore.entities.create('CIRCLE', {
      cx: this.center.x, cy: this.center.y, r: radius
    });
    this.app.renderer2D.setPreview(preview);
    const px = this.center.x + radius;
    LiveMeasureOverlay.radius(this.app, this.center.x, this.center.y, px, this.center.y);
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.center = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const radius = GeometryKernel.distance(this.center.x, this.center.y, snap.x, snap.y);
      if (radius > 0) {
        this._run('DRAW_CIRCLE', { cx: this.center.x, cy: this.center.y, r: radius });
      }
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.center) {
      const snap = this._getSnappedPos(worldPos);
      const radius = GeometryKernel.distance(this.center.x, this.center.y, snap.x, snap.y);
      this._showPreview(radius);
      this._bindRadiusInput(this.center, snap, {
        onPreview: (r) => this._showPreview(r),
        onApply: (r) => {
          if (r > 0) this._run('DRAW_CIRCLE', { cx: this.center.x, cy: this.center.y, r });
          this.app.setTool('select');
        }
      });
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
    return 'RECTANGLE: Chọn góc đối hoặc gõ R×S + Enter (vd 4000x3000).';
  }

  _showPreview(end) {
    const preview = this.app.cadCore.entities.create('RECTANGLE', {
      x1: this.corner1.x, y1: this.corner1.y, x2: end.x, y2: end.y
    });
    this.app.renderer2D.setPreview(preview);
    LiveMeasureOverlay.rectangle(this.app, this.corner1.x, this.corner1.y, end.x, end.y);
  }

  _commit(end) {
    this._run('DRAW_RECTANGLE', {
      x1: this.corner1.x, y1: this.corner1.y, x2: end.x, y2: end.y
    });
    this.app.setTool('select');
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.corner1 = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      let end = this._applyOrtho(this.corner1, snap);
      this._commit(end);
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step === 1 && this.corner1) {
      const snap = this._getSnappedPos(worldPos);
      let end = this._applyOrtho(this.corner1, snap);
      this._showPreview(end);
      this._bindRectangleInput(this.corner1, end, {
        onPreview: (pt) => this._showPreview(pt),
        onApply: (pt) => this._commit(pt)
      });
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
    const prompts = [
      'ARC: Chọn tâm.',
      'ARC: Chọn điểm bắt đầu hoặc gõ R + Enter.',
      'ARC: Chọn điểm kết thúc.'
    ];
    return prompts[this.step] || prompts[0];
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);

    if (this.step === 0) {
      this.center = { x: snap.x, y: snap.y };
      this.step = 1;
    } else if (this.step === 1) {
      this.radius = GeometryKernel.distance(this.center.x, this.center.y, snap.x, snap.y);
      this.startAngle = GeometryKernel.angle(this.center.x, this.center.y, snap.x, snap.y);
      this.step = 2;
    } else {
      const endAngle = GeometryKernel.angle(this.center.x, this.center.y, snap.x, snap.y);
      if (this.radius > 0) {
        this._run('DRAW_ARC', {
          cx: this.center.x, cy: this.center.y, r: this.radius,
          startAngle: this.startAngle, endAngle
        });
      }
      this.app.setTool('select');
    }
    this.app.updateToolInfo(this.getPrompt());
  }

  onMouseMove(e, worldPos) {
    if (this.step >= 1 && this.center) {
      const snap = this._getSnappedPos(worldPos);
      const core = this.app.cadCore.entities;
      if (this.step === 1) {
        const radius = GeometryKernel.distance(this.center.x, this.center.y, snap.x, snap.y);
        this.app.renderer2D.setPreview(core.create('CIRCLE', { cx: this.center.x, cy: this.center.y, r: radius }));
        LiveMeasureOverlay.radius(this.app, this.center.x, this.center.y, snap.x, snap.y);
        this._bindRadiusInput(this.center, snap, {
          onPreview: (r) => {
            this.app.renderer2D.setPreview(core.create('CIRCLE', { cx: this.center.x, cy: this.center.y, r }));
            LiveMeasureOverlay.radius(this.app, this.center.x, this.center.y, this.center.x + r, this.center.y);
          },
          onApply: (r) => {
            this.radius = r;
            this.startAngle = GeometryKernel.angle(this.center.x, this.center.y, snap.x, snap.y);
            this.step = 2;
            this.app.updateToolInfo(this.getPrompt());
          }
        });
      } else if (this.step === 2) {
        const endAngle = GeometryKernel.angle(this.center.x, this.center.y, snap.x, snap.y);
        this.app.renderer2D.setPreview(core.create('ARC', {
          cx: this.center.x, cy: this.center.y, r: this.radius,
          startAngle: this.startAngle, endAngle
        }));
        LiveMeasureOverlay.arc(
          this.app, this.center.x, this.center.y, this.radius,
          this.startAngle, endAngle
        );
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
    return `PLINE: Chọn điểm tiếp hoặc gõ chiều dài + Enter (${this.points.length} điểm). Enter/Esc kết thúc.`;
  }

  _showPreview(cursor) {
    const layerId = this.app.layerManager.currentLayerId;
    const previewPoints = [...this.points, { x: cursor.x, y: cursor.y }];
    const preview = new PolylineEntity(layerId, previewPoints);
    this.app.renderer2D.setPreview(preview);
    LiveMeasureOverlay.polylineSegment(this.app, this.points, cursor);
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
      this._showPreview(snap);
      const last = this.points[this.points.length - 1];
      this._bindLengthInput(last, snap, {
        label: 'D',
        onPreview: (pt) => this._showPreview(pt),
        onApply: (pt) => {
          this.points.push({ x: pt.x, y: pt.y });
          this.app.updateToolInfo(this.getPrompt());
        }
      });
      this.app.requestRender();
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter') this._finish();
    if (e.key === 'Escape') this.app.setTool('select');
  }

  _finish() {
    if (this.points.length >= 2) {
      this._run('DRAW_POLYLINE', { points: [...this.points] });
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
        this._run('DRAW_TEXT', { x: this.position.x, y: this.position.y, text, height: 10 });
      }
      this.app.setTool('select');
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}
