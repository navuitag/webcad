class PolylineEntity extends Entity {
  constructor(layerId, points = []) {
    super('POLYLINE', layerId);
    this.points = points;
    this.closed = false;
  }

  draw(ctx, drawing, layerManager) {
    if (this.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = this.getColor(layerManager);
    ctx.lineWidth = this.style.lineWidth;
    if (this.style.lineDash.length) ctx.setLineDash(this.style.lineDash);
    ctx.beginPath();
    const first = drawing.worldToScreen(this.points[0].x, this.points[0].y, ctx.canvas.width, ctx.canvas.height);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < this.points.length; i++) {
      const p = drawing.worldToScreen(this.points[i].x, this.points[i].y, ctx.canvas.width, ctx.canvas.height);
      ctx.lineTo(p.x, p.y);
    }
    if (this.closed) ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  move(dx, dy) {
    for (const p of this.points) {
      p.x += dx;
      p.y += dy;
    }
  }

  rotate(cx, cy, angle) {
    this.points = this.points.map(p => GeometryEngine.rotatePoint(p.x, p.y, cx, cy, angle));
  }

  scale(cx, cy, factor) {
    this.points = this.points.map(p => GeometryEngine.scalePoint(p.x, p.y, cx, cy, factor));
  }

  hitTest(wx, wy, tolerance) {
    for (let i = 0; i < this.points.length - 1; i++) {
      const nearest = GeometryEngine.nearestPointOnSegment(
        wx, wy,
        this.points[i].x, this.points[i].y,
        this.points[i + 1].x, this.points[i + 1].y
      );
      if (nearest.distance <= tolerance) return true;
    }
    if (this.closed && this.points.length > 2) {
      const last = this.points.length - 1;
      const nearest = GeometryEngine.nearestPointOnSegment(
        wx, wy,
        this.points[last].x, this.points[last].y,
        this.points[0].x, this.points[0].y
      );
      if (nearest.distance <= tolerance) return true;
    }
    return false;
  }

  getBoundingBox() {
    if (this.points.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  getSnapPoints() {
    const snaps = [];
    for (let i = 0; i < this.points.length; i++) {
      snaps.push({ x: this.points[i].x, y: this.points[i].y, type: 'endpoint' });
      if (i < this.points.length - 1) {
        const mid = GeometryEngine.midpoint(
          this.points[i].x, this.points[i].y,
          this.points[i + 1].x, this.points[i + 1].y
        );
        snaps.push({ x: mid.x, y: mid.y, type: 'midpoint' });
      }
    }
    return snaps;
  }

  getNearestPoint(wx, wy) {
    let best = null;
    for (let i = 0; i < this.points.length - 1; i++) {
      const nearest = GeometryEngine.nearestPointOnSegment(
        wx, wy,
        this.points[i].x, this.points[i].y,
        this.points[i + 1].x, this.points[i + 1].y
      );
      if (!best || nearest.distance < best.distance) best = nearest;
    }
    return best;
  }

  getSegmentPoints() {
    const segments = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      segments.push({
        x1: this.points[i].x, y1: this.points[i].y,
        x2: this.points[i + 1].x, y2: this.points[i + 1].y
      });
    }
    return segments;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      points: this.points.map(p => ({ ...p })),
      closed: this.closed
    };
  }

  static fromJSON(data) {
    const pline = new PolylineEntity(data.layerId, data.points);
    pline.id = data.id;
    pline.closed = data.closed || false;
    pline.style = { ...pline.style, ...data.style };
    return pline;
  }
}
