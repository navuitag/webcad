/**
 * EntitySystem — quản lý vòng đời entity, thao tác hình học qua kernel
 */
class EntitySystem {
  constructor(cadCore) {
    this.core = cadCore;
  }

  get drawing() { return this.core.drawing; }
  get layers() { return this.core.layerBlock; }

  create(type, data, layerId) {
    const lid = layerId || this.layers.getCurrentLayerId();
    switch (type) {
      case 'LINE': return new LineEntity(lid, data.x1, data.y1, data.x2, data.y2);
      case 'CIRCLE': return new CircleEntity(lid, data.cx, data.cy, data.r);
      case 'ARC': return new ArcEntity(lid, data.cx, data.cy, data.r, data.startAngle, data.endAngle);
      case 'POLYLINE': return new PolylineEntity(lid, data.points || []);
      case 'RECTANGLE': return new RectangleEntity(lid, data.x1, data.y1, data.x2, data.y2);
      case 'TEXT': return new TextEntity(lid, data.x, data.y, data.text, data.height);
      case 'DIMENSION': return new DimensionEntity(lid, data.x1, data.y1, data.x2, data.y2, data.offset);
      case 'HATCH': return new HatchEntity(lid, data.boundary || [], data.pattern, data.scale, data.angle);
      default: return EntityFactory.create({ type, layerId: lid, ...data });
    }
  }

  fromJSON(data) {
    return EntityFactory.create(data);
  }

  clone(entity) {
    return entity.clone();
  }

  add(entity, options = {}) {
    this.drawing.addEntity(entity);
    if (!options.silent) {
      this.core.history.push({ type: 'ADD_ENTITY', entity });
      this.core.collaboration?.broadcastEntityAdded(entity);
      this.core.parametric.attach(entity);
    }
    return entity;
  }

  addMany(entities, options = {}) {
    for (const e of entities) this.add(e, { ...options, silent: true });
    if (!options.silent && entities.length) {
      this.core.history.push({ type: 'ADD_ENTITIES', entities });
    }
    return entities;
  }

  remove(entity, options = {}) {
    this.drawing.removeEntity(entity);
    this.core.selection.deselect(entity);
    if (!options.silent) {
      this.core.history.push({ type: 'REMOVE_ENTITY', entity });
      this.core.collaboration?.broadcastEntityRemoved(entity);
    }
  }

  replace(oldEntity, newEntity) {
    this.remove(oldEntity, { silent: true });
    this.add(newEntity, { silent: true });
    this.core.history.push({ type: 'REMOVE_ENTITY', entity: oldEntity });
    this.core.history.push({ type: 'ADD_ENTITY', entity: newEntity });
  }

  modify(entity, mutator) {
    const before = entity.toJSON();
    mutator(entity);
    this.core.history.push({ type: 'MODIFY_ENTITY', entity, before, after: entity.toJSON() });
  }

  getVisible() {
    return this.drawing.getVisibleEntities(this.layers.layerManager);
  }

  hitTest(worldX, worldY, tolerance) {
    const entities = this.getVisible();
    for (let i = entities.length - 1; i >= 0; i--) {
      if (this.layers.isLocked(entities[i].layerId)) continue;
      if (entities[i].hitTest(worldX, worldY, tolerance)) return entities[i];
    }
    return null;
  }

  getBoundingBox(entity) {
    return entity.getBoundingBox ? entity.getBoundingBox() : null;
  }

  getDrawingBoundingBox() {
    return this.drawing.getBoundingBox();
  }

  // ─── Geometry ops via Kernel ──────────────────────────────

