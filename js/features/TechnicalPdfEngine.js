/**
 * TechnicalPdfEngine — xuất hồ sơ PDF kỹ thuật
 */
class TechnicalPdfEngine {
  static export(app, options = {}) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) return { success: false, message: 'jsPDF not loaded' };

    const drawing = app.drawing;
    const name = drawing.name || 'Untitled';
    const qa = DrawingQaEngine.check(app);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Trang 1: Bìa / Title block
    pdf.setFontSize(18);
    pdf.text('HỒ SƠ BẢN VẼ KỸ THUẬT', 105, 30, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Dự án: ${name}`, 20, 50);
    pdf.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')}`, 20, 58);
    pdf.text(`Đơn vị: ${drawing.unit || 'mm'}`, 20, 66);
    pdf.text(`Tỷ lệ: 1:${drawing.scale || 1}`, 20, 74);
    pdf.text(`Số entity 2D: ${drawing.entities.length}`, 20, 82);
    pdf.text(`Số entity 3D: ${drawing.entities3D.length}`, 20, 90);

    pdf.setDrawColor(0);
    pdf.rect(15, 100, 180, 80);
    pdf.setFontSize(10);
    pdf.text('TITLE BLOCK', 20, 108);
    pdf.text(`Author: ${drawing.metadata?.author || '-'}`, 20, 118);
    pdf.text(`Modified: ${drawing.metadata?.modifiedAt?.slice(0, 10) || '-'}`, 20, 126);

    // Trang 2: Bản vẽ
    pdf.addPage('a4', 'landscape');
    pdf.setFontSize(14);
    pdf.text('BẢN VẼ', 148, 15, { align: 'center' });
    const imgData = app.canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 10, 25, 277, 180);

    // Trang 3: QA + Layers
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('KIỂM TRA & LAYER', 20, 20);
    pdf.setFontSize(9);
    let y = 30;
    const report = DrawingQaEngine.formatReport(qa).split('\n');
    for (const line of report) {
      pdf.text(line.substring(0, 90), 20, y);
      y += 6;
    }
    y += 10;
    pdf.text('DANH SÁCH LAYER:', 20, y);
    y += 8;
    for (const layer of app.layerManager.layers) {
      pdf.text(`• ${layer.name} (${layer.color}) ${layer.visible ? 'ON' : 'OFF'}`, 25, y);
      y += 6;
    }

    const filename = FormatRegistry.filename(FormatRegistry.baseName(name), 'pdf').replace('.pdf', '_hoso.pdf');
    pdf.save(filename);
    return { success: true, filename, pages: 3 };
  }
}
