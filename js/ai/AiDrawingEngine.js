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

    // Vẽ nhanh kiến trúc
    if (s.match(/ve\s*tuong|tuong\s*dep|ke\s*tuong/)) {
      app.setTool('wall');
      return { success: true, message: 'Chế độ vẽ tường — click các điểm nối tiếp.' };
    }
    if (s.match(/ve\s*phong|khoanh\s*phong|tao\s*phong/)) {
      app.setTool('room');
      return { success: true, message: 'Chế độ vẽ phòng — kéo khung, tự ghi diện tích.' };
    }
    if (s.match(/cot\s*tron|cot\s*tròn/)) {
      app.setTool('round-column');
      return { success: true, message: 'Chế độ vẽ cột tròn.' };
    }
    if (s.match(/ve\s*cot|cot\s*vuong/)) {
      app.setTool('column');
      return { success: true, message: 'Chế độ vẽ cột vuông.' };
    }
    if (s.match(/tuong\s*mo|tuong\s*mở/)) {
      app.setTool('open-wall');
      return { success: true, message: 'Chế độ vẽ tường mở.' };
    }
    if (s.match(/san\s*mo|san\s*mở|ve\s*san/)) {
      app.setTool('open-floor');
      return { success: true, message: 'Chế độ vẽ sàn mở — tự ghi S= diện tích.' };
    }
    if (s.match(/tran\s*mo|tran\s*mở|ve\s*tran/)) {
      app.setTool('open-ceiling');
      return { success: true, message: 'Chế độ vẽ trần mở — tự ghi T= diện tích.' };
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

    // Interior Design Module — Phase 3 AI Designer
    if (typeof InteriorAiDesigner !== 'undefined' && InteriorAiDesigner.isInteriorPrompt(input)) {
      if (s.match(/smart\s*decor|can\s*ho\s*\d+\s*m2|\d+\s*m2.*\d+\s*phong\s*ngu|apartment.*budget|ngan\s*sach\s*\d+/)) {
        const r = InteriorAiDesigner.smartDecorator(app, input);
        return { success: r.success, message: r.message };
      }
      const r = InteriorAiDesigner.designFromPrompt(app, input);
      return { success: r.success, message: r.message };
    }
    if (s.match(/trang\s*tri\s*tu\s*dong|auto\s*decor|automatic\s*decoration/)) {
      const styleMatch = s.match(/indochine|japandi|scandinavian|minimalist|modern|tropical|wabi|luxury/);
      const r = InteriorAutoDecorator.run(app, { styleId: styleMatch?.[0] });
      return { success: r.success, message: r.message };
    }
    if (s.match(/sketch\s*(?:to|->|→)\s*(?:noi\s*that|interior)/)) {
      const r = InteriorSketchEngine.fromSketch(app, {});
      return { success: r.success, message: r.message };
    }

    // Phase 4 — BIM-lite
    if (s.match(/(?:quet|scan)\s*bim|bim\s*lite/)) {
      const r = InteriorBimEngine.scanDrawing(app);
      return { success: r.success, message: r.message };
    }
    if (s.match(/vong\s*doi|lifecycle/)) {
      InteriorBimEngine.scanDrawing(app);
      const r = InteriorLifecycleEngine.projectReport(app);
      return { success: r.success, message: r.message + '\n' + InteriorLifecycleEngine.formatReport(r) };
    }
    if (s.match(/bao\s*tri|maintenance/)) {
      InteriorBimEngine.scanDrawing(app);
      const r = InteriorMaintenanceEngine.annualPlan(app);
      return { success: r.success, message: r.message + '\n' + InteriorMaintenanceEngine.formatReport(r) };
    }
    if (s.match(/bao\s*gia|quotation|cost\s*sheet/)) {
      const r = InteriorBoqEngine.downloadQuotationPdf(app);
      return { success: r.success, message: r.message };
    }
    if (s.match(/xuat\s*bim|export\s*bim/)) {
      const r = InteriorBimEngine.downloadBimJson(app);
      return { success: true, message: r.message };
    }
    if (s.match(/boq\s*ncc|boq\s*nang\s*cao|nha\s*cung\s*cap/)) {
      const r = InteriorBoqEngine.downloadBoq(app);
      return { success: r.success, message: r.message };
    }

    // Interior Design Module
    if (s.match(/(?:phat\s*hien|detect)\s*phong/)) {
      const r = InteriorEngine.detectRooms(app);
      return { success: r.length > 0, message: r.length ? `Phát hiện ${r.length} phòng.` : 'Không có phòng.' };
    }
    if (s.match(/trang\s*tri|decor|noi\s*that/)) {
      const styleMatch = s.match(/indochine|japandi|scandinavian|minimalist|modern|tropical|wabi|luxury/);
      const styleId = styleMatch ? styleMatch[0] : (app.drawing.metadata?.interiorStyle || 'modern');
      const r = InteriorSceneGenerator.furnishAll(app, styleId);
      return { success: r.success, message: r.message };
    }
    if (s.match(/(?:ap|apply)\s*phong\s*cach|phong\s*cach\s*(indochine|japandi|scandinavian|minimalist|modern|tropical|wabi|luxury)/)) {
      const styleMatch = s.match(/indochine|japandi|scandinavian|minimalist|modern|tropical|wabi|luxury/);
      const styleId = styleMatch ? styleMatch[0] : 'modern';
      const r = InteriorSceneGenerator.applyStyle(app, styleId);
      return { success: r.success, message: r.message };
    }
    if (s.match(/uoc\s*tinh|chi\s*phi|bao\s*gia|boq/)) {
      const r = InteriorEstimationEngine.estimate(app);
      return { success: true, message: r.message + '\n' + InteriorEstimationEngine.formatReport(r) };
    }
    if (s.match(/xuat\s*boq|export\s*boq/)) {
      const r = InteriorEstimationEngine.downloadBoq(app, app.drawing.metadata?.interiorStyle, s.includes('json') ? 'json' : 'csv');
      return { success: true, message: r.message };
    }
    const decorMatch = s.match(/mau\s*trang\s*tri|decor\s*template|homestay|apartment|showroom|cafe|tea\s*house/);
    if (decorMatch) {
      const tplId = InteriorDecorTemplates.list().find(t =>
        s.includes(t.category) || s.includes(t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      )?.id;
      if (tplId) {
        const r = InteriorDecorTemplates.apply(app, tplId);
        return { success: r.success, message: r.message };
      }
    }

    return null;
  }

  static getSuggestions() {
    return [
      'Mặt bằng đất 5×20m 2 phòng ngủ',
      'Thêm sofa 3 chỗ',
      'Vẽ phòng',
      'Vẽ tường',
      'Vẽ sàn mở',
      'Thêm giường đôi',
      'Trang trí phòng Japandi',
      'Áp phong cách Indochine',
      'Ước tính chi phí nội thất',
      'Xuất BOQ CSV',
      'Mẫu trang trí Indochine Homestay',
      'Thiết kế homestay Indochine 6×25m, 15 phòng, ngân sách 5 tỷ',
      'Smart Decorator: căn hộ 65m² 2 phòng ngủ Japandi ngân sách 500 triệu',
      'Trang trí tự động phong cách Modern',
      'Quét BIM-lite',
      'Báo giá PDF nội thất',
      'Vòng đời sản phẩm',
      'Lịch bảo trì hàng năm',
      'Phát hiện phòng',
      'Chèn cửa sổ lùa',
      'Tự động ghi kích thước',
      'Kiểm tra lỗi bản vẽ'
    ];
  }
}
