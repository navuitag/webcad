class LineEntity extends Entity {
  constructor(layerId, x1, y1, x2, y2) {
    super('LINE', layerId);
    this.start = { x: x1, y: y1 };
    this.end = { x: x2, y: y2 };
  }

  draw(ctx, drawing, layerManager, styleManager) {
    const p1 = drawing.worldToScreen(this.start.x, this.start.y, ctx.canvas.width, ctx.canvas.height);
    const p2 = drawing.worldToScreen(this.end.x, this.end.y, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    this.applyStroke(ctx, layerManager, styleManager);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
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
  }

  hitTest(wx, wy, tolerance) {
    const nearest = GeometryEngine.nearestPointOnSegment(
      wx, wy, this.start.x, this.start.y, this.end.x, this.end.y
    );
    return nearest.distance <= tolerance;
  }

  getBoundingBox() {
    return {
      minX: Math.min(this.start.x, this.end.x),
      minY: Math.min(this.start.y, this.end.y),
      maxX: Math.max(this.start.x, this.end.x),
      maxY: Math.max(this.start.y, this.end.y)
    };
  }

  getSnapPoints() {
    const mid = GeometryEngine.midpoint(this.start.x, this.start.y, this.end.x, this.end.y);
    return [
      { x: this.start.x, y: this.start.y, type: 'endpoint' },
      { x: this.end.x, y: this.end.y, type: 'endpoint' },
      { x: mid.x, y: mid.y, type: 'midpoint' }
    ];
  }

  getNearestPoint(wx, wy) {
    return GeometryEngine.nearestPointOnSegment(
      wx, wy, this.start.x, this.start.y, this.end.x, this.end.y
    );
  }

  getSegmentPoints() {
    return [{ x1: this.start.x, y1: this.start.y, x2: this.end.x, y2: this.end.y }];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      start: { ...this.start },
      end: { ...this.end }
    };
  }

  static fromJSON(data) {
    const line = new LineEntity(data.layerId, data.start.x, data.start.y, data.end.x, data.end.y);
    line.id = data.id;
    line.style = { ...line.style, ...data.style };
    line.linetypeId = data.linetypeId || 'Continuous';
    return line;
  }
}
