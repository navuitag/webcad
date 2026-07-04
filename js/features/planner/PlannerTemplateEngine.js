/**
 * PlannerTemplateEngine — gán mẫu phòng theo loại không gian (CAD_TO_PLANNER_SDD §10)
 */
class PlannerTemplateEngine {
  static ROOM_PRESETS = {
    bedroom: { styleId: 'japandi', decorTemplateId: 'apartment-japandi', lightingId: 'warm-white' },
    living: { styleId: 'modern', decorTemplateId: 'apartment-modern', lightingId: 'showroom' },
    kitchen: { styleId: 'modern', decorTemplateId: 'apartment-minimal', lightingId: 'cool-white' },
    bath: { styleId: 'minimalist', decorTemplateId: 'apartment-minimal', lightingId: 'cool-white' },
    dining: { styleId: 'scandinavian', decorTemplateId: 'apartment-scandinavian', lightingId: 'warm-white' },
    office: { styleId: 'modern', decorTemplateId: 'showroom-modern', lightingId: 'cool-white' },
    generic: { styleId: 'modern', decorTemplateId: 'apartment-modern', lightingId: 'warm-white' },
    restaurant: { styleId: 'indochine', decorTemplateId: 'restaurant-indochine', lightingId: 'restaurant' },
    hotel: { styleId: 'luxury', decorTemplateId: 'hotel-luxury', lightingId: 'luxury-hotel' },
    homestay: { styleId: 'indochine', decorTemplateId: 'homestay-indochine', lightingId: 'tea-house' },
    cafe: { styleId: 'indochine', decorTemplateId: 'cafe-indochine', lightingId: 'cafe-ambient' },
    teahouse: { styleId: 'wabi', decorTemplateId: 'teahouse-traditional', lightingId: 'tea-house' },
    showroom: { styleId: 'modern', decorTemplateId: 'showroom-modern', lightingId: 'showroom' }
  };

  static SPACE_MAP = {
    apartment: 'apartment-modern',
    homestay: 'homestay-indochine',
    hotel: 'hotel-luxury',
    restaurant: 'restaurant-indochine',
    teahouse: 'teahouse-traditional',
    showroom: 'showroom-modern',
    cafe: 'cafe-indochine'
  };

  static resolve(options = {}) {
    const spaceType = options.spaceType || 'apartment';
    const styleId = options.styleId || 'modern';

    if (options.decorTemplateId) {
      const tpl = InteriorDecorTemplates.get(options.decorTemplateId);
      return {
        styleId: tpl?.styleId || styleId,
        decorTemplateId: options.decorTemplateId,
        lightingId: tpl?.lightingId || InteriorStyleEngine.get(styleId).lightingPreset
      };
    }

    const decorTemplateId = PlannerTemplateEngine.SPACE_MAP[spaceType]
      || PlannerTemplateEngine.ROOM_PRESETS.generic.decorTemplateId;

    const tpl = InteriorDecorTemplates.get(decorTemplateId);
    return {
      styleId: styleId || tpl?.styleId || 'modern',
      decorTemplateId,
      lightingId: tpl?.lightingId || 'warm-white',
      spaceType
    };
  }

  static forRoom(room, globalPreset) {
    const preset = PlannerTemplateEngine.ROOM_PRESETS[room.type]
      || PlannerTemplateEngine.ROOM_PRESETS.generic;
    return {
      styleId: globalPreset.styleId || preset.styleId,
      lightingId: globalPreset.lightingId || preset.lightingId
    };
  }
}
