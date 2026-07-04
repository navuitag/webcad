/**
 * InteriorCommercialAssets — tài sản thương mại / premium (SDD Phase 5)
 */
class InteriorCommercialAssets {
  static STORAGE_KEY = 'webcad_commercial_packs';

  static catalog = {
    'velvet-sofa-pro': {
      id: 'velvet-sofa-pro', blockId: 'sofa-3seat', name: 'Sofa Velvet Pro', icon: '✨',
      category: 'sofa', license: 'commercial', tier: 'pro', brand: 'VietSpace Pro',
      price: 28500000, styles: ['luxury', 'modern']
    },
    'marble-dining-pro': {
      id: 'marble-dining-pro', blockId: 'table-dining', name: 'Bàn Marble Pro', icon: '💎',
      category: 'table', license: 'commercial', tier: 'pro', brand: 'VietSpace Pro',
      price: 15800000, styles: ['luxury', 'indochine']
    },
    'king-bed-pro': {
      id: 'king-bed-pro', blockId: 'bed-king', name: 'Giường King Premium', icon: '👑',
      category: 'bed', license: 'commercial', tier: 'pro', brand: 'VietSpace Pro',
      price: 32000000, styles: ['luxury', 'modern']
    },
    'pendant-gold-pro': {
      id: 'pendant-gold-pro', blockId: 'pendant-lamp', name: 'Đèn thả vàng Pro', icon: '💡',
      category: 'lighting', license: 'commercial', tier: 'pro', brand: 'Lumière VN',
      price: 6800000, styles: ['luxury', 'indochine']
    },
    'kitchen-premium-pro': {
      id: 'kitchen-premium-pro', blockId: 'cabinet-kitchen-base', name: 'Bếp Premium Pro', icon: '🍳',
      category: 'kitchen', license: 'commercial', tier: 'pro', brand: 'KitchenCraft VN',
      price: 22000000, styles: ['modern', 'luxury']
    },
    'planter-designer-pro': {
      id: 'planter-designer-pro', blockId: 'planter-round', name: 'Chậu Designer Pro', icon: '🪴',
      category: 'plant', license: 'commercial', tier: 'studio', brand: 'Green Atelier',
      price: 3200000, styles: ['japandi', 'tropical', 'scandinavian']
    }
  };

  static packs = {
    'furniture-pro': { label: 'Furniture Pro Pack', assetIds: ['velvet-sofa-pro', 'marble-dining-pro', 'king-bed-pro'] },
    'lighting-pro': { label: 'Lighting Pro Pack', assetIds: ['pendant-gold-pro'] },
    'kitchen-pro': { label: 'Kitchen Pro Pack', assetIds: ['kitchen-premium-pro'] },
    'decor-pro': { label: 'Decor Pro Pack', assetIds: ['planter-designer-pro', 'pendant-gold-pro'] },
    'studio-all': { label: 'Studio All Access', assetIds: Object.keys(InteriorCommercialAssets.catalog) }
  };

  static getInstalledPacks() {
    try {
      return new Set(JSON.parse(localStorage.getItem(InteriorCommercialAssets.STORAGE_KEY) || '[]'));
    } catch (_) {
      return new Set();
    }
  }

  static _saveInstalled(packs) {
    localStorage.setItem(InteriorCommercialAssets.STORAGE_KEY, JSON.stringify([...packs]));
  }

  static installPack(packId) {
    const pack = InteriorCommercialAssets.packs[packId];
    if (!pack) return { success: false, message: 'Không tìm thấy gói thương mại.' };
    const installed = InteriorCommercialAssets.getInstalledPacks();
    installed.add(packId);
    InteriorCommercialAssets._saveInstalled(installed);
    return { success: true, packId, label: pack.label, count: pack.assetIds.length, message: `Đã cài ${pack.label} (${pack.assetIds.length} tài sản).` };
  }

  static listAvailable(filter = {}) {
    const installed = InteriorCommercialAssets.getInstalledPacks();
    const activeIds = new Set();
    for (const pid of installed) {
      const p = InteriorCommercialAssets.packs[pid];
      if (p) p.assetIds.forEach(id => activeIds.add(id));
    }
    return Object.values(InteriorCommercialAssets.catalog)
      .filter(a => !filter.tier || a.tier === filter.tier)
      .map(a => ({ ...a, installed: activeIds.has(a.id), blockId: a.blockId }));
  }

  static listInstalledAssets(filter = {}) {
    const installed = InteriorCommercialAssets.getInstalledPacks();
    const ids = new Set();
    for (const pid of installed) {
      InteriorCommercialAssets.packs[pid]?.assetIds.forEach(id => ids.add(id));
    }
    return [...ids]
      .map(id => InteriorCommercialAssets.catalog[id])
      .filter(Boolean)
      .filter(a => !filter.category || filter.category === 'all' || a.category === filter.category)
      .filter(a => !filter.style || a.styles.includes(filter.style))
      .map(a => ({
        id: a.blockId,
        commercialId: a.id,
        name: a.name,
        icon: a.icon,
        price: a.price,
        brand: a.brand,
        license: a.license,
        tier: a.tier,
        category: a.category,
        styles: a.styles,
        isCommercial: true
      }));
  }

  static insert(app, commercialId, point, options = {}) {
    const item = InteriorCommercialAssets.catalog[commercialId];
    if (!item) return { success: false, message: 'Tài sản thương mại không tồn tại.' };
    const installed = InteriorCommercialAssets.getInstalledPacks();
    const hasPack = [...installed].some(pid =>
      InteriorCommercialAssets.packs[pid]?.assetIds.includes(commercialId)
    );
    if (!hasPack) {
      return { success: false, message: `Cần cài gói chứa "${item.name}" từ Marketplace trước.` };
    }
    const r = InteriorPlacementEngine.insert(app, item.blockId, point, {
      ...options,
      styleId: options.styleId || app.drawing.metadata?.interiorStyle
    });
    if (r.success && r.entities?.length) {
      for (const e of r.entities) {
        e.commercialAssetId = commercialId;
        e.commercialTier = item.tier;
        e.commercialBrand = item.brand;
        if (typeof InteriorBimEngine !== 'undefined') InteriorBimEngine.attachToEntity(e, app);
      }
    }
    return { ...r, commercial: item.name, message: r.success ? `Đã chèn ${item.name} (${item.license}).` : r.message };
  }
}
