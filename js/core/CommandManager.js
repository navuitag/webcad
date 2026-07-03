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
      CONE: () => this.app.setTool('cone3d'),
      EXT: () => this.app.setTool('extrude'),
      EXTRUDE: () => this.app.setTool('extrude'),
      UNION: () => { this.app.setMode('3d').then(() => { this.app.tools.boolean3d.operation = 'union'; this.app.setTool('boolean3d'); }); },
      SUBTRACT: () => { this.app.setMode('3d').then(() => { this.app.tools.boolean3d.operation = 'subtract'; this.app.setTool('boolean3d'); }); },
      INTERSECT: () => { this.app.setMode('3d').then(() => { this.app.tools.boolean3d.operation = 'intersect'; this.app.setTool('boolean3d'); }); },
      GLTFOUT: () => this.app._exportFormat('gltf'),
      STLOUT: () => this.app._exportFormat('stl'),
      OBJOUT: () => this.app._exportFormat('obj'),
      PNGOUT: () => this.app._exportFormat('png'),
      SVGOUT: () => this.app._exportFormat('svg'),
      PDFOUT: () => this.app._exportFormat('pdf'),
      WCADOUT: () => this.app._exportFormat('wcad'),
      OFFSET: () => this.app.setTool('offset'),
      O: () => this.app.setTool('offset'),
      TRIM: () => this.app.setTool('trim'),
      EXTEND: () => this.app.setTool('extend'),
      EX: () => this.app.setTool('extend'),
      FILLET: () => this.app.setTool('fillet'),
      F: () => this.app.setTool('fillet'),
      MIRROR: () => this.app.setTool('mirror'),
      MI: () => this.app.setTool('mirror'),
      BLOCK: () => this.app.setTool('block-create'),
      B: () => this.app.setTool('block-create'),
      INSERT: () => this.app.setTool('block-insert'),
      I: () => this.app.setTool('block-insert'),
      CHAMFER: () => this.app.setTool('chamfer'),
      CHA: () => this.app.setTool('chamfer'),
      ARRAY: () => this.app.setTool('array'),
      AR: () => this.app.setTool('array'),
      STRETCH: () => this.app.setTool('stretch'),
      S: () => this.app.setTool('stretch'),
      EXPLODE: () => this.app.setTool('explode'),
      X: () => this.app.setTool('explode'),
      JOIN: () => this.app.setTool('join'),
      J: () => this.app.setTool('join'),
      BREAK: () => this.app.setTool('break'),
      BR: () => this.app.setTool('break'),
      DIVIDE: () => this.app.setTool('divide'),
      DIV: () => this.app.setTool('divide'),
      MEASURE: () => this.app.setTool('measure'),
      MEA: () => this.app.setTool('measure'),
      HATCH: () => this.app.setTool('hatch'),
      H: () => this.app.setTool('hatch'),
      PLOT: () => this.app.cadCore.run('PLOT', {}),
      TEMPLATE: () => this.app.cadCore.run('LOAD_TEMPLATE', { name: 'A4-Metric' }),
      PRINT: () => {
        if (!this.app.layoutManager.isModelSpace()) {
          this.app.cadCore.run('PLOT', {});
        } else {
          ExportEngine.print(this.app.canvas, this.app.drawing);
        }
      },
      PR: () => ExportEngine.print(this.app.canvas, this.app.drawing),
      DXFOUT: () => this.app._exportFormat('dxf'),
      DXFIN: () => this.app._openImportDialog(['dxf']),
      AI: () => document.getElementById('ai-input')?.focus(),
      VIEWER: () => this.app.viewerInput?.click(),
      CLOUDSAVE: () => this.app.saveToCloud(),
      SHARE: () => this.app.createShareLink()
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
