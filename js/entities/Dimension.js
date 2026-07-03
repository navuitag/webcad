class DimensionEntity extends Entity {
  static DEFAULT_COLOR = DimensionEngine.COLOR;

  constructor(layerId, x1, y1, x2, y2, offset = 10) {
    super('DIMENSION', layerId);
    this.start = { x: x1, y: y1 };
    this.end = { x: x2, y: y2 };
    this.offset = offset;
    this.style.color = DimensionEntity.DEFAULT_COLOR;
  }

  getColor(layerManager) {
    return this.style.color || DimensionEntity.DEFAULT_COLOR;
  }

  getDistance() {
    return GeometryEngine.distance(this.start.x, this.start.y, this.end.x, this.end.y);
  }

  draw(ctx, drawing, layerManager) {
    const p1 = drawing.worldToScreen(this.start.x, this.start.y, ctx.canvas.width, ctx.canvas.height);
    const p2 = drawing.worldToScreen(this.end.x, this.end.y, ctx.canvas.width, ctx.canvas.height);

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const perpAngle = angle + Math.PI / 2;
    const offsetPx = this.offset * drawing.view.zoom;
    const dimY1 = p1.y + Math.sin(perpAngle) * offsetPx;
    const dimX1 = p1.x + Math.cos(perpAngle) * offsetPx;
    const dimY2 = p2.y + Math.sin(perpAngle) * offsetPx;
    const dimX2 = p2.x + Math.cos(perpAngle) * offsetPx;

    const dist = this.getDistance();
    const text = GeometryKernel.formatDistance(
      dist, drawing.unit, 2, drawing.worldUnit || drawing.unit
    );

    ctx.save();
    ctx.strokeStyle = this.getColor(layerManager);
    ctx.fillStyle = this.getColor(layerManager);
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(dimX1, dimY1);
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(dimX2, dimY2);
    ctx.moveTo(dimX1, dimY1);
    ctx.lineTo(dimX2, dimY2);
    ctx.stroke();

    const midX = (dimX1 + dimX2) / 2;
    const midY = (dimY1 + dimY2) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, midX, midY - 4);
    ctx.restore();
  }

  move(dx, dy) {
    this.start.x += dx;
    this.start.y += dy;
    this.end.x += dx;
    this.end.y += dy;
  }

  rotate(cx, cy, angle) {
    this.start = GeometryEngine.rotatePoint(this.start.x, this.start.y, cx, cy, angle);
    this.end = GeometryEngine.rotatePoint(this.end.x, this.end.y, cx, cy, angle);
  }

  scale(cx, cy, factor) {
    this.start = GeometryEngine.scalePoint(this.start.x, this.start.y, cx, cy, factor);
    this.end = GeometryEngine.scalePoint(this.end.x, this.end.y, cx, cy, factor);
    this.offset *= factor;
  }

  hitTest(wx, wy, tolerance) {
    const nearest = GeometryEngine.nearestPointOnSegment(
      wx, wy, this.start.x, this.start.y, this.end.x, this.end.y
    );
    return nearest.distance <= tolerance + this.offset;
  }

  getBoundingBox() {
    return {
      minX: Math.min(this.start.x, this.end.x) - this.offset,
      minY: Math.min(this.start.y, this.end.y) - this.offset,
      maxX: Math.max(this.start.x, this.end.x) + this.offset,
      maxY: Math.max(this.start.y, this.end.y) + this.offset
    };
  }

  getSnapPoints() {
    return [
      { x: this.start.x, y: this.start.y, type: 'endpoint' },
      { x: this.end.x, y: this.end.y, type: 'endpoint' }
    ];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      start: { ...this.start },
      end: { ...this.end },
      offset: this.offset
    };
  }

  static fromJSON(data) {
    const dim = new DimensionEntity(
      data.layerId, data.start.x, data.start.y, data.end.x, data.end.y, data.offset
    );
    dim.id = data.id;
    dim.style = { ...dim.style, ...data.style };
    return dim;
  }
}
