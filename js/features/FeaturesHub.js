/**
 * FeaturesHub — tính năng tạo khác biệt WebCAD
 */
class FeaturesHub {
  constructor(app) {
    this.app = app;
    this.vision = new AiVisionEngine(app);
  }

  // AI
  aiDraw(text) { return AiDrawingEngine.parse(this.app, text); }
  aiCheck() {
    const r = DrawingQaEngine.check(this.app);
    return { ...r, message: DrawingQaEngine.formatReport(r) };
  }

  // Thư viện
  insertTemplate(id, point) { return BlockLibrary.insert(this.app, id, point); }
  startInsertTemplate(id) { this.app.startInsertTemplate(id); }
  listTemplates(cat) { return BlockLibrary.list(cat); }
  listTemplateCategories() { return BlockLibrary.categories; }

  // Tự động
  autoDimension(all = true) {
    return all ? AutoDimensionEngine.dimensionAll(this.app) : AutoDimensionEngine.dimensionSelection(this.app);
  }
  generateFloorPlan(w, d, preset) { return FloorPlanGenerator.generate(this.app, w, d, preset); }

  async importSketch(file, opts = {}) {
    await this.vision.loadImage(file);
    const apiKey = this.app.aiAssistant?.apiKey;
    if (opts.useAi && apiKey) {
      return this.vision.analyzeWithAI(file, apiKey, this.app.aiAssistant?.apiUrl);
    }
    const refPx = opts.refPixels || 100;
    const refMm = opts.refMm || 1000;
    return this.vision.traceToDrawing(refPx, refMm);
  }

  // Xuất
  exportTechnicalPdf(opts) { return TechnicalPdfEngine.export(this.app, opts); }

  // Chia sẻ & Collab
  shareLink() { return this.app.createShareLink(); }
  collabStatus() { return this.app.platform?.collab?.getStatus() || this.app.collaboration?.getStatus?.(); }

  // Offline
  isOfflineCapable() {
    return 'serviceWorker' in navigator && 'indexedDB' in window;
  }

  getOfflineStatus() {
    return { online: navigator.onLine, pwa: this.isOfflineCapable(), cached: !!navigator.serviceWorker?.controller };
  }
}
