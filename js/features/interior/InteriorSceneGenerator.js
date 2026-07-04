/**
 * InteriorSceneGenerator — trang trí phòng & áp phong cách (SDD §18)
 */
class InteriorSceneGenerator {
  static applyStyle(app, styleId, roomId) {
    const style = InteriorStyleEngine.get(styleId);
    app.drawing.metadata.interiorStyle = styleId;
    const rooms = roomId
      ? InteriorEngine.detectRooms(app).filter(r => r.id === roomId)
      : InteriorEngine.detectRooms(app);

    let updated = 0;
    for (const room of rooms) {
      InteriorSceneGenerator.applyMaterialsToRoom(app, room, style);
      updated++;
    }

    if (app.renderer3D?.initialized) {
      app.renderer3D.setLightingPreset(style.lighting || 'studio');
    }

    app.requestRender();
    return {
      success: updated > 0,
      updated,
      style: style.name,
      message: updated
        ? `Đã áp phong cách ${style.name} cho ${updated} phòng.`
        : 'Không tìm thấy phòng. Vẽ phòng (công cụ Phòng) hoặc chèn mẫu nhà trước.'
    };
  }

  static applyMaterialsToRoom(app, room, style) {
    const floorMat = InteriorMaterialLibrary.get(style.materials.floor);
    const wallMat = InteriorMaterialLibrary.get(style.materials.wall);
    const ceilMat = InteriorMaterialLibrary.get(style.materials.ceiling);

    if (room.entity && floorMat) {
      room.entity.style.color = floorMat.color;
      room.entity.interiorMaterialId = floorMat.id;
      if (typeof ArchPlanStyle !== 'undefined') {
        ArchPlanStyle.mark(room.entity, 'room-floor', { color: floorMat.color, fillOpacity: 0.58 });
      }
    }

    for (const e of app.drawing.entities) {
      if (e.archType === 'wall' && InteriorEngine.entityInRoom(e, room) && wallMat) {
        e.style.color = wallMat.color;
        e.interiorMaterialId = wallMat.id;
        if (typeof ArchPlanStyle !== 'undefined') {
          ArchPlanStyle.mark(e, 'wall', { color: wallMat.color, fillOpacity: 0.72 });
        }
      }
      if (e.archType === 'ceiling' && InteriorEngine.entityInRoom(e, room) && ceilMat) {
        e.style.color = ceilMat.color;
        e.interiorMaterialId = ceilMat.id;
      }
    }
  }

  static furnishRoom(app, roomId, styleId) {
    const style = InteriorStyleEngine.get(styleId || app.drawing.metadata?.interiorStyle || 'modern');
    const rooms = InteriorEngine.detectRooms(app);
    const room = roomId ? rooms.find(r => r.id === roomId) : rooms[0];
    if (!room) {
      return { success: false, message: 'Không tìm thấy phòng để trang trí.' };
    }

    InteriorSceneGenerator.applyMaterialsToRoom(app, room, style);
    const assets = InteriorEngine.suggestFurniture(room, style.id);
    const margin = InteriorPlacementEngine.worldFromCm(40, app);
    const r = room.bounds;
    const placed = [];
    let x = r.minX + margin;
    let y = r.minY + margin;
    let rowH = 0;

    for (const assetId of assets) {
      const meta = InteriorAssetManager.get(assetId);
      if (!meta) continue;
      const aw = InteriorPlacementEngine.worldFromCm(meta.width, app);
      const ah = InteriorPlacementEngine.worldFromCm(meta.depth, app);
      if (aw > r.maxX - r.minX - 2 * margin || ah > r.maxY - r.minY - 2 * margin) continue;

      if (x + aw > r.maxX - margin) {
        x = r.minX + margin;
        y += rowH + margin * 0.4;
        rowH = 0;
      }
      if (y + ah > r.maxY - margin) break;

      const ins = InteriorPlacementEngine.insert(app, assetId, { x, y }, { styleId: style.id });
      if (ins.success) {
        placed.push(...ins.entities);
        rowH = Math.max(rowH, ah);
        x += aw + margin * 0.35;
      }
    }

    app.requestRender();
    const circ = InteriorEngine.analyzeCirculation(app, room);
    return {
      success: placed.length > 0,
      placed: placed.length,
      room: room.name,
      style: style.name,
      walkableRatio: Math.round(circ.walkableRatio * 100),
      message: placed.length
        ? `Đã trang trí "${room.name}" (${style.name}): ${placed.length} chi tiết. Diện tích đi lại ~${Math.round(circ.walkableRatio * 100)}%.`
        : 'Không đặt được nội thất — phòng quá nhỏ hoặc thiếu mẫu.'
    };
  }

  static furnishAll(app, styleId) {
    const rooms = InteriorEngine.detectRooms(app);
    let total = 0;
    for (const room of rooms) {
      const r = InteriorSceneGenerator.furnishRoom(app, room.id, styleId);
      if (r.placed) total += r.placed;
    }
    return {
      success: total > 0,
      placed: total,
      rooms: rooms.length,
      message: total
        ? `Đã trang trí ${rooms.length} phòng, ${total} chi tiết nội thất.`
        : 'Không trang trí được — cần có phòng trên bản vẽ.'
    };
  }
}
