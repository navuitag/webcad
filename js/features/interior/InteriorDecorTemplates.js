/**
 * InteriorDecorTemplates — mẫu trang trí theo không gian (SDD §11, Phase 2)
 */
class InteriorDecorTemplates {
  static categories = {
    apartment: { label: 'Căn hộ', icon: '🏢' },
    homestay: { label: 'Homestay', icon: '🏡' },
    hotel: { label: 'Khách sạn', icon: '🏨' },
    restaurant: { label: 'Nhà hàng', icon: '🍽️' },
    teahouse: { label: 'Phòng trà', icon: '🍵' },
    showroom: { label: 'Showroom', icon: '🏪' },
    cafe: { label: 'Quán cà phê', icon: '☕' }
  };

  static catalog = {
    'apartment-modern': {
      id: 'apartment-modern', category: 'apartment', name: 'Modern Apartment', icon: '🏙️',
      styleId: 'modern', lightingId: 'showroom', floorPlan: { w: 8, h: 12, preset: '2bed' }, furnish: true
    },
    'apartment-minimal': {
      id: 'apartment-minimal', category: 'apartment', name: 'Minimal Apartment', icon: '⬜',
      styleId: 'minimalist', lightingId: 'cool-white', floorPlan: { w: 6, h: 10, preset: '1bed' }, furnish: true
    },
    'apartment-japandi': {
      id: 'apartment-japandi', category: 'apartment', name: 'Japandi Apartment', icon: '🎋',
      styleId: 'japandi', lightingId: 'warm-white', floorPlan: { w: 7, h: 11, preset: '2bed' }, furnish: true
    },
    'apartment-scandinavian': {
      id: 'apartment-scandinavian', category: 'apartment', name: 'Scandinavian Apartment', icon: '🌿',
      styleId: 'scandinavian', lightingId: 'warm-white', floorPlan: { w: 8, h: 10, preset: '2bed' }, furnish: true
    },
    'homestay-indochine': {
      id: 'homestay-indochine', category: 'homestay', name: 'Indochine Homestay', icon: '🪭',
      styleId: 'indochine', lightingId: 'tea-house', floorPlan: { w: 6, h: 25, preset: 'studio' }, furnish: true
    },
    'homestay-rustic': {
      id: 'homestay-rustic', category: 'homestay', name: 'Rustic Homestay', icon: '🪵',
      styleId: 'wabi', lightingId: 'warm-white', floorPlan: { w: 5, h: 15, preset: 'studio' }, furnish: true
    },
    'homestay-tropical': {
      id: 'homestay-tropical', category: 'homestay', name: 'Tropical Homestay', icon: '🌴',
      styleId: 'tropical', lightingId: 'spa-relaxation', floorPlan: { w: 8, h: 14, preset: '2bed' }, furnish: true
    },
    'homestay-wabi': {
      id: 'homestay-wabi', category: 'homestay', name: 'Wabi Sabi Homestay', icon: '🪨',
      styleId: 'wabi', lightingId: 'spa-relaxation', floorPlan: { w: 5, h: 12, preset: 'studio' }, furnish: true
    },
    'hotel-luxury': {
      id: 'hotel-luxury', category: 'hotel', name: 'Luxury Hotel', icon: '✨',
      styleId: 'luxury', lightingId: 'luxury-hotel', floorPlan: { w: 9, h: 10, preset: '2bed' }, furnish: true
    },
    'hotel-boutique': {
      id: 'hotel-boutique', category: 'hotel', name: 'Boutique Hotel', icon: '🛎️',
      styleId: 'indochine', lightingId: 'luxury-hotel', floorPlan: { w: 6, h: 12, preset: '1bed' }, furnish: true
    },
    'hotel-business': {
      id: 'hotel-business', category: 'hotel', name: 'Business Hotel', icon: '💼',
      styleId: 'modern', lightingId: 'cool-white', floorPlan: { w: 5, h: 8, preset: '1bed' }, furnish: true
    },
    'hotel-resort': {
      id: 'hotel-resort', category: 'hotel', name: 'Resort Hotel', icon: '🏖️',
      styleId: 'tropical', lightingId: 'spa-relaxation', floorPlan: { w: 10, h: 12, preset: '2bed' }, furnish: true
    },
    'restaurant-european': {
      id: 'restaurant-european', category: 'restaurant', name: 'European Restaurant', icon: '🍷',
      styleId: 'luxury', lightingId: 'restaurant', floorPlan: { w: 10, h: 8, preset: 'studio' }, furnish: true
    },
    'restaurant-indochine': {
      id: 'restaurant-indochine', category: 'restaurant', name: 'Indochine Restaurant', icon: '🪷',
      styleId: 'indochine', lightingId: 'restaurant', floorPlan: { w: 8, h: 10, preset: 'studio' }, furnish: true
    },
    'teahouse-traditional': {
      id: 'teahouse-traditional', category: 'teahouse', name: 'Traditional Tea House', icon: '🍵',
      styleId: 'wabi', lightingId: 'tea-house', floorPlan: { w: 6, h: 8, preset: 'studio' }, furnish: true
    },
    'teahouse-zen': {
      id: 'teahouse-zen', category: 'teahouse', name: 'Zen Tea House', icon: '🎋',
      styleId: 'japandi', lightingId: 'tea-house', floorPlan: { w: 5, h: 7, preset: 'studio' }, furnish: true
    },
    'teahouse-indochine': {
      id: 'teahouse-indochine', category: 'teahouse', name: 'Indochine Tea House', icon: '🪭',
      styleId: 'indochine', lightingId: 'tea-house', floorPlan: { w: 6, h: 9, preset: 'studio' }, furnish: true
    },
    'showroom-modern': {
      id: 'showroom-modern', category: 'showroom', name: 'Modern Showroom', icon: '🏪',
      styleId: 'modern', lightingId: 'showroom', floorPlan: { w: 12, h: 8, preset: 'studio' }, furnish: true
    },
    'showroom-minimal': {
      id: 'showroom-minimal', category: 'showroom', name: 'Minimal Showroom', icon: '⬜',
      styleId: 'minimalist', lightingId: 'showroom', floorPlan: { w: 10, h: 8, preset: 'studio' }, furnish: true
    },
    'cafe-indochine': {
      id: 'cafe-indochine', category: 'cafe', name: 'Indochine Cafe', icon: '☕',
      styleId: 'indochine', lightingId: 'cafe-ambient', floorPlan: { w: 6, h: 10, preset: 'studio' }, furnish: true
    },
    'cafe-modern': {
      id: 'cafe-modern', category: 'cafe', name: 'Modern Cafe', icon: '🥤',
      styleId: 'modern', lightingId: 'cafe-ambient', floorPlan: { w: 5, h: 8, preset: 'studio' }, furnish: true
    }
  };

