/**
 * PlannerConversionEngine — pipeline CAD → Planner Scene (CAD_TO_PLANNER_SDD §4)
 */
class PlannerConversionEngine {
  static convert(app, options = {}) {
    const preset = PlannerTemplateEngine.resolve(options);
    const styleId = preset.styleId;
    const steps = [];
    const reports = [];

    const plan = PlanConversionEngine.convert(app);
    if (plan.converted) steps.push(`Plan view (${plan.converted})`);
    else steps.push('Plan view');

    const semantic = SemanticEngine.analyze(app);
    steps.push(`Semantic (${semantic.objects.length})`);
    reports.push(SemanticEngine.formatReport(semantic));

    let rooms = PlannerRoomDetector.detectAll(app, {
      scanPolylines: true,
      createRooms: options.createRooms !== false
    });

    if (!rooms.length && options.width && options.depth) {
      FloorPlanGenerator.generate(app, options.width, options.depth, options.preset || '2bed');
      PlanConversionEngine.convert(app);
      rooms = PlannerRoomDetector.detectAll(app);
      steps.push(`Mặt bằng ${options.width}×${options.depth}m`);
    }

    if (!rooms.length) {
      return {
        success: false,
        steps,
        semantic,
        message: 'Không phát hiện phòng — vẽ phòng, polyline kín, hoặc tạo mặt bằng trước.'
      };
    }
    steps.push(`Phòng (${rooms.length})`);
    reports.push(PlannerRoomDetector.formatReport(rooms));

    if (options.useDecorTemplate && preset.decorTemplateId) {
      const tpl = InteriorDecorTemplates.apply(app, preset.decorTemplateId);
      steps.push(`Mẫu ${tpl.template || preset.decorTemplateId}`);
    } else {
      InteriorSceneGenerator.applyStyle(app, styleId);
      steps.push(`Phong cách ${InteriorStyleEngine.get(styleId).name}`);

      let placed = 0;
      for (const room of rooms) {
        const rp = PlannerTemplateEngine.forRoom(room, preset);
        const fr = InteriorSceneGenerator.furnishRoom(app, room.id, rp.styleId);
        placed += fr.placed || 0;
        placed += InteriorSceneGenerator.applyDecorations(app, room, rp.styleId);
      }
      steps.push(`Nội thất & trang trí (${placed})`);
    }

    InteriorLightingEngine.apply(app, preset.lightingId);
    steps.push(`Ánh sáng ${InteriorLightingEngine.get(preset.lightingId).name}`);

    InteriorBimEngine.scanDrawing(app);
    steps.push('BIM-lite');

    const estimate = InteriorEstimationEngine.estimate(app, styleId);
    steps.push(`BOQ ${estimate.formattedTotal}`);
    reports.push(InteriorEstimationEngine.formatReport(estimate));

    app.drawing.metadata.plannerMode = true;
    app.drawing.metadata.plannerConvertedAt = new Date().toISOString();
    app.drawing.metadata.interiorStyle = styleId;
    app.drawing.metadata.plannerPreset = preset;

    app.requestRender();
    app.zoomExtents?.();

    return {
      success: true,
      steps,
      rooms,
      semantic,
      preset,
      styleId,
      estimate,
      reports,
      message: `CAD → Planner: ${steps.join(' → ')}`
    };
  }
}
