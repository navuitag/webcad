class Entity {
  constructor(type, layerId) {
    this.id = 'ent_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    this.type = type;
    this.layerId = layerId;
    this.selected = false;
    this.linetypeId = 'Continuous';
    this.textStyleId = 'Standard';
    this.dimStyleId = 'Standard';
    this.style = {
      color: null,
      lineWidth: 1,
      lineDash: []
    };
  }

  applyStroke(ctx, layerManager, styleManager) {
    ctx.strokeStyle = this.getColor(layerManager);
    ctx.lineWidth = this.style.lineWidth;
    const dash = styleManager
      ? styleManager.getLineDash(this.linetypeId, this.style.lineDash)
      : this.style.lineDash;
    if (dash && dash.length) ctx.setLineDash(dash);
    else ctx.setLineDash([]);
  }

  getColor(layerManager) {
    if (this.style.color) return this.style.color;
    const layer = layerManager.getLayer(this.layerId);
    return layer ? layer.color : '#ffffff';
  }

  draw(ctx, drawing, layerManager) {}

  drawSelection(ctx, drawing, layerManager) {
    const bb = this.getBoundingBox();
    if (!bb) return;
    const p1 = drawing.worldToScreen(bb.minX, bb.minY, ctx.canvas.width, ctx.canvas.height);
    const p2 = drawing.worldToScreen(bb.maxX, bb.maxY, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      Math.min(p1.x, p2.x) - 4,
      Math.min(p1.y, p2.y) - 4,
      Math.abs(p2.x - p1.x) + 8,
      Math.abs(p2.y - p1.y) + 8
    );
    ctx.restore();
  }

  move(dx, dy) {}

  rotate(cx, cy, angle) {}

  scale(cx, cy, factor) {}

  hitTest(wx, wy, tolerance) {
    return false;
  }

  getBoundingBox() {
    return null;
  }

  getSnapPoints() {
    return [];
  }

  getNearestPoint(wx, wy) {
    return null;
  }

  getSegmentPoints() {
    return [];
  }

  clone() {
    const data = this.toJSON();
    data.id = 'ent_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    return EntityFactory.create(data);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      layerId: this.layerId,
      linetypeId: this.linetypeId,
      textStyleId: this.textStyleId,
      dimStyleId: this.dimStyleId,
      style: { ...this.style }
    };
  }
}
