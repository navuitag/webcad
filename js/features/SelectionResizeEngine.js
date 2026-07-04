/**
 * SelectionResizeEngine — kéo grip để đổi kích thước đối tượng 2D
 */
class SelectionResizeEngine {
  static RESIZABLE = new Set(['RECTANGLE', 'HATCH', 'POLYLINE', 'CIRCLE', 'LINE']);

  static canResize(entity) {
    if (!entity?.getBoundingBox) return false;
    if (entity.type === 'POLYLINE' && !entity.closed) return false;
    return SelectionResizeEngine.RESIZABLE.has(entity.type);
  }

  static getHandles(entity) {
    if (!SelectionResizeEngine.canResize(entity)) return [];

    if (entity.type === 'CIRCLE') {
      return [{
        id: 'radius',
        x: entity.center.x + entity.radius,
        y: entity.center.y,
        cursor: 'ew-resize'
      }];
    }

    if (entity.type === 'LINE') {
      return [
        { id: 'start', x: entity.start.x, y: entity.start.y, cursor: 'move' },
        { id: 'end', x: entity.end.x, y: entity.end.y, cursor: 'crosshair' }
      ];
    }

    const bb = entity.getBoundingBox();
    if (!bb) return [];
    const cx = (bb.minX + bb.maxX) / 2;
    const cy = (bb.minY + bb.maxY) / 2;
    return [
      { id: 'nw', x: bb.minX, y: bb.maxY, cursor: 'nwse-resize' },
      { id: 'n', x: cx, y: bb.maxY, cursor: 'ns-resize' },
      { id: 'ne', x: bb.maxX, y: bb.maxY, cursor: 'nesw-resize' },
      { id: 'e', x: bb.maxX, y: cy, cursor: 'ew-resize' },
      { id: 'se', x: bb.maxX, y: bb.minY, cursor: 'nwse-resize' },
      { id: 's', x: cx, y: bb.minY, cursor: 'ns-resize' },
      { id: 'sw', x: bb.minX, y: bb.minY, cursor: 'nesw-resize' },
      { id: 'w', x: bb.minX, y: cy, cursor: 'ew-resize' }
    ];
  }

  static hitTest(handles, wx, wy, tolerance) {
    for (const h of handles) {
      if (Math.hypot(h.x - wx, h.y - wy) <= tolerance) return h;
    }
    return null;
  }

  static drawHandles(ctx, drawing, entity) {
    const handles = SelectionResizeEngine.getHandles(entity);
    if (!handles.length) return;
    const size = 7;
    ctx.save();
    for (const h of handles) {
      const p = drawing.worldToScreen(h.x, h.y, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1565c0';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.rect(p.x - size / 2, p.y - size / 2, size, size);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  static applyHandle(entity, handleId, wx, wy, anchor) {
    if (!anchor) return false;
    const minSize = 0.05;

    if (entity.type === 'CIRCLE' && handleId === 'radius') {
      const r = Math.hypot(wx - entity.center.x, wy - entity.center.y);
      if (r < minSize) return false;
      entity.radius = r;
      return true;
    }

    if (entity.type === 'LINE') {
      if (handleId === 'start') {
        entity.start = { x: wx, y: wy };
        return true;
      }
      if (handleId === 'end') {
        entity.end = { x: wx, y: wy };
        return true;
      }
      return false;
    }

    const { minX, minY, maxX, maxY } = anchor;
    let nMinX = minX;
    let nMinY = minY;
    let nMaxX = maxX;
    let nMaxY = maxY;

    switch (handleId) {
      case 'e': nMaxX = wx; break;
      case 'w': nMinX = wx; break;
      case 'n': nMaxY = wy; break;
      case 's': nMinY = wy; break;
      case 'ne': nMaxX = wx; nMaxY = wy; break;
      case 'nw': nMinX = wx; nMaxY = wy; break;
      case 'se': nMaxX = wx; nMinY = wy; break;
      case 'sw': nMinX = wx; nMinY = wy; break;
      default: return false;
    }

    if (nMinX > nMaxX) [nMinX, nMaxX] = [nMaxX, nMinX];
    if (nMinY > nMaxY) [nMinY, nMaxY] = [nMaxY, nMinY];
    if (nMaxX - nMinX < minSize || nMaxY - nMinY < minSize) return false;

    return EntityDimensionEngine.setBounds(entity, nMinX, nMinY, nMaxX, nMaxY, anchor.sourceBb);
  }
}
