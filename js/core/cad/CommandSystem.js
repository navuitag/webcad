/**
 * CommandSystem — mọi thao tác CAD đi qua command, không xử lý rời trong tool
 */
class CommandSystem {
  constructor(cadCore) {
    this.core = cadCore;
    this.registry = new Map();
    this._registerBuiltins();
  }

  register(name, handler) {
    this.registry.set(name.toUpperCase(), handler);
  }

  execute(name, params = {}) {
    const handler = this.registry.get(name.toUpperCase());
    if (!handler) return { success: false, message: `Unknown command: ${name}` };
    try {
      return handler(params, this.core);
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  has(name) {
    return this.registry.has(name.toUpperCase());
  }

  _registerBuiltins() {
    const C = this;

    // ─── Draw ───────────────────────────────────────────────
    C.register('DRAW_LINE', (p, core) => {
      const e = core.entities.create('LINE', { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 });
      core.entities.add(e);
      return { success: true, entity: e };
    });

    C.register('DRAW_CIRCLE', (p, core) => {
      const e = core.entities.create('CIRCLE', { cx: p.cx, cy: p.cy, r: p.r });
      core.entities.add(e);
      return { success: true, entity: e };
    });

    C.register('DRAW_RECTANGLE', (p, core) => {
      const e = core.entities.create('RECTANGLE', { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 });
      core.entities.add(e);
      return { success: true, entity: e };
    });

    C.register('DRAW_ARC', (p, core) => {
      const e = core.entities.create('ARC', p);
      core.entities.add(e);
      return { success: true, entity: e };
    });

    C.register('DRAW_POLYLINE', (p, core) => {
      const e = core.entities.create('POLYLINE', { points: p.points });
      if (p.closed) e.closed = true;
      core.entities.add(e);
      return { success: true, entity: e };
    });

    C.register('DRAW_TEXT', (p, core) => {
      const e = core.entities.create('TEXT', p);
      core.entities.add(e);
      return { success: true, entity: e };
    });

    C.register('DRAW_DIMENSION', (p, core) => {
      const e = core.dimensions.createLinear(p.p1, p.p2, p.offset);
      core.entities.add(e);
      return { success: true, entity: e };
    });

    // ─── Modify (kernel-backed) ───────────────────────────
    C.register('OFFSET', (p, core) => {
      const result = core.entities.offset(p.entity, p.distance, p.sidePoint);
      if (!result) return { success: false, message: 'Offset failed' };
      core.entities.add(result);
      return { success: true, entity: result };
    });

    C.register('TRIM', (p, core) => {
      const result = core.entities.trim(p.entity, p.clickPoint);
      if (!result) return { success: false, message: 'Trim failed' };
      core.entities.replace(p.entity, result);
      return { success: true, entity: result };
    });

    C.register('EXTEND', (p, core) => {
      const result = core.entities.extend(p.entity, p.clickPoint);
      if (!result) return { success: false, message: 'Extend failed' };
      core.entities.replace(p.entity, result);
      return { success: true, entity: result };
    });

    C.register('FILLET', (p, core) => {
      const result = core.entities.fillet(p.line1, p.line2, p.radius || 5);
      if (!result) return { success: false, message: 'Fillet failed' };
      core.entities.remove(p.line1, { silent: true });
      core.entities.remove(p.line2, { silent: true });
      core.entities.addMany([result.line1, result.line2, result.arc]);
      return { success: true, entities: [result.line1, result.line2, result.arc] };
    });

    C.register('MIRROR', (p, core) => {
      const copies = p.entities.map(e => core.entities.mirror(e, p.axisStart, p.axisEnd));
      core.entities.addMany(copies);
      return { success: true, entities: copies };
    });

    C.register('BOOLEAN', (p, core) => {
      const results = core.entities.boolean(p.op, p.entityA, p.entityB);
      if (!results.length) return { success: false, message: 'Boolean failed' };
      core.entities.remove(p.entityA, { silent: true });
      core.entities.remove(p.entityB, { silent: true });
      core.entities.addMany(results);
      return { success: true, entities: results };
    });

    C.register('MOVE', (p, core) => {
      core.entities.move(p.entities, p.dx, p.dy);
      core.history.push({ type: 'MODIFY_ENTITY', entity: p.entities[0], before: p.before, after: p.entities[0].toJSON() });
      return { success: true };
    });

    C.register('ROTATE', (p, core) => {
      core.entities.rotate(p.entities, p.cx, p.cy, p.angle);
      return { success: true };
    });

    C.register('SCALE', (p, core) => {
      core.entities.scale(p.entities, p.cx, p.cy, p.factor);
      return { success: true };
    });

    C.register('DELETE', (p, core) => {
      const entities = [...p.entities];
      for (const e of entities) core.entities.remove(e, { silent: true });
      if (entities.length === 1) {
        core.history.push({ type: 'REMOVE_ENTITY', entity: entities[0] });
      } else if (entities.length > 1) {
        core.history.push({ type: 'REMOVE_ENTITIES', entities });
      }
      return { success: true };
    });

    C.register('COPY', (p, core) => {
      const copies = p.entities.map(e => {
        const c = core.entities.clone(e);
        core.entities.move([c], p.dx, p.dy);
        return c;
      });
      core.entities.addMany(copies);
      return { success: true, entities: copies };
    });

    // ─── Block ────────────────────────────────────────────
    C.register('CREATE_BLOCK', (p, core) => {
      core.layerBlock.createBlock(p.name, p.entities, p.basePoint, p.attributes);
      return { success: true };
    });

    C.register('INSERT_BLOCK', (p, core) => {
      const instances = core.layerBlock.instantiateBlock(
        p.name, p.insertPoint, p.rotation || 0, p.scale || 1, p.attributes || {}
      );
      core.entities.addMany(instances);
      return { success: true, entities: instances };
    });

    // ─── Professional modify ────────────────────────────────
    C.register('CHAMFER', (p, core) => {
      const result = core.entities.chamfer(p.line1, p.line2, p.distance || 5);
      if (!result) return { success: false, message: 'Chamfer failed' };
      for (const e of result.remove) core.entities.remove(e, { silent: true });
      core.entities.addMany(result.entities);
      return { success: true, entities: result.entities };
    });

    C.register('ARRAY_RECT', (p, core) => {
      const copies = core.entities.arrayRectangular(
        p.entities, p.rows || 2, p.cols || 2, p.rowSpacing || 20, p.colSpacing || 20
      );
      core.entities.addMany(copies);
      return { success: true, entities: copies };
    });

    C.register('ARRAY_POLAR', (p, core) => {
      const copies = core.entities.arrayPolar(
        p.entities, p.center, p.count || 6, p.totalAngle
      );
      core.entities.addMany(copies);
      return { success: true, entities: copies };
    });

    C.register('STRETCH', (p, core) => {
      core.entities.stretch(p.entities, p.windowMin, p.windowMax, p.dx, p.dy);
      core.history.push({ type: 'MODIFY_ENTITIES', entities: p.entities });
      return { success: true };
    });

    C.register('EXPLODE', (p, core) => {
      const all = [];
      for (const e of p.entities) {
        const parts = core.entities.explode(e);
        core.entities.remove(e, { silent: true });
        core.entities.addMany(parts, { silent: true });
        all.push(...parts);
      }
      core.history.push({ type: 'EXPLODE', removed: p.entities, added: all });
      return { success: true, entities: all };
    });

    C.register('JOIN', (p, core) => {
      const result = core.entities.join(p.entities);
      if (!result) return { success: false, message: 'Join failed' };
      for (const e of result.remove) core.entities.remove(e, { silent: true });
      core.entities.add(result.polyline);
      return { success: true, entity: result.polyline };
    });

    C.register('BREAK', (p, core) => {
      const result = core.entities.break(p.entity, p.clickPoint);
      if (!result) return { success: false, message: 'Break failed' };
      core.entities.remove(result.remove, { silent: true });
      core.entities.addMany(result.lines);
      return { success: true, entities: result.lines };
    });

    C.register('DIVIDE', (p, core) => {
      const result = core.entities.divide(p.entity, p.segments || 4);
      core.entities.addMany(result.markers);
      return { success: true, points: result.points, markers: result.markers };
    });

    C.register('MEASURE', (p, core) => {
      const dist = core.entities.measure(p.p1, p.p2);
      return { success: true, distance: dist, formatted: GeometryKernel.formatDistance(dist) };
    });

    C.register('HATCH', (p, core) => {
      let hatch;
      if (p.boundary) {
        hatch = core.entities.create('HATCH', {
          boundary: p.boundary, pattern: p.pattern || 'SOLID', scale: p.scale || 1, angle: p.angle || 0
        });
      } else if (p.entity) {
        hatch = core.entities.hatchFromEntity(p.entity, p.pattern || 'SOLID', p.scale || 1, p.angle || 0);
      }
      if (!hatch) return { success: false, message: 'Hatch failed' };
      core.entities.add(hatch);
      return { success: true, entity: hatch };
    });

    C.register('SET_PROPERTY', (p, core) => {
      for (const e of p.entities) {
        const before = e.toJSON();
        core.entities.setEntityProperty(e, p.key, p.value);
        core.history.push({ type: 'MODIFY_ENTITY', entity: e, before, after: e.toJSON() });
      }
      return { success: true };
    });

    C.register('ATTACH_XREF', (p, core) => {
      core.xrefs.attach(p.name, p.data, p.insertPoint);
      const entities = core.xrefs.instantiateEntities(p.name);
      core.entities.addMany(entities);
      return { success: true, entities };
    });

    C.register('LOAD_TEMPLATE', (p, core) => {
      return core.templates.apply(p.name);
    });

    C.register('PLOT', (p, core) => {
      return PlotEngine.plot(core.app, p);
    });

    C.register('DRAW_HATCH', (p, core) => {
      return core.commands.execute('HATCH', p);
    });

    // ─── Constraint ───────────────────────────────────────
    C.register('ADD_CONSTRAINT', (p, core) => {
      const c = core.constraints.add(p.type, p.entityIds, p.params);
      core.constraints.solve();
      return { success: true, constraint: c };
    });

    // ─── File ─────────────────────────────────────────────
    C.register('EXPORT_DXF', (_, core) => {
      core.fileFormat.exportDxf();
      return { success: true };
    });

    C.register('EXPORT_WCAD', (p, core) => {
      core.fileFormat.exportWcad(p.filename);
      return { success: true };
    });
  }
}
