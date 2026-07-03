/**
 * FileFormatEngine — import/export thống nhất qua FormatRegistry
 */
class FileFormatEngine {
  constructor(cadCore) {
    this.core = cadCore;
  }

  serialize() {
    const data = this.core.drawing.toJSON(
      this.core.layerBlock.layerManager,
      this.core.layerBlock.blockManager,
      this.core.layoutManager,
      this.core.styles,
      this.core.xrefs
    );
    data.format = 'webcad-json';
    data.formatVersion = data.version || '1.2';
    return data;
  }

  deserialize(data) {
    return Drawing.fromJSON(
      data,
      this.core.layerBlock.layerManager,
      this.core.layerBlock.blockManager,
      this.core.layoutManager,
      this.core.styles,
      this.core.xrefs
    );
  }

  exportFormat(app, formatId) {
    const fmt = FormatRegistry.get(formatId);
    if (!fmt || !fmt.export) {
      return { success: false, message: `Export not supported: ${formatId}` };
    }

    const name = FormatRegistry.baseName(app.drawing.name);
    const filename = FormatRegistry.filename(name, formatId);

    try {
      switch (formatId) {
        case 'wcad':
          this.exportWcad(name);
          break;
        case 'svg':
          ExportEngine.exportSVG(app.drawing, app.layerManager, app.canvas.width, app.canvas.height, filename);
          break;
        case 'png':
          ExportEngine.exportPNG(app.canvas, filename);
          break;
        case 'pdf':
          ExportEngine.exportPDF(app.canvas, app.drawing, filename);
          break;
        case 'dxf':
          DxfEngine.export(app.drawing, app.layerManager, filename);
          break;
        case 'stl':
          if (!app.renderer3D.initialized) throw new Error('Chuyển sang chế độ 3D trước khi xuất STL');
          ExportEngine.exportSTL(app.renderer3D.getScene(), filename);
          break;
        case 'obj':
          if (!app.renderer3D.initialized) throw new Error('Chuyển sang chế độ 3D trước khi xuất OBJ');
          ExportEngine.exportOBJ(app.renderer3D.getScene(), filename);
          break;
        case 'gltf':
          if (!app.renderer3D.initialized) throw new Error('Chuyển sang chế độ 3D trước khi xuất GLTF');
          ExportEngine.exportGLTF(app.renderer3D.getScene(), filename);
          break;
        default:
          return { success: false, message: `Unknown format: ${formatId}` };
      }
      return { success: true, format: formatId, filename };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async importFile(app, file) {
    try {
      const result = await ImportEngine.importFile(file, app);
      return { success: true, ...result };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  exportWcad(basename) {
    const data = this.serialize();
    const filename = FormatRegistry.filename(basename || data.name, 'wcad');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: FormatRegistry.formats.wcad.mime });
    this._download(blob, filename);
  }

  exportDxf() {
    DxfEngine.export(this.core.drawing, this.core.layerBlock.layerManager);
  }

  exportSvg(canvasW, canvasH) {
    ExportEngine.exportSVG(this.core.drawing, this.core.layerBlock.layerManager, canvasW, canvasH);
  }

  exportPdf(canvas) {
    ExportEngine.exportPDF(canvas, this.core.drawing);
  }

  exportPng(canvas) {
    ExportEngine.exportPNG(canvas);
  }

  async importDxf(text) {
    return DxfEngine.import(text, this.core.layerBlock.layerManager);
  }

  async loadFromFile(file) {
    const text = await file.text();
    return JSON.parse(text);
  }

  listFormats(direction) {
    if (direction === 'import') return FormatRegistry.list({ import: true });
    if (direction === 'export') return FormatRegistry.list({ export: true });
    return Object.values(FormatRegistry.formats);
  }

  _download(blob, filename) {
    ExportEngine._downloadBlob(blob, filename);
  }
}
