/**
 * InteriorSketchEngine — Sketch To Interior (SDD §12 Phase 3)
 */
class InteriorSketchEngine {
  static _ensureRooms(app) {
    let rooms = InteriorEngine.detectRooms(app);
    if (rooms.length) return rooms;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of app.drawing.entities) {
      const bb = e.getBoundingBox?.();
      if (!bb) continue;
      minX = Math.min(minX, bb.minX);
      minY = Math.min(minY, bb.minY);
      maxX = Math.max(maxX, bb.maxX);
      maxY = Math.max(maxY, bb.maxY);
    }
    if (!isFinite(minX)) return [];

    const margin = Math.max(0.3, (maxX - minX) * 0.05);
    if (typeof ArchDrawEngine !== 'undefined') {
      ArchDrawEngine.createRoom(
        app,
        minX + margin,
        minY + margin,
        maxX - margin,
        maxY - margin,
        { name: 'PHÒNG CHÍNH' }
      );
    }
    PlanConversionEngine.convert(app);
    return InteriorEngine.detectRooms(app);
  }

  static fromSketch(app, opts = {}) {
    const vision = app.features?.vision;
    if (!vision?.sketchImage) {
      return { success: false, message: 'Chưa tải ảnh phác thảo.' };
    }

    const refPx = opts.refPixels || 100;
    const refMm = opts.refMm || 1000;
    const trace = vision.traceToDrawing(refPx, refMm);
    if (!trace.success) return trace;

    PlanConversionEngine.convert(app);
    const rooms = InteriorSketchEngine._ensureRooms(app);
    if (!rooms.length) {
      return {
        success: false,
        message: `${trace.message}\nKhông tạo được phòng từ phác thảo — thử vẽ khung phòng rõ hơn.`
      };
    }

    const styleId = opts.styleId || app.drawing.metadata?.interiorStyle || 'modern';
    const decor = InteriorAutoDecorator.run(app, { styleId, lightingId: opts.lightingId });

    app.requestRender();
    if (typeof app.zoomExtents === 'function') app.zoomExtents();

    return {
      success: true,
      trace,
      rooms: rooms.length,
      placed: decor.placed,
      styleId,
      estimate: decor.estimate,
      message: `Sketch → Nội thất: ${trace.message}\nPhát hiện ${rooms.length} phòng, ${decor.placed || 0} chi tiết (${InteriorStyleEngine.get(styleId).name}).\n${decor.estimate?.message || ''}`
    };
  }
}
