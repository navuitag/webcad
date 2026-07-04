/**
 * InteriorLightingEngine — preset ánh sáng nội thất (SDD §10)
 */
class InteriorLightingEngine {
  static presets = {
    'warm-white': {
      id: 'warm-white', name: 'Warm White', icon: '🟡',
      ambientIntensity: 0.55, directionalIntensity: 0.75, hemisphereIntensity: 0.38,
      ambientColor: 0xfff3e0, directionalColor: 0xffcc80, hemisphereSky: 0xfff8e1, hemisphereGround: 0x4e342e,
      fillIntensity: 0.22, shadows: false
    },
    'cool-white': {
      id: 'cool-white', name: 'Cool White', icon: '🔵',
      ambientIntensity: 0.5, directionalIntensity: 0.85, hemisphereIntensity: 0.42,
      ambientColor: 0xe3f2fd, directionalColor: 0x90caf9, hemisphereSky: 0xbbdefb, hemisphereGround: 0x263238,
      fillIntensity: 0.2, shadows: false
    },
    'luxury-hotel': {
      id: 'luxury-hotel', name: 'Luxury Hotel', icon: '✨',
      ambientIntensity: 0.42, directionalIntensity: 1.0, hemisphereIntensity: 0.35,
      ambientColor: 0xfff8e1, directionalColor: 0xffd54f, hemisphereSky: 0xf5f5f5, hemisphereGround: 0x37474f,
      fillIntensity: 0.35, shadows: true
    },
    'cafe-ambient': {
      id: 'cafe-ambient', name: 'Cafe Ambient', icon: '☕',
      ambientIntensity: 0.48, directionalIntensity: 0.65, hemisphereIntensity: 0.45,
      ambientColor: 0xefebe9, directionalColor: 0xffab91, hemisphereSky: 0xd7ccc8, hemisphereGround: 0x3e2723,
      fillIntensity: 0.28, shadows: false
    },
    'tea-house': {
      id: 'tea-house', name: 'Tea House', icon: '🍵',
      ambientIntensity: 0.52, directionalIntensity: 0.55, hemisphereIntensity: 0.4,
      ambientColor: 0xf1f8e9, directionalColor: 0xa5d6a7, hemisphereSky: 0xe8f5e9, hemisphereGround: 0x33691e,
      fillIntensity: 0.25, shadows: false
    },
    'showroom': {
      id: 'showroom', name: 'Showroom', icon: '🏪',
      ambientIntensity: 0.6, directionalIntensity: 0.95, hemisphereIntensity: 0.5,
      ambientColor: 0xffffff, directionalColor: 0xffffff, hemisphereSky: 0xeceff1, hemisphereGround: 0x455a64,
      fillIntensity: 0.3, shadows: true
    },
    'restaurant': {
      id: 'restaurant', name: 'Restaurant', icon: '🍽️',
      ambientIntensity: 0.4, directionalIntensity: 0.88, hemisphereIntensity: 0.32,
      ambientColor: 0xfff3e0, directionalColor: 0xff8a65, hemisphereSky: 0xffccbc, hemisphereGround: 0x3e2723,
      fillIntensity: 0.32, shadows: true
    },
    'spa-relaxation': {
      id: 'spa-relaxation', name: 'Spa Relaxation', icon: '🧘',
      ambientIntensity: 0.58, directionalIntensity: 0.45, hemisphereIntensity: 0.48,
      ambientColor: 0xe0f2f1, directionalColor: 0x80cbc4, hemisphereSky: 0xb2dfdb, hemisphereGround: 0x004d40,
      fillIntensity: 0.18, shadows: false
    }
  };

  static list() {
    return Object.values(this.presets);
  }

  static get(id) {
    return this.presets[id] ? { ...this.presets[id] } : { ...this.presets['warm-white'] };
  }

  static apply(app, presetId) {
    const preset = InteriorLightingEngine.get(presetId);
    app.drawing.metadata.interiorLighting = presetId;
    if (app.renderer3D?.initialized && app.renderer3D.lighting) {
      app.renderer3D.lighting.applyInteriorPreset(preset);
    }
    return { success: true, preset: preset.name, id: presetId };
  }

  static forStyle(styleId) {
    const style = InteriorStyleEngine.get(styleId);
    const id = style.lightingPreset || InteriorLightingEngine._mapLegacy(style.lighting);
    return InteriorLightingEngine.get(id);
  }

  static _mapLegacy(lighting) {
    const map = { studio: 'showroom', outdoor: 'warm-white', flat: 'cool-white' };
    return map[lighting] || 'warm-white';
  }
}
