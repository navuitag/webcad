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
  insertTemplate(id, point, options) { return BlockLibrary.insert(this.app, id, point, options); }
  startInsertTemplate(id) { this.app.startInsertTemplate(id); }
  listTemplates(cat) { return BlockLibrary.list(cat); }
  listTemplateCategories() { return BlockLibrary.categories; }

  // Interior Design Module (SDD Interior_Design_Module)
  detectRooms() {
    const rooms = InteriorEngine.detectRooms(this.app);
    return {
      success: rooms.length > 0,
      rooms,
      count: rooms.length,
      message: rooms.length
        ? `Phát hiện ${rooms.length} phòng trên bản vẽ.`
        : 'Không phát hiện phòng — dùng công cụ Phòng hoặc mẫu kiến trúc.'
    };
  }

  listInteriorStyles() { return InteriorStyleEngine.list(); }
  listInteriorDecorPresets() { return InteriorStyleEngine.listDecorPresets(); }
  listInteriorMaterials(cat) { return InteriorMaterialLibrary.list(cat); }
  listInteriorAssets(filter) { return InteriorAssetManager.list(filter); }
  listInteriorAssetCategories() { return InteriorAssetManager.categories(); }

  applyInteriorStyle(styleId, roomId) {
    const r = InteriorSceneGenerator.applyStyle(this.app, styleId, roomId);
    InteriorCollabEngine.broadcast(this.app, 'applyStyle', { styleId, roomId });
    return r;
  }

  furnishRoom(roomId, styleId) {
    const r = InteriorSceneGenerator.furnishRoom(this.app, roomId, styleId);
    InteriorCollabEngine.broadcast(this.app, 'furnishRoom', { styleId, roomId });
    return r;
  }

  furnishAllRooms(styleId) {
    const r = InteriorSceneGenerator.furnishAll(this.app, styleId);
    InteriorCollabEngine.broadcast(this.app, 'furnishAll', { styleId });
    return r;
  }

  estimateInteriorCost(styleId) {
    const r = InteriorEstimationEngine.estimate(this.app, styleId);
    return { ...r, report: InteriorEstimationEngine.formatReport(r) };
  }

  exportInteriorBoq(format = 'csv', styleId) {
    return InteriorEstimationEngine.downloadBoq(this.app, styleId, format);
  }

  listInteriorLightingPresets() { return InteriorLightingEngine.list(); }
  applyInteriorLighting(presetId) {
    const r = InteriorLightingEngine.apply(this.app, presetId);
    InteriorCollabEngine.broadcast(this.app, 'applyLighting', { presetId });
    return { ...r, message: `Ánh sáng: ${r.preset}` };
  }

  listDecorTemplates(category) { return InteriorDecorTemplates.list(category); }
  listDecorTemplateCategories() { return InteriorDecorTemplates.categories; }
  applyDecorTemplate(id) {
    const r = InteriorDecorTemplates.apply(this.app, id);
    InteriorCollabEngine.broadcast(this.app, 'applyDecorTemplate', { templateId: id });
    return r;
  }

  /** Phase 3 — AI Designer & Smart Decorator */
  designInteriorFromPrompt(text) {
    return InteriorAiDesigner.designFromPrompt(this.app, text);
  }

  smartDecorator(text) {
    return InteriorAiDesigner.smartDecorator(this.app, text);
  }

  autoDecorateInterior(opts) {
    return InteriorAutoDecorator.run(this.app, opts);
  }

  sketchToInterior(opts) {
    return InteriorSketchEngine.fromSketch(this.app, opts);
  }

  /** Phase 4 — BIM-lite, BOQ nâng cao, NCC, bảo trì */
  scanInteriorBim() {
    const r = InteriorBimEngine.scanDrawing(this.app);
    InteriorCollabEngine.broadcast(this.app, 'scanBim', {});
    return r;
  }

  listInteriorSuppliers(category) {
    return InteriorSupplierLibrary.list(category);
  }

  buildInteriorBoq(styleId) {
    const r = InteriorBoqEngine.build(this.app, styleId);
    return { ...r, report: InteriorBoqEngine.formatReport(r) };
  }

  getInteriorLifecycleReport() {
    const r = InteriorLifecycleEngine.projectReport(this.app);
    return { ...r, report: InteriorLifecycleEngine.formatReport(r) };
  }

  getInteriorMaintenancePlan() {
    const r = InteriorMaintenanceEngine.annualPlan(this.app);
    return { ...r, report: InteriorMaintenanceEngine.formatReport(r) };
  }

  exportInteriorBimJson() {
    return InteriorBimEngine.downloadBimJson(this.app);
  }

  exportInteriorBoqPhase4(format = 'csv', styleId) {
    return InteriorBoqEngine.downloadBoq(this.app, styleId, format);
  }

  exportInteriorQuotationPdf(styleId) {
    return InteriorBoqEngine.downloadQuotationPdf(this.app, styleId);
  }

  getEntityBim(entity) {
    if (entity?.bimData) return entity.bimData;
    if (entity && typeof InteriorBimEngine !== 'undefined') {
      return InteriorBimEngine.buildRecord(entity, this.app);
    }
    return null;
  }

  /** Phase 5 — Marketplace, Cloud Library, Collab, Commercial */
  listMarketplacePlugins(category) {
    return InteriorMarketplace.list(category);
  }

  listMarketplaceCategories() {
    return InteriorMarketplace.categories();
  }

  installMarketplacePlugin(pluginId) {
    return InteriorMarketplace.install(this.app, pluginId);
  }

  listCommercialAssets(filter) {
    return InteriorCommercialAssets.listInstalledAssets(filter);
  }

  insertCommercialAsset(commercialId, point, options) {
    return InteriorCommercialAssets.insert(this.app, commercialId, point, options);
  }

  saveInteriorCloud(name) {
    const r = InteriorCloudLibrary.saveScene(this.app, name);
    InteriorCollabEngine.broadcast(this.app, 'saveCloud', { name: r.pack?.name });
    return r;
  }

  listInteriorCloudScenes() {
    return InteriorCloudLibrary.list();
  }

  loadInteriorCloud(packId) {
    return InteriorCloudLibrary.loadScene(this.app, packId);
  }

  shareInteriorCloud(packId) {
    return InteriorCloudLibrary.generateShareLink(packId);
  }

  deleteInteriorCloud(packId) {
    return InteriorCloudLibrary.deleteScene(packId);
  }

  getInteriorCollabStatus() {
    return InteriorCollabEngine.getStatus(this.app);
  }

  /** CAD → Planner Engine (CAD_TO_PLANNER_SDD) */
  convertToPlanner(options) {
    return PlannerEngine.convertToPlanner(this.app, options);
  }

  analyzePlannerSemantic() {
    return PlannerEngine.analyzeSemantic(this.app);
  }

  detectPlannerRooms(options) {
    return PlannerEngine.detectRooms(this.app, options);
  }

  enterPlannerMode() {
    return PlannerEngine.enterPlannerMode(this.app);
  }

  async enterPlannerRenderMode(styleId) {
    return PlannerEngine.enterRenderMode(this.app, styleId);
  }

  getPlannerWorkflow() {
    const wf = PlannerEngine.getWorkflow(this.app);
    return { ...wf, report: PlannerEngine.formatWorkflow(wf) };
  }

  setInteriorCollabEnabled(on) {
    InteriorCollabEngine.setEnabled(on);
    return { success: true, enabled: on, message: on ? 'Đã bật collab nội thất realtime.' : 'Đã tắt collab nội thất.' };
  }

  startInsertInteriorAsset(id) { this.app.startInsertTemplate(id); }

  // Tự động
  autoDimension(all = true) {
    return all ? AutoDimensionEngine.dimensionAll(this.app) : AutoDimensionEngine.dimensionSelection(this.app);
  }
  generateFloorPlan(w, d, preset) { return FloorPlanGenerator.generate(this.app, w, d, preset); }
  listArchTemplates(cat) { return ArchitecturalTemplates.list(cat); }
  applyArchTemplate(id) { return ArchitecturalTemplates.apply(this.app, id); }
  convertToPlanView(selectionOnly = false) {
    return PlanConversionEngine.convert(this.app, { selectionOnly });
  }

  async importSketch(file, opts = {}) {
    await this.vision.loadImage(file);
    if (opts.toInterior) {
      return InteriorSketchEngine.fromSketch(this.app, opts);
    }
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
