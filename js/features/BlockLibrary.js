/**
 * BlockLibrary — thư viện mẫu nhà, cửa, cầu thang, điện nước
 */
class BlockLibrary {
  static categories = {
    house: { label: 'Nhà / Tường', icon: '🏠' },
    door: { label: 'Cửa & Cửa sổ', icon: '🚪' },
    stair: { label: 'Cầu thang', icon: '🪜' },
    mep: { label: 'Điện nước', icon: '⚡' }
  };

  static templates = {
    'wall-segment': {
      category: 'house', name: 'Tường 100mm', width: 100, height: 10,
      entities: (w, h) => [{ type: 'RECTANGLE', x1: 0, y1: 0, x2: w, y2: h }]
    },
    'room-label': {
      category: 'house', name: 'Nhãn phòng', width: 40, height: 10,
      entities: () => [{ type: 'TEXT', x: 0, y: 0, text: 'PHÒNG', height: 3 }]
    },
    'door-single': {
      category: 'door', name: 'Cửa đi 900', width: 90, height: 10,
      entities: () => [
        { type: 'LINE', x1: 0, y1: 0, x2: 90, y2: 0 },
        { type: 'ARC', cx: 0, cy: 0, r: 90, startAngle: 0, endAngle: Math.PI / 2 }
      ]
    },
    'door-double': {
      category: 'door', name: 'Cửa đôi 1800', width: 180, height: 10,
      entities: () => [
        { type: 'LINE', x1: 0, y1: 0, x2: 180, y2: 0 },
        { type: 'ARC', cx: 0, cy: 0, r: 90, startAngle: 0, endAngle: Math.PI / 2 },
        { type: 'ARC', cx: 180, cy: 0, r: 90, startAngle: Math.PI / 2, endAngle: Math.PI }
      ]
    },
    'window': {
      category: 'door', name: 'Cửa sổ 1200', width: 120, height: 10,
      entities: () => [
        { type: 'LINE', x1: 0, y1: 0, x2: 120, y2: 0 },
        { type: 'LINE', x1: 0, y1: 5, x2: 120, y2: 5 },
        { type: 'LINE', x1: 60, y1: 0, x2: 60, y2: 5 }
      ]
    },
    'stairs': {
      category: 'stair', name: 'Cầu thang', width: 100, height: 200,
      entities: () => {
        const lines = [];
        for (let i = 0; i <= 10; i++) {
          const y = i * 20;
          lines.push({ type: 'LINE', x1: 0, y1: y, x2: 100, y2: y });
        }
        lines.push({ type: 'LINE', x1: 0, y1: 0, x2: 0, y2: 200 });
        lines.push({ type: 'LINE', x1: 100, y1: 0, x2: 100, y2: 200 });
        return lines;
      }
    },
    'outlet': {
      category: 'mep', name: 'Ổ cắm điện', width: 8, height: 8,
      entities: () => [
        { type: 'CIRCLE', cx: 4, cy: 4, r: 4 },
        { type: 'LINE', x1: 2, y1: 4, x2: 6, y2: 4 },
        { type: 'LINE', x1: 4, y1: 2, x2: 4, y2: 6 }
      ]
    },
    'switch': {
      category: 'mep', name: 'Công tắc', width: 8, height: 8,
      entities: () => [
        { type: 'RECTANGLE', x1: 0, y1: 0, x2: 8, y2: 8 },
        { type: 'LINE', x1: 2, y1: 4, x2: 6, y2: 4 }
      ]
    },
    'pipe': {
      category: 'mep', name: 'Ống nước', width: 50, height: 6,
      entities: () => [
        { type: 'CIRCLE', cx: 3, cy: 3, r: 3 },
        { type: 'LINE', x1: 3, y1: 3, x2: 47, y2: 3 },
        { type: 'CIRCLE', cx: 47, cy: 3, r: 3 }
      ]
    },
    'toilet': {
      category: 'mep', name: 'Bồn cầu', width: 40, height: 60,
      entities: () => [
        { type: 'RECTANGLE', x1: 0, y1: 0, x2: 40, y2: 60 },
        { type: 'CIRCLE', cx: 20, cy: 40, r: 12 }
      ]
    }
  };

  static list(category) {
    return Object.entries(this.templates)
      .filter(([, t]) => !category || t.category === category)
      .map(([id, t]) => ({ id, ...t }));
  }

  static insert(app, templateId, insertPoint = { x: 0, y: 0 }) {
    const tpl = this.templates[templateId];
    if (!tpl) return { success: false, message: 'Template not found' };

    const defs = typeof tpl.entities === 'function' ? tpl.entities(tpl.width, tpl.height) : tpl.entities;
    const layerId = app.layerManager.currentLayerId;
    const entities = [];

    for (const def of defs) {
      const e = BlockLibrary._createEntity(def, layerId);
      if (e) {
        e.move(insertPoint.x, insertPoint.y);
        app.drawing.addEntity(e);
        entities.push(e);
      }
    }

    app.requestRender();
    app.updateStatusBar();
    return { success: true, entities, name: tpl.name };
  }

  static _createEntity(def, layerId) {
    switch (def.type) {
      case 'LINE': return new LineEntity(layerId, def.x1, def.y1, def.x2, def.y2);
      case 'CIRCLE': return new CircleEntity(layerId, def.cx, def.cy, def.r);
      case 'ARC': return new ArcEntity(layerId, def.cx, def.cy, def.r, def.startAngle, def.endAngle);
      case 'RECTANGLE': return new RectangleEntity(layerId, def.x1, def.y1, def.x2, def.y2);
      case 'TEXT': return new TextEntity(layerId, def.x, def.y, def.text, def.height || 3);
      case 'POLYLINE': {
        const pl = new PolylineEntity(layerId, def.points || []);
        pl.closed = def.closed || false;
        return pl;
      }
      default: return null;
    }
  }
}
