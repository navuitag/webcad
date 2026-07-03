/**
 * ArchitecturalTemplates — mẫu nhà, tầng, phòng (mặt bằng kiến trúc, đơn vị m)
 */
class ArchitecturalTemplates {
  static categories = {
    house: { label: 'Nhà', icon: '🏠' },
    floor: { label: 'Tầng', icon: '🏢' },
    room: { label: 'Phòng', icon: '🚪' }
  };

  static catalog = {
    // ─── Nhà ─────────────────────────────────────────────
    'nha-studio-25': {
      category: 'house', name: 'Studio 5×5m', icon: '🏠',
      desc: 'Căn studio gọn 25m²',
      site: { w: 5, h: 5 },
      rooms: [
        { name: 'STUDIO', x: 0.3, y: 0.3, w: 4.4, h: 3.2 },
        { name: 'WC', x: 0.3, y: 3.6, w: 4.4, h: 1.1 }
      ]
    },
    'nha-1pn-40': {
      category: 'house', name: 'Nhà 1PN 5×8m', icon: '🏡',
      desc: '1 phòng ngủ, khách, bếp',
      site: { w: 5, h: 8 },
      rooms: [
        { name: 'PHÒNG KHÁCH', x: 0.3, y: 0.3, w: 2.2, h: 3.5 },
        { name: 'PHÒNG NGỦ', x: 2.6, y: 0.3, w: 2.1, h: 3.5 },
        { name: 'BẾP', x: 0.3, y: 4.0, w: 2.0, h: 2.0 },
        { name: 'WC', x: 2.4, y: 4.0, w: 1.2, h: 2.0 },
        { name: 'BAN CÔNG', x: 3.7, y: 4.0, w: 1.0, h: 3.7 }
      ]
    },
    'nha-2pn-60': {
      category: 'house', name: 'Nhà 2PN 6×10m', icon: '🏠',
      desc: '2 phòng ngủ tiêu chuẩn',
      site: { w: 6, h: 10 },
      rooms: [
        { name: 'PHÒNG KHÁCH', x: 0.3, y: 0.3, w: 2.5, h: 3.8 },
        { name: 'PN 1', x: 2.9, y: 0.3, w: 2.8, h: 3.2 },
        { name: 'PN 2', x: 2.9, y: 3.7, w: 2.8, h: 3.2 },
        { name: 'BẾP', x: 0.3, y: 4.3, w: 2.2, h: 2.2 },
        { name: 'WC', x: 0.3, y: 6.7, w: 2.2, h: 1.5 },
        { name: 'SẢNH', x: 0.3, y: 8.4, w: 5.4, h: 1.3 }
      ]
    },
    'nha-3pn-90': {
      category: 'house', name: 'Nhà 3PN 9×10m', icon: '🏘️',
      desc: '3 phòng ngủ, gia đình',
      site: { w: 9, h: 10 },
      rooms: [
        { name: 'PHÒNG KHÁCH', x: 0.3, y: 0.3, w: 4.0, h: 4.0 },
        { name: 'BẾP', x: 4.5, y: 0.3, w: 2.5, h: 2.5 },
        { name: 'ĂN', x: 7.1, y: 0.3, w: 1.6, h: 2.5 },
        { name: 'PN MASTER', x: 0.3, y: 4.5, w: 3.5, h: 3.5 },
        { name: 'PN 2', x: 4.0, y: 4.5, w: 2.5, h: 3.5 },
        { name: 'PN 3', x: 6.7, y: 4.5, w: 2.0, h: 3.5 },
        { name: 'WC 1', x: 4.5, y: 3.0, w: 1.2, h: 1.2 },
        { name: 'WC 2', x: 7.1, y: 3.0, w: 1.2, h: 1.2 },
        { name: 'GIẶT', x: 0.3, y: 8.2, w: 2.0, h: 1.5 }
      ]
    },
    'nha-ong-5x20': {
      category: 'house', name: 'Nhà ống 5×20m', icon: '🏚️',
      desc: 'Mặt tiền hẹp, chiều sâu',
      site: { w: 5, h: 20 },
      rooms: [
        { name: 'CỬA HÀNG', x: 0.3, y: 0.3, w: 4.4, h: 3.5 },
        { name: 'PHÒNG KHÁCH', x: 0.3, y: 4.0, w: 4.4, h: 4.0 },
        { name: 'PN 1', x: 0.3, y: 8.2, w: 4.4, h: 3.5 },
        { name: 'PN 2', x: 0.3, y: 11.9, w: 4.4, h: 3.5 },
        { name: 'BẾP+WC', x: 0.3, y: 15.6, w: 4.4, h: 2.5 },
        { name: 'SÂU', x: 0.3, y: 18.3, w: 4.4, h: 1.4 }
      ]
    },

    // ─── Tầng ────────────────────────────────────────────
    'tang-tret': {
      category: 'floor', name: 'Tầng trệt', icon: '1️⃣',
      desc: 'Garage + khách + bếp',
      rooms: [
        { name: 'GARA', x: 0, y: 0, w: 4, h: 5 },
        { name: 'PHÒNG KHÁCH', x: 4.3, y: 0, w: 5, h: 4.5 },
        { name: 'BẾP', x: 4.3, y: 4.8, w: 3, h: 2.5 },
        { name: 'WC', x: 7.5, y: 4.8, w: 1.8, h: 2.5 },
        { name: 'SẢNH', x: 0, y: 5.3, w: 4, h: 2 }
      ]
    },
    'tang-lau-1': {
      category: 'floor', name: 'Tầng lầu 1', icon: '2️⃣',
      desc: '2 phòng ngủ + WC',
      rooms: [
        { name: 'PN MASTER', x: 0, y: 0, w: 4.5, h: 4 },
        { name: 'PN 2', x: 4.8, y: 0, w: 3.5, h: 4 },
        { name: 'WC CHUNG', x: 0, y: 4.3, w: 2.5, h: 2 },
        { name: 'BAN CÔNG', x: 2.8, y: 4.3, w: 5.5, h: 2 }
      ]
    },
    'tang-lau-2': {
      category: 'floor', name: 'Tầng lầu 2', icon: '3️⃣',
      desc: 'Phòng thờ + sân thượng',
      rooms: [
        { name: 'PHÒNG THỜ', x: 0, y: 0, w: 4, h: 3.5 },
        { name: 'KHO', x: 4.3, y: 0, w: 2.5, h: 3.5 },
        { name: 'SÂN PHỤ', x: 0, y: 3.8, w: 6.8, h: 3 }
      ]
    },
    'tang-open-plan': {
      category: 'floor', name: 'Open plan', icon: '⬜',
      desc: 'Không gian mở linh hoạt',
      rooms: [
        { name: 'KHU VỰC CHÍNH', x: 0, y: 0, w: 8, h: 6 },
        { name: 'WC', x: 8.3, y: 0, w: 2, h: 2.5 },
        { name: 'KHO', x: 8.3, y: 2.8, w: 2, h: 3.2 }
      ]
    },

    // ─── Phòng ───────────────────────────────────────────
    'phong-ngu-master': {
      category: 'room', name: 'PN Master 4×3.5m', icon: '🛏️',
      room: { w: 4, h: 3.5, name: 'PN MASTER' }
    },
    'phong-ngu-don': {
      category: 'room', name: 'PN đơn 3×3m', icon: '🛏️',
      room: { w: 3, h: 3, name: 'PHÒNG NGỦ' }
    },
    'phong-khach': {
      category: 'room', name: 'Phòng khách 5×4m', icon: '🛋️',
      room: { w: 5, h: 4, name: 'PHÒNG KHÁCH' }
    },
    'phong-bep': {
      category: 'room', name: 'Bếp 3×2.5m', icon: '🍳',
      room: { w: 3, h: 2.5, name: 'BẾP' }
    },
    'phong-wc': {
      category: 'room', name: 'WC 2×2m', icon: '🚿',
      room: { w: 2, h: 2, name: 'WC' }
    },
    'phong-lam-viec': {
      category: 'room', name: 'Làm việc 3×2.5m', icon: '💻',
      room: { w: 3, h: 2.5, name: 'LÀM VIỆC' }
    },
    'phong-giat': {
      category: 'room', name: 'Giặt 2×1.5m', icon: '🧺',
      room: { w: 2, h: 1.5, name: 'GIẶT' }
    },
    'phong-an': {
      category: 'room', name: 'Phòng ăn 3×3m', icon: '🍽️',
      room: { w: 3, h: 3, name: 'PHÒNG ĂN' }
    }
  };

