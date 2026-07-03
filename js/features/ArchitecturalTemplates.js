/**
 * ArchitecturalTemplates — mẫu nhà, tầng, phòng, cảnh quan (mặt bằng, đơn vị m)
 */
class ArchitecturalTemplates {
  static categories = {
    house: { label: 'Nhà', icon: '🏠' },
    floor: { label: 'Tầng', icon: '🏢' },
    room: { label: 'Phòng', icon: '🚪' },
    landscape: { label: 'Cảnh quan', icon: '🌳' }
  };

  static ZONE_KINDS = {
    lawn: { color: '#aed581', fillOpacity: 0.48, dash: null },
    garden: { color: '#c5e1a5', fillOpacity: 0.5, dash: null },
    water: { color: '#81d4fa', fillOpacity: 0.55, dash: [8, 4] },
    pool: { color: '#4fc3f7', fillOpacity: 0.58, dash: null },
    path: { color: '#eeeeee', fillOpacity: 0.62, dash: null },
    paving: { color: '#cfd8dc', fillOpacity: 0.6, dash: null },
    sand: { color: '#fff59d', fillOpacity: 0.52, dash: null },
    deck: { color: '#bcaaa4', fillOpacity: 0.5, dash: null },
    flower: { color: '#f48fb1', fillOpacity: 0.48, dash: null }
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
    },

