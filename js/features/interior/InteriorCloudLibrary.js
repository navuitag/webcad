/**
 * InteriorCloudLibrary — Cloud Library scene nội thất (SDD Phase 5)
 */
class InteriorCloudLibrary {
  static STORAGE_KEY = 'webcad_interior_cloud_packs';

  static _loadAll() {
    try {
      return JSON.parse(localStorage.getItem(InteriorCloudLibrary.STORAGE_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }

  static _saveAll(packs) {
    localStorage.setItem(InteriorCloudLibrary.STORAGE_KEY, JSON.stringify(packs));
  }

  static list() {
    return InteriorCloudLibrary._loadAll().sort((a, b) =>
      (b.savedAt || '').localeCompare(a.savedAt || '')
    );
  }

  static get(id) {
    return InteriorCloudLibrary._loadAll().find(p => p.id === id) || null;
  }

  static saveScene(app, name) {
    const rooms = InteriorEngine.detectRooms(app);
    const styleId = app.drawing.metadata?.interiorStyle || 'modern';
    let boqTotal = 0;
    try {
      boqTotal = InteriorEstimationEngine.estimate(app, styleId).total;
    } catch (_) {}

    const pack = {
      id: 'isc_' + Date.now().toString(36),
      name: name || app.drawing.name || 'Interior Scene',
      savedAt: new Date().toISOString(),
      interiorStyle: styleId,
      decorTemplate: app.drawing.metadata?.interiorDecorTemplate,
      bimScanAt: app.drawing.metadata?.bimScanAt,
      bimCount: app.drawing.metadata?.bimCount || 0,
      roomCount: rooms.length,
      roomSummary: rooms.map(r => ({
        name: r.name, type: r.type, area: Math.round(r.area * 100) / 100
      })),
      boqTotal,
      entityCount: app.drawing.entities.length,
      drawing: app.drawing.toJSON(app.layerManager, app.blockManager, app.layoutManager)
    };

    const packs = InteriorCloudLibrary._loadAll();
    packs.unshift(pack);
    if (packs.length > 30) packs.length = 30;
    InteriorCloudLibrary._saveAll(packs);

    return {
      success: true,
      pack,
      message: `Đã lưu scene "${pack.name}" (${rooms.length} phòng, ${pack.entityCount} entity) vào Cloud Library.`
    };
  }

  static applyPack(app, pack) {
    if (!pack?.drawing) return { success: false, message: 'Scene không hợp lệ.' };
    app._loadDrawingData(pack.drawing);
    app.drawing.metadata.interiorStyle = pack.interiorStyle;
    app.drawing.metadata.interiorDecorTemplate = pack.decorTemplate;
    app.drawing.metadata.bimScanAt = pack.bimScanAt;
    app.drawing.metadata.bimCount = pack.bimCount;
    app.requestRender();
    app.zoomExtents?.();
    return { success: true, pack, message: `Đã tải scene "${pack.name}".` };
  }

  static loadScene(app, packId) {
    const pack = InteriorCloudLibrary.get(packId);
    if (!pack) {
      return { success: false, message: 'Không tìm thấy scene trong Cloud Library.' };
    }
    return {
      ...InteriorCloudLibrary.applyPack(app, pack),
      message: `Đã tải scene "${pack.name}" (${pack.roomCount || 0} phòng, phong cách ${pack.interiorStyle || '—'}).`
    };
  }

  static deleteScene(packId) {
    const packs = InteriorCloudLibrary._loadAll().filter(p => p.id !== packId);
    InteriorCloudLibrary._saveAll(packs);
    return { success: true, message: 'Đã xóa scene khỏi Cloud Library.' };
  }

  static generateShareLink(packId) {
    const pack = InteriorCloudLibrary.get(packId);
    if (!pack) return { success: false, message: 'Scene không tồn tại.' };
    const json = JSON.stringify({ type: 'interior-scene', pack });
    const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p) =>
      String.fromCharCode(parseInt(p, 16))
    ));
    const base = location.href.split('#')[0];
    const link = `${base}#interior=${encoded}`;
    return { success: true, link, message: 'Đã tạo link chia sẻ scene nội thất.' };
  }

  static parseShareLink() {
    const hash = location.hash;
    if (!hash.startsWith('#interior=')) return null;
    try {
      const encoded = hash.slice(10);
      const json = decodeURIComponent(atob(encoded).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const data = JSON.parse(json);
      return data.type === 'interior-scene' ? data.pack : null;
    } catch (_) {
      return null;
    }
  }

  static clearShareLink() {
    if (location.hash.startsWith('#interior=')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  static formatListReport(packs) {
    if (!packs.length) return 'Cloud Library trống — lưu scene nội thất để dùng lại.';
    return packs.map(p =>
      `${p.name} — ${p.roomCount || 0} phòng, ${p.interiorStyle || '?'}, ${new Date(p.savedAt).toLocaleDateString('vi-VN')}`
    ).join('\n');
  }
}
