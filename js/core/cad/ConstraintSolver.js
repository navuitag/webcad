/**
 * ConstraintSolver — ràng buộc hình học cơ bản
 */
class ConstraintSolver {
  constructor(cadCore) {
    this.core = cadCore;
    this.constraints = [];
  }

  add(type, entityIds, params = {}) {
    const c = { id: 'c_' + Date.now(), type, entityIds, params, enabled: true };
    this.constraints.push(c);
    return c;
  }

  remove(id) {
    this.constraints = this.constraints.filter(c => c.id !== id);
  }

  clear() {
    this.constraints = [];
  }

  solve(iterations = 5) {
    for (let i = 0; i < iterations; i++) {
      for (const c of this.constraints) {
        if (!c.enabled) continue;
        this._applyConstraint(c);
      }
    }
  }

  _getEntity(id) {
    return this.core.drawing.entities.find(e => e.id === id);
  }

  _applyConstraint(c) {
    const G = GeometryKernel;
    switch (c.type) {
      case 'HORIZONTAL': {
        const e = this._getEntity(c.entityIds[0]);
        if (e?.type === 'LINE') e.end.y = e.start.y;
        break;
      }
      case 'VERTICAL': {
        const e = this._getEntity(c.entityIds[0]);
        if (e?.type === 'LINE') e.end.x = e.start.x;
        break;
      }
      case 'PARALLEL': {
        const e1 = this._getEntity(c.entityIds[0]);
        const e2 = this._getEntity(c.entityIds[1]);
        if (e1?.type === 'LINE' && e2?.type === 'LINE') {
          const angle = G.angle(e1.start.x, e1.start.y, e1.end.x, e1.end.y);
          const len = G.distance(e2.start.x, e2.start.y, e2.end.x, e2.end.y);
          e2.end.x = e2.start.x + Math.cos(angle) * len;
          e2.end.y = e2.start.y + Math.sin(angle) * len;
        }
        break;
      }
      case 'PERPENDICULAR': {
        const e1 = this._getEntity(c.entityIds[0]);
        const e2 = this._getEntity(c.entityIds[1]);
        if (e1?.type === 'LINE' && e2?.type === 'LINE') {
          const angle = G.angle(e1.start.x, e1.start.y, e1.end.x, e1.end.y) + Math.PI / 2;
          const len = G.distance(e2.start.x, e2.start.y, e2.end.x, e2.end.y);
          e2.end.x = e2.start.x + Math.cos(angle) * len;
          e2.end.y = e2.start.y + Math.sin(angle) * len;
        }
        break;
      }
      case 'COINCIDENT': {
        const e1 = this._getEntity(c.entityIds[0]);
        const e2 = this._getEntity(c.entityIds[1]);
        if (e1?.type === 'LINE' && e2?.type === 'LINE') {
          e2.start.x = e1.end.x;
          e2.start.y = e1.end.y;
        }
        break;
      }
      case 'DISTANCE': {
        const e = this._getEntity(c.entityIds[0]);
        const dist = c.params.distance || 10;
        if (e?.type === 'LINE') {
          const angle = G.angle(e.start.x, e.start.y, e.end.x, e.end.y);
          e.end.x = e.start.x + Math.cos(angle) * dist;
          e.end.y = e.start.y + Math.sin(angle) * dist;
        }
        break;
      }
      case 'FIXED': {
        const e = this._getEntity(c.entityIds[0]);
        if (e && c.params.position) {
          if (e.type === 'LINE') {
            const dx = c.params.position.x - e.start.x;
            const dy = c.params.position.y - e.start.y;
            e.move(dx, dy);
          } else if (e.type === 'CIRCLE') {
            e.center.x = c.params.position.x;
            e.center.y = c.params.position.y;
          }
        }
        break;
      }
    }
  }

  toJSON() {
    return this.constraints.map(c => ({ ...c }));
  }

  fromJSON(data) {
    this.constraints = Array.isArray(data) ? data.map(c => ({ ...c })) : [];
  }
}
