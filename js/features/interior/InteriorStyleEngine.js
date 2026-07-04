/**
 * InteriorStyleEngine — phong cách nội thất (SDD §6–7, Phase 2)
 */
class InteriorStyleEngine {
  static styles = {
    modern: {
      id: 'modern', name: 'Modern', icon: '🏙️',
      palette: ['#ffffff', '#eceff1', '#37474f', '#4fc3f7'],
      accentColor: '#4fc3f7',
      materials: { floor: 'floor-concrete', wall: 'wall-white-paint', ceiling: 'ceiling-white' },
      lighting: 'studio', lightingPreset: 'showroom',
      furniture: ['sofa-3seat', 'table-coffee', 'tv-stand', 'chair-office'],
      decorations: ['painting-frame', 'floor-lamp'],
      plants: ['planter-round'], paintings: ['painting-frame'], textiles: ['carpet-area']
    },
    minimalist: {
      id: 'minimalist', name: 'Minimalist', icon: '⬜',
      palette: ['#ffffff', '#f5f5f5', '#bdbdbd', '#eeeeee'],
      accentColor: '#bdbdbd',
      materials: { floor: 'floor-tile-white', wall: 'wall-white-paint', ceiling: 'ceiling-white' },
      lighting: 'flat', lightingPreset: 'cool-white',
      furniture: ['sofa-2seat', 'table-round', 'bookshelf'],
      decorations: ['painting-frame'], plants: [], paintings: ['painting-frame'], textiles: []
    },
    scandinavian: {
      id: 'scandinavian', name: 'Scandinavian', icon: '🌿',
      palette: ['#ffffff', '#d7ccc8', '#a5d6a7', '#81c784'],
      accentColor: '#a5d6a7',
      materials: { floor: 'floor-oak', wall: 'wall-warm-gray', ceiling: 'ceiling-white' },
      lighting: 'studio', lightingPreset: 'warm-white',
      furniture: ['sofa-2seat', 'table-coffee', 'chair-dining', 'bookshelf', 'planter-round'],
      decorations: ['planter-round', 'painting-frame'], plants: ['planter-round'], paintings: ['painting-frame'], textiles: ['carpet-area']
    },
    indochine: {
      id: 'indochine', name: 'Indochine', icon: '🪭',
      palette: ['#efebe9', '#5d4037', '#2e5c4a', '#bcaaa4'],
      accentColor: '#2e5c4a',
      materials: { floor: 'wood-teak', wall: 'wall-indochine-green', ceiling: 'ceiling-cove' },
      lighting: 'outdoor', lightingPreset: 'tea-house',
      furniture: ['bed-double', 'wardrobe', 'table-desk', 'curtain-panel', 'floor-lamp'],
      decorations: ['curtain-panel', 'floor-lamp', 'painting-frame'], plants: ['planter-round'], paintings: ['painting-frame'], textiles: ['curtain-panel']
    },
    japandi: {
      id: 'japandi', name: 'Japandi', icon: '🎋',
      palette: ['#fafafa', '#d7ccc8', '#8d6e63', '#a5d6a7'],
      accentColor: '#8d6e63',
      materials: { floor: 'floor-oak', wall: 'wall-limewash', ceiling: 'ceiling-white' },
      lighting: 'flat', lightingPreset: 'warm-white',
      furniture: ['bed-double', 'table-coffee', 'chair-dining', 'planter-round', 'painting-frame'],
      decorations: ['planter-round', 'painting-frame'], plants: ['planter-round'], paintings: ['painting-frame'], textiles: ['carpet-area']
    },
    tropical: {
      id: 'tropical', name: 'Tropical', icon: '🌴',
      palette: ['#ffffff', '#c8e6c9', '#8d6e63', '#4db6ac'],
      accentColor: '#4db6ac',
      materials: { floor: 'wood-teak', wall: 'wall-white-paint', ceiling: 'ceiling-white' },
      lighting: 'outdoor', lightingPreset: 'spa-relaxation',
      furniture: ['sofa-lshape', 'table-dining', 'planter-round'],
      decorations: ['planter-round'], plants: ['planter-round'], paintings: [], textiles: ['carpet-area']
    },
    wabi: {
      id: 'wabi', name: 'Wabi Sabi', icon: '🪨',
      palette: ['#f5f5f0', '#bcaaa4', '#8d6e63', '#cfd8dc'],
      accentColor: '#bcaaa4',
      materials: { floor: 'floor-concrete', wall: 'wall-limewash', ceiling: 'ceiling-cove' },
      lighting: 'flat', lightingPreset: 'spa-relaxation',
      furniture: ['table-round', 'chair-dining', 'planter-round', 'painting-frame'],
      decorations: ['painting-frame', 'planter-round'], plants: ['planter-round'], paintings: ['painting-frame'], textiles: []
    },
    luxury: {
      id: 'luxury', name: 'Luxury Hotel', icon: '✨',
      palette: ['#fafafa', '#eceff1', '#ffd54f', '#5d4037'],
      accentColor: '#ffd54f',
      materials: { floor: 'floor-marble', wall: 'wall-wallpaper-linen', ceiling: 'ceiling-cove' },
      lighting: 'studio', lightingPreset: 'luxury-hotel',
      furniture: ['bed-king', 'sofa-3seat', 'table-coffee', 'mirror-round', 'floor-lamp'],
      decorations: ['floor-lamp', 'pendant-lamp', 'mirror-round', 'curtain-panel'], plants: ['planter-round'], paintings: ['painting-frame'], textiles: ['curtain-panel', 'carpet-area']
    }
  };

