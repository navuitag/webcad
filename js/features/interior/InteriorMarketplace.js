/**
 * InteriorMarketplace — Plugin Marketplace nội thất (SDD §17, Phase 5)
 */
class InteriorMarketplace {
  static STORAGE_KEY = 'webcad_interior_marketplace';

  static catalog = [
    {
      id: 'plugin-furniture', name: 'Furniture Plugin', icon: '🛋️', category: 'Furniture',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Bộ sofa, bàn, giường premium thương mại',
      packId: 'furniture-pro', price: 0, featured: true
    },
    {
      id: 'plugin-kitchen', name: 'Kitchen Plugin', icon: '🍳', category: 'Kitchen',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Tủ bếp & thiết bị bếp cao cấp',
      packId: 'kitchen-pro', price: 0
    },
    {
      id: 'plugin-landscape', name: 'Landscape Plugin', icon: '🌴', category: 'Landscape',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Cây, hồ, sân vườn — mở rộng BlockLibrary landscape',
      packId: null, price: 0,
      onInstall(app) {
        app.drawing.metadata.landscapePlugin = true;
        app.logCommand?.('Landscape Plugin: đã kích hoạt thư viện cảnh quan.');
      }
    },
    {
      id: 'plugin-lighting', name: 'Lighting Plugin', icon: '💡', category: 'Lighting',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Đèn designer & preset ánh sáng nâng cao',
      packId: 'lighting-pro', price: 0
    },
    {
      id: 'plugin-decor', name: 'Decor Plugin', icon: '🖼️', category: 'Decor',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Trang trí, cây, tranh thương mại',
      packId: 'decor-pro', price: 0
    },
    {
      id: 'plugin-renderer', name: 'Renderer Plugin', icon: '🎬', category: 'Renderer',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Tăng chất lượng preview 3D (PBR, HDRI hint)',
      packId: null, price: 0,
      onInstall(app) {
        app.drawing.metadata.rendererPlugin = true;
        if (app.renderer3D?.setQuality) app.renderer3D.setQuality('high');
      }
    },
    {
      id: 'plugin-bim', name: 'BIM Plugin', icon: '📋', category: 'BIM',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Xuất BIM JSON, BOQ nâng cao & NCC',
      packId: null, price: 0,
      onInstall(app) {
        app.drawing.metadata.bimPlugin = true;
        InteriorBimEngine.scanDrawing(app);
      }
    },
    {
      id: 'plugin-ai', name: 'AI Plugin', icon: '🤖', category: 'AI',
      version: '1.0', author: 'WebCAD Studio',
      description: 'AI Designer, Smart Decorator, Sketch→Interior',
      packId: null, price: 0,
      onInstall(app) {
        app.drawing.metadata.aiInteriorPlugin = true;
      }
    },
    {
      id: 'plugin-studio-all', name: 'Studio All Access', icon: '🏆', category: 'Bundle',
      version: '1.0', author: 'WebCAD Studio',
      description: 'Tất cả plugin + gói thương mại',
      packId: 'studio-all', price: 0, featured: true
    }
  ];

  static getInstalled() {
    try {
      return new Set(JSON.parse(localStorage.getItem(InteriorMarketplace.STORAGE_KEY) || '[]'));
    } catch (_) {
      return new Set();
    }
  }

  static _saveInstalled(set) {
    localStorage.setItem(InteriorMarketplace.STORAGE_KEY, JSON.stringify([...set]));
  }

  static list(category) {
    return InteriorMarketplace.catalog.filter(p =>
      !category || category === 'all' || p.category === category
    ).map(p => ({
      ...p,
      installed: InteriorMarketplace.getInstalled().has(p.id)
    }));
  }

  static categories() {
    const cats = new Map();
    for (const p of InteriorMarketplace.catalog) {
      if (!cats.has(p.category)) cats.set(p.category, p.category);
    }
    return [{ id: 'all', label: 'Tất cả' }, ...[...cats.keys()].map(c => ({ id: c, label: c }))];
  }

  static install(app, pluginId) {
    const plugin = InteriorMarketplace.catalog.find(p => p.id === pluginId);
    if (!plugin) return { success: false, message: 'Plugin không tồn tại.' };

    const installed = InteriorMarketplace.getInstalled();
    if (installed.has(pluginId)) {
      return { success: true, message: `"${plugin.name}" đã được cài.` };
    }

    installed.add(pluginId);
    InteriorMarketplace._saveInstalled(installed);

    if (plugin.packId) {
      InteriorCommercialAssets.installPack(plugin.packId);
    }
    if (plugin.onInstall) plugin.onInstall(app);

    if (app.pluginManager) {
      app.pluginManager.register({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        author: plugin.author,
        description: plugin.description,
        category: plugin.category
      });
      app.pluginManager.enable(plugin.id);
    }

    return {
      success: true,
      plugin: plugin.name,
      message: `Đã cài "${plugin.name}" từ Marketplace.${plugin.packId ? ' Gói thương mại đã mở khóa.' : ''}`
    };
  }

  static uninstall(pluginId) {
    const installed = InteriorMarketplace.getInstalled();
    installed.delete(pluginId);
    InteriorMarketplace._saveInstalled(installed);
    return { success: true, message: 'Đã gỡ plugin khỏi Marketplace local.' };
  }
}
