/**
 * DimensionEngine — tạo và tính toán kích thước qua kernel
 */
class DimensionEngine {
  /** Màu dimension — khác layer và live measure (#ffa726) */
  static COLOR = '#81c784';

  constructor(cadCore) {
    this.core = cadCore;
  }

  createLinear(p1, p2, offset = 10, layerId) {
    const entity = this.core.entities.create('DIMENSION', {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, offset
    }, layerId);
    entity.style.color = DimensionEngine.COLOR;
    return entity;
  }

  measureDistance(p1, p2) {
    return GeometryKernel.distance(p1.x, p1.y, p2.x, p2.y);
  }

  format(value) {
    return GeometryKernel.formatDistance(
      value, this.core.drawing.unit, 2,
      this.core.drawing.worldUnit || this.core.drawing.unit
    );
  }

  autoDimension(entity) {
    const bb = entity.getBoundingBox?.();
    const layerId = entity.layerId;
    const offset = 10;

    if (entity.type === 'LINE') {
      return this.createLinear(entity.start, entity.end, offset, layerId);
    }
    if (entity.type === 'RECTANGLE' && bb) {
      return [
        this.createLinear({ x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.minY }, offset, layerId),
        this.createLinear({ x: bb.minX, y: bb.minY }, { x: bb.minX, y: bb.maxY }, offset, layerId)
      ];
    }
    if (entity.type === 'CIRCLE') {
      const { x: cx, y: cy } = entity.center;
      const r = entity.radius;
      return this.createLinear({ x: cx - r, y: cy }, { x: cx + r, y: cy }, offset, layerId);
    }
    if (entity.type === 'ARC') {
      const { x: cx, y: cy } = entity.center;
      const r = entity.radius;
      const start = {
        x: cx + Math.cos(entity.startAngle) * r,
        y: cy + Math.sin(entity.startAngle) * r
      };
      const end = {
        x: cx + Math.cos(entity.endAngle) * r,
        y: cy + Math.sin(entity.endAngle) * r
      };
      return [
        this.createLinear({ x: cx, y: cy }, start, offset, layerId),
        this.createLinear(start, end, offset + 6, layerId)
      ];
    }
    if (entity.type === 'POLYLINE' && entity.points?.length >= 2) {
      const dims = [];
      for (let i = 0; i < entity.points.length - 1; i++) {
        dims.push(this.createLinear(entity.points[i], entity.points[i + 1], offset, layerId));
      }
      if (entity.closed && entity.points.length >= 3) {
        const last = entity.points[entity.points.length - 1];
        dims.push(this.createLinear(last, entity.points[0], offset, layerId));
      }
      return dims;
    }
    return null;
  }

  updateFromGeometry(dimensionEntity) {
    if (dimensionEntity.type !== 'DIMENSION') return;
    dimensionEntity._distance = dimensionEntity.getDistance();
  }
}
