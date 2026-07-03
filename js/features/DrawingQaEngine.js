/**
 * DrawingQaEngine — kiểm tra lỗi bản vẽ (rule-based + AI-ready)
 */
class DrawingQaEngine {
  static check(app) {
    const issues = [];
    const entities = app.drawing.entities;
    const layers = app.layerManager.layers;
    const tol = 0.01;

    for (const e of entities) {
      if (e.type === 'LINE') {
        const len = GeometryKernel.distance(e.start.x, e.start.y, e.end.x, e.end.y);
        if (len < tol) issues.push({ severity: 'error', code: 'ZERO_LINE', message: `Đường thẳng zero-length: ${e.id}` });
      }
      if (e.type === 'CIRCLE' && e.radius < tol) {
        issues.push({ severity: 'error', code: 'ZERO_CIRCLE', message: `Đường tròn bán kính 0: ${e.id}` });
      }
      if (e.type === 'POLYLINE' && e.closed && e.points.length < 3) {
        issues.push({ severity: 'error', code: 'INVALID_POLY', message: `Polyline kín không hợp lệ: ${e.id}` });
      }
    }

    // Trùng lặp line
    const lines = entities.filter(e => e.type === 'LINE');
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (DrawingQaEngine._linesDuplicate(lines[i], lines[j], tol)) {
          issues.push({ severity: 'warning', code: 'DUPLICATE', message: `Đường trùng lặp: ${lines[i].id} / ${lines[j].id}` });
        }
      }
    }

    // Thiếu dimension trên rectangle lớn
    const rects = entities.filter(e => e.type === 'RECTANGLE');
    const dims = entities.filter(e => e.type === 'DIMENSION');
    for (const r of rects) {
      const bb = r.getBoundingBox();
      const area = (bb.maxX - bb.minX) * (bb.maxY - bb.minY);
      if (area > 100 && dims.length === 0) {
        issues.push({ severity: 'info', code: 'NO_DIM', message: 'Rectangle lớn chưa có kích thước — dùng Tự động ghi DIM' });
        break;
      }
    }

    // Layer rỗng
    for (const layer of layers) {
      const count = entities.filter(e => e.layerId === layer.id).length;
      if (count === 0 && layers.length > 1) {
        issues.push({ severity: 'info', code: 'EMPTY_LAYER', message: `Layer "${layer.name}" trống` });
      }
    }

    return {
      success: true,
      issueCount: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      issues
    };
  }

  static _linesDuplicate(a, b, tol) {
    const same = (p1, p2) => GeometryKernel.distance(p1.x, p1.y, p2.x, p2.y) < tol;
    return (same(a.start, b.start) && same(a.end, b.end)) ||
           (same(a.start, b.end) && same(a.end, b.start));
  }

  static formatReport(result) {
    if (!result.issues.length) return '✅ Bản vẽ OK — không phát hiện lỗi.';
    let text = `Kiểm tra: ${result.errors} lỗi, ${result.warnings} cảnh báo\n`;
    for (const i of result.issues.slice(0, 10)) {
      const icon = i.severity === 'error' ? '❌' : i.severity === 'warning' ? '⚠️' : 'ℹ️';
      text += `${icon} ${i.message}\n`;
    }
    if (result.issues.length > 10) text += `... +${result.issues.length - 10} mục`;
    return text;
  }
}