  static list(category = 'all') {
    return Object.entries(this.catalog)
      .filter(([, t]) => category === 'all' || t.category === category)
      .map(([id, t]) => ({ id, ...t }));
  }

  static get(id) {
    return this.catalog[id] ? { id, ...this.catalog[id] } : null;
  }

  static apply(app, templateId, options = {}) {
    const tpl = ArchitecturalTemplates.get(templateId);
    if (!tpl) return { success: false, message: 'Không tìm thấy mẫu' };

    const ox = options.x || 0;
    const oy = options.y || 0;
    app.drawing.worldUnit = 'm';

    if (tpl.category === 'room' && tpl.room) {
      const r = tpl.room;
      ArchitecturalTemplates._placeRoom(app, ox, oy, r.w, r.h, r.name);
      app.zoomExtents();
      app.requestRender();
      return {
        success: true,
        message: `Đã tạo ${tpl.name}.`,
        templateId, name: tpl.name
      };
    }

    if (tpl.site) {
      ArchitecturalTemplates._drawSite(app, ox, oy, tpl.site.w, tpl.site.h);
    }

    for (const room of tpl.rooms || []) {
      ArchitecturalTemplates._placeRoom(
        app, ox + room.x, oy + room.y, room.w, room.h, room.name
      );
    }

    AutoDimensionEngine.dimensionAll(app);
    app.zoomExtents();
    app.requestRender();
    return {
      success: true,
      message: `Đã tạo mẫu "${tpl.name}" (${(tpl.rooms || []).length} phòng).`,
      templateId,
      name: tpl.name,
      roomCount: (tpl.rooms || []).length
    };
  }

