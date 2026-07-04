/**
 * InteriorBoqEngine — BOQ nâng cao, báo giá & cost sheet (SDD §14–15, Phase 4)
 */
class InteriorBoqEngine {
  static build(app, styleId) {
    InteriorBimEngine.scanDrawing(app);
    const base = InteriorEstimationEngine.estimate(app, styleId);
    const enriched = [];
    const supplierTotals = new Map();

    for (const line of base.lines) {
      const el = InteriorBoqEngine._enrichLine(line, app);
      enriched.push(el);
      if (el.supplierId) {
        supplierTotals.set(el.supplierId, (supplierTotals.get(el.supplierId) || 0) + el.cost);
      }
    }

    const maintenance = InteriorMaintenanceEngine.annualPlan(app);
    const lifecycle = InteriorLifecycleEngine.projectReport(app);
    const suppliers = [...supplierTotals.entries()].map(([id, total]) => ({
      ...InteriorSupplierLibrary.get(id),
      total,
      formattedTotal: InteriorEstimationEngine.formatVnd(total)
    })).sort((a, b) => b.total - a.total);

    const installCost = enriched.reduce((s, l) => s + (l.installCost || 0), 0);
    const grandTotal = base.total + installCost;

    return {
      ...base,
      lines: enriched,
      installCost,
      grandTotal,
      formattedGrandTotal: InteriorEstimationEngine.formatVnd(grandTotal),
      suppliers,
      maintenance,
      lifecycle,
      quotation: {
        number: 'BG-' + Date.now().toString(36).toUpperCase(),
        date: new Date().toLocaleDateString('vi-VN'),
        validDays: 30
      },
      message: `BOQ nâng cao: ${InteriorEstimationEngine.formatVnd(grandTotal)} (${enriched.length} hạng mục, ${suppliers.length} NCC, bảo trì/năm ${maintenance.formattedTotal || '0 ₫'})`
    };
  }

  static _enrichLine(line, app) {
    const el = { ...line, supplier: '—', supplierId: null, sku: '—', warranty: '—', installCost: 0, leadDays: '—' };

    for (const e of app.drawing.entities) {
      if (!e.bimData) continue;
      const bim = e.bimData;
      const matchName = line.item.includes(bim.object?.name) || line.item.includes(bim.material?.name);
      if (!matchName && line.section !== 'materials') continue;
      if (line.section === 'materials' && !bim.material) continue;
      if (['furniture', 'decor', 'lighting'].includes(line.section) && !bim.object?.assetId) continue;

      el.supplier = bim.supplier?.name || '—';
      el.supplierId = bim.supplier?.id;
      el.sku = bim.object?.model || bim.material?.id || '—';
      el.warranty = bim.lifecycle?.warrantyYears ? `${bim.lifecycle.warrantyYears} năm` : '—';
      el.leadDays = bim.supplier?.leadDays ? `${bim.supplier.leadDays} ngày` : '—';
      el.installCost = Math.round((bim.installation?.hours || 0) * 150000);
      break;
    }

    if (line.section === 'labor') {
      const sup = InteriorSupplierLibrary.get('tho-thi-cong');
      el.supplier = sup.name;
      el.supplierId = sup.id;
      el.warranty = '12 tháng thi công';
    }

    return el;
  }

  static formatReport(result) {
    const rows = [];
    const sectionLabels = {
      materials: '── Vật liệu ──',
      furniture: '── Nội thất ──',
      decor: '── Trang trí ──',
      lighting: '── Đèn ──',
      labor: '── Nhân công ──'
    };
    for (const key of ['materials', 'furniture', 'decor', 'lighting', 'labor']) {
      const items = result.lines?.filter(l => l.section === key) || [];
      if (!items.length) continue;
      rows.push(sectionLabels[key]);
      for (const l of items) {
        rows.push(`  ${l.item} × ${l.qty}`);
        rows.push(`    NCC: ${l.supplier} | BH: ${l.warranty} | Giao: ${l.leadDays} | ${InteriorEstimationEngine.formatVnd(l.cost)}`);
      }
      rows.push('');
    }
    if (result.suppliers?.length) {
      rows.push('── Nhà cung cấp ──');
      for (const s of result.suppliers) {
        rows.push(`  ${s.name}: ${s.formattedTotal}`);
      }
      rows.push('');
    }
    rows.push(`Phong cách: ${result.style}`);
    rows.push(`Vật liệu + NT: ${result.formattedSubtotal}`);
    if (result.laborCost) rows.push(`Nhân công: ${InteriorEstimationEngine.formatVnd(result.laborCost)}`);
    if (result.installCost) rows.push(`Lắp đặt: ${InteriorEstimationEngine.formatVnd(result.installCost)}`);
    rows.push(`TỔNG BOQ: ${result.formattedGrandTotal || result.formattedTotal}`);
    if (result.maintenance?.formattedTotal) {
      rows.push(`Bảo trì hàng năm: ${result.maintenance.formattedTotal}`);
    }
    return rows.join('\n');
  }

