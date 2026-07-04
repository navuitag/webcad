/**
 * SemanticEngine — CAD → ngữ nghĩa Planner (CAD_TO_PLANNER_SDD §5)
 */
class SemanticEngine {
  static CLASSES = [
    'wall', 'door', 'window', 'column', 'room', 'floor', 'ceiling',
    'stair', 'furniture', 'decor', 'landscape', 'lighting', 'generic'
  ];

  static analyze(app) {
    const objects = [];
    for (const e of app.drawing.entities) {
      objects.push(SemanticEngine.classifyEntity(e, app));
    }
    const summary = SemanticEngine.summarize(objects);
    app.drawing.metadata.semanticScanAt = new Date().toISOString();
    app.drawing.metadata.semanticSummary = summary;
    return { success: objects.length > 0, objects, summary };
  }

  static classifyEntity(e, app) {
    let semanticClass = 'generic';
    const tpl = e.blockTemplateId || e.interiorAssetId || '';

    if (e.archType === 'wall' || e.planRole === 'wall') semanticClass = 'wall';
    else if (e.archType === 'column' || e.planRole === 'column') semanticClass = 'column';
    else if (e.archType === 'room-fill' || e.planRole === 'room-floor') semanticClass = 'room';
    else if (e.archType === 'ceiling' || e.planRole === 'ceiling') semanticClass = 'ceiling';
    else if (e.archType === 'open-floor' || e.planRole === 'floor') semanticClass = 'floor';
    else if (/^door/.test(tpl) || e.planRole === 'door') semanticClass = 'door';
    else if (/^window/.test(tpl) || e.planRole === 'window') semanticClass = 'window';
    else if (/^stairs/.test(tpl) || e.archType === 'stair') semanticClass = 'stair';
    else if (e.interiorAssetId) semanticClass = 'furniture';
    else if (e.interiorCategory === 'plant' || /^tree|^bush|^planter|^flower/.test(tpl)) semanticClass = 'landscape';
    else if (e.interiorCategory === 'lighting' || /^pendant|^floor-lamp/.test(tpl)) semanticClass = 'lighting';
    else if (['textile', 'art', 'mirror', 'plant'].includes(e.interiorCategory)) semanticClass = 'decor';
    else if (e.type === 'HATCH' && e.closed !== false) semanticClass = 'floor';
    else if (e.type === 'POLYLINE' && e.closed) semanticClass = 'room';

    e.semanticClass = semanticClass;
    const bb = e.getBoundingBox?.();
    return {
      id: e.id,
      type: e.type,
      semanticClass,
      archType: e.archType,
      planRole: e.planRole,
      templateId: tpl || null,
      bounds: bb ? { minX: bb.minX, minY: bb.minY, maxX: bb.maxX, maxY: bb.maxY } : null
    };
  }

  static summarize(objects) {
    const counts = {};
    for (const c of SemanticEngine.CLASSES) counts[c] = 0;
    for (const o of objects) counts[o.semanticClass] = (counts[o.semanticClass] || 0) + 1;
    return counts;
  }

  static formatReport(result) {
    if (!result.summary) return 'Chưa phân tích semantic.';
    const rows = ['── Semantic Engine ──'];
    for (const [k, v] of Object.entries(result.summary)) {
      if (v > 0) rows.push(`  ${k}: ${v}`);
    }
    rows.push(`Tổng: ${result.objects?.length || 0} đối tượng`);
    return rows.join('\n');
  }
}
