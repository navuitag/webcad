class CommandManager {
  constructor(app) {
    this.app = app;
    this.commands = {
      LINE: () => this.app.setTool('line'),
      L: () => this.app.setTool('line'),
      PLINE: () => this.app.setTool('polyline'),
      PL: () => this.app.setTool('polyline'),
      CIRCLE: () => this.app.setTool('circle'),
      C: () => this.app.setTool('circle'),
      ARC: () => this.app.setTool('arc'),
      A: () => this.app.setTool('arc'),
      RECTANGLE: () => this.app.setTool('rectangle'),
      REC: () => this.app.setTool('rectangle'),
      R: () => this.app.setTool('rectangle'),
      TEXT: () => this.app.setTool('text'),
      T: () => this.app.setTool('text'),
      MOVE: () => this.app.setTool('move'),
      M: () => this.app.setTool('move'),
      COPY: () => this.app.setTool('copy'),
      CO: () => this.app.setTool('copy'),
      ROTATE: () => this.app.setTool('rotate'),
      RO: () => this.app.setTool('rotate'),
      SCALE: () => this.app.setTool('scale'),
      SC: () => this.app.setTool('scale'),
      ERASE: () => this.app.setTool('delete'),
      E: () => this.app.setTool('delete'),
      DELETE: () => this.app.setTool('delete'),
      DIM: () => this.app.setTool('dimension'),
      DIMENSION: () => this.app.setTool('dimension'),
      DIST: () => this.app.setTool('distance'),
      DI: () => this.app.setTool('distance'),
      DISTANCE: () => this.app.setTool('distance'),
      PAN: () => this.app.setTool('pan'),
      P: () => this.app.setTool('pan'),
      ZOOM: () => this.app.setTool('zoom'),
      Z: () => this.app.setTool('zoom'),
      SELECT: () => this.app.setTool('select'),
      ESC: () => this.app.setTool('select'),
      UNDO: () => this.app.undo(),
      U: () => this.app.undo(),
      REDO: () => this.app.redo(),
      GRID: () => this.app.toggleGrid(),
      ORTHO: () => this.app.toggleOrtho(),
      SNAP: () => this.app.toggleSnap(),
      ZOOMEXTENTS: () => this.app.zoomExtents(),
      ZE: () => this.app.zoomExtents(),
      NEW: () => this.app.newDrawing(),
      SAVE: () => this.app.saveDrawing(),
      OPEN: () => this.app.openDrawing(),
      BOX: () => this.app.setTool('box3d'),
      SPHERE: () => this.app.setTool('sphere3d'),
      CYLINDER: () => this.app.setTool('cylinder3d'),
      CONE: () => this.app.setTool('cone3d')
    };
  }

  execute(input) {
    const cmd = input.trim().toUpperCase();
    if (!cmd) return false;

    const handler = this.commands[cmd];
    if (handler) {
      handler();
      return true;
    }
    return false;
  }

  getCommandList() {
    return Object.keys(this.commands).filter(k => k.length > 1);
  }
}
