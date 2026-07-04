/**
 * InteriorStyleEngine — phong cách nội thất (SDD §6–7)
 */
class InteriorStyleEngine {
  static styles = {
    modern: {
      id: 'modern', name: 'Modern', icon: '🏙️',
      palette: ['#ffffff', '#eceff1', '#37474f', '#4fc3f7'],
      materials: { floor: 'floor-concrete', wall: 'wall-white-paint', ceiling: 'ceiling-white' },
      lighting: 'studio',
      furniture: ['sofa-3seat', 'table-coffee', 'tv-stand', 'chair-office']
    },
    minimalist: {
      id: 'minimalist', name: 'Minimalist', icon: '⬜',
      palette: ['#ffffff', '#f5f5f5', '#bdbdbd', '#eeeeee'],
      materials: { floor: 'floor-tile-white', wall: 'wall-white-paint', ceiling: 'ceiling-white' },
      lighting: 'flat',
      furniture: ['sofa-2seat', 'table-round', 'bookshelf']
    },
    scandinavian: {
      id: 'scandinavian', name: 'Scandinavian', icon: '🌿',
      palette: ['#ffffff', '#d7ccc8', '#a5d6a7', '#81c784'],
      materials: { floor: 'floor-oak', wall: 'wall-warm-gray', ceiling: 'ceiling-white' },
      lighting: 'studio',
      furniture: ['sofa-2seat', 'table-coffee', 'chair-dining', 'bookshelf', 'planter-round']
    },
    indochine: {
      id: 'indochine', name: 'Indochine', icon: '🪭',
      palette: ['#efebe9', '#5d4037', '#2e5c4a', '#bcaaa4'],
      materials: { floor: 'wood-teak', wall: 'wall-indochine-green', ceiling: 'ceiling-cove' },
      lighting: 'outdoor',
      furniture: ['bed-double', 'wardrobe', 'table-desk', 'curtain-panel', 'floor-lamp']
    },
    japandi: {
      id: 'japandi', name: 'Japandi', icon: '🎋',
      palette: ['#fafafa', '#d7ccc8', '#8d6e63', '#a5d6a7'],
      materials: { floor: 'floor-oak', wall: 'wall-limewash', ceiling: 'ceiling-white' },
      lighting: 'flat',
      furniture: ['bed-double', 'table-coffee', 'chair-dining', 'planter-round', 'painting-frame']
    },
    tropical: {
      id: 'tropical', name: 'Tropical', icon: '🌴',
      palette: ['#ffffff', '#c8e6c9', '#8d6e63', '#4db6ac'],
      materials: { floor: 'wood-teak', wall: 'wall-white-paint', ceiling: 'ceiling-white' },
      lighting: 'outdoor',
      furniture: ['sofa-lshape', 'table-dining', 'planter-round', 'tree-palm']
    },
    wabi: {
      id: 'wabi', name: 'Wabi Sabi', icon: '🪨',
      palette: ['#f5f5f0', '#bcaaa4', '#8d6e63', '#cfd8dc'],
      materials: { floor: 'floor-concrete', wall: 'wall-limewash', ceiling: 'ceiling-cove' },
      lighting: 'flat',
      furniture: ['table-round', 'chair-dining', 'planter-round', 'painting-frame']
    },
    luxury: {
      id: 'luxury', name: 'Luxury Hotel', icon: '✨',
      palette: ['#fafafa', '#eceff1', '#ffd54f', '#5d4037'],
      materials: { floor: 'floor-marble', wall: 'wall-wallpaper-linen', ceiling: 'ceiling-cove' },
      lighting: 'studio',
      furniture: ['bed-king', 'sofa-3seat', 'table-coffee', 'mirror-round', 'floor-lamp']
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
    const styleSet = style.furniture || [];
    const merged = [...roomSet];
    for (const id of styleSet) {
      if (!merged.includes(id) && BlockLibrary.templates[id]) merged.push(id);
    }
    return merged.filter(id => BlockLibrary.templates[id]);
  }

  static listDecorPresets() {
    return Object.entries(this.decorPresets).map(([id, p]) => ({ id, ...p }));
  }
}