  static decorPresets = {
    apartment: { label: 'Căn hộ', styles: ['modern', 'minimalist', 'japandi', 'scandinavian'] },
    homestay: { label: 'Homestay', styles: ['indochine', 'tropical', 'wabi', 'scandinavian'] },
    hotel: { label: 'Khách sạn', styles: ['luxury', 'modern', 'indochine'] },
    cafe: { label: 'Quán cà phê', styles: ['indochine', 'modern', 'tropical'] },
    restaurant: { label: 'Nhà hàng', styles: ['luxury', 'indochine', 'modern'] },
    showroom: { label: 'Showroom', styles: ['modern', 'minimalist', 'luxury'] },
    office: { label: 'Văn phòng', styles: ['modern', 'minimalist'] }
  };

  static roomFurniture = {
    bedroom: ['bed-double', 'wardrobe', 'chair-office', 'curtain-panel', 'floor-lamp'],
    living: ['sofa-3seat', 'table-coffee', 'tv-stand', 'carpet-area', 'floor-lamp'],
    kitchen: ['cabinet-kitchen-base', 'cabinet-kitchen-wall', 'kitchen-stove', 'kitchen-sink', 'table-dining'],
    bath: ['bathtub', 'sink-bath', 'toilet', 'mirror-rect'],
    dining: ['table-dining', 'chair-dining', 'chair-dining', 'chair-dining', 'chair-dining'],
    office: ['table-desk', 'chair-office', 'bookshelf', 'floor-lamp'],
    generic: ['table-coffee', 'chair-dining', 'planter-round']
  };

  static list() {
    return Object.values(this.styles);
  }

  static get(id) {
    return this.styles[id] ? { ...this.styles[id] } : this.styles.modern;
  }

  static furnitureForRoom(roomType, styleId) {
    const style = this.get(styleId);
    const roomSet = this.roomFurniture[roomType] || this.roomFurniture.generic;
    const merged = [...roomSet];
    for (const id of style.furniture || []) {
      if (!merged.includes(id) && BlockLibrary.templates[id]) merged.push(id);
    }
    return merged.filter(id => BlockLibrary.templates[id]);
  }

  static decorationsForRoom(roomType, styleId) {
    const style = this.get(styleId);
    const base = [...(style.decorations || []), ...(style.plants || []), ...(style.paintings || [])];
    if (roomType === 'living') base.push('carpet-area', 'floor-lamp');
    if (roomType === 'bedroom') base.push('curtain-panel', 'floor-lamp');
    return [...new Set(base)].filter(id => BlockLibrary.templates[id]);
  }

  static applyPaletteToEntity(entity, style) {
    if (!entity || !style?.accentColor) return;
    if (entity.interiorAssetId && entity.style) {
      entity.style.color = style.accentColor;
    }
  }

  static listDecorPresets() {
    return Object.entries(this.decorPresets).map(([id, p]) => ({ id, ...p }));
  }
}
