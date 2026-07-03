/**
 * PluginHost — hệ thống plugin chuyên nghiệp
 *
 * Loại plugin: tool | entity | export | ai
 */
class PluginHost {
  constructor(app, pluginManager) {
    this.app = app;
    this.manager = pluginManager;
    this.tools = new Map();
    this.entities = new Map();
    this.exporters = new Map();
    this.aiProviders = new Map();
  }

  registerTool(plugin) {
    this._validate(plugin, 'tool');
    this.tools.set(plugin.id, plugin);
    this.manager.register({ ...plugin, category: plugin.category || 'Tool' });
    if (plugin.factory) {
      this.app.tools[plugin.id] = plugin.factory(this.app);
    }
    return plugin;
  }

  registerEntity(plugin) {
    this._validate(plugin, 'entity');
    this.entities.set(plugin.type, plugin);
    this.manager.register({ ...plugin, id: plugin.id || `entity-${plugin.type}`, category: 'Entity' });
    return plugin;
  }

  registerExporter(plugin) {
    this._validate(plugin, 'export');
    this.exporters.set(plugin.format, plugin);
    this.manager.register({ ...plugin, id: plugin.id || `export-${plugin.format}`, category: 'Export' });
    return plugin;
  }

  registerAiProvider(plugin) {
    this._validate(plugin, 'ai');
    this.aiProviders.set(plugin.id, plugin);
    this.manager.register({ ...plugin, category: 'AI' });
    return plugin;
  }

  getTool(id) {
    return this.tools.get(id);
  }

  getEntityFactory(type) {
    return this.entities.get(type);
  }

  async runExporter(format, app) {
    const plugin = this.exporters.get(format);
    if (plugin?.export) return plugin.export(app);
    return app.platform?.file?.export(format);
  }

  async runAi(prompt, context) {
    for (const provider of this.aiProviders.values()) {
      if (this.manager.isEnabled(provider.id) && provider.handle) {
        return provider.handle(prompt, context, this.app);
      }
    }
    return this.app.aiAssistant?.process(prompt);
  }

  listByType(type) {
    switch (type) {
      case 'tool': return [...this.tools.values()];
      case 'entity': return [...this.entities.values()];
      case 'export': return [...this.exporters.values()];
      case 'ai': return [...this.aiProviders.values()];
      default: return this.manager.list();
    }
  }

  _validate(plugin, type) {
    if (!plugin.id && type !== 'entity') throw new Error(`Plugin ${type} requires id`);
    if (type === 'entity' && !plugin.type) throw new Error('Entity plugin requires type');
    if (type === 'export' && !plugin.format) throw new Error('Export plugin requires format');
  }
}
