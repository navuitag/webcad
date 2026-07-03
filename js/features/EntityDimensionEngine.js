/**
 * EntityDimensionEngine — đọc / chỉnh kích thước đối tượng (chiều dài, chiều cao)
 */
class EntityDimensionEngine {
  static getDimensions(entity) {
    if (!entity?.getBoundingBox) return null;
    const bb = entity.getBoundingBox();
    if (!bb) return null;

    const width = bb.maxX - bb.minX;
    const height = bb.maxY - bb.minY;

    if (entity.type === 'LINE') {
      const length = GeometryKernel.distance(
        entity.start.x, entity.start.y, entity.end.x, entity.end.y
      );
      return { width: length, height: null, length, hasHeight: false, hasLength: true };
    }

    if (entity.type === 'CIRCLE') {
      return {
        width: entity.radius * 2,
        height: entity.radius * 2,
        radius: entity.radius,
        hasHeight: false,
        hasLength: false,
        isCircle: true
      };
    }

    if (entity.type === 'ARC') {
      return {
        width: entity.radius * 2,
        height: entity.radius * 2,
        radius: entity.radius,
        hasHeight: false,
        hasLength: false,
        isArc: true
      };
    }

    if (['RECTANGLE', 'HATCH', 'POLYLINE'].includes(entity.type)) {
      return { width, height, hasHeight: true, hasLength: false };
    }

    return null;
  }

  static setWidth(entity, value) {
    const w = parseFloat(value);
    if (!Number.isFinite(w) || w <= 0) return false;
    if (entity.type === 'LINE') return EntityDimensionEngine.setLength(entity, w);
    if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
      return EntityDimensionEngine.setRadius(entity, w / 2);
    }
    const dims = EntityDimensionEngine.getDimensions(entity);
    if (!dims?.hasHeight) return false;
    return EntityDimensionEngine._setBox(entity, w, dims.height);
  }

  static setHeight(entity, value) {
    const h = parseFloat(value);
    if (!Number.isFinite(h) || h <= 0) return false;
    const dims = EntityDimensionEngine.getDimensions(entity);
    if (!dims?.hasHeight) return false;
    return EntityDimensionEngine._setBox(entity, dims.width, h);
  }

  static setLength(entity, value) {
    const len = parseFloat(value);
    if (!Number.isFinite(len) || len <= 0 || entity.type !== 'LINE') return false;
    const dx = entity.end.x - entity.start.x;
    const dy = entity.end.y - entity.start.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-12) {
      entity.end.x = entity.start.x + len;
      entity.end.y = entity.start.y;
      return true;
    }
    const f = len / dist;
    entity.end.x = entity.start.x + dx * f;
    entity.end.y = entity.start.y + dy * f;
    return true;
  }

  static setRadius(entity, value) {
    const r = parseFloat(value);
    if (!Number.isFinite(r) || r <= 0) return false;
    if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
      entity.radius = r;
      return true;
    }
    return false;
  }

  static _setBox(entity, width, height) {
    const bb = entity.getBoundingBox();
    if (!bb) return false;
    const ow = bb.maxX - bb.minX;
    const oh = bb.maxY - bb.minY;
    if (ow < 1e-12 || oh < 1e-12) return false;

    if (entity.type === 'RECTANGLE') {
      entity.corner1 = { x: bb.minX, y: bb.minY };
      entity.corner2 = { x: bb.minX + width, y: bb.minY + height };
      return true;
    }

    if (entity.type === 'HATCH') {
      entity.boundary = EntityDimensionEngine._scalePoints(
        entity.boundary, bb, width, height
      );
      return true;
    }

    if (entity.type === 'POLYLINE') {
      entity.points = EntityDimensionEngine._scalePoints(
        entity.points, bb, width, height
      );
      return true;
    }

    return false;
  }

  static _scalePoints(points, bb, newW, newH) {
    const ow = bb.maxX - bb.minX;
    const oh = bb.maxY - bb.minY;
    return points.map(p => ({
      x: bb.minX + ((p.x - bb.minX) / ow) * newW,
      y: bb.minY + ((p.y - bb.minY) / oh) * newH
    }));
  }
}
