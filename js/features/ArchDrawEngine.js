/**
 * ArchDrawEngine — vẽ nhanh kiến trúc (tường, phòng, cột, sàn/trần mở)
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

  static formatArea(area) {
    return `${area.toFixed(2)} m²`;
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

  static rectOutline(layerId, minX, minY, maxX, maxY, style = {}) {
    const pl = new PolylineEntity(layerId, [
      { x: minX, y: minY }, { x: maxX, y: minY },
      { x: maxX, y: maxY }, { x: minX, y: maxY }
    ]);
    pl.closed = true;
    if (style.lineDash) pl.style.lineDash = style.lineDash;
    if (style.lineWidth) pl.style.lineWidth = style.lineWidth;
    if (style.color) pl.style.color = style.color;
    return pl;
  }

  static createAreaLabel(layerId, cx, cy, area, prefix = 'S') {
    const text = `${prefix}= ${ArchDrawEngine.formatArea(area)}`;
    const height = Math.max(0.12, Math.sqrt(Math.max(area, 0.01)) * 0.07);
    const label = new TextEntity(layerId, cx, cy, text, height);
    label.centered = true;
    label.archLabel = true;
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
    const pts = ArchDrawEngine.wallPolygon({ x: x1, y: y1 }, { x: x2, y: y2 }, thickness);
    if (!pts) return [];
    const layerId = app.layerManager.currentLayerId;
    const wall = new HatchEntity(layerId, pts, 'SOLID');
    wall.style.color = '#78909c';
    wall.archType = 'wall';
    return ArchDrawEngine._commit(app, [wall]);
  }

  static createOpenWall(app, x1, y1, x2, y2) {
    const layerId = app.layerManager.currentLayerId;
    const line = new LineEntity(layerId, x1, y1, x2, y2);
    line.style.lineDash = [12, 6];
    line.style.lineWidth = 2;
    line.style.color = '#78909c';
    line.archType = 'open-wall';
    return ArchDrawEngine._commit(app, [line]);
  }

  static createRoom(app, x1, y1, x2, y2) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY);
    outline.archType = 'room';
    const fill = new HatchEntity(layerId, outline.points, 'SOLID');
    fill.style.color = '#4fc3f7';
    fill.archType = 'room-fill';
    const label = ArchDrawEngine.createAreaLabel(layerId, b.cx, b.cy, b.area, 'S');
    return ArchDrawEngine._commit(app, [fill, outline, label]);
  }

  static createOpenFloor(app, x1, y1, x2, y2) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      lineDash: [10, 5],
      color: '#66bb6a'
    });
    outline.archType = 'open-floor';
    const label = ArchDrawEngine.createAreaLabel(layerId, b.cx, b.cy, b.area, 'S');
    return ArchDrawEngine._commit(app, [outline, label]);
  }

  static createOpenCeiling(app, x1, y1, x2, y2) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      lineDash: [4, 4, 12, 4],
      color: '#ab47bc'
    });
    outline.archType = 'open-ceiling';
    const label = ArchDrawEngine.createAreaLabel(layerId, b.cx, b.cy, b.area, 'T');
    return ArchDrawEngine._commit(app, [outline, label]);
  }

  static createColumn(app, x1, y1, x2, y2) {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const pts = [
      { x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY },
      { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY }
    ];
    const col = new HatchEntity(layerId, pts, 'SOLID');
    col.style.color = '#455a64';
    col.archType = 'column';
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      color: '#263238',
      lineWidth: 2
    });
    return ArchDrawEngine._commit(app, [col, outline]);
  }

  static createRoundColumn(app, cx, cy, edgeX, edgeY) {
    const r = GeometryEngine.distance(cx, cy, edgeX, edgeY);
    if (r < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const outer = new CircleEntity(layerId, cx, cy, r);
    outer.style.lineWidth = 2;
    outer.style.color = '#263238';
    outer.archType = 'round-column';
    const inner = new CircleEntity(layerId, cx, cy, r * 0.55);
    inner.style.lineDash = [4, 3];
    inner.style.color = '#455a64';
    const fill = new HatchEntity(layerId, ArchDrawEngine._circlePoints(cx, cy, r, 24), 'SOLID');
    fill.style.color = '#546e7a';
    return ArchDrawEngine._commit(app, [fill, outer, inner]);
  }

  static _circlePoints(cx, cy, r, n = 24) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  }

  static previewAreaMeasures(x1, y1, x2, y2, prefix = 'S') {
    const b = ArchDrawEngine.bounds(x1, y1, x2, y2);
    return [
      { kind: 'segment', x1: b.minX, y1: b.minY, x2: b.maxX, y2: b.minY, label: `${b.w.toFixed(2)} m` },
      { kind: 'segment', x1: b.minX, y1: b.minY, x2: b.minX, y2: b.maxY, label: `${b.h.toFixed(2)} m` },
      { kind: 'label', x: b.cx, y: b.cy, text: `${prefix}= ${ArchDrawEngine.formatArea(b.area)}` }
    ];
  }
}
