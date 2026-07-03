/**
 * ArchDrawTools — công cụ vẽ nhanh kiến trúc
 */
class ArchRectDrawTool extends Tool {
  constructor(app, name, promptName, createFn, options = {}) {
    super(app);
    this.name = name;
    this.promptName = promptName;
    this.createFn = createFn;
    this.areaPrefix = options.areaPrefix || null;
    this.step = 0;
    this.corner1 = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.corner1 = null;
  }

  getPrompt() {
    if (this.step === 0) return `${this.promptName}: Chọn góc thứ nhất.`;
    return `${this.promptName}: Chọn góc đối diện.`;
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    if (this.step === 0) {
      this.corner1 = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const end = this._applyOrtho(this.corner1, snap);
      this.createFn(this.app, this.corner1.x, this.corner1.y, end.x, end.y);
      LiveMeasureOverlay.clear(this.app);
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step !== 1 || !this.corner1) return;
    const snap = this._getSnappedPos(worldPos);
    const end = this._applyOrtho(this.corner1, snap);
    const layerId = this.app.layerManager.currentLayerId;
    const b = ArchDrawEngine.bounds(this.corner1.x, this.corner1.y, end.x, end.y);
    const preview = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      lineDash: this.areaPrefix ? [8, 4] : []
    });
    this.app.renderer2D.setPreview(preview);
    if (this.areaPrefix) {
      this.app.renderer2D.setLiveMeasures(
        ArchDrawEngine.previewAreaMeasures(this.corner1.x, this.corner1.y, end.x, end.y, this.areaPrefix)
      );
    } else {
      LiveMeasureOverlay.rectangle(this.app, this.corner1.x, this.corner1.y, end.x, end.y);
    }
    this.app.requestRender();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class WallTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'wall';
    this.step = 0;
    this.startPoint = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.startPoint = null;
  }

  getPrompt() {
    return this.step === 0 ? 'TƯỜNG: Chọn điểm đầu.' : 'TƯỜNG: Chọn điểm cuối (Enter/Esc kết thúc).';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    if (this.step === 0) {
      this.startPoint = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const end = this._applyOrtho(this.startPoint, snap);
      ArchDrawEngine.createWall(this.app, this.startPoint.x, this.startPoint.y, end.x, end.y);
      this.startPoint = { x: end.x, y: end.y };
      this.app.updateToolInfo(this.getPrompt());
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step !== 1 || !this.startPoint) return;
    const snap = this._getSnappedPos(worldPos);
    const end = this._applyOrtho(this.startPoint, snap);
    const pts = ArchDrawEngine.wallPolygon(this.startPoint, end);
    if (!pts) return;
    const layerId = this.app.layerManager.currentLayerId;
    const preview = new HatchEntity(layerId, pts, 'SOLID');
    preview.style.color = '#78909c';
    this.app.renderer2D.setPreview(preview);
    LiveMeasureOverlay.segment(this.app, this.startPoint.x, this.startPoint.y, end.x, end.y);
    this.app.requestRender();
  }

  onKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Enter') this.app.setTool('select');
  }
}

class OpenWallTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'open-wall';
    this.step = 0;
    this.startPoint = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.startPoint = null;
  }

  getPrompt() {
    return this.step === 0 ? 'T.MỞ: Chọn điểm đầu tường mở.' : 'T.MỞ: Chọn điểm cuối.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    if (this.step === 0) {
      this.startPoint = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      const end = this._applyOrtho(this.startPoint, snap);
      ArchDrawEngine.createOpenWall(this.app, this.startPoint.x, this.startPoint.y, end.x, end.y);
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step !== 1 || !this.startPoint) return;
    const snap = this._getSnappedPos(worldPos);
    const end = this._applyOrtho(this.startPoint, snap);
    const layerId = this.app.layerManager.currentLayerId;
    const preview = new LineEntity(layerId, this.startPoint.x, this.startPoint.y, end.x, end.y);
    preview.style.lineDash = [12, 6];
    this.app.renderer2D.setPreview(preview);
    LiveMeasureOverlay.segment(this.app, this.startPoint.x, this.startPoint.y, end.x, end.y);
    this.app.requestRender();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class RoundColumnTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'round-column';
    this.step = 0;
    this.center = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.center = null;
  }

  getPrompt() {
    return this.step === 0 ? 'CỘT TRÒN: Chọn tâm.' : 'CỘT TRÒN: Chọn bán kính.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    if (this.step === 0) {
      this.center = { x: snap.x, y: snap.y };
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    } else {
      ArchDrawEngine.createRoundColumn(this.app, this.center.x, this.center.y, snap.x, snap.y);
      this.app.setTool('select');
    }
  }

  onMouseMove(e, worldPos) {
    if (this.step !== 1 || !this.center) return;
    const snap = this._getSnappedPos(worldPos);
    const layerId = this.app.layerManager.currentLayerId;
    const r = GeometryEngine.distance(this.center.x, this.center.y, snap.x, snap.y);
    const preview = new CircleEntity(layerId, this.center.x, this.center.y, r);
    this.app.renderer2D.setPreview(preview);
    LiveMeasureOverlay.radius(this.app, this.center.x, this.center.y, snap.x, snap.y);
    this.app.requestRender();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

const ArchDrawTools = {
  createRoomTool(app) {
    return new ArchRectDrawTool(app, 'room', 'PHÒNG', ArchDrawEngine.createRoom, { areaPrefix: 'S' });
  },
  createOpenFloorTool(app) {
    return new ArchRectDrawTool(app, 'open-floor', 'SÀN MỞ', ArchDrawEngine.createOpenFloor, { areaPrefix: 'S' });
  },
  createOpenCeilingTool(app) {
    return new ArchRectDrawTool(app, 'open-ceiling', 'TRẦN MỞ', ArchDrawEngine.createOpenCeiling, { areaPrefix: 'T' });
  },
  createColumnTool(app) {
    return new ArchRectDrawTool(app, 'column', 'CỘT', ArchDrawEngine.createColumn);
  }
};
