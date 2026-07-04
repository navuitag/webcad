/**
 * InteriorEstimationEngine — BOQ & ước tính chi phí (SDD §14, Phase 2)
 */
class InteriorEstimationEngine {
  static LABOR_RATE = 0.15;
  static PAINT_WASTE = 1.1;
  static LIGHTING_UNIT_PRICE = 850000;

  static estimate(app, styleId) {
    const style = InteriorStyleEngine.get(styleId || app.drawing.metadata?.interiorStyle || 'modern');
    const wu = app.drawing.worldUnit || app.drawing.unit || 'm';
    const toM2 = (areaWorld) => {
      const sideMm = Math.sqrt(areaWorld) * (UnitEngine.UNITS[wu]?.toMm || 1);
      return (sideMm / 1000) ** 2;
    };

    const sections = { materials: [], furniture: [], decor: [], lighting: [], labor: [] };
    const lines = [];
    let subtotal = 0;
    const rooms = InteriorEngine.detectRooms(app);

    for (const room of rooms) {
      const areaM2 = toM2(room.area);
      const floorMat = InteriorMaterialLibrary.get(style.materials.floor);
      const wallMat = InteriorMaterialLibrary.get(style.materials.wall);
      const ceilMat = InteriorMaterialLibrary.get(style.materials.ceiling);

      if (floorMat) {
        const c = areaM2 * floorMat.pricePerM2;
        subtotal += c;
        const line = { section: 'materials', category: 'Sàn', item: `${room.name} — ${floorMat.name}`, qty: areaM2.toFixed(1) + ' m²', unit: 'm²', cost: c };
        lines.push(line);
        sections.materials.push(line);
      }

      const perimeter = 2 * (room.width + room.height);
      const perimeterM = UnitEngine.toDisplay(perimeter, wu, 'm');
      const wallAreaM2 = perimeterM * 2.8 * InteriorEstimationEngine.PAINT_WASTE;
      if (wallMat) {
        const c = wallAreaM2 * wallMat.pricePerM2;
        subtotal += c;
        const line = { section: 'materials', category: 'Tường/Sơn', item: `${room.name} — ${wallMat.name}`, qty: wallAreaM2.toFixed(1) + ' m²', unit: 'm²', cost: c };
        lines.push(line);
        sections.materials.push(line);
      }

      if (ceilMat) {
        const c = areaM2 * ceilMat.pricePerM2;
        subtotal += c;
        const line = { section: 'materials', category: 'Trần', item: `${room.name} — ${ceilMat.name}`, qty: areaM2.toFixed(1) + ' m²', unit: 'm²', cost: c };
        lines.push(line);
        sections.materials.push(line);
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
      subtotal += c;
      const isDecor = ['textile', 'art', 'plant', 'lighting', 'mirror'].includes(asset.category);
      const isLight = asset.category === 'lighting';
      const section = isLight ? 'lighting' : isDecor ? 'decor' : 'furniture';
      const cat = isLight ? 'Đèn' : isDecor ? 'Trang trí' : 'Nội thất';
      const line = { section, category: cat, item: asset.name, qty: String(qty), unit: 'cái', cost: c };
      lines.push(line);
      sections[section].push(line);
    }

    const laborCost = subtotal * InteriorEstimationEngine.LABOR_RATE;
    if (laborCost > 0) {
      const line = { section: 'labor', category: 'Nhân công', item: 'Lắp đặt & thi công (15%)', qty: '1', unit: 'gói', cost: laborCost };
      lines.push(line);
      sections.labor.push(line);
    }

    const total = subtotal + laborCost;
    return {
      success: true,
      style: style.name,
      subtotal,
      laborCost,
      total,
      lines,
      sections,
      currency: 'VND',
      formattedTotal: InteriorEstimationEngine.formatVnd(total),
      formattedSubtotal: InteriorEstimationEngine.formatVnd(subtotal),
      message: `BOQ: ${InteriorEstimationEngine.formatVnd(total)} (${lines.length} hạng mục, gồm nhân công 15%)`
    };
  }

  static formatVnd(n) {
    return Math.round(n).toLocaleString('vi-VN') + ' ₫';
  }

  static formatReport(result) {
    if (!result.lines?.length) return 'Chưa có dữ liệu ước tính.';
    const rows = [];
    const sectionLabels = { materials: '── Vật liệu ──', furniture: '── Nội thất ──', decor: '── Trang trí ──', lighting: '── Đèn ──', labor: '── Nhân công ──' };
    for (const key of ['materials', 'furniture', 'decor', 'lighting', 'labor']) {
      const items = result.sections?.[key] || [];
      if (!items.length) continue;
      rows.push(sectionLabels[key]);
      for (const l of items) {
        rows.push(`  ${l.item} × ${l.qty} = ${InteriorEstimationEngine.formatVnd(l.cost)}`);
      }
      rows.push('');
    }
    rows.push(`Phong cách: ${result.style}`);
    rows.push(`Vật liệu + NT: ${result.formattedSubtotal || InteriorEstimationEngine.formatVnd(result.subtotal)}`);
    if (result.laborCost) rows.push(`Nhân công: ${InteriorEstimationEngine.formatVnd(result.laborCost)}`);
    rows.push(`TỔNG BOQ: ${result.formattedTotal}`);
    return rows.join('\n');
  }

  static toBoqJson(result, app) {
    return JSON.stringify({
      project: app.drawing.name || 'Untitled',
      date: new Date().toISOString(),
      style: result.style,
      currency: result.currency,
      subtotal: result.subtotal,
      laborCost: result.laborCost,
      total: result.total,
      lines: result.lines
    }, null, 2);
  }

  static toBoqCsv(result) {
    const header = 'Section,Category,Item,Qty,Unit,Cost(VND)\n';
    const rows = result.lines.map(l =>
      `"${l.section}","${l.category}","${l.item}","${l.qty}","${l.unit || ''}",${Math.round(l.cost)}`
    );
    return header + rows.join('\n');
  }

  static downloadBoq(app, styleId, format = 'csv') {
    const result = InteriorEstimationEngine.estimate(app, styleId);
    const name = (app.drawing.name || 'boq').replace(/\s+/g, '_');
    let content, mime, ext;
    if (format === 'json') {
      content = InteriorEstimationEngine.toBoqJson(result, app);
      mime = 'application/json';
      ext = 'json';
    } else {
      content = InteriorEstimationEngine.toBoqCsv(result);
      mime = 'text/csv;charset=utf-8';
      ext = 'csv';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_BOQ.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, filename: `${name}_BOQ.${ext}`, message: `Đã tải ${name}_BOQ.${ext}` };
  }
}
