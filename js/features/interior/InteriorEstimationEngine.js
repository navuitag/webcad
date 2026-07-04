/**
 * InteriorEstimationEngine — ước tính chi phí nội thất (SDD §14)
 */
class InteriorEstimationEngine {
  static estimate(app, styleId) {
    const style = InteriorStyleEngine.get(styleId || app.drawing.metadata?.interiorStyle || 'modern');
    const wu = app.drawing.worldUnit || app.drawing.unit || 'm';
    const toM2 = (areaWorld) => {
      const sideMm = Math.sqrt(areaWorld) * (UnitEngine.UNITS[wu]?.toMm || 1);
      return (sideMm / 1000) ** 2;
    };

    const lines = [];
    let total = 0;
    const rooms = InteriorEngine.detectRooms(app);

    for (const room of rooms) {
      const areaM2 = toM2(room.area);
      const floorMat = InteriorMaterialLibrary.get(style.materials.floor);
      const wallMat = InteriorMaterialLibrary.get(style.materials.wall);
      const ceilMat = InteriorMaterialLibrary.get(style.materials.ceiling);

      if (floorMat) {
        const c = areaM2 * floorMat.pricePerM2;
        total += c;
        lines.push({ category: 'Sàn', item: `${room.name} — ${floorMat.name}`, qty: areaM2.toFixed(1) + ' m²', cost: c });
      }

      const perimeter = 2 * (room.width + room.height);
      const perimeterM = UnitEngine.toDisplay(perimeter, wu, 'm');
      const wallAreaM2 = perimeterM * 2.8;
      if (wallMat) {
        const c = wallAreaM2 * wallMat.pricePerM2;
        total += c;
        lines.push({ category: 'Tường', item: `${room.name} — ${wallMat.name}`, qty: wallAreaM2.toFixed(1) + ' m²', cost: c });
      }

      if (ceilMat) {
        const c = areaM2 * ceilMat.pricePerM2;
        total += c;
        lines.push({ category: 'Trần', item: `${room.name} — ${ceilMat.name}`, qty: areaM2.toFixed(1) + ' m²', cost: c });
      }
    }

    const assetCounts = new Map();
    for (const e of app.drawing.entities) {
      if (!e.interiorAssetId) continue;
      assetCounts.set(e.interiorAssetId, (assetCounts.get(e.interiorAssetId) || 0) + 1);
    }

    for (const [id, qty] of assetCounts) {
      const asset = InteriorAssetManager.get(id);
      if (!asset) continue;
      const c = asset.price * qty;
      total += c;
      lines.push({ category: 'Nội thất', item: asset.name, qty: String(qty), cost: c });
    }

    return {
      success: true,
      style: style.name,
      total,
      lines,
      currency: 'VND',
      formattedTotal: InteriorEstimationEngine.formatVnd(total),
      message: `Tổng ước tính: ${InteriorEstimationEngine.formatVnd(total)} (${lines.length} hạng mục)`
    };
  }

  static formatVnd(n) {
    return Math.round(n).toLocaleString('vi-VN') + ' ₫';
  }

  static formatReport(result) {
    if (!result.lines?.length) return 'Chưa có dữ liệu ước tính.';
    const rows = result.lines.map(l =>
      `[${l.category}] ${l.item} × ${l.qty} = ${InteriorEstimationEngine.formatVnd(l.cost)}`
    );
    rows.push('', `Phong cách: ${result.style}`, `TỔNG: ${result.formattedTotal}`);
    return rows.join('\n');
  }
}
