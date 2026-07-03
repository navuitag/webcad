class TextEntity extends Entity {
  constructor(layerId, x, y, text, height = 10) {
    super('TEXT', layerId);
    this.position = { x, y };
    this.text = text;
    this.height = height;
    this.rotation = 0;
  }

  draw(ctx, drawing, layerManager) {
    const sp = drawing.worldToScreen(this.position.x, this.position.y, ctx.canvas.width, ctx.canvas.height);
    const fontSize = this.height * drawing.view.zoom;

    ctx.save();
    ctx.fillStyle = this.getColor(layerManager);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = 'bottom';
    if (this.rotation !== 0) {
      ctx.translate(sp.x, sp.y);
      ctx.rotate(-this.rotation);
      ctx.fillText(this.text, 0, 0);
    } else {
      ctx.fillText(this.text, sp.x, sp.y);
    }
    ctx.restore();
  }

  move(dx, dy) {
    this.position.x += dx;
    this.position.y += dy;
  }

  rotate(cx, cy, angle) {
    this.position = GeometryEngine.rotatePoint(this.position.x, this.position.y, cx, cy, angle);
    this.rotation += angle;
  }

  scale(cx, cy, factor) {
    this.position = GeometryEngine.scalePoint(this.position.x, this.position.y, cx, cy, factor);
    this.height *= factor;
  }

  hitTest(wx, wy, tolerance) {
    return GeometryEngine.distance(wx, wy, this.position.x, this.position.y) <= tolerance + this.height;
  }

  getBoundingBox() {
    const w = this.text.length * this.height * 0.6;
    return {
      minX: this.position.x,
      minY: this.position.y,
      maxX: this.position.x + w,
      maxY: this.position.y + this.height
    };
  }

  getSnapPoints() {
    return [{ x: this.position.x, y: this.position.y, type: 'endpoint' }];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      position: { ...this.position },
      text: this.text,
      height: this.height,
      rotation: this.rotation
    };
  }

  static fromJSON(data) {
    const text = new TextEntity(data.layerId, data.position.x, data.position.y, data.text, data.height);
    text.id = data.id;
    text.rotation = data.rotation || 0;
    text.style = { ...text.style, ...data.style };
    return text;
  }
}