  static toBoqCsv(result) {
    const header = 'Section,Category,Item,Qty,Unit,Supplier,SKU,Warranty,LeadDays,Cost(VND),Install(VND)\n';
    const rows = result.lines.map(l =>
      `"${l.section}","${l.category}","${l.item}","${l.qty}","${l.unit || ''}","${l.supplier || ''}","${l.sku || ''}","${l.warranty || ''}","${l.leadDays || ''}",${Math.round(l.cost)},${l.installCost || 0}`
    );
    return header + rows.join('\n');
  }

  static toQuotationJson(result, app) {
    return JSON.stringify({
      quotation: result.quotation,
      project: app.drawing.name || 'Untitled',
      style: result.style,
      currency: result.currency,
      subtotal: result.subtotal,
      laborCost: result.laborCost,
      installCost: result.installCost,
      total: result.grandTotal || result.total,
      annualMaintenance: result.maintenance?.totalAnnual,
      suppliers: result.suppliers,
      lines: result.lines
    }, null, 2);
  }

  static downloadBoq(app, styleId, format = 'csv') {
    const result = InteriorBoqEngine.build(app, styleId);
    const name = (app.drawing.name || 'boq').replace(/\s+/g, '_');
    let content, mime, ext;
    if (format === 'json') {
      content = InteriorBoqEngine.toQuotationJson(result, app);
      mime = 'application/json';
      ext = 'json';
    } else {
      content = InteriorBoqEngine.toBoqCsv(result);
      mime = 'text/csv;charset=utf-8';
      ext = 'csv';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_BOQ_Phase4.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, filename: `${name}_BOQ_Phase4.${ext}`, message: `Đã tải ${name}_BOQ_Phase4.${ext}`, result };
  }

  static downloadQuotationPdf(app, styleId) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) return { success: false, message: 'jsPDF chưa tải — không xuất PDF được.' };

    const result = InteriorBoqEngine.build(app, styleId);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const project = app.drawing.name || 'Untitled';
    const q = result.quotation;

    pdf.setFontSize(16);
    pdf.text('BÁO GIÁ NỘI THẤT', 105, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`Số: ${q.number}`, 20, 32);
    pdf.text(`Dự án: ${project}`, 20, 38);
    pdf.text(`Ngày: ${q.date}`, 20, 44);
    pdf.text(`Phong cách: ${result.style}`, 20, 50);
    pdf.text(`Hiệu lực: ${q.validDays} ngày`, 20, 56);

    let y = 66;
    pdf.setFontSize(9);
    pdf.text('Hạng mục', 20, y);
    pdf.text('SL', 100, y);
    pdf.text('NCC', 115, y);
    pdf.text('Thành tiền', 165, y);
    y += 4;
    pdf.line(20, y, 190, y);
    y += 5;

    for (const l of result.lines.slice(0, 28)) {
      if (y > 270) { pdf.addPage(); y = 20; }
      const item = l.item.length > 42 ? l.item.slice(0, 39) + '…' : l.item;
      pdf.text(item, 20, y);
      pdf.text(String(l.qty).slice(0, 8), 100, y);
      pdf.text((l.supplier || '—').slice(0, 18), 115, y);
      pdf.text(InteriorEstimationEngine.formatVnd(l.cost), 165, y);
      y += 5;
    }

    y += 4;
    pdf.line(20, y, 190, y);
    y += 6;
    pdf.text(`Vật liệu + nội thất: ${result.formattedSubtotal}`, 20, y); y += 5;
    pdf.text(`Nhân công: ${InteriorEstimationEngine.formatVnd(result.laborCost)}`, 20, y); y += 5;
    if (result.installCost) {
      pdf.text(`Lắp đặt: ${InteriorEstimationEngine.formatVnd(result.installCost)}`, 20, y); y += 5;
    }
    pdf.setFontSize(11);
    pdf.text(`TỔNG: ${result.formattedGrandTotal || result.formattedTotal}`, 20, y + 2);
    y += 8;
    pdf.setFontSize(9);
    if (result.maintenance?.formattedTotal) {
      pdf.text(`Bảo trì dự kiến/năm: ${result.maintenance.formattedTotal}`, 20, y);
    }

    const filename = `${project.replace(/\s+/g, '_')}_BaoGia.pdf`;
    pdf.save(filename);
    return { success: true, filename, message: `Đã tải báo giá ${filename}`, result };
  }
}
