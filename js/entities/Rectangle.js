class RectangleEntity extends Entity {
  constructor(layerId, x1, y1, x2, y2) {
    super('RECTANGLE', layerId);
    this.corner1 = { x: x1, y: y1 };
    this.corner2 = { x: x2, y: y2 };
  }

  draw(ctx, drawing, layerManager) {
    const p1 = drawing.worldToScreen(this.corner1.x, this.corner1.y, ctx.canvas.width, ctx.canvas.height);
    const p2 = drawing.worldToScreen(this.corner2.x, this.corner2.y, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    if (this.planView && typeof ArchPlanStyle !== 'undefined') {
      ArchPlanStyle.drawRectFill(this, ctx, p1, p2, layerManager);
      ctx.restore();
      return;
    }
    ctx.strokeStyle = this.getColor(layerManager);
    ctx.lineWidth = this.style.lineWidth;
    if (this.style.lineDash.length) ctx.setLineDash(this.style.lineDash);
    ctx.strokeRect(
      Math.min(p1.x, p2.x), Math.min(p1.y, p2.y),
      Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)
    );
    ctx.restore();
  }

  move(dx, dy) {
    this.corner1.x += dx;
    this.corner1.y += dy;
    this.corner2.x += dx;
    this.corner2.y += dy;
  }

  rotate(cx, cy, angle) {
    this.corner1 = GeometryEngine.rotatePoint(this.corner1.x, this.corner1.y, cx, cy, angle);
    this.corner2 = GeometryEngine.rotatePoint(this.corner2.x, this.corner2.y, cx, cy, angle);
  }

  scale(cx, cy, factor) {
    this.corner1 = GeometryEngine.scalePoint(this.corner1.x, this.corner1.y, cx, cy, factor);
    this.corner2 = GeometryEngine.scalePoint(this.corner2.x, this.corner2.y, cx, cy, factor);
  }

  _getCorners() {
    const minX = Math.min(this.corner1.x, this.corner2.x);
    const maxX = Math.max(this.corner1.x, this.corner2.x);
    const minY = Math.min(this.corner1.y, this.corner2.y);
    const maxY = Math.max(this.corner1.y, this.corner2.y);
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  }

  hitTest(wx, wy, tolerance) {
    const corners = this._getCorners();
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const nearest = GeometryEngine.nearestPointOnSegment(
        wx, wy, corners[i].x, corners[i].y, corners[j].x, corners[j].y
      );
      if (nearest.distance <= tolerance) return true;
    }
    return false;
  }

  getBoundingBox() {
    return {
      minX: Math.min(this.corner1.x, this.corner2.x),
      minY: Math.min(this.corner1.y, this.corner2.y),
      maxX: Math.max(this.corner1.x, this.corner2.x),
      maxY: Math.max(this.corner1.y, this.corner2.y)
    };
  }

  getSnapPoints() {
    const corners = this._getCorners();
    const snaps = corners.map(c => ({ x: c.x, y: c.y, type: 'endpoint' }));
    const mid = GeometryEngine.midpoint(corners[0].x, corners[0].y, corners[2].x, corners[2].y);
    snaps.push({ x: mid.x, y: mid.y, type: 'center' });
    return snaps;
  }

  getNearestPoint(wx, wy) {
    const corners = this._getCorners();
    let best = null;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const nearest = GeometryEngine.nearestPointOnSegment(
        wx, wy, corners[i].x, corners[i].y, corners[j].x, corners[j].y
      );
      if (!best || nearest.distance < best.distance) best = nearest;
    }
    return best;
  }

  getSegmentPoints() {
    const corners = this._getCorners();
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      segments.push({ x1: corners[i].x, y1: corners[i].y, x2: corners[j].x, y2: corners[j].y });
    }
    return segments;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      corner1: { ...this.corner1 },
      corner2: { ...this.corner2 }
    };
  }

  static fromJSON(data) {
    const rect = new RectangleEntity(
      data.layerId, data.corner1.x, data.corner1.y, data.corner2.x, data.corner2.y
    );
    rect.id = data.id;
    rect.style = { ...rect.style, ...data.style };
    return rect;
  }
}
