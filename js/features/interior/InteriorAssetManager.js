/**
 * InteriorAssetManager — quản lý metadata tài sản nội thất (SDD §8)
 */
class InteriorAssetManager {
  static INTERIOR_BLOCK_CATS = new Set(['furniture', 'kitchen', 'bath', 'decor']);

  static meta = {
    'bed-single': { category: 'bed', price: 4500000, height: 45, styles: ['modern', 'minimalist'] },
    'bed-double': { category: 'bed', price: 8500000, height: 50, styles: ['modern', 'indochine', 'japandi'] },
    'bed-king': { category: 'bed', price: 12000000, height: 55, styles: ['luxury', 'modern'] },
    'wardrobe': { category: 'wardrobe', price: 9800000, height: 220, styles: ['modern', 'indochine'] },
    'wardrobe-slide': { category: 'wardrobe', price: 14500000, height: 220, styles: ['modern'] },
    'table-dining': { category: 'table', price: 5200000, height: 75, styles: ['modern', 'scandinavian', 'tropical'] },
    'table-coffee': { category: 'table', price: 2800000, height: 42, styles: ['modern', 'minimalist', 'japandi'] },
    'table-desk': { category: 'table', price: 3500000, height: 75, styles: ['modern', 'office'] },
    'table-round': { category: 'table', price: 2200000, height: 45, styles: ['minimalist', 'wabi'] },
    'chair-dining': { category: 'chair', price: 850000, height: 85, styles: ['modern', 'scandinavian'] },
    'chair-office': { category: 'chair', price: 1200000, height: 95, styles: ['modern', 'office'] },
    'sofa-2seat': { category: 'sofa', price: 8500000, height: 85, styles: ['modern', 'minimalist'] },
    'sofa-3seat': { category: 'sofa', price: 12000000, height: 85, styles: ['modern', 'luxury'] },
    'sofa-lshape': { category: 'sofa', price: 18500000, height: 85, styles: ['tropical', 'modern'] },
    'tv-stand': { category: 'cabinet', price: 3200000, height: 50, styles: ['modern'] },
    'bookshelf': { category: 'bookshelf', price: 2800000, height: 180, styles: ['scandinavian', 'minimalist'] },
    'mirror-rect': { category: 'mirror', price: 950000, height: 80, styles: ['modern', 'bath'] },
    'mirror-round': { category: 'mirror', price: 1200000, height: 80, styles: ['luxury'] },
    'cabinet-kitchen-base': { category: 'kitchen', price: 4500000, height: 85, styles: ['modern'] },
    'cabinet-kitchen-wall': { category: 'kitchen', price: 3800000, height: 70, styles: ['modern'] },
    'kitchen-stove': { category: 'kitchen', price: 8500000, height: 90, styles: ['modern'] },
    'kitchen-sink': { category: 'kitchen', price: 2200000, height: 20, styles: ['modern'] },
    'bathtub': { category: 'bath', price: 6500000, height: 55, styles: ['modern', 'luxury'] },
    'sink-bath': { category: 'bath', price: 1800000, height: 85, styles: ['modern'] },
    'toilet': { category: 'bath', price: 3200000, height: 40, styles: ['modern'] },
    'curtain-panel': { category: 'textile', price: 1200000, height: 260, styles: ['indochine', 'luxury', 'japandi'] },
    'carpet-area': { category: 'textile', price: 2800000, height: 1, styles: ['modern', 'living'] },
    'floor-lamp': { category: 'lighting', price: 1500000, height: 160, styles: ['modern', 'indochine', 'luxury'] },
    'pendant-lamp': { category: 'lighting', price: 2200000, height: 40, styles: ['modern', 'scandinavian'] },
    'painting-frame': { category: 'art', price: 850000, height: 60, styles: ['japandi', 'wabi', 'indochine'] },
    'planter-round': { category: 'plant', price: 450000, height: 40, styles: ['scandinavian', 'tropical', 'japandi'] }
  };

  static list(filter = {}) {
    const { category, style, keyword } = filter;
    return Object.entries(BlockLibrary.templates)
      .map(([id]) => InteriorAssetManager.get(id))
      .filter(a => a && InteriorAssetManager.INTERIOR_BLOCK_CATS.has(a.blockCategory))
      .filter(a => !category || category === 'all' || a.category === category)
      .filter(a => !style || a.styles.includes(style))
      .filter(a => !keyword || a.name.toLowerCase().includes(keyword.toLowerCase()));
  }

  static categories() {
    const cats = new Map();
    for (const a of InteriorAssetManager.list()) {
      if (!cats.has(a.category)) {
        cats.set(a.category, { id: a.category, label: InteriorAssetManager._catLabel(a.category), icon: InteriorAssetManager._catIcon(a.category) });
      }
    }
    return [{ id: 'all', label: 'Tất cả', icon: '📦' }, ...cats.values()];
  }

  static get(id) {
    const tpl = BlockLibrary.templates[id];
    if (!tpl) return null;
    const m = InteriorAssetManager.meta[id] || {};
    return {
      id,
      name: tpl.name,
      icon: tpl.icon || '📦',
      category: m.category || tpl.category || 'furniture',
      style: m.styles?.[0] || 'modern',
      styles: m.styles || ['modern'],
      material: m.material || 'wood',
      width: tpl.width || 100,
      depth: tpl.height || tpl.width || 100,
      height: m.height || 45,
      price: m.price || 0,
      brand: m.brand || 'WebCAD',
      model: m.model || id.toUpperCase(),
      blockCategory: tpl.category
    };
  }

  static _catLabel(c) {
    const map = { bed: 'Giường', sofa: 'Sofa', table: 'Bàn', chair: 'Ghế', wardrobe: 'Tủ', kitchen: 'Bếp', bath: 'Phòng tắm', lighting: 'Đèn', textile: 'Vải & thảm', art: 'Tranh trang trí', plant: 'Cây', cabinet: 'Tủ kệ', mirror: 'Gương', bookshelf: 'Kệ sách' };
    return map[c] || c;
  }

  static _catIcon(c) {
    const map = { bed: '🛏️', sofa: '🛋️', table: '🍽️', chair: '🪑', wardrobe: '🚪', kitchen: '🍳', bath: '🚿', lighting: '💡', textile: '🧵', art: '🖼️', plant: '🪴', cabinet: '🗄️', mirror: '🪞', bookshelf: '📚' };
    return map[c] || '📦';
  }
}
