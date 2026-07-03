/**
 * ParametricEngine — tham số hóa entity, cập nhật hình học theo tham số
 */
class ParametricEngine {
  constructor(cadCore) {
    this.core = cadCore;
    this.params = new Map();
  }

  attach(entity, definitions = null) {
    if (definitions) {
      this.params.set(entity.id, { ...definitions });
      return;
    }
    const auto = this._inferParams(entity);
    if (auto) this.params.set(entity.id, auto);
  }

  detach(entityId) {
    this.params.delete(entityId);
  }

  clear() {
    this.params.clear();
  }

  _inferParams(entity) {
    switch (entity.type) {
      case 'LINE':
        return {
          x1: entity.start.x, y1: entity.start.y,
          x2: entity.end.x, y2: entity.end.y,
          length: GeometryKernel.distance(entity.start.x, entity.start.y, entity.end.x, entity.end.y)
        };
      case 'CIRCLE':
        return { cx: entity.center.x, cy: entity.center.y, radius: entity.radius };
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        return { x: bb.minX, y: bb.minY, width: bb.maxX - bb.minX, height: bb.maxY - bb.minY };
      }
      default:
        return null;
    }
  }

  setParam(entityId, name, value) {
    const p = this.params.get(entityId);
    if (!p) return false;
    p[name] = value;
    return this.evaluate(entityId);
  }

  getParams(entityId) {
    return this.params.get(entityId) ? { ...this.params.get(entityId) } : null;
  }

  evaluate(entityId) {
    const entity = this.core.drawing.entities.find(e => e.id === entityId);
    const p = this.params.get(entityId);
    if (!entity || !p) return false;

    switch (entity.type) {
      case 'LINE':
        if ('length' in p && 'x1' in p && 'y1' in p) {
          const angle = GeometryKernel.angle(p.x1, p.y1, p.x2 ?? entity.end.x, p.y2 ?? entity.end.y);
          entity.start.x = p.x1; entity.start.y = p.y1;
          entity.end.x = p.x1 + Math.cos(angle) * p.length;
          entity.end.y = p.y1 + Math.sin(angle) * p.length;
        } else {
          entity.start.x = p.x1; entity.start.y = p.y1;
          entity.end.x = p.x2; entity.end.y = p.y2;
        }
        break;
      case 'CIRCLE':
        entity.center.x = p.cx; entity.center.y = p.cy;
        entity.radius = p.radius;
        break;
      case 'RECTANGLE':
        entity.corner1 = { x: p.x, y: p.y };
        entity.corner2 = { x: p.x + p.width, y: p.y + p.height };
        break;
    }
    return true;
  }

  evaluateAll() {
    for (const id of this.params.keys()) this.evaluate(id);
  }

  toJSON() {
    return Object.fromEntries(this.params);
  }

  fromJSON(data, entities) {
    this.params.clear();
    if (!data) return;
    for (const [id, params] of Object.entries(data)) {
      if (entities.find(e => e.id === id)) this.params.set(id, params);
    }
  }
}
