/**
 * InteriorMaterialLibrary — thư viện vật liệu nội thất (SDD §9)
 */
class InteriorMaterialLibrary {
  static categories = {
    floor: { label: 'Sàn', icon: '⬜' },
    wall: { label: 'Tường', icon: '🧱' },
    ceiling: { label: 'Trần', icon: '🔲' },
    wood: { label: 'Gỗ', icon: '🪵' },
    tile: { label: 'Gạch', icon: '🔷' },
    paint: { label: 'Sơn', icon: '🎨' },
    fabric: { label: 'Vải', icon: '🧵' },
    metal: { label: 'Kim loại', icon: '⚙️' },
    glass: { label: 'Kính', icon: '🪟' }
  };

  static materials = {
    'floor-oak': { id: 'floor-oak', name: 'Sàn gỗ sồi', category: 'floor', kind: 'wood', color: '#d7ccc8', roughness: 0.72, pricePerM2: 850000 },
    'floor-tile-white': { id: 'floor-tile-white', name: 'Gạch trắng 60×60', category: 'floor', kind: 'tile', color: '#fafafa', roughness: 0.45, pricePerM2: 420000 },
    'floor-marble': { id: 'floor-marble', name: 'Đá marble', category: 'floor', kind: 'marble', color: '#eceff1', roughness: 0.35, pricePerM2: 1200000 },
    'floor-concrete': { id: 'floor-concrete', name: 'Bê tông đánh bóng', category: 'floor', kind: 'concrete', color: '#bdbdbd', roughness: 0.82, pricePerM2: 380000 },
    'wall-white-paint': { id: 'wall-white-paint', name: 'Sơn trắng', category: 'wall', kind: 'paint', color: '#ffffff', roughness: 0.9, pricePerM2: 95000 },
    'wall-warm-gray': { id: 'wall-warm-gray', name: 'Sơn xám ấm', category: 'wall', kind: 'paint', color: '#eceff1', roughness: 0.88, pricePerM2: 105000 },
    'wall-limewash': { id: 'wall-limewash', name: 'Sơn vôi (Wabi)', category: 'wall', kind: 'paint', color: '#f5f5f0', roughness: 0.92, pricePerM2: 120000 },
    'wall-indochine-green': { id: 'wall-indochine-green', name: 'Xanh Indochine', category: 'wall', kind: 'paint', color: '#2e5c4a', roughness: 0.85, pricePerM2: 135000 },
    'wall-wallpaper-linen': { id: 'wall-wallpaper-linen', name: 'Giấy dán vải lanh', category: 'wall', kind: 'wallpaper', color: '#efebe9', roughness: 0.78, pricePerM2: 280000 },
    'ceiling-white': { id: 'ceiling-white', name: 'Trần trắng', category: 'ceiling', kind: 'paint', color: '#ffffff', roughness: 0.92, pricePerM2: 85000 },
    'ceiling-cove': { id: 'ceiling-cove', name: 'Trần thả cove', category: 'ceiling', kind: 'gypsum', color: '#f5f5f5', roughness: 0.88, pricePerM2: 320000 },
    'wood-teak': { id: 'wood-teak', name: 'Gỗ teak', category: 'wood', kind: 'wood', color: '#8d6e63', roughness: 0.68, pricePerM2: 980000 },
    'wood-dark-walnut': { id: 'wood-dark-walnut', name: 'Gỗ óc chó tối', category: 'wood', kind: 'wood', color: '#5d4037', roughness: 0.65, pricePerM2: 1100000 },
    'fabric-linen': { id: 'fabric-linen', name: 'Vải lanh', category: 'fabric', kind: 'fabric', color: '#efebe9', roughness: 0.95, pricePerM2: 450000 },
    'metal-brass': { id: 'metal-brass', name: 'Đồng thau', category: 'metal', kind: 'metal', color: '#bcaaa4', roughness: 0.35, metalness: 0.85, pricePerM2: 0 },
    'glass-clear': { id: 'glass-clear', name: 'Kính trong', category: 'glass', kind: 'glass', color: '#e1f5fe', roughness: 0.05, opacity: 0.35, pricePerM2: 650000 }
  };

  static list(category) {
    return Object.values(this.materials).filter(m => !category || m.category === category);
  }

  static get(id) {
    return this.materials[id] ? { ...this.materials[id] } : null;
  }

  static to3D(materialId) {
    const m = this.get(materialId);
    if (!m) return null;
    return {
      color: m.color,
      metalness: m.metalness ?? 0,
      roughness: m.roughness ?? 0.85,
      opacity: m.opacity ?? 0.55,
      transparent: (m.opacity ?? 0.55) < 0.99
    };
  }
}
