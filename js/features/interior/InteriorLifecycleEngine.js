/**
 * InteriorLifecycleEngine — vòng đời sản phẩm BIM-lite (SDD §15, Phase 4)
 */
class InteriorLifecycleEngine {
  static PHASES = ['design', 'procurement', 'installation', 'operation', 'maintenance', 'replacement'];

  static PHASE_LABELS = {
    design: 'Thiết kế',
    procurement: 'Mua sắm',
    installation: 'Lắp đặt',
    operation: 'Vận hành',
    maintenance: 'Bảo trì',
    replacement: 'Thay thế'
  };

  static DEFAULTS = {
    generic: { warrantyYears: 1, lifespanYears: 10, installHours: 1 },
    floor: { warrantyYears: 5, lifespanYears: 20, installHours: 0.4 },
    wall: { warrantyYears: 3, lifespanYears: 8, installHours: 0.3 },
    ceiling: { warrantyYears: 2, lifespanYears: 15, installHours: 0.25 },
    bed: { warrantyYears: 2, lifespanYears: 12, installHours: 1.5 },
    sofa: { warrantyYears: 2, lifespanYears: 10, installHours: 2 },
    table: { warrantyYears: 1, lifespanYears: 8, installHours: 0.5 },
    chair: { warrantyYears: 1, lifespanYears: 6, installHours: 0.25 },
    wardrobe: { warrantyYears: 2, lifespanYears: 15, installHours: 3 },
    kitchen: { warrantyYears: 2, lifespanYears: 12, installHours: 4 },
    bath: { warrantyYears: 2, lifespanYears: 15, installHours: 2 },
    lighting: { warrantyYears: 2, lifespanYears: 8, installHours: 0.5 },
    textile: { warrantyYears: 1, lifespanYears: 5, installHours: 0.5 },
    plant: { warrantyYears: 0, lifespanYears: 3, installHours: 0.1 },
    art: { warrantyYears: 0, lifespanYears: 20, installHours: 0.2 }
  };

  static forEntity(entity, asset, material) {
    const cat = asset?.category || material?.category || entity.interiorCategory || 'generic';
    const d = InteriorLifecycleEngine.DEFAULTS[cat] || InteriorLifecycleEngine.DEFAULTS.generic;
    const installedAt = entity.bimData?.lifecycle?.installedAt || new Date().toISOString().slice(0, 10);
    const replaceDate = new Date(installedAt);
    replaceDate.setFullYear(replaceDate.getFullYear() + d.lifespanYears);

    return {
      stage: entity.bimData?.lifecycle?.stage || 'operation',
      phases: InteriorLifecycleEngine.PHASES,
      warrantyYears: d.warrantyYears,
      lifespanYears: d.lifespanYears,
      installHours: d.installHours,
      installedAt,
      warrantyUntil: InteriorLifecycleEngine._addYears(installedAt, d.warrantyYears),
      replacementDate: replaceDate.toISOString().slice(0, 10),
      category: cat
    };
  }

  static _addYears(dateStr, years) {
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().slice(0, 10);
  }

  static projectReport(app) {
    const items = [];
    for (const e of app.drawing.entities) {
      if (!e.bimData && !e.interiorAssetId && !e.interiorMaterialId) continue;
      const bim = e.bimData || (typeof InteriorBimEngine !== 'undefined' ? InteriorBimEngine.buildRecord(e, app) : null);
      if (!bim?.lifecycle) continue;
      items.push({
        name: bim.object?.name || e.id,
        category: bim.lifecycle.category,
        warrantyUntil: bim.lifecycle.warrantyUntil,
        replacementDate: bim.lifecycle.replacementDate,
        stage: bim.lifecycle.stage
      });
    }
    const upcoming = items
      .filter(i => i.replacementDate)
      .sort((a, b) => a.replacementDate.localeCompare(b.replacementDate))
      .slice(0, 8);

    return {
      success: items.length > 0,
      count: items.length,
      items,
      upcoming,
      message: items.length
        ? `Vòng đời: ${items.length} đối tượng BIM-lite.`
        : 'Chưa có dữ liệu vòng đời — quét BIM trước.'
    };
  }

  static formatReport(report) {
    if (!report.items?.length) return report.message;
    const rows = ['── Vòng đời sản phẩm ──'];
    for (const i of report.upcoming || report.items.slice(0, 10)) {
      rows.push(`  ${i.name} (${i.category})`);
      rows.push(`    Bảo hành đến: ${i.warrantyUntil || '—'} | Thay thế: ${i.replacementDate || '—'}`);
    }
    return rows.join('\n');
  }
}
