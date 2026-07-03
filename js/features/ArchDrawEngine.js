/**
 * ArchDrawEngine — vẽ nhanh kiến trúc (mặt bằng / plan view)
 * Đơn vị: mét (m²)
 */
class ArchDrawEngine {
  static DEFAULTS = {
    wallThickness: 0.15,
    columnSize: 0.4,
    columnRadius: 0.2,
    labelColor: '#90caf9'
  };

  static bounds(x1, y1, x2, y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const w = maxX - minX;
    const h = maxY - minY;
    return {
      minX, maxX, minY, maxY, w, h,
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      area: w * h
    };
  }

  static formatArea(area, displayUnit = 'm', worldUnit = 'm') {
    if (typeof UnitEngine !== 'undefined') {
      return UnitEngine.formatArea(area, displayUnit, worldUnit);
    }
    return `${area.toFixed(2)} m²`;
  }

  static _unitOpts(app) {
    return {
      unit: app.drawing.unit,
      worldUnit: app.drawing.worldUnit || app.drawing.unit
    };
  }

  static wallPolygon(p1, p2, thickness = ArchDrawEngine.DEFAULTS.wallThickness) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return null;
    const ox = (-dy / len) * (thickness / 2);
    const oy = (dx / len) * (thickness / 2);
    return [
      { x: p1.x + ox, y: p1.y + oy },
      { x: p2.x + ox, y: p2.y + oy },
      { x: p2.x - ox, y: p2.y - oy },
      { x: p1.x - ox, y: p1.y - oy }
    ];
  }

  static _innerRect(b, inset) {
    return {
      minX: b.minX + inset,
      maxX: b.maxX - inset,
      minY: b.minY + inset,
      maxY: b.maxY - inset
    };
  }

  static _rectPoints(minX, minY, maxX, maxY) {
    return [
      { x: minX, y: minY }, { x: maxX, y: minY },
      { x: maxX, y: maxY }, { x: minX, y: maxY }
    ];
  }

  static _wallHatch(layerId, p1, p2, thickness) {
    const pts = ArchDrawEngine.wallPolygon(p1, p2, thickness);
    if (!pts) return null;
    const wall = new HatchEntity(layerId, pts, 'SOLID');
    ArchPlanStyle.mark(wall, 'wall', {
      color: ArchPlanStyle.COLORS.wallCut,
      fillOpacity: 0.72
    });
    wall.archType = 'wall';
    return wall;
  }

  static _edgeWalls(layerId, b, thickness) {
    const t = thickness;
    return [
      ArchDrawEngine._wallHatch(layerId, { x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY }, t),
      ArchDrawEngine._wallHatch(layerId, { x: b.maxX, y: b.minY }, { x: b.maxX, y: b.maxY }, t),
      ArchDrawEngine._wallHatch(layerId, { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY }, t),
      ArchDrawEngine._wallHatch(layerId, { x: b.minX, y: b.maxY }, { x: b.minX, y: b.minY }, t)
    ].filter(Boolean);
  }

  static rectOutline(layerId, minX, minY, maxX, maxY, style = {}) {
    const pl = new PolylineEntity(layerId, ArchDrawEngine._rectPoints(minX, minY, maxX, maxY));
    pl.closed = true;
    if (style.lineDash) pl.style.lineDash = style.lineDash;
    if (style.lineWidth) pl.style.lineWidth = style.lineWidth;
    if (style.color) pl.style.color = style.color;
    if (style.planView !== false) {
      ArchPlanStyle.mark(pl, style.planRole || 'symbol', {
        color: style.color || ArchPlanStyle.COLORS.outline,
        lineWidth: style.lineWidth || 1
      });
    }
    return pl;
  }

  static createAreaLabel(layerId, cx, cy, area, prefix = 'S', unitOpts = null) {
    const u = unitOpts || { unit: 'm', worldUnit: 'm' };
    const text = `${prefix}= ${ArchDrawEngine.formatArea(area, u.unit, u.worldUnit)}`;
    const height = Math.max(0.12, Math.sqrt(Math.max(area, 0.01)) * 0.07);
    const label = new TextEntity(layerId, cx, cy, text, height);
    label.centered = true;
    label.archLabel = true;
    label.planView = true;
    label.style.color = ArchDrawEngine.DEFAULTS.labelColor;
    return label;
  }

  static _commit(app, entities) {
    const list = entities.filter(Boolean);
    for (const e of list) app.drawing.addEntity(e);
    if (list.length && app.cadCore?.history) {
      if (list.length === 1) {
        app.cadCore.history.push({ type: 'ADD_ENTITY', entity: list[0] });
      } else {
        app.cadCore.history.push({ type: 'ADD_ENTITIES', entities: list });
      }
    }
    app.requestRender();
    app.updateStatusBar();
    return list;
  }

  static createWall(app, x1, y1, x2, y2, thickness) {
    const wall = ArchDrawEngine._wallHatch(
      app.layerManager.currentLayerId,
      { x: x1, y: y1 }, { x: x2, y: y2 },
      thickness || ArchDrawEngine.DEFAULTS.wallThickness
    );
    if (!wall) return [];
    return ArchDrawEngine._commit(app, [wall]);
  }

  static createOpenWall(app, x1, y1, x2, y2) {
    const layerId = app.layerManager.currentLayerId;
    const t = 0.04;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return [];
    const ox = (-dy / len) * t;
    const oy = (dx / len) * t;
    const mk = (sx, sy, ex, ey) => {
      const line = new LineEntity(layerId, sx, sy, ex, ey);
      ArchPlanStyle.mark(line, 'open-wall', {
        color: ArchPlanStyle.COLORS.openWall,
        lineWidth: 1.5,
        lineDash: [8, 5]
      });
      line.archType = 'open-wall';
      return line;
    };
    return ArchDrawEngine._commit(app, [
      mk(x1 + ox, y1 + oy, x2 + ox, y2 + oy),
      mk(x1 - ox, y1 - oy, x2 - ox, y2 - oy)
    ]);
  }

  static createRoom(app, x1, y1, x2, y2, opts = {}) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const t = ArchDrawEngine.DEFAULTS.wallThickness;
    const inner = ArchDrawEngine._innerRect(b, t);
    if (inner.maxX <= inner.minX || inner.maxY <= inner.minY) return [];

    const walls = ArchDrawEngine._edgeWalls(layerId, b, t);
    const floor = new HatchEntity(
      layerId,
      ArchDrawEngine._rectPoints(inner.minX, inner.minY, inner.maxX, inner.maxY),
      'SOLID'
    );
    ArchPlanStyle.mark(floor, 'room-floor', {
      color: ArchPlanStyle.COLORS.roomFloor,
      fillOpacity: 0.58
    });
    floor.archType = 'room-fill';
    const label = ArchDrawEngine.createAreaLabel(layerId, b.cx, b.cy, b.area, 'S', ArchDrawEngine._unitOpts(app));
    const entities = [...walls, floor, label];
    if (opts.name) {
      const nh = Math.max(0.12, Math.min(b.w, b.h) * 0.055);
      const nameLabel = new TextEntity(layerId, b.cx, b.cy + nh * 0.6, opts.name, nh);
      nameLabel.centered = true;
      nameLabel.textStyleId = 'RoomLabel';
      nameLabel.planView = true;
      nameLabel.style.color = ArchDrawEngine.DEFAULTS.labelColor;
      entities.push(nameLabel);
    }
    return ArchDrawEngine._commit(app, entities);
  }

  static createOpenFloor(app, x1, y1, x2, y2) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const fill = new HatchEntity(
      layerId,
      ArchDrawEngine._rectPoints(b.minX, b.minY, b.maxX, b.maxY),
      'ANSI31', 1, 45
    );
    ArchPlanStyle.mark(fill, 'floor', {
      color: ArchPlanStyle.COLORS.floor,
      fillOpacity: 0.62
    });
    fill.archType = 'open-floor';
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      lineDash: [10, 5],
      color: ArchPlanStyle.COLORS.floor,
      planRole: 'floor'
    });
    outline.archType = 'open-floor';
    const label = ArchDrawEngine.createAreaLabel(layerId, b.cx, b.cy, b.area, 'S', ArchDrawEngine._unitOpts(app));
    return ArchDrawEngine._commit(app, [fill, outline, label]);
  }

  static createOpenCeiling(app, x1, y1, x2, y2) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const fill = new HatchEntity(
      layerId,
      ArchDrawEngine._rectPoints(b.minX, b.minY, b.maxX, b.maxY),
      'DOTS', 1.2, 0
    );
    ArchPlanStyle.mark(fill, 'ceiling', {
      color: ArchPlanStyle.COLORS.ceiling,
      fillOpacity: 0.55
    });
    fill.archType = 'open-ceiling';
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      lineDash: [4, 4, 12, 4],
      color: ArchPlanStyle.COLORS.ceiling,
      planRole: 'ceiling'
    });
    outline.archType = 'open-ceiling';
    const label = ArchDrawEngine.createAreaLabel(layerId, b.cx, b.cy, b.area, 'T', ArchDrawEngine._unitOpts(app));
    return ArchDrawEngine._commit(app, [fill, outline, label]);
  }

  static createColumn(app, x1, y1, x2, y2) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const col = new HatchEntity(
      layerId,
      ArchDrawEngine._rectPoints(b.minX, b.minY, b.maxX, b.maxY),
      'SOLID'
    );
    ArchPlanStyle.mark(col, 'column', {
      color: ArchPlanStyle.COLORS.columnFill,
      fillOpacity: 0.82
    });
    col.archType = 'column';
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      color: ArchPlanStyle.COLORS.column,
      lineWidth: 2,
      planRole: 'column'
    });
    const x1l = new LineEntity(layerId, b.minX, b.minY, b.maxX, b.maxY);
    const x2l = new LineEntity(layerId, b.maxX, b.minY, b.minX, b.maxY);
    [x1l, x2l].forEach(l => ArchPlanStyle.mark(l, 'symbol', {
      color: ArchPlanStyle.COLORS.outline,
      lineWidth: 1
    }));
    return ArchDrawEngine._commit(app, [col, outline, x1l, x2l]);
  }

  static createRoundColumn(app, cx, cy, edgeX, edgeY) {
    const r = GeometryEngine.distance(cx, cy, edgeX, edgeY);
    if (r < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const fill = new HatchEntity(layerId, ArchDrawEngine._circlePoints(cx, cy, r, 32), 'SOLID');
    ArchPlanStyle.mark(fill, 'column', {
      color: ArchPlanStyle.COLORS.columnFill,
      fillOpacity: 0.82
    });
    fill.archType = 'round-column';
    const outer = new CircleEntity(layerId, cx, cy, r);
    ArchPlanStyle.mark(outer, 'column', {
      color: ArchPlanStyle.COLORS.column,
      fillOpacity: 0,
      lineWidth: 2
    });
    return ArchDrawEngine._commit(app, [fill, outer]);
  }

  static _circlePoints(cx, cy, r, n = 24) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  }

  static previewAreaMeasures(x1, y1, x2, y2, prefix = 'S', unitOpts = null) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    const u = unitOpts || { unit: 'm', worldUnit: 'm' };
    const fmt = (v) => UnitEngine.format(v, u.unit, u.worldUnit);
    return [
      { kind: 'segment', x1: b.minX, y1: b.minY, x2: b.maxX, y2: b.minY, label: fmt(b.w) },
      { kind: 'segment', x1: b.minX, y1: b.minY, x2: b.minX, y2: b.maxY, label: fmt(b.h) },
      { kind: 'label', x: b.cx, y: b.cy, text: `${prefix}= ${ArchDrawEngine.formatArea(b.area, u.unit, u.worldUnit)}` }
    ];
  }
}
