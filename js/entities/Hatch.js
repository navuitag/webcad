class HatchEntity extends Entity {
  constructor(layerId, boundary, pattern = 'SOLID', scale = 1, angle = 0) {
    super('HATCH', layerId);
    this.boundary = boundary.map(p => ({ x: p.x, y: p.y }));
    this.pattern = pattern;
    this.scale = scale;
    this.angle = angle;
    this.linetypeId = 'Continuous';
  }

  draw(ctx, drawing, layerManager, styleManager) {
    if (this.boundary.length < 3) return;
    const pts = this.boundary.map(p =>
      drawing.worldToScreen(p.x, p.y, ctx.canvas.width, ctx.canvas.height)
    );

    ctx.save();
    const color = this.getColor(layerManager);
    const isPlan = this.planView && typeof ArchPlanStyle !== 'undefined';
    const fillOpacity = isPlan ? ArchPlanStyle.fillOpacity(this) : 0.35;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();

    if (this.pattern === 'SOLID') {
      ctx.fillStyle = color;
      ctx.globalAlpha = fillOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isPlan
        ? ArchPlanStyle.edgeColor(this, color)
        : color;
      ctx.lineWidth = isPlan ? 1.5 : 1;
      ctx.stroke();
    } else {
      ctx.clip();
      this._drawPattern(ctx, pts, color);
    }
    ctx.restore();
  }

  _drawPattern(ctx, pts, color) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    const spacing = 8 * this.scale;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 0.5;

    if (this.pattern === 'ANSI31') {
      const rad = (this.angle || 45) * Math.PI / 180;
      const dx = Math.cos(rad) * spacing;
      const dy = Math.sin(rad) * spacing;
      const diag = Math.hypot(maxX - minX, maxY - minY);
      for (let i = -diag; i < diag; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(minX + i * Math.cos(rad + Math.PI / 2), minY + i * Math.sin(rad + Math.PI / 2));
        ctx.lineTo(minX + i * Math.cos(rad + Math.PI / 2) + diag * Math.cos(rad),
          minY + i * Math.sin(rad + Math.PI / 2) + diag * Math.sin(rad));
        ctx.stroke();
      }
    } else if (this.pattern === 'CROSS') {
      for (let x = minX; x <= maxX; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, minY); ctx.lineTo(x, maxY); ctx.stroke();
      }
      for (let y = minY; y <= maxY; y += spacing) {
        ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(maxX, y); ctx.stroke();
      }
    } else if (this.pattern === 'DOTS') {
      for (let x = minX; x <= maxX; x += spacing) {
        for (let y = minY; y <= maxY; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  move(dx, dy) {
    for (const p of this.boundary) { p.x += dx; p.y += dy; }
  }

  rotate(cx, cy, angle) {
    this.boundary = this.boundary.map(p =>
      GeometryEngine.rotatePoint(p.x, p.y, cx, cy, angle)
    );
  }

  scale(cx, cy, factor) {
    this.boundary = this.boundary.map(p =>
      GeometryEngine.scalePoint(p.x, p.y, cx, cy, factor)
    );
  }

  hitTest(wx, wy, tolerance) {
    return GeometryKernel.pointInPolygon(wx, wy, this.boundary);
  }

  getBoundingBox() {
    return GeometryKernel.boundingBoxFromPoints(this.boundary);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      boundary: this.boundary.map(p => ({ ...p })),
      pattern: this.pattern,
      scale: this.scale,
      angle: this.angle,
      linetypeId: this.linetypeId,
      planView: this.planView,
      planRole: this.planRole,
      planFillOpacity: this.planFillOpacity,
      archType: this.archType,
      wallThickness: this.wallThickness,
      floorHeight: this.floorHeight,
      extrudeHeight: this.extrudeHeight
    };
  }

  static fromJSON(data) {
    const h = new HatchEntity(data.layerId, data.boundary, data.pattern, data.scale, data.angle);
    h.id = data.id;
    h.style = { ...h.style, ...data.style };
    h.linetypeId = data.linetypeId || 'Continuous';
    h.planView = data.planView;
    h.planRole = data.planRole;
    h.planFillOpacity = data.planFillOpacity;
    h.archType = data.archType;
    h.wallThickness = data.wallThickness;
    h.floorHeight = data.floorHeight;
    h.extrudeHeight = data.extrudeHeight;
    return h;
  }
}