    // ─── Cảnh quan (bố cục) ─────────────────────────────
    'cq-san-nha-pho': {
      category: 'landscape', name: 'Sân nhà phố 4×10m', icon: '🏡',
      desc: 'Cỏ trước + lối đi + sân sau',
      site: { w: 4, h: 10 },
      zones: [
        { name: 'CỎ TRƯỚC', x: 0, y: 0, w: 4, h: 3, kind: 'lawn' },
        { name: 'LỐI ĐI', x: 1.4, y: 0, w: 1.2, h: 10, kind: 'path' },
        { name: 'SÂN SAU', x: 0, y: 3.2, w: 4, h: 6.8, kind: 'lawn' }
      ],
      features: [
        { kind: 'tree', x: 0.6, y: 1.2, r: 0.35 },
        { kind: 'tree', x: 3.0, y: 1.2, r: 0.35 },
        { kind: 'tree', x: 0.6, y: 8.5, r: 0.4 },
        { kind: 'tree', x: 3.0, y: 8.5, r: 0.4 }
      ]
    },
    'cq-san-sau-ho-boi': {
      category: 'landscape', name: 'Sân sau + hồ bơi 8×12m', icon: '🏊',
      desc: 'Hồ bơi, sàn gỗ, vườn',
      site: { w: 8, h: 12 },
      zones: [
        { name: 'CỎ', x: 0, y: 0, w: 8, h: 12, kind: 'lawn' },
        { name: 'HỒ BƠI', x: 1, y: 1, w: 3.5, h: 7, kind: 'pool' },
        { name: 'SÀN GỖ', x: 4.8, y: 1, w: 2.5, h: 4, kind: 'deck' },
        { name: 'VƯỜN HOA', x: 4.8, y: 5.5, w: 2.5, h: 3, kind: 'flower' },
        { name: 'LỐI ĐI', x: 0.3, y: 0.3, w: 0.8, h: 11.4, kind: 'path' }
      ]
    },
    'cq-vuon-biet-thu': {
      category: 'landscape', name: 'Vườn biệt thự 15×12m', icon: '🏰',
      desc: 'Hồ bơi trung tâm, 4 góc cây',
      site: { w: 15, h: 12 },
      zones: [
        { name: 'CỎ', x: 0, y: 0, w: 15, h: 12, kind: 'lawn' },
        { name: 'HỒ BƠI', x: 5, y: 4, w: 5, h: 4, kind: 'pool' },
        { name: 'SÀN TIỆC', x: 5, y: 0.5, w: 5, h: 3, kind: 'paving' },
        { name: 'VƯỜN HOA', x: 0.5, y: 0.5, w: 3.5, h: 3, kind: 'flower' },
        { name: 'VƯỜN HOA 2', x: 11, y: 0.5, w: 3.5, h: 3, kind: 'flower' },
        { name: 'LỐI ĐI', x: 7, y: 0, w: 1.2, h: 12, kind: 'path' }
      ],
      features: [
        { kind: 'tree', x: 1.5, y: 9.5, r: 0.55 },
        { kind: 'tree', x: 13.5, y: 9.5, r: 0.55 },
        { kind: 'tree', x: 1.5, y: 5, r: 0.5 },
        { kind: 'tree', x: 13.5, y: 5, r: 0.5 },
        { kind: 'fountain', x: 7.5, y: 6, r: 0.6 }
      ]
    },
    'cq-san-choi-tre': {
      category: 'landscape', name: 'Sân chơi trẻ 6×8m', icon: '🛝',
      desc: 'Cát + cỏ + lối đi',
      site: { w: 6, h: 8 },
      zones: [
        { name: 'CỎ', x: 0, y: 0, w: 6, h: 8, kind: 'lawn' },
        { name: 'KHU CÁT', x: 0.5, y: 0.5, w: 2.5, h: 2.5, kind: 'sand' },
        { name: 'SÀN CHƠI', x: 3.2, y: 0.5, w: 2.3, h: 2.5, kind: 'paving' },
        { name: 'LỐI ĐI', x: 2.5, y: 3.2, w: 1, h: 4.5, kind: 'path' }
      ]
    },
    'cq-vuon-an-qua': {
      category: 'landscape', name: 'Vườn cây ăn quả 10×8m', icon: '🍎',
      desc: 'Lưới cây + lối đi giữa',
      site: { w: 10, h: 8 },
      zones: [
        { name: 'VƯỜN', x: 0, y: 0, w: 10, h: 8, kind: 'garden' },
        { name: 'LỐI ĐI', x: 4.5, y: 0, w: 1, h: 8, kind: 'path' },
        { name: 'LỐI NGANG', x: 0, y: 3.5, w: 10, h: 1, kind: 'path' }
      ],
      features: [
        { kind: 'tree', x: 1.5, y: 1.5, r: 0.4 },
        { kind: 'tree', x: 3, y: 1.5, r: 0.4 },
        { kind: 'tree', x: 1.5, y: 6, r: 0.4 },
        { kind: 'tree', x: 3, y: 6, r: 0.4 },
        { kind: 'tree', x: 7, y: 1.5, r: 0.4 },
        { kind: 'tree', x: 8.5, y: 1.5, r: 0.4 },
        { kind: 'tree', x: 7, y: 6, r: 0.4 },
        { kind: 'tree', x: 8.5, y: 6, r: 0.4 }
      ]
    },
    'cq-cong-vien-mini': {
      category: 'landscape', name: 'Công viên mini 12×10m', icon: '🌲',
      desc: 'Thảm cỏ + lối chữ thập',
      site: { w: 12, h: 10 },
      zones: [
        { name: 'CỎ', x: 0, y: 0, w: 12, h: 10, kind: 'lawn' },
        { name: 'LỐI DỌC', x: 5.2, y: 0, w: 1.6, h: 10, kind: 'path' },
        { name: 'LỐI NGANG', x: 0, y: 4.2, w: 12, h: 1.6, kind: 'path' },
        { name: 'AO NHỎ', x: 5, y: 4, w: 2, h: 2, kind: 'water' }
      ],
      features: [
        { kind: 'tree', x: 1.5, y: 1.5, r: 0.5 },
        { kind: 'tree', x: 10.5, y: 1.5, r: 0.5 },
        { kind: 'tree', x: 1.5, y: 8.5, r: 0.5 },
        { kind: 'tree', x: 10.5, y: 8.5, r: 0.5 },
        { kind: 'bench', x: 6, y: 1.2, w: 1.2, h: 0.4 }
      ]
    },
    'cq-san-vuon-nho': {
      category: 'landscape', name: 'Sân vườn nhỏ 5×6m', icon: '🌿',
      desc: 'Cỏ + vườn hoa góc',
      site: { w: 5, h: 6 },
      zones: [
        { name: 'CỎ', x: 0, y: 0, w: 5, h: 6, kind: 'lawn' },
        { name: 'VƯỜN HOA', x: 0.3, y: 0.3, w: 2, h: 2, kind: 'flower' },
        { name: 'SÀN NGỒI', x: 3, y: 3.5, w: 1.8, h: 2.2, kind: 'paving' }
      ],
      features: [
        { kind: 'tree', x: 4, y: 1, r: 0.35 },
        { kind: 'bush', x: 1.2, y: 4.5, r: 0.25 }
      ]
    },

