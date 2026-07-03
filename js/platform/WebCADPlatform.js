/**
 * WebCADPlatform — root bootstrap, wiring tất cả engine layers
 */
class WebCADPlatform {
  constructor(app) {
    this.app = app;
    this.cad = new CadEngine(app);
    this.file = new FileEngine(app);
    this.collab = new CollabPlatform(app);
    this.plugins = null;
    this.frontend = {
      mode: '2d',
      renderer2D: null,
      renderer3D: null,
      get canvas() { return app.canvas; },
      get container3D() { return app.container3D; }
    };
    this._booted = false;
  }

  async boot() {
    if (this._booted) return this;

    await this.cad.init();
    this.app.cadCore = this.cad.core;

    this.file.attach(this.cad.core);
    this.collab.attach(this.app.collaboration);
    this.collab.init();

    this.frontend.renderer2D = this.app.renderer2D;
    this.frontend.renderer3D = this.app.renderer3D;

    this._booted = true;
    console.info('[WebCAD Platform]', this.getStatus());
    return this;
  }

  attachPlugins(pluginManager) {
    this.plugins = new PluginHost(this.app, pluginManager);
    this._registerCorePlugins();
    return this.plugins;
  }

  _registerCorePlugins() {
    if (!this.plugins) return;

    this.plugins.registerAiProvider({
      id: 'builtin-ai',
      name: 'Built-in AI Assistant',
      version: '1.0',
      description: 'Rule-based CAD assistant',
      handle: (prompt, ctx, app) => app.aiAssistant.process(prompt)
    });
  }

  getStatus() {
    return {
      platform: 'WebCAD 2.0',
      cad: this.cad.getStatus(),
      file: { formats: FormatRegistry.list().length },
      collab: this.collab.getStatus(),
      dwg: DwgAdapter.info,
      geometry: GeometryKernelWASM.getStatus()
    };
  }
}
