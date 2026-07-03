/**
 * DwgAdapter — DWG SDK Adapter (stub)
 *
 * Production: tích hợp ODA Drawings SDK (server-side) hoặc LibreDWG (WASM)
 * Hiện tại: hướng dẫn convert DXF, placeholder API
 */
class DwgAdapter {
  static get supported() {
    return false;
  }

  static get info() {
    return {
      name: 'DWG Adapter',
      status: 'stub',
      message: 'DWG import/export cần SDK server-side (ODA) hoặc WASM (LibreDWG). Dùng DXF làm interchange.',
      alternatives: ['dxf']
    };
  }

  static async import(file, app) {
    throw new Error(
      'DWG chưa được hỗ trợ trực tiếp. Xuất DWG → DXF từ AutoCAD/BricsCAD, rồi dùng Import DXF.'
    );
  }

  static async export(app, filename) {
    throw new Error(
      'DWG export cần DWG SDK Adapter. Tạm thời xuất DXF: File → Xuất DXF (.dxf).'
    );
  }

  static async probe(file) {
    const name = (file?.name || '').toLowerCase();
    if (!name.endsWith('.dwg')) return { compatible: false };
    return {
      compatible: false,
      format: 'dwg',
      suggestion: 'Convert to DXF using external tool, then import DXF.'
    };
  }
}