    // ─── Cảnh quan (vùng đơn) ────────────────────────────
    'cq-co-4x3': {
      category: 'landscape', name: 'Thảm cỏ 4×3m', icon: '🌿',
      zone: { w: 4, h: 3, name: 'CỎ', kind: 'lawn' }
    },
    'cq-loi-di-1x5': {
      category: 'landscape', name: 'Lối đi 1×5m', icon: '🛤️',
      zone: { w: 1, h: 5, name: 'LỐI ĐI', kind: 'path' }
    },
    'cq-ho-boi-4x8': {
      category: 'landscape', name: 'Hồ bơi 4×8m', icon: '🏊',
      zone: { w: 4, h: 8, name: 'HỒ BƠI', kind: 'pool' }
    },
    'cq-vuon-hoa-3x3': {
      category: 'landscape', name: 'Vườn hoa 3×3m', icon: '🌸',
      zone: { w: 3, h: 3, name: 'VƯỜN HOA', kind: 'flower' }
    },
    'cq-san-gach-4x4': {
      category: 'landscape', name: 'Sân gạch 4×4m', icon: '⬜',
      zone: { w: 4, h: 4, name: 'SÀN GẠCH', kind: 'paving' }
    },
    'cq-san-go-3x5': {
      category: 'landscape', name: 'Sàn gỗ ngoài trời 3×5m', icon: '🪵',
      zone: { w: 3, h: 5, name: 'SÀN GỖ', kind: 'deck' }
    },
    'cq-ao-nuoc-3x2': {
      category: 'landscape', name: 'Ao nước 3×2m', icon: '💧',
      zone: { w: 3, h: 2, name: 'AO', kind: 'water' }
    },
    'cq-khu-cat-3x3': {
      category: 'landscape', name: 'Khu cát 3×3m', icon: '🏖️',
      zone: { w: 3, h: 3, name: 'CÁT', kind: 'sand' }
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

    if (tpl.category === 'landscape' && tpl.zone) {
      const z = tpl.zone;
      ArchitecturalTemplates._placeLandscapeZone(
        app, ox, oy, z.w, z.h, z.name, z.kind || 'lawn'
      );
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

    const zones = tpl.zones || [];
    const rooms = tpl.rooms || [];

    for (const room of rooms) {
      ArchitecturalTemplates._placeRoom(
        app, ox + room.x, oy + room.y, room.w, room.h, room.name
      );
    }

    for (const zone of zones) {
      ArchitecturalTemplates._placeLandscapeZone(
        app, ox + zone.x, oy + zone.y, zone.w, zone.h,
        zone.name, zone.kind || 'lawn'
      );
    }

    for (const feat of tpl.features || []) {
      ArchitecturalTemplates._placeLandscapeFeature(app, ox, oy, feat);
    }

    AutoDimensionEngine.dimensionAll(app);
    app.zoomExtents();
    app.requestRender();

    const count = zones.length || rooms.length;
    const unit = tpl.category === 'landscape' ? 'vùng' : 'phòng';
    return {
      success: true,
      message: `Đã tạo mẫu "${tpl.name}" (${count} ${unit}).`,
      templateId,
      name: tpl.name,
      zoneCount: count
    };
  }

  static _zoneStyle(kind) {
    return ArchitecturalTemplates.ZONE_KINDS[kind]
      || ArchitecturalTemplates.ZONE_KINDS.lawn;
  }

  static _placeLandscapeZone(app, x, y, w, h, name, kind = 'lawn') {
    const b = ArchDrawEngine.bounds(x, y, x + w, y + h);
    if (b.w < 1e-6 || b.h < 1e-6) return [];
    const layerId = app.layerManager.currentLayerId;
    const st = ArchitecturalTemplates._zoneStyle(kind);
    const fill = new HatchEntity(
      layerId,
      ArchDrawEngine._rectPoints(b.minX, b.minY, b.maxX, b.maxY),
      'SOLID'
    );
    ArchPlanStyle.mark(fill, 'landscape-fill', {
      color: st.color,
      fillOpacity: st.fillOpacity
    });
    fill.archType = 'landscape';
    fill.landscapeKind = kind;
    const outline = ArchDrawEngine.rectOutline(layerId, b.minX, b.minY, b.maxX, b.maxY, {
      color: st.color,
      lineWidth: kind === 'path' ? 0.8 : 1,
      lineDash: st.dash || undefined,
      planRole: 'landscape-fill'
    });
    outline.archType = 'landscape';
    const label = ArchDrawEngine.createAreaLabel(
      layerId, b.cx, b.cy - b.h * 0.04, b.area, 'S', ArchDrawEngine._unitOpts(app)
    );
    const entities = [fill, outline, label];
    if (name) {
      const nh = Math.max(0.12, Math.min(b.w, b.h) * 0.055);
      const nameLabel = new TextEntity(layerId, b.cx, b.cy + nh * 0.55, name, nh);
      nameLabel.centered = true;
      nameLabel.textStyleId = 'RoomLabel';
      nameLabel.planView = true;
      nameLabel.style.color = st.color;
      entities.push(nameLabel);
    }
    return ArchDrawEngine._commit(app, entities);
  }

  static _placeLandscapeFeature(app, ox, oy, feat) {
    const layerId = app.layerManager.currentLayerId;
    const entities = [];
    const cx = ox + (feat.x || 0);
    const cy = oy + (feat.y || 0);

    if (feat.kind === 'tree' || feat.kind === 'bush') {
      const r = feat.r || (feat.kind === 'tree' ? 0.45 : 0.25);
      const crown = new CircleEntity(layerId, cx, cy, r);
      ArchPlanStyle.mark(crown, 'landscape-tree', {
        color: ArchPlanStyle.COLORS.tree,
        fillOpacity: feat.kind === 'tree' ? 0.55 : 0.45
      });
      crown.archType = 'landscape';
      entities.push(crown);
      if (feat.kind === 'tree') {
        const trunk = new CircleEntity(layerId, cx, cy, r * 0.12);
        ArchPlanStyle.mark(trunk, 'landscape-tree', {
          color: '#5d4037',
          fillOpacity: 0.85
        });
        entities.push(trunk);
      }
    } else if (feat.kind === 'fountain') {
      const r = feat.r || 0.5;
      const pool = new CircleEntity(layerId, cx, cy, r);
      ArchPlanStyle.mark(pool, 'landscape-water', {
        color: ArchPlanStyle.COLORS.water,
        fillOpacity: 0.45
      });
      entities.push(pool);
      const jet = new CircleEntity(layerId, cx, cy, r * 0.2);
      ArchPlanStyle.mark(jet, 'landscape-water', {
        color: ArchPlanStyle.COLORS.pool,
        fillOpacity: 0.7
      });
      entities.push(jet);
    } else if (feat.kind === 'bench') {
      const w = feat.w || 1.2;
      const h = feat.h || 0.4;
      const bench = new RectangleEntity(layerId, cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
      ArchPlanStyle.mark(bench, 'landscape-path', {
        color: ArchPlanStyle.COLORS.deck,
        fillOpacity: 0.6,
        lineWidth: 1
      });
      bench.archType = 'landscape';
      entities.push(bench);
    }

    if (entities.length) {
      ArchDrawEngine._commit(app, entities);
    }
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