  static list(category) {
    return Object.values(this.catalog)
      .filter(t => !category || category === 'all' || t.category === category);
  }

  static get(id) {
    return this.catalog[id] ? { ...this.catalog[id] } : null;
  }

  static apply(app, templateId) {
    const tpl = InteriorDecorTemplates.get(templateId);
    if (!tpl) return { success: false, message: 'Không tìm thấy mẫu trang trí.' };

    let rooms = InteriorEngine.detectRooms(app);
    if (!rooms.length && tpl.floorPlan) {
      FloorPlanGenerator.generate(app, tpl.floorPlan.w, tpl.floorPlan.h, tpl.floorPlan.preset || '2bed');
      PlanConversionEngine.convert(app);
      rooms = InteriorEngine.detectRooms(app);
    }

    InteriorSceneGenerator.applyStyle(app, tpl.styleId);
    InteriorLightingEngine.apply(app, tpl.lightingId);
    app.drawing.metadata.interiorDecorTemplate = templateId;

    let placed = 0;
    if (tpl.furnish) {
      const fr = InteriorSceneGenerator.furnishAll(app, tpl.styleId);
      placed = fr.placed || 0;
      for (const room of InteriorEngine.detectRooms(app)) {
        placed += InteriorSceneGenerator.applyDecorations(app, room, tpl.styleId);
      }
    }

    app.requestRender();
    if (typeof app.zoomExtents === 'function') app.zoomExtents();

    return {
      success: true,
      template: tpl.name,
      style: tpl.styleId,
      lighting: tpl.lightingId,
      rooms: rooms.length,
      placed,
      message: `Đã áp mẫu "${tpl.name}": phong cách ${InteriorStyleEngine.get(tpl.styleId).name}, ánh sáng ${InteriorLightingEngine.get(tpl.lightingId).name}, ${placed} chi tiết.`
    };
  }
}
