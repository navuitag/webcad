class ChamferTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'chamfer';
    this.step = 0;
    this.line1 = null;
    this.distance = 5;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.line1 = null;
  }

  getPrompt() {
    return ['CHAMFER: Chọn đường thẳng thứ nhất.', 'CHAMFER: Chọn đường thẳng thứ hai.'][this.step];
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tol = 5 / this.app.drawing.view.zoom;
    if (this.step === 0) {
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
      if (hit?.type === 'LINE') { this.line1 = hit; this.step = 1; this.app.updateToolInfo(this.getPrompt()); }
    } else {
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
      if (hit?.type === 'LINE' && hit !== this.line1) {
        const r = this._run('CHAMFER', { line1: this.line1, line2: hit, distance: this.distance });
        if (!r.success) this.app.cadCore.log('CHAMFER: Không thể vát góc.');
        this.app.setTool('select');
      }
    }
  }

  onKeyDown(e) { if (e.key === 'Escape') this.app.setTool('select'); }
}

class ArrayTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'array';
    this.step = 0;
    this.entities = [];
    this.mode = 'rect';
    this.rows = 2; this.cols = 3;
    this.rowSpacing = 30; this.colSpacing = 30;
    this.count = 6;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.entities = [];
  }

  getPrompt() {
    if (this.step === 0) return 'ARRAY: Chọn đối tượng. Enter khi xong.';
    if (this.step === 1) return 'ARRAY: Click điểm gốc (rect) hoặc tâm (polar).';
    return 'ARRAY: Click điểm thứ hai (khoảng cách / bán kính).';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tol = 5 / this.app.drawing.view.zoom;
    if (this.step === 0) {
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
      if (hit && !this.entities.includes(hit)) this.entities.push(hit);
    } else if (this.step === 1) {
      this.basePoint = { x: snap.x, y: snap.y };
      this.step = 2;
      this.app.updateToolInfo(this.getPrompt());
    } else if (this.step === 2) {
      if (this.mode === 'rect') {
        this.colSpacing = Math.abs(snap.x - this.basePoint.x) || 30;
        this.rowSpacing = Math.abs(snap.y - this.basePoint.y) || 30;
        this._run('ARRAY_RECT', {
          entities: this.entities, rows: this.rows, cols: this.cols,
          rowSpacing: this.rowSpacing, colSpacing: this.colSpacing
        });
      } else {
        const radius = GeometryEngine.distance(this.basePoint.x, this.basePoint.y, snap.x, snap.y);
        this._run('ARRAY_POLAR', { entities: this.entities, center: this.basePoint, count: this.count });
      }
      this.app.setTool('select');
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter' && this.step === 0 && this.entities.length > 0) {
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    }
    if (e.key === 'Tab') { this.mode = this.mode === 'rect' ? 'polar' : 'rect'; this.app.cadCore.log(`ARRAY mode: ${this.mode}`); }
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class StretchTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'stretch';
    this.step = 0;
    this.windowMin = null;
    this.entities = [];
  }

  activate() { super.activate(); this.step = 0; this.windowMin = null; this.entities = []; }

  getPrompt() {
    return ['STRETCH: Chọn điểm góc cửa sổ.', 'STRETCH: Chọn điểm đối diện cửa sổ.',
      'STRETCH: Chọn điểm cơ sở.', 'STRETCH: Chọn điểm đích.'][this.step];
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    if (this.step === 0) {
      this.windowMin = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else if (this.step === 1) {
      this.windowMax = { x: snap.x, y: snap.y };
      const minX = Math.min(this.windowMin.x, this.windowMax.x);
      const maxX = Math.max(this.windowMin.x, this.windowMax.x);
      const minY = Math.min(this.windowMin.y, this.windowMax.y);
      const maxY = Math.max(this.windowMin.y, this.windowMax.y);
      this.windowMin = { x: minX, y: minY };
      this.windowMax = { x: maxX, y: maxY };
      this.entities = this.app.drawing.entities.filter(ent => {
        const bb = ent.getBoundingBox();
        return bb && bb.minX >= minX && bb.maxX <= maxX && bb.minY >= minY && bb.maxY <= maxY;
      });
      this.step = 2;
      this.app.updateToolInfo(this.getPrompt());
    } else if (this.step === 2) {
      this.basePoint = { x: snap.x, y: snap.y };
      this.step = 3;
      this.app.updateToolInfo(this.getPrompt());
    } else if (this.step === 3) {
      this._run('STRETCH', {
        entities: this.entities,
        windowMin: this.windowMin, windowMax: this.windowMax,
        dx: snap.x - this.basePoint.x, dy: snap.y - this.basePoint.y
      });
      this.app.setTool('select');
    }
  }

  onKeyDown(e) { if (e.key === 'Escape') this.app.setTool('select'); }
}

class ExplodeTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'explode';
  }

  getPrompt() { return 'EXPLODE: Chọn đối tượng cần phá.'; }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tol = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
    if (hit) this._run('EXPLODE', { entities: [hit] });
  }

  onKeyDown(e) { if (e.key === 'Escape') this.app.setTool('select'); }
}

class JoinTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'join';
    this.lines = [];
  }

  activate() { super.activate(); this.lines = []; }

  getPrompt() { return 'JOIN: Chọn các đường thẳng nối nhau. Enter khi xong.'; }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tol = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
    if (hit?.type === 'LINE' && !this.lines.includes(hit)) this.lines.push(hit);
  }

  onKeyDown(e) {
    if (e.key === 'Enter' && this.lines.length >= 2) {
      const r = this._run('JOIN', { entities: this.lines });
      if (!r.success) this.app.cadCore.log('JOIN: Không thể nối.');
      this.app.setTool('select');
    }
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class BreakTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'break';
  }

  getPrompt() { return 'BREAK: Click điểm trên đường thẳng cần ngắt.'; }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tol = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
    if (hit?.type === 'LINE') this._run('BREAK', { entity: hit, clickPoint: snap });
  }

  onKeyDown(e) { if (e.key === 'Escape') this.app.setTool('select'); }
}

class DivideTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'divide';
    this.segments = 4;
  }

  getPrompt() { return 'DIVIDE: Chọn đường thẳng cần chia.'; }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tol = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
    if (hit?.type === 'LINE') {
      const r = this._run('DIVIDE', { entity: hit, segments: this.segments });
      if (r.success) this.app.cadCore.log(`DIVIDE: ${this.segments} phân đoạn.`);
    }
  }

  onKeyDown(e) { if (e.key === 'Escape') this.app.setTool('select'); }
}

class MeasureTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'measure';
    this.step = 0;
    this.p1 = null;
  }

  activate() { super.activate(); this.step = 0; this.p1 = null; }

  getPrompt() {
    return this.step === 0 ? 'MEASURE: Chọn điểm đầu.' : 'MEASURE: Chọn điểm cuối.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    if (this.step === 0) {
      this.p1 = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const r = this._run('MEASURE', { p1: this.p1, p2: snap });
      if (r.success) {
        this.app.cadCore.log(`MEASURE: ${r.formatted}`);
        this.app.renderer2D.setMeasureLine({ x1: this.p1.x, y1: this.p1.y, x2: snap.x, y2: snap.y });
        this.app.requestRender();
      }
      this.app.setTool('select');
    }
  }

  onKeyDown(e) { if (e.key === 'Escape') this.app.setTool('select'); }
}

class HatchTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'hatch';
    this.pattern = 'SOLID';
  }

  getPrompt() { return 'HATCH: Chọn vùng kín (polyline, rectangle, circle).'; }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tol = 5 / this.app.drawing.view.zoom;
    const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tol);
    if (hit && ['POLYLINE', 'RECTANGLE', 'CIRCLE'].includes(hit.type)) {
      const r = this._run('HATCH', { entity: hit, pattern: this.pattern, scale: 1, angle: 45 });
      if (!r.success) this.app.cadCore.log('HATCH: Không thể tạo hatch.');
      this.app.setTool('select');
    }
  }

  onKeyDown(e) {
    if (e.key === 'P') {
      const patterns = ['SOLID', 'ANSI31', 'CROSS', 'DOTS'];
      const idx = (patterns.indexOf(this.pattern) + 1) % patterns.length;
      this.pattern = patterns[idx];
      this.app.cadCore.log(`HATCH pattern: ${this.pattern}`);
    }
    if (e.key === 'Escape') this.app.setTool('select');
  }
}
