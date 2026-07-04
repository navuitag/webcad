/**
 * InteriorAutoDecorator — Automatic Decoration cho bản vẽ hiện có (SDD §13, Phase 3)
 */
class InteriorAutoDecorator {
  static run(app, opts = {}) {
    const styleId = opts.styleId || app.drawing.metadata?.interiorStyle || 'modern';
    let rooms = InteriorEngine.detectRooms(app);

    if (!rooms.length) {
      return {
        success: false,
        message: 'Không có phòng — vẽ phòng, import phác thảo, hoặc dùng AI Designer tạo mặt bằng trước.'
      };
    }

    const steps = [];
    InteriorSceneGenerator.applyStyle(app, styleId);
    steps.push('Vật liệu');

    let placed = 0;
    for (const room of rooms) {
      const r = InteriorSceneGenerator.furnishRoom(app, room.id, styleId);
      placed += r.placed || 0;
    }
    steps.push('Nội thất');

    for (const room of InteriorEngine.detectRooms(app)) {
      placed += InteriorSceneGenerator.applyDecorations(app, room, styleId);
    }
    steps.push('Trang trí');

    const style = InteriorStyleEngine.get(styleId);
    InteriorLightingEngine.apply(app, opts.lightingId || style.lightingPreset || InteriorLightingEngine._mapLegacy(style.lighting));
    steps.push('Ánh sáng');

    app.drawing.metadata.interiorStyle = styleId;
    app.requestRender();

    const estimate = InteriorEstimationEngine.estimate(app, styleId);
    const budgetNote = opts.budgetVnd
      ? (estimate.total <= opts.budgetVnd
        ? `\n✓ Trong ngân sách ${InteriorEstimationEngine.formatVnd(opts.budgetVnd)}`
        : `\n⚠ Vượt ngân sách ${InteriorEstimationEngine.formatVnd(estimate.total - opts.budgetVnd)}`)
      : '';

    return {
      success: placed > 0,
      placed,
      rooms: rooms.length,
      styleId,
      estimate,
      message: `Trang trí tự động (${style.name}, ${rooms.length} phòng): ${steps.join(' → ')}\n${placed} chi tiết.\n${estimate.message}${budgetNote}\n\n${InteriorEstimationEngine.formatReport(estimate)}`
    };
  }
}
