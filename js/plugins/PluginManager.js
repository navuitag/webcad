class PluginManager {
  constructor(app) {
    this.app = app;
    this.plugins = new Map();
    this.enabled = new Set(JSON.parse(localStorage.getItem('webcad_plugins') || '[]'));
  }

  register(plugin) {
    this.plugins.set(plugin.id, plugin);
    if (this.enabled.has(plugin.id) && plugin.onEnable) {
      plugin.onEnable(this.app);
    }
  }

  loadBuiltIn() {
    const builtins = [
      {
        id: 'grid-enhancer',
        name: 'Grid Enhancer',
        version: '1.0',
        author: 'WebCAD',
        description: 'Hiển thị tọa độ lưới lớn mỗi 50mm',
        category: 'View',
        onEnable(app) {
          app.drawing.view.majorGrid = 50;
        },
        onDisable(app) {
          delete app.drawing.view.majorGrid;
        }
      },
      {
        id: 'auto-save-boost',
        name: 'Auto-save Boost',
        version: '1.0',
        author: 'WebCAD',
        description: 'Autosave mỗi 15 giây thay vì 30',
        category: 'Productivity',
        onEnable(app) {
          if (app.autosaveInterval) clearInterval(app.autosaveInterval);
          app.autosaveInterval = setInterval(() => {
            app.storage.autosave(app.drawing, app.layerManager, app.blockManager, app.layoutManager);
          }, 15000);
        },
        onDisable(app) {
          app._startAutosave();
        }
      },
      {
        id: 'dimension-helper',
        name: 'Dimension Helper',
        version: '1.0',
        author: 'WebCAD',
        description: 'Gợi ý ghi kích thước sau khi vẽ line',
        category: 'Draw',
        onEnable(app) {
          app._dimHelperEnabled = true;
        },
        onDisable(app) {
          app._dimHelperEnabled = false;
        }
      },
      {
        id: 'collab-notify',
        name: 'Collab Notifications',
        version: '1.0',
        author: 'WebCAD',
        description: 'Thông báo khi có thay đổi từ collaborator',
        category: 'Collaboration',
        onEnable(app) {
          app.collaboration.onEvent((evt) => {
            if (evt.type === 'ADD_ENTITY' && evt.userName) {
              app.logCommand(`Collab: ${evt.userName} thêm entity`);
            }
          });
        },
        onDisable() {}
      },
      {
        id: 'ai-shortcuts',
        name: 'AI Quick Commands',
        version: '1.0',
        author: 'WebCAD',
        description: 'Phím tắt Ctrl+/ mở AI assistant',
        category: 'AI',
        onEnable(app) {
          app._aiShortcutEnabled = true;
        },
        onDisable(app) {
          app._aiShortcutEnabled = false;
        }
      }
    ];

    for (const plugin of builtins) {
      this.register(plugin);
    }
  }

  enable(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    this.enabled.add(id);
    this._saveEnabled();
    if (plugin.onEnable) plugin.onEnable(this.app);
    return true;
  }

  disable(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    this.enabled.delete(id);
    this._saveEnabled();
    if (plugin.onDisable) plugin.onDisable(this.app);
    return true;
  }

  toggle(id) {
    if (this.enabled.has(id)) return this.disable(id);
    return this.enable(id);
  }

  isEnabled(id) {
    return this.enabled.has(id);
  }

  list() {
    return Array.from(this.plugins.values());
  }

  _saveEnabled() {
    localStorage.setItem('webcad_plugins', JSON.stringify([...this.enabled]));
  }

  runHook(hookName, ...args) {
    for (const plugin of this.plugins.values()) {
      if (this.enabled.has(plugin.id) && plugin[hookName]) {
        plugin[hookName](this.app, ...args);
      }
    }
  }
}
