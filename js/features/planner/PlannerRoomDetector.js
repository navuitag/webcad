/**
 * PlannerRoomDetector — phát hiện phòng cho Planner (CAD_TO_PLANNER_SDD §6–7)
 */
class PlannerRoomDetector {
  static AREA_RULES = [
    { min: 40, max: 200, type: 'living', label: 'Sảnh / nhà hàng' },
    { min: 20, max: 35, type: 'living', label: 'Phòng khách' },
    { min: 12, max: 18, type: 'bedroom', label: 'Phòng ngủ / khách sạn' },
    { min: 10, max: 18, type: 'bedroom', label: 'Phòng ngủ' },
    { min: 6, max: 12, type: 'kitchen', label: 'Bếp' },
    { min: 0, max: 6, type: 'bath', label: 'WC / phòng tắm' }
  ];

  static detectAll(app, options = {}) {
    let rooms = InteriorEngine.detectRooms(app);

    if (!rooms.length || options.scanPolylines) {
      const inferred = PlannerRoomDetector._fromClosedShapes(app);
      if (options.createRooms && inferred.length) {
        for (const shape of inferred) {
          if (shape.created) continue;
          const b = shape.bounds;
          ArchDrawEngine.createRoom(app, b.minX, b.minY, b.maxX, b.maxY, {
            name: shape.suggestedName || 'PHÒNG'
          });
        }
        PlanConversionEngine.convert(app);
        rooms = InteriorEngine.detectRooms(app);
      } else if (inferred.length) {
        const existingIds = new Set(rooms.map(r => r.id));
        for (const inf of inferred) {
          if (!existingIds.has(inf.id)) rooms.push(inf);
        }
      }
    }

    return rooms.map(r => PlannerRoomDetector._enrich(r, app));
  }

  static _fromClosedShapes(app) {
    const found = [];
    const wu = app.drawing.worldUnit || app.drawing.unit || 'm';

    for (const e of app.drawing.entities) {
      if (InteriorEngine._isRoomEntity(e)) continue;
      const isClosedShape =
        (e.type === 'POLYLINE' && e.closed) ||
        e.type === 'RECTANGLE' ||
        (e.type === 'HATCH' && e.archType !== 'wall');
      if (!isClosedShape) continue;

      const bb = e.getBoundingBox?.();
      if (!bb) continue;
      const w = bb.maxX - bb.minX;
      const h = bb.maxY - bb.minY;
      if (w < 1e-6 || h < 1e-6) continue;

      const areaM2 = PlannerRoomDetector._areaM2(w, h, wu);
      if (areaM2 < 3) continue;

      const name = InteriorEngine.findRoomLabel(e, app) || PlannerRoomDetector._defaultName(areaM2);
      const type = InteriorEngine.classifyRoom(name, w, h);
      const byArea = PlannerRoomDetector.classifyByArea(areaM2);

      found.push({
        id: e.id,
        entity: e,
        bounds: bb,
        width: w,
        height: h,
        area: w * h,
        areaM2,
        name,
        type: type !== 'generic' ? type : byArea,
        inferred: true,
        suggestedName: name
      });
    }
    return found;
  }

  static _areaM2(w, h, wu) {
    const wM = UnitEngine.toDisplay(w, wu, 'm');
    const hM = UnitEngine.toDisplay(h, wu, 'm');
    return wM * hM;
  }

  static classifyByArea(areaM2) {
    for (const rule of PlannerRoomDetector.AREA_RULES) {
      if (areaM2 >= rule.min && areaM2 < rule.max) return rule.type;
    }
    return areaM2 >= 40 ? 'living' : 'generic';
  }

  static _defaultName(areaM2) {
    const rule = PlannerRoomDetector.AREA_RULES.find(r => areaM2 >= r.min && areaM2 < r.max);
    return rule?.label || 'PHÒNG';
  }

  static _enrich(room, app) {
    const wu = app.drawing.worldUnit || 'm';
    const areaM2 = room.areaM2 ?? PlannerRoomDetector._areaM2(room.width, room.height, wu);
    const circ = InteriorEngine.analyzeCirculation(app, room);
    return {
      ...room,
      areaM2: Math.round(areaM2 * 10) / 10,
      walkableRatio: Math.round((circ.walkableRatio || 0) * 100),
      openings: InteriorEngine.detectOpenings(app).filter(o =>
        InteriorEngine.entityInRoom(o.entity, room)
      ).length
    };
  }

  static formatReport(rooms) {
    if (!rooms.length) return 'Không phát hiện phòng — vẽ phòng hoặc polyline kín.';
    return rooms.map(r =>
      `${r.name} (${r.type}) — ${r.areaM2}m², đi lại ~${r.walkableRatio || '?'}%`
    ).join('\n');
  }
}
