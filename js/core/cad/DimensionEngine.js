/**
 * DimensionEngine — tạo và tính toán kích thước qua kernel
 */
class DimensionEngine {
  constructor(cadCore) {
    this.core = cadCore;
  }

  createLinear(p1, p2, offset = 10, layerId) {
    return this.core.entities.create('DIMENSION', {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, offset
    }, layerId);
  }

  measureDistance(p1, p2) {
    return GeometryKernel.distance(p1.x, p1.y, p2.x, p2.y);
  }

  format(value) {
    return GeometryKernel.formatDistance(value, this.core.drawing.unit);
  }

  autoDimension(entity) {
    const bb = entity.getBoundingBox?.();
    if (!bb) return null;
    if (entity.type === 'LINE') {
      return this.createLinear(entity.start, entity.end);
    }
    if (entity.type === 'RECTANGLE') {
      return [
        this.createLinear({ x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.minY }),
        this.createLinear({ x: bb.minX, y: bb.minY }, { x: bb.minX, y: bb.maxY })
      ];
    }
    return null;
  }

  updateFromGeometry(dimensionEntity) {
    if (dimensionEntity.type !== 'DIMENSION') return;
    dimensionEntity._distance = dimensionEntity.getDistance();
  }
}
