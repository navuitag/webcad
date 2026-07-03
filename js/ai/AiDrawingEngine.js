/**
 * AiDrawingEngine — AI tạo bản vẽ từ mô tả tiếng Việt
 */
class AiDrawingEngine {
  static parse(app, input) {
    const s = input.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Mặt bằng: "mat bang dat 5x20", "thua dat 4x15m 2 phong ngu"
    let m = s.match(/(?:mat\s*bang|thua\s*dat|dat)\s*(?:rong\s*)?([\d.]+)\s*[x×]\s*([\d.]+)/);
    if (m) {
      const w = parseFloat(m[1]) * (s.includes('m') && !s.includes('mm') ? 1 : 1);
      const d = parseFloat(m[2]);
      const preset = s.includes('studio') ? 'studio' : s.includes('1 phong') || s.includes('1 pn') ? '1bed' : '2bed';
      const r = FloorPlanGenerator.generate(app, w, d, preset);
      return { success: true, message: `Đã tạo mặt bằng ${w}×${d}m (${preset}, ${r.roomCount} phòng).` };
    }

    // Nhà phố: "nha pho 4x12 3 tang" (2D footprint)
    m = s.match(/(?:nha\s*pho|nha)\s*([\d.]+)\s*[x×]\s*([\d.]+)/);
    if (m) {
      const w = parseFloat(m[1]), d = parseFloat(m[2]);
      FloorPlanGenerator.generate(app, w, d, '2bed');
      return { success: true, message: `Đã tạo mặt bằng nhà ${w}×${d}m.` };
    }

    // Chèn mẫu nội thất / kiến trúc
    if (s.match(/(?:chen|them|dat|ve)\s+/)) {
      const id = BlockLibrary.findByKeyword(s);
      if (id) {
        BlockLibrary.insert(app, id, { x: 0, y: 0 });
        return { success: true, message: `Đã chèn ${BlockLibrary.templates[id].name}.` };
      }
    }

    // Tự động dim: "tu dong ghi kich thuoc", "auto dim"
    if (s.match(/(?:tu\s*dong|auto)\s*(?:ghi\s*)?(?:kich\s*thuoc|dim|dimension)/)) {
      const r = AutoDimensionEngine.dimensionAll(app);
      return { success: true, message: `Đã ghi ${r.count} kích thước.` };
    }

    // Kiểm tra lỗi
    if (s.match(/(?:kiem\s*tra|check)\s*(?:loi|ban\s*ve)/)) {
      const qa = DrawingQaEngine.check(app);
      return { success: true, message: DrawingQaEngine.formatReport(qa) };
    }

    // Phòng đơn: "phong khach 4x5"
    m = s.match(/(?:phong\s*\w+|room)\s*([\d.]+)\s*[x×]\s*([\d.]+)/);
    if (m) {
      const w = parseFloat(m[1]), h = parseFloat(m[2]);
      app.cadCore.run('DRAW_RECTANGLE', { x1: 0, y1: 0, x2: w, y2: h });
      return { success: true, message: `Đã vẽ phòng ${w}×${h}.` };
    }

    return null;
  }

  static getSuggestions() {
    return [
      'Mặt bằng đất 5×20m 2 phòng ngủ',
      'Thêm sofa 3 chỗ',
      'Chèn bàn ăn 120×80',
      'Thêm giường đôi',
      'Chèn cửa sổ lùa',
      'Tự động ghi kích thước',
      'Kiểm tra lỗi bản vẽ'
    ];
  }
}
