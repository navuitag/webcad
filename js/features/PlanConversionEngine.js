/**
 * PlanConversionEngine — chuyển bản vẽ 2D thường sang ký hiệu mặt bằng (plan view)
 */
class PlanConversionEngine {
  static convert(app, options = {}) {
    const targets = options.selectionOnly
      ? app.selectionManager.getSelected()
      : app.drawing.entities;

    let converted = 0;
    let skipped = 0;

    for (const entity of targets) {
      if (ArchPlanStyle.convertEntity(entity, app.drawing.worldUnit || app.drawing.unit)) {
        converted++;
      } else {
        skipped++;
      }
    }

    if (converted) {
      app.drawing.metadata.modifiedAt = new Date().toISOString();
    }
    app.requestRender();
    if (converted) app.zoomExtents();

    return {
      success: converted > 0,
      converted,
      skipped,
      message: converted
        ? `Đã chuyển ${converted} đối tượng sang plan view.`
        : 'Không có đối tượng nào được chuyển (chọn hình kín hoặc kiến trúc).'
    };
  }
}
