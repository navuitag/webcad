/**
 * CadEngine — façade CAD Engine chuyên nghiệp
 */
class CadEngine {
  constructor(app) {
    this.app = app;
    this.core = new CadCore(app);
    this.geometry = GeometryKernelWASM;
    this.backend = 'javascript';
  }

  async init() {
    this.backend = await GeometryKernelWASM.init();
    this.core.initPostApp();
    return this;
  }

  get entities() { return this.core.entities; }
  get commands() { return this.core.commands; }
  get constraints() { return this.core.constraints; }
  get history() { return this.core.history; }
  get parametric() { return this.core.parametric; }
  get dimensions() { return this.core.dimensions; }
  get styles() { return this.core.styles; }
  get layerBlock() { return this.core.layerBlock; }

  syncDrawing(drawing) { this.core.syncDrawing(drawing); }
  syncManagers(lm, bm, layout) { this.core.syncManagers(lm, bm, layout); }
  initPostApp() { this.core.initPostApp(); }

  run(command, params) { return this.core.run(command, params); }
  snapPoint(x, y, view, w, h) { return this.core.snapPoint(x, y, view, w, h); }

  getStatus() {
    return {
      geometryBackend: this.backend,
      entityCount: this.core.drawing?.entities?.length || 0,
      entity3dCount: this.core.drawing?.entities3D?.length || 0
    };
  }
}