  offset(entity, distance, sidePoint) {
    const layerId = this.layers.getCurrentLayerId();
    const G = GeometryKernel;

    switch (entity.type) {
      case 'LINE': {
        const side = G.pointSideOfLine(sidePoint.x, sidePoint.y, entity.start.x, entity.start.y, entity.end.x, entity.end.y);
        const dist = side >= 0 ? distance : -distance;
        const off = G.offsetLine(entity.start.x, entity.start.y, entity.end.x, entity.end.y, dist);
        return off ? this.create('LINE', { x1: off.x1, y1: off.y1, x2: off.x2, y2: off.y2 }, layerId) : null;
      }
      case 'CIRCLE': {
        const d = G.distance(sidePoint.x, sidePoint.y, entity.center.x, entity.center.y);
        const delta = d > entity.radius ? distance : -distance;
        const off = G.offsetCircle(entity.center.x, entity.center.y, entity.radius, delta);
        return off ? this.create('CIRCLE', { cx: off.cx, cy: off.cy, r: off.r }, layerId) : null;
      }
      case 'POLYLINE': {
        const mid = entity.points[Math.floor(entity.points.length / 2)];
        const next = entity.points[Math.min(Math.floor(entity.points.length / 2) + 1, entity.points.length - 1)];
        const side = G.pointSideOfLine(sidePoint.x, sidePoint.y, mid.x, mid.y, next.x, next.y);
        const dist = side >= 0 ? distance : -distance;
        const pts = G.offsetPolyline(entity.points, dist);
        return pts && pts.length >= 2 ? this.create('POLYLINE', { points: pts }, layerId) : null;
      }
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        const inside = sidePoint.x >= bb.minX && sidePoint.x <= bb.maxX && sidePoint.y >= bb.minY && sidePoint.y <= bb.maxY;
        const d = inside ? -distance : distance;
        return this.create('RECTANGLE', { x1: bb.minX - d, y1: bb.minY - d, x2: bb.maxX + d, y2: bb.maxY + d }, layerId);
      }
      default:
        return null;
    }
  }

  trim(entity, clickPoint) {
    const entities = this.getVisible();
    if (entity.type !== 'LINE') return null;
    const result = GeometryKernel.trimLineAtPoint(entity, clickPoint.x, clickPoint.y, entities);
    if (!result) return null;
    return this.create('LINE', { x1: result.start.x, y1: result.start.y, x2: result.end.x, y2: result.end.y }, entity.layerId);
  }

  extend(entity, clickPoint) {
    const entities = this.getVisible();
    if (entity.type !== 'LINE') return null;
    const dStart = GeometryKernel.distance(clickPoint.x, clickPoint.y, entity.start.x, entity.start.y);
    const dEnd = GeometryKernel.distance(clickPoint.x, clickPoint.y, entity.end.x, entity.end.y);
    const result = GeometryKernel.extendLine(entity, dStart < dEnd, entities);
    if (!result) return null;
    return this.create('LINE', { x1: result.start.x, y1: result.start.y, x2: result.end.x, y2: result.end.y }, entity.layerId);
  }

  fillet(line1, line2, radius = 5) {
    const result = GeometryKernel.filletLines(line1, line2, radius);
    if (!result) return null;
    const layerId = line1.layerId;
    return {
      arc: this.create('ARC', {
        cx: result.arc.center.x, cy: result.arc.center.y, r: result.arc.radius,
        startAngle: result.arc.startAngle, endAngle: result.arc.endAngle
      }, layerId),
      line1: this.create('LINE', {
        x1: result.line1.start.x, y1: result.line1.start.y,
        x2: result.line1.end.x, y2: result.line1.end.y
      }, layerId),
      line2: this.create('LINE', {
        x1: result.line2.start.x, y1: result.line2.start.y,
        x2: result.line2.end.x, y2: result.line2.end.y
      }, layerId)
    };
  }

  mirror(entity, axisStart, axisEnd) {
    const copy = entity.clone();
    const G = GeometryKernel;
    const mirror = (x, y) => G.mirrorPoint(x, y, axisStart.x, axisStart.y, axisEnd.x, axisEnd.y);

    switch (copy.type) {
      case 'LINE':
        copy.start = mirror(copy.start.x, copy.start.y);
        copy.end = mirror(copy.end.x, copy.end.y);
        break;
      case 'CIRCLE':
        copy.center = mirror(copy.center.x, copy.center.y);
        break;
      case 'POLYLINE':
        copy.points = copy.points.map(p => mirror(p.x, p.y));
        break;
      case 'RECTANGLE':
        copy.corner1 = mirror(copy.corner1.x, copy.corner1.y);
        copy.corner2 = mirror(copy.corner2.x, copy.corner2.y);
        break;
      case 'TEXT':
        copy.position = mirror(copy.position.x, copy.position.y);
        break;
    }
    return copy;
  }

  boolean(op, entityA, entityB) {
    const polyA = GeometryKernel.entityToPolygon(entityA);
    const polyB = GeometryKernel.entityToPolygon(entityB);
    const results = GeometryKernel.boolean(op, polyA, polyB);
    const layerId = entityA.layerId;
    return results.map(pts => {
      const pline = this.create('POLYLINE', { points: pts }, layerId);
      pline.closed = true;
      return pline;
    });
  }

  intersect(entityA, entityB) {
    return GeometryKernel.intersectEntities(entityA, entityB);
  }

  move(entities, dx, dy) {
    for (const e of entities) e.move(dx, dy);
  }

  rotate(entities, cx, cy, angle) {
    for (const e of entities) e.rotate(cx, cy, angle);
  }

  scale(entities, cx, cy, factor) {
    for (const e of entities) e.scale(cx, cy, factor);
  }

  chamfer(line1, line2, distance = 5) {
    const result = GeometryKernel.chamferLines(line1, line2, distance);
    if (!result) return null;
    const layerId = line1.layerId;
    const entities = [
      this.create('LINE', { x1: result.line1.start.x, y1: result.line1.start.y, x2: result.line1.end.x, y2: result.line1.end.y }, layerId),
      this.create('LINE', { x1: result.line2.start.x, y1: result.line2.start.y, x2: result.line2.end.x, y2: result.line2.end.y }, layerId),
      this.create('LINE', { x1: result.chamfer.start.x, y1: result.chamfer.start.y, x2: result.chamfer.end.x, y2: result.chamfer.end.y }, layerId)
    ];
    return { entities, remove: [line1, line2] };
  }

  arrayRectangular(entities, rows, cols, rowSpacing, colSpacing) {
    const copies = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;
        const dx = c * colSpacing;
        const dy = r * rowSpacing;
        for (const e of entities) {
          const copy = e.clone();
          copy.move(dx, dy);
          copies.push(copy);
        }
      }
    }
    return copies;
  }

  arrayPolar(entities, center, count, totalAngle = Math.PI * 2) {
    const copies = [];
    const step = totalAngle / count;
    for (let i = 1; i < count; i++) {
      const angle = step * i;
      for (const e of entities) {
        const copy = e.clone();
        copy.rotate(center.x, center.y, angle);
        copies.push(copy);
      }
    }
    return copies;
  }

  stretch(entities, windowMin, windowMax, dx, dy) {
    for (const entity of entities) {
      this._stretchEntity(entity, windowMin, windowMax, dx, dy);
    }
  }

  _stretchEntity(entity, windowMin, windowMax, dx, dy) {
    const G = GeometryKernel;
    const inWin = (p) => G.pointInRect(p.x, p.y, windowMin.x, windowMin.y, windowMax.x, windowMax.y);
    switch (entity.type) {
      case 'LINE':
        if (inWin(entity.start)) { entity.start.x += dx; entity.start.y += dy; }
        if (inWin(entity.end)) { entity.end.x += dx; entity.end.y += dy; }
        break;
      case 'POLYLINE':
        entity.points = entity.points.map(p => inWin(p) ? { x: p.x + dx, y: p.y + dy } : { ...p });
        break;
      case 'RECTANGLE':
        if (inWin(entity.corner1)) { entity.corner1.x += dx; entity.corner1.y += dy; }
        if (inWin(entity.corner2)) { entity.corner2.x += dx; entity.corner2.y += dy; }
        break;
      case 'TEXT':
        if (inWin(entity.position)) { entity.position.x += dx; entity.position.y += dy; }
        break;
    }
  }

  explode(entity) {
    const layerId = entity.layerId;
    switch (entity.type) {
      case 'LINE':
        return [entity.clone()];
      case 'POLYLINE': {
        const lines = [];
        for (let i = 0; i < entity.points.length - 1; i++) {
          lines.push(this.create('LINE', {
            x1: entity.points[i].x, y1: entity.points[i].y,
            x2: entity.points[i + 1].x, y2: entity.points[i + 1].y
          }, layerId));
        }
        if (entity.closed && entity.points.length > 2) {
          const last = entity.points.length - 1;
          lines.push(this.create('LINE', {
            x1: entity.points[last].x, y1: entity.points[last].y,
            x2: entity.points[0].x, y2: entity.points[0].y
          }, layerId));
        }
        return lines;
      }
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        return [
          this.create('LINE', { x1: bb.minX, y1: bb.minY, x2: bb.maxX, y2: bb.minY }, layerId),
          this.create('LINE', { x1: bb.maxX, y1: bb.minY, x2: bb.maxX, y2: bb.maxY }, layerId),
          this.create('LINE', { x1: bb.maxX, y1: bb.maxY, x2: bb.minX, y2: bb.maxY }, layerId),
          this.create('LINE', { x1: bb.minX, y1: bb.maxY, x2: bb.minX, y2: bb.minY }, layerId)
        ];
      }
      case 'CIRCLE': {
        const pts = GeometryKernel.entityToBoundary(entity);
        const pline = this.create('POLYLINE', { points: pts }, layerId);
        pline.closed = true;
        return this.explode(pline);
      }
      default:
        return [entity.clone()];
    }
  }

  join(entities) {
    const lines = entities.filter(e => e.type === 'LINE');
    if (lines.length < 2) return null;
    const points = [{ x: lines[0].start.x, y: lines[0].start.y }, { x: lines[0].end.x, y: lines[0].end.y }];
    const used = new Set([0]);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 1; i < lines.length; i++) {
        if (used.has(i)) continue;
        const l = lines[i];
        const last = points[points.length - 1];
        const first = points[0];
        if (GeometryKernel.distance(last.x, last.y, l.start.x, l.start.y) < 0.01) {
          points.push({ x: l.end.x, y: l.end.y }); used.add(i); changed = true;
        } else if (GeometryKernel.distance(last.x, last.y, l.end.x, l.end.y) < 0.01) {
          points.push({ x: l.start.x, y: l.start.y }); used.add(i); changed = true;
        } else if (GeometryKernel.distance(first.x, first.y, l.end.x, l.end.y) < 0.01) {
          points.unshift({ x: l.start.x, y: l.start.y }); used.add(i); changed = true;
        } else if (GeometryKernel.distance(first.x, first.y, l.start.x, l.start.y) < 0.01) {
          points.unshift({ x: l.end.x, y: l.end.y }); used.add(i); changed = true;
        }
      }
    }
    const pline = this.create('POLYLINE', { points }, lines[0].layerId);
    return { polyline: pline, remove: lines };
  }

  break(entity, clickPoint) {
    if (entity.type !== 'LINE') return null;
    const result = GeometryKernel.breakLineAtPoint(entity, clickPoint.x, clickPoint.y);
    if (!result) return null;
    const layerId = entity.layerId;
    return {
      lines: [
        this.create('LINE', { x1: result.line1.start.x, y1: result.line1.start.y, x2: result.line1.end.x, y2: result.line1.end.y }, layerId),
        this.create('LINE', { x1: result.line2.start.x, y1: result.line2.start.y, x2: result.line2.end.x, y2: result.line2.end.y }, layerId)
      ],
      remove: entity
    };
  }

  divide(entity, segments = 4) {
    if (entity.type !== 'LINE') return { points: [], markers: [] };
    const pts = GeometryKernel.divideLinePoints(
      entity.start.x, entity.start.y, entity.end.x, entity.end.y, segments
    );
    const layerId = entity.layerId;
    const markers = pts.slice(1, -1).map(p =>
      this.create('CIRCLE', { cx: p.x, cy: p.y, r: 1.5 }, layerId)
    );
    return { points: pts, markers };
  }

  measure(p1, p2) {
    return GeometryKernel.distance(p1.x, p1.y, p2.x, p2.y);
  }

  hatchFromEntity(entity, pattern = 'SOLID', scale = 1, angle = 0) {
    const boundary = GeometryKernel.entityToBoundary(entity);
    if (!boundary || boundary.length < 3) return null;
    return this.create('HATCH', { boundary, pattern, scale, angle }, entity.layerId);
  }

  setEntityProperty(entity, key, value) {
    if (key === 'linetypeId') entity.linetypeId = value;
    else if (key === 'textStyleId') entity.textStyleId = value;
    else if (key === 'dimStyleId') entity.dimStyleId = value;
    else if (key === 'color') entity.style.color = value;
    else if (key === 'lineWidth') entity.style.lineWidth = parseFloat(value);
    else if (key === 'layerId') entity.layerId = value;
    else if (entity.type === 'HATCH' && key === 'pattern') entity.pattern = value;
    else if (entity.type === 'TEXT' && key === 'text') entity.text = value;
  }
}
