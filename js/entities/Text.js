class TextEntity extends Entity {
  constructor(layerId, x, y, text, height = 10) {
    super('TEXT', layerId);
    this.position = { x, y };
    this.text = text;
    this.height = height;
    this.rotation = 0;
    this.centered = false;
    this.fontFamily = null;
    this.fontWeight = 'normal';
    this.fontStyle = 'normal';
  }

  _resolveStyle(styleManager) {
    const ts = styleManager?.getTextStyle?.(this.textStyleId) || {};
    return {
      height: this.height ?? ts.height ?? 10,
      fontFamily: this.fontFamily || ts.fontFamily || 'Arial, sans-serif',
      fontWeight: this.fontWeight || ts.fontWeight || 'normal',
      fontStyle: this.fontStyle || ts.fontStyle || 'normal',
      widthFactor: ts.widthFactor || 1
    };
  }

  draw(ctx, drawing, layerManager, styleManager) {
    const st = this._resolveStyle(styleManager);
    const sp = drawing.worldToScreen(this.position.x, this.position.y, ctx.canvas.width, ctx.canvas.height);
    const fontSize = st.height * drawing.view.zoom;

    ctx.save();
    ctx.fillStyle = this.getColor(layerManager);
    ctx.font = `${st.fontStyle} ${st.fontWeight} ${fontSize}px ${st.fontFamily}`;

    if (this.centered) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (this.rotation !== 0) {
        ctx.translate(sp.x, sp.y);
        ctx.rotate(-this.rotation);
        if (st.widthFactor !== 1) ctx.scale(st.widthFactor, 1);
        ctx.fillText(this.text, 0, 0);
      } else {
        if (st.widthFactor !== 1) {
          ctx.translate(sp.x, sp.y);
          ctx.scale(st.widthFactor, 1);
          ctx.fillText(this.text, 0, 0);
        } else {
          ctx.fillText(this.text, sp.x, sp.y);
        }
      }
    } else {
      ctx.textBaseline = 'bottom';
      ctx.translate(sp.x, sp.y);
      ctx.rotate(-this.rotation);
      if (st.widthFactor !== 1) ctx.scale(st.widthFactor, 1);
      ctx.fillText(this.text, 0, 0);
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
      rotation: this.rotation,
      centered: !!this.centered,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle
    };
  }

  static fromJSON(data) {
    const text = new TextEntity(data.layerId, data.position.x, data.position.y, data.text, data.height);
    text.id = data.id;
    text.rotation = data.rotation || 0;
    text.centered = !!data.centered;
    text.fontFamily = data.fontFamily || null;
    text.fontWeight = data.fontWeight || 'normal';
    text.fontStyle = data.fontStyle || 'normal';
    text.style = { ...text.style, ...data.style };
    return text;
  }
}
