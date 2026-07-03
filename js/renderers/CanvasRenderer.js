class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.previewEntity = null;
    this.measureLine = null;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(drawing, layerManager, selectionManager, snapEngine) {
    this.clear();

    if (drawing.view.showGrid) {
      this._drawGrid(drawing);
    }

    this._drawAxes(drawing);

    const entities = drawing.getVisibleEntities(layerManager);
    for (const entity of entities) {
      entity.draw(this.ctx, drawing, layerManager);
    }

    if (this.previewEntity) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.6;
      this.previewEntity.draw(this.ctx, drawing, layerManager);
      this.ctx.restore();
    }

    const selected = selectionManager.getSelected();
    for (const entity of selected) {
      entity.drawSelection(this.ctx, drawing, layerManager);
    }

    if (this.measureLine) {
      this._drawMeasureLine(drawing, this.measureLine);
    }

    snapEngine.drawSnapIndicator(this.ctx, drawing, drawing.view, this.canvas.width, this.canvas.height);
  }

  _drawGrid(drawing) {
    const { zoom, gridSize, offsetX, offsetY } = drawing.view;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const worldLeft = (-cx - offsetX) / zoom;
    const worldRight = (w - cx - offsetX) / zoom;
    const worldTop = (cy + offsetY) / zoom;
    const worldBottom = (-(h - cy) + offsetY) / zoom;

    const startX = Math.floor(worldLeft / gridSize) * gridSize;
    const endX = Math.ceil(worldRight / gridSize) * gridSize;
    const startY = Math.floor(worldBottom / gridSize) * gridSize;
    const endY = Math.ceil(worldTop / gridSize) * gridSize;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.08)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x += gridSize) {
      const sx = x * zoom + offsetX + cx;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, 0);
      this.ctx.lineTo(sx, h);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const sy = -y * zoom + offsetY + cy;
      this.ctx.beginPath();
      this.ctx.moveTo(0, sy);
      this.ctx.lineTo(w, sy);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  _drawAxes(drawing) {
    const cx = this.canvas.width / 2 + drawing.view.offsetX;
    const cy = this.canvas.height / 2 + drawing.view.offsetY;

    this.ctx.save();
    this.ctx.lineWidth = 1;

    this.ctx.strokeStyle = 'rgba(239, 83, 80, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(cx, 0);
    this.ctx.lineTo(cx, this.canvas.height);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(102, 187, 106, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy);
    this.ctx.lineTo(this.canvas.width, cy);
    this.ctx.stroke();

    this.ctx.restore();
  }

  _drawMeasureLine(drawing, line) {
    const p1 = drawing.worldToScreen(line.x1, line.y1, this.canvas.width, this.canvas.height);
    const p2 = drawing.worldToScreen(line.x2, line.y2, this.canvas.width, this.canvas.height);
    const dist = GeometryEngine.distance(line.x1, line.y1, line.x2, line.y2);

    this.ctx.save();
    this.ctx.strokeStyle = '#ffa726';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.fillStyle = '#ffa726';
    this.ctx.font = '12px sans-serif';
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    this.ctx.fillText(GeometryEngine.formatDistance(dist), midX + 8, midY - 8);
    this.ctx.restore();
  }

  setPreview(entity) {
    this.previewEntity = entity;
  }

  setMeasureLine(line) {
    this.measureLine = line;
  }
}
