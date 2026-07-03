/**
 * CadCore — façade trung tâm của CAD Engine
 *
 * CAD Core
 * ├── Geometry Kernel      → geometry
 * ├── Entity System        → entities
 * ├── Constraint Solver    → constraints
 * ├── Command System       → commands
 * ├── Parametric Engine    → parametric
 * ├── Layer/Block Manager  → layerBlock
 * ├── Dimension Engine     → dimensions
 * └── File Format Engine   → fileFormat
 */
class CadCore {
  constructor(app) {
    this.app = app;
    this.drawing = app.drawing;
    this.layoutManager = app.layoutManager;

    this.layerBlock = new LayerBlockManager(app.layerManager, app.blockManager);
    this.geometry = GeometryKernel;
    this.entities = new EntitySystem(this);
    this.constraints = new ConstraintSolver(this);
    this.commands = new CommandSystem(this);
    this.parametric = new ParametricEngine(this);
    this.dimensions = new DimensionEngine(this);
    this.fileFormat = new FileFormatEngine(this);
    this.styles = new StyleManager();
    this.xrefs = new XrefManager();
    this.templates = null;

    this.history = app.history;
    this.selection = app.selectionManager;
    this.collaboration = app.collaboration;
  }

  syncDrawing(drawing) {
    this.drawing = drawing;
  }

  initPostApp() {
    this.templates = new TemplateManager(this.app);
  }

  syncManagers(layerManager, blockManager, layoutManager) {
    this.layerBlock = new LayerBlockManager(layerManager, blockManager);
    if (layoutManager) this.layoutManager = layoutManager;
  }

  /** Snap point qua kernel + snap engine */
  snapPoint(worldX, worldY, view, canvasW, canvasH) {
    return this.app.snapEngine.snap(
      worldX, worldY, this.drawing, this.layerBlock.layerManager,
      view, canvasW, canvasH
    );
  }

  /** Apply ortho qua kernel */
  applyOrtho(start, end, orthoEnabled) {
    return orthoEnabled
      ? GeometryKernel.applyOrtho(start.x, start.y, end.x, end.y)
      : end;
  }

  requestRender() {
    this.app.requestRender();
  }

  log(message) {
    this.app.logCommand(message);
  }

  /** Thực thi pipeline: command → entity → history → render */
  run(commandName, params = {}) {
    const result = this.commands.execute(commandName, params);
    if (result.success) this.requestRender();
    return result;
  }
}
