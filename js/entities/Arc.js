class ArcEntity extends Entity {
  constructor(layerId, cx, cy, radius, startAngle, endAngle) {
    super('ARC', layerId);
    this.center = { x: cx, y: cy };
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }

  draw(ctx, drawing, layerManager) {
    const sc = drawing.worldToScreen(this.center.x, this.center.y, ctx.canvas.width, ctx.canvas.height);
    const sr = this.radius * drawing.view.zoom;

    ctx.save();
    ctx.strokeStyle = this.getColor(layerManager);
    ctx.lineWidth = this.style.lineWidth;
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sr, -this.endAngle, -this.startAngle, true);
    ctx.stroke();
    ctx.restore();
  }

  move(dx, dy) {
    this.center.x += dx;
    this.center.y += dy;
  }

  rotate(cx, cy, angle) {
    this.center = GeometryEngine.rotatePoint(this.center.x, this.center.y, cx, cy, angle);
    this.startAngle += angle;
    this.endAngle += angle;
  }

  scale(cx, cy, factor) {
    this.center = GeometryEngine.scalePoint(this.center.x, this.center.y, cx, cy, factor);
    this.radius *= factor;
  }

  _getStartPoint() {
    return {
      x: this.center.x + Math.cos(this.startAngle) * this.radius,
      y: this.center.y + Math.sin(this.startAngle) * this.radius
    };
  }

  _getEndPoint() {
    return {
      x: this.center.x + Math.cos(this.endAngle) * this.radius,
      y: this.center.y + Math.sin(this.endAngle) * this.radius
    };
  }

  hitTest(wx, wy, tolerance) {
    const dist = GeometryEngine.distance(wx, wy, this.center.x, this.center.y);
    if (Math.abs(dist - this.radius) > tolerance) return false;
    let angle = Math.atan2(wy - this.center.y, wx - this.center.x);
    if (angle < 0) angle += Math.PI * 2;
    let start = this.startAngle;
    let end = this.endAngle;
    if (start < 0) start += Math.PI * 2;
    if (end < 0) end += Math.PI * 2;
    if (start <= end) return angle >= start && angle <= end;
    return angle >= start || angle <= end;
  }

  getBoundingBox() {
    const start = this._getStartPoint();
    const end = this._getEndPoint();
    return {
      minX: Math.min(start.x, end.x, this.center.x - this.radius),
      minY: Math.min(start.y, end.y, this.center.y - this.radius),
      maxX: Math.max(start.x, end.x, this.center.x + this.radius),
      maxY: Math.max(start.y, end.y, this.center.y + this.radius)
    };
  }

  getSnapPoints() {
    const start = this._getStartPoint();
    const end = this._getEndPoint();
    const midAngle = (this.startAngle + this.endAngle) / 2;
    return [
      { x: this.center.x, y: this.center.y, type: 'center' },
      { x: start.x, y: start.y, type: 'endpoint' },
      { x: end.x, y: end.y, type: 'endpoint' },
      {
        x: this.center.x + Math.cos(midAngle) * this.radius,
        y: this.center.y + Math.sin(midAngle) * this.radius,
        type: 'midpoint'
      }
    ];
  }

  getNearestPoint(wx, wy) {
    const angle = GeometryEngine.angle(this.center.x, this.center.y, wx, wy);
    return {
      x: this.center.x + Math.cos(angle) * this.radius,
      y: this.center.y + Math.sin(angle) * this.radius,
      distance: Math.abs(GeometryEngine.distance(wx, wy, this.center.x, this.center.y) - this.radius)
    };
  }

  toJSON() {
    return {
      ...super.toJSON(),
      center: { ...this.center },
      radius: this.radius,
      startAngle: this.startAngle,
      endAngle: this.endAngle
    };
  }

  static fromJSON(data) {
    const arc = new ArcEntity(
      data.layerId, data.center.x, data.center.y, data.radius,
      data.startAngle, data.endAngle
    );
    arc.id = data.id;
    arc.style = { ...arc.style, ...data.style };
    return arc;
  }
}
