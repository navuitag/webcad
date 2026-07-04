/**
 * PlannerEngine — CAD to Planner orchestrator (CAD_TO_PLANNER_SDD §2–4, Phase 2)
 */
class PlannerEngine {
  static MODES = ['cad', 'bim', 'planner', 'render'];

  static convertToPlanner(app, options = {}) {
    return PlannerConversionEngine.convert(app, options);
  }

  static analyzeSemantic(app) {
    const r = SemanticEngine.analyze(app);
    return { ...r, report: SemanticEngine.formatReport(r) };
  }

  static detectRooms(app, options) {
    const rooms = PlannerRoomDetector.detectAll(app, options);
    return {
      success: rooms.length > 0,
      rooms,
      count: rooms.length,
      report: PlannerRoomDetector.formatReport(rooms),
      message: rooms.length ? `Planner: ${rooms.length} phòng.` : 'Không phát hiện phòng.'
    };
  }

  static enterPlannerMode(app) {
    app.drawing.metadata.appMode = 'planner';
    if (typeof app.setMode === 'function') app.setMode('planner');
    return { success: true, message: 'Chế độ Planner — kéo thả nội thất, đổi vật liệu, preset.' };
  }

  static async enterRenderMode(app, styleId) {
    app.drawing.metadata.appMode = 'render';
    const style = InteriorStyleEngine.get(styleId || app.drawing.metadata.interiorStyle || 'modern');
    const lightId = style.lightingPreset || InteriorLightingEngine._mapLegacy(style.lighting);
    InteriorLightingEngine.apply(app, lightId);
    if (typeof app.setMode === 'function') await app.setMode('3d');
    if (app.renderer3D?.initialized) {
      app.renderer3D.setLightingPreset('studio');
      if (app.drawing.entities3D.length) app.renderer3D.fitView();
    }
    return {
      success: true,
      message: `Render Mode 3D — ${style.name}, ánh sáng ${InteriorLightingEngine.get(lightId).name}.`
    };
  }

  static getWorkflow(app) {
    const meta = app.drawing.metadata || {};
    return {
      mode: meta.appMode || 'cad',
      planner: !!meta.plannerMode,
      convertedAt: meta.plannerConvertedAt,
      style: meta.interiorStyle,
      rooms: InteriorEngine.detectRooms(app).length,
      semantic: meta.semanticSummary,
      bim: meta.bimCount || 0
    };
  }

  static formatWorkflow(wf) {
    const rows = [
      '── Planner Workflow ──',
      `Chế độ: ${wf.mode}`,
      wf.planner ? `Đã chuyển Planner: ${wf.convertedAt?.slice(0, 10) || '—'}` : 'Chưa chuyển Planner',
      `Phòng: ${wf.rooms}`,
      `Phong cách: ${wf.style || '—'}`,
      `BIM objects: ${wf.bim || 0}`
    ];
    if (wf.semantic) {
      rows.push('Semantic: ' + Object.entries(wf.semantic).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(', '));
    }
    return rows.join('\n');
  }
}