  static _placeRoom(app, x, y, w, h, name) {
    ArchDrawEngine.createRoom(app, x, y, x + w, y + h, { name });
  }

  static _drawSite(app, ox, oy, w, h) {
    const layerId = app.layerManager.currentLayerId;
    const outline = ArchDrawEngine.rectOutline(layerId, ox, oy, ox + w, oy + h, {
      lineDash: [12, 6],
      color: '#78909c',
      lineWidth: 1.5,
      planRole: 'symbol'
    });
    outline.archType = 'site';
    app.drawing.addEntity(outline);
    if (app.cadCore?.history) {
      app.cadCore.history.push({ type: 'ADD_ENTITY', entity: outline });
    }
  }

  /** Preset cho FloorPlanGenerator (legacy) */
  static presetRooms(preset, landWidth, landDepth) {
    const margin = 0.5;
    const map = {
      '1bed': 'nha-1pn-40',
      '2bed': 'nha-2pn-60',
      'studio': 'nha-studio-25'
    };
    const id = map[preset];
    if (id) {
      const tpl = ArchitecturalTemplates.get(id);
      if (tpl?.site) {
        const sx = landWidth / tpl.site.w;
        const sy = landDepth / tpl.site.h;
        const s = Math.min(sx, sy, 1);
        return (tpl.rooms || []).map(r => ({
          name: r.name,
          x: margin + r.x * s,
          y: margin + r.y * s,
          w: r.w * s,
          h: r.h * s
        }));
      }
    }
    return null;
  }
}
