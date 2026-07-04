/**
 * InteriorEngine — phát hiện phòng & phân loại không gian (SDD §4)
 */
class InteriorEngine {
  static ROOM_TYPES = {
    bedroom: [/ph[oò]ng\s*ng[uủ]/, /bedroom/, /\bng[uủ]\b/],
    living: [/ph[oò]ng\s*kh[aá]ch/, /living/, /\bkh[aá]ch\b/, /pk\b/],
    kitchen: [/b[eế]p/, /kitchen/],
    bath: [/\bwc\b/, /ph[oò]ng\s*t[aă]m/, /bath/, /toilet/],
    dining: [/ph[oò]ng\s*[ăa]n/, /dining/],
    office: [/v[aă]n\s*ph[oò]ng/, /office/, /lam\s*vi[eệ]c/]
  };

  static detectRooms(app) {
    const rooms = [];
    for (const e of app.drawing.entities) {
      if (!InteriorEngine._isRoomEntity(e)) continue;
      const bb = e.getBoundingBox();
      if (!bb) continue;
      const w = bb.maxX - bb.minX;
      const h = bb.maxY - bb.minY;
      if (w < 1e-6 || h < 1e-6) continue;
      const name = InteriorEngine.findRoomLabel(e, app);
      rooms.push({
        id: e.id,
        entity: e,
        bounds: bb,
        width: w,
        height: h,
        area: w * h,
        name: name || 'Phòng',
        type: InteriorEngine.classifyRoom(name, w, h)
      });
    }
    return rooms;
  }

  static _isRoomEntity(e) {
    return e.archType === 'room-fill'
      || e.planRole === 'room-floor'
      || (e.type === 'HATCH' && e.planRole === 'floor' && e.archType !== 'open-floor');
  }

  static findRoomLabel(roomEntity, app) {
    const bb = roomEntity.getBoundingBox();
    if (!bb) return null;
    const cx = (bb.minX + bb.maxX) / 2;
    const cy = (bb.minY + bb.maxY) / 2;
    let best = null;
    let bestD = Infinity;
    for (const e of app.drawing.entities) {
      if (e.type !== 'TEXT' || e.archLabel) continue;
      const tx = e.x ?? e.position?.x ?? 0;
      const ty = e.y ?? e.position?.y ?? 0;
      if (tx < bb.minX || tx > bb.maxX || ty < bb.minY || ty > bb.maxY) continue;
      const d = Math.hypot(tx - cx, ty - cy);
      if (d < bestD) { bestD = d; best = e.text || e.content; }
    }
    return best;
  }

  static classifyRoom(name, width, height) {
    const s = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [type, patterns] of Object.entries(InteriorEngine.ROOM_TYPES)) {
      if (patterns.some(re => re.test(s))) return type;
    }
    const area = width * height;
    const wu = 'm';
    if (area < 6) return 'bath';
    if (area > 25 && width > height * 1.3) return 'living';
    if (area < 14) return 'bedroom';
    return 'generic';
  }

  static entityInRoom(entity, room) {
    const bb = entity.getBoundingBox?.();
    if (!bb || !room.bounds) return false;
    const cx = (bb.minX + bb.maxX) / 2;
    const cy = (bb.minY + bb.maxY) / 2;
    const r = room.bounds;
    return cx >= r.minX && cx <= r.maxX && cy >= r.minY && cy <= r.maxY;
  }

  static analyzeCirculation(app, room) {
    const margin = InteriorPlacementEngine.worldFromCm(60, app);
    const r = room.bounds;
    const walkW = Math.max(0, (r.maxX - r.minX) - 2 * margin);
    const walkH = Math.max(0, (r.maxY - r.minY) - 2 * margin);
    const furnitureArea = InteriorEngine._furnitureAreaInRoom(app, room);
    const total = (r.maxX - r.minX) * (r.maxY - r.minY);
    return {
      walkableArea: Math.max(0, walkW * walkH - furnitureArea),
      walkableRatio: total > 0 ? Math.max(0, (walkW * walkH - furnitureArea) / total) : 0,
      furnitureArea
    };
  }

  static _furnitureAreaInRoom(app, room) {
    let area = 0;
    for (const e of app.drawing.entities) {
      if (!e.interiorAssetId) continue;
      if (!InteriorEngine.entityInRoom(e, room)) continue;
      const bb = e.getBoundingBox?.();
      if (bb) area += (bb.maxX - bb.minX) * (bb.maxY - bb.minY);
    }
    return area;
  }

  static suggestFurniture(room, styleId = 'modern') {
    return InteriorStyleEngine.furnitureForRoom(room.type, styleId);
  }

  static detectOpenings(app) {
    const openings = [];
    for (const e of app.drawing.entities) {
      if (e.blockTemplateId && /^door-/.test(e.blockTemplateId)) {
        openings.push({ type: 'door', entity: e, id: e.id });
      } else if (e.blockTemplateId && /^window/.test(e.blockTemplateId)) {
        openings.push({ type: 'window', entity: e, id: e.id });
      }
    }
    return openings;
  }
}
