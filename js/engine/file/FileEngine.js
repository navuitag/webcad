/**
 * FileEngine — façade File Engine chuyên nghiệp
 */
class FileEngine {
  constructor(app) {
    this.app = app;
    this.formats = FormatRegistry;
    this._core = null;
  }

  attach(cadCore) {
    this._core = cadCore.fileFormat;
  }

  get core() {
    return this._core || this.app.cadCore?.fileFormat;
  }

  list(direction) {
    return FormatRegistry.list(direction ? { [direction]: true } : {});
  }

  detect(filename) {
    return FormatRegistry.detect(filename);
  }

  export(formatId) {
    if (formatId === 'dwg') {
      return DwgAdapter.export(this.app, FormatRegistry.filename(this.app.drawing.name, 'dwg'))
        .then(() => ({ success: true }))
        .catch(e => ({ success: false, message: e.message }));
    }
    return this.core?.exportFormat(this.app, formatId) || { success: false, message: 'FileEngine not ready' };
  }

  async import(file) {
    const fmt = FormatRegistry.detect(file.name);
    if (fmt?.id === 'dwg') {
      try {
        return await DwgAdapter.import(file, this.app);
      } catch (e) {
        return { success: false, message: e.message };
      }
    }
    return this.core?.importFile(this.app, file) || { success: false, message: 'FileEngine not ready' };
  }

  serialize() {
    return this.core?.serialize();
  }
}
