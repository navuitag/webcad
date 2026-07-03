class CircleEntity extends Entity {
  constructor(layerId, cx, cy, radius) {
    super('CIRCLE', layerId);
    this.center = { x: cx, y: cy };
    this.radius = radius;
  }

  draw(ctx, drawing, layerManager) {
    const sc = drawing.worldToScreen(this.center.x, this.center.y, ctx.canvas.width, ctx.canvas.height);
    const sr = this.radius * drawing.view.zoom;

    ctx.save();
    if (this.planView && typeof ArchPlanStyle !== 'undefined') {
      ArchPlanStyle.drawCircleFill(this, ctx, sc, sr, layerManager);
      ctx.restore();
      return;
    }
    ctx.strokeStyle = this.getColor(layerManager);
    ctx.lineWidth = this.style.lineWidth;
    if (this.style.lineDash.length) ctx.setLineDash(this.style.lineDash);
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  move(dx, dy) {
    this.center.x += dx;
    this.center.y += dy;
  }

  rotate(cx, cy, angle) {
    this.center = GeometryEngine.rotatePoint(this.center.x, this.center.y, cx, cy, angle);
  }

  scale(cx, cy, factor) {
    this.center = GeometryEngine.scalePoint(this.center.x, this.center.y, cx, cy, factor);
    this.radius *= factor;
  }

  hitTest(wx, wy, tolerance) {
    const dist = GeometryEngine.distance(wx, wy, this.center.x, this.center.y);
    return Math.abs(dist - this.radius) <= tolerance;
  }

  getBoundingBox() {
    return {
      minX: this.center.x - this.radius,
      minY: this.center.y - this.radius,
      maxX: this.center.x + this.radius,
      maxY: this.center.y + this.radius
    };
  }

  getSnapPoints() {
    return [
      { x: this.center.x, y: this.center.y, type: 'center' },
      { x: this.center.x + this.radius, y: this.center.y, type: 'endpoint' },
      { x: this.center.x - this.radius, y: this.center.y, type: 'endpoint' },
      { x: this.center.x, y: this.center.y + this.radius, type: 'endpoint' },
      { x: this.center.x, y: this.center.y - this.radius, type: 'endpoint' }
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
      radius: this.radius
    };
  }

  static fromJSON(data) {
    const circle = new CircleEntity(data.layerId, data.center.x, data.center.y, data.radius);
    circle.id = data.id;
    circle.style = { ...circle.style, ...data.style };
    return circle;
  }
}
