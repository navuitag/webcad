/**
 * InteriorMaintenanceEngine — lịch bảo trì BIM-lite (SDD §15, Phase 4)
 */
class InteriorMaintenanceEngine {
  static SCHEDULES = {
    floor: { intervalMonths: 6, task: 'Đánh bóng / vệ sinh sàn', costPerVisit: 180000, unit: 'm²' },
    wall: { intervalMonths: 24, task: 'Sơn lại / vá tường', costPerVisit: 95000, unit: 'm²' },
    ceiling: { intervalMonths: 36, task: 'Kiểm tra trần & đèn', costPerVisit: 120000, unit: 'm²' },
    bed: { intervalMonths: 12, task: 'Kiểm tra khung & vệ sinh', costPerVisit: 350000, unit: 'cái' },
    sofa: { intervalMonths: 6, task: 'Giặt / hút bụi sofa', costPerVisit: 450000, unit: 'cái' },
    textile: { intervalMonths: 3, task: 'Giặt rèm / thảm', costPerVisit: 280000, unit: 'cái' },
    lighting: { intervalMonths: 12, task: 'Thay bóng / vệ sinh đèn', costPerVisit: 150000, unit: 'cái' },
    plant: { intervalMonths: 1, task: 'Tưới & chăm cây', costPerVisit: 80000, unit: 'cái' },
    kitchen: { intervalMonths: 6, task: 'Bảo dưỡng bếp & ống', costPerVisit: 520000, unit: 'bộ' },
    bath: { intervalMonths: 12, task: 'Kiểm tra silicon & van', costPerVisit: 380000, unit: 'bộ' },
    generic: { intervalMonths: 12, task: 'Kiểm tra tổng thể', costPerVisit: 200000, unit: 'cái' }
  };

  static forEntity(entity, asset, material) {
    const cat = asset?.category || material?.category || entity.interiorCategory || 'generic';
    const sch = InteriorMaintenanceEngine.SCHEDULES[cat] || InteriorMaintenanceEngine.SCHEDULES.generic;
    const visitsPerYear = 12 / sch.intervalMonths;
    return {
      category: cat,
      intervalMonths: sch.intervalMonths,
      task: sch.task,
      costPerVisit: sch.costPerVisit,
      unit: sch.unit,
      visitsPerYear: Math.round(visitsPerYear * 10) / 10,
      annualCost: Math.round(sch.costPerVisit * visitsPerYear)
    };
  }

  static annualPlan(app) {
    const tasks = [];
    let totalAnnual = 0;

    for (const e of app.drawing.entities) {
      const bim = e.bimData;
      if (!bim?.maintenance) continue;
      const m = bim.maintenance;
      totalAnnual += m.annualCost || 0;
      tasks.push({
        object: bim.object?.name || e.id,
        task: m.task,
        intervalMonths: m.intervalMonths,
        annualCost: m.annualCost
      });
    }

    if (!tasks.length) {
      const rooms = InteriorEngine.detectRooms(app);
      for (const room of rooms) {
        if (room.entity?.bimData?.maintenance) {
          const m = room.entity.bimData.maintenance;
          totalAnnual += m.annualCost || 0;
          tasks.push({ object: room.name, task: m.task, intervalMonths: m.intervalMonths, annualCost: m.annualCost });
        }
      }
    }

    return {
      success: tasks.length > 0,
      tasks,
      totalAnnual,
      formattedTotal: InteriorEstimationEngine.formatVnd(totalAnnual),
      message: tasks.length
        ? `Bảo trì hàng năm: ${InteriorEstimationEngine.formatVnd(totalAnnual)} (${tasks.length} hạng mục)`
        : 'Chưa có lịch bảo trì — quét BIM trước.'
    };
  }

  static formatReport(plan) {
    if (!plan.tasks?.length) return plan.message;
    const rows = ['── Lịch bảo trì hàng năm ──'];
    for (const t of plan.tasks) {
      rows.push(`  ${t.object}: ${t.task} (mỗi ${t.intervalMonths} tháng) ≈ ${InteriorEstimationEngine.formatVnd(t.annualCost)}/năm`);
    }
    rows.push('');
    rows.push(`Tổng bảo trì/năm: ${plan.formattedTotal}`);
    return rows.join('\n');
  }
}
