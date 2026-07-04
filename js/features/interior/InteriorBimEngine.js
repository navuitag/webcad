/**
 * InteriorBimEngine — BIM-lite: Object → Material → Supplier → Price → Lifecycle (SDD §15, Phase 4)
 */
class InteriorBimEngine {
  static INSTALL_NOTES = {
    floor: 'Keo dán + cân bằng mặt bằng, expansion gap 8mm',
    wall: 'Lót + 2 lớp sơn phủ, che phủ 10–12 m²/lít',
    ceiling: 'Khung thạch cao + bả, mối nối band tape',
    furniture: 'Lắp ráp tại chỗ, neo tường nếu cao > 1.8m',
    lighting: 'Đi dây theo tiêu chuẩn TCVN, cầu dao riêng',
    textile: 'Treo rail inox, khoảng cách sàn 2cm',
    plant: 'Đặt khay thoát nước, ánh sáng gián tiếp'
  };

  static buildRecord(entity, app) {
    const assetId = entity.interiorAssetId || entity.blockTemplateId;
    const matId = entity.interiorMaterialId;
    const asset = assetId ? InteriorAssetManager.get(assetId) : null;
    const material = matId ? InteriorMaterialLibrary.get(matId) : null;
    const supplier = InteriorSupplierLibrary.match(material, asset);
    const bb = entity.getBoundingBox?.();
    const wu = app?.drawing?.worldUnit || 'm';

    let qty = 1;
    let unit = 'cái';
    let unitPrice = asset?.price || 0;
    if (material && bb && (entity.archType === 'room-fill' || entity.planRole === 'room-floor')) {
      const w = bb.maxX - bb.minX;
      const h = bb.maxY - bb.minY;
      const sideMm = Math.sqrt(w * h) * (UnitEngine.UNITS[wu]?.toMm || 1);
      qty = (sideMm / 1000) ** 2;
      unit = 'm²';
      unitPrice = material.pricePerM2 || 0;
    }

    const totalPrice = Math.round(unitPrice * qty);
    const lifecycle = InteriorLifecycleEngine.forEntity(entity, asset, material);
    const maintenance = InteriorMaintenanceEngine.forEntity(entity, asset, material);
    if (material && qty > 1) {
      maintenance.annualCost = Math.round(maintenance.costPerVisit * maintenance.visitsPerYear * qty);
    }

    const installKey = material?.category || asset?.category || 'furniture';
    const construction = {
      phase: lifecycle.stage === 'installation' ? 'Thi công hoàn thiện' : 'Vận hành',
      spec: material?.name || asset?.name || entity.type,
      standard: 'TCVN nội thất & PCCC cơ bản',
      installMethod: InteriorBimEngine.INSTALL_NOTES[installKey] || InteriorBimEngine.INSTALL_NOTES.furniture
    };

    return {
      id: entity.id,
      object: {
        name: asset?.name || material?.name || entity.type,
        type: entity.type,
        category: asset?.category || material?.category || entity.archType || 'object',
        assetId,
        materialId: matId,
        brand: asset?.brand || supplier?.name,
        model: asset?.model || matId || entity.id?.slice(0, 8)
      },
      material: material ? {
        id: material.id,
        name: material.name,
        kind: material.kind,
        color: material.color,
        pricePerM2: material.pricePerM2
      } : null,
      supplier: supplier ? {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        location: supplier.location,
        leadDays: supplier.leadDays,
        warrantyPolicy: supplier.warrantyPolicy
      } : null,
      price: {
        unit,
        qty: unit === 'm²' ? qty.toFixed(1) : String(Math.round(qty)),
        unitPrice,
        total: totalPrice,
        currency: 'VND',
        formatted: InteriorEstimationEngine.formatVnd(totalPrice)
      },
      maintenance,
      lifecycle,
      installation: {
        method: construction.installMethod,
        hours: lifecycle.installHours * (unit === 'm²' ? qty : 1),
        notes: supplier?.warrantyPolicy || ''
      },
      construction
    };
  }

  static attachToEntity(entity, app) {
    const bim = InteriorBimEngine.buildRecord(entity, app);
    entity.bimData = bim;
    entity.bimId = bim.id;
    entity.bimSupplierId = bim.supplier?.id;
    return bim;
  }

  static scanDrawing(app) {
    let count = 0;
    for (const e of app.drawing.entities) {
      if (!e.interiorAssetId && !e.interiorMaterialId && e.archType !== 'room-fill' && e.planRole !== 'room-floor') continue;
      InteriorBimEngine.attachToEntity(e, app);
      count++;
    }
    app.drawing.metadata.bimScanAt = new Date().toISOString();
    app.drawing.metadata.bimCount = count;
    return {
      success: count > 0,
      count,
      message: count
        ? `BIM-lite: đã gắn metadata cho ${count} đối tượng (vật liệu, NCC, vòng đời, bảo trì).`
        : 'Không có đối tượng nội thất — trang trí phòng hoặc áp phong cách trước.'
    };
  }

  static exportJson(app) {
    const records = [];
    for (const e of app.drawing.entities) {
      if (e.bimData) records.push(e.bimData);
    }
    return JSON.stringify({
      project: app.drawing.name || 'Untitled',
      scannedAt: app.drawing.metadata.bimScanAt || new Date().toISOString(),
      style: app.drawing.metadata.interiorStyle,
      count: records.length,
      records
    }, null, 2);
  }

  static downloadBimJson(app) {
    const content = InteriorBimEngine.exportJson(app);
    const name = (app.drawing.name || 'bim').replace(/\s+/g, '_');
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_BIM.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, filename: `${name}_BIM.json`, message: `Đã tải ${name}_BIM.json` };
  }

  static formatEntitySummary(bim) {
    if (!bim) return '';
    const rows = [
      `── BIM-lite: ${bim.object?.name} ──`,
      `Vật liệu: ${bim.material?.name || '—'}`,
      `NCC: ${bim.supplier?.name || '—'} (${bim.supplier?.phone || ''})`,
      `Giá: ${bim.price?.formatted || '—'}`,
      `Bảo hành: ${bim.lifecycle?.warrantyYears || 0} năm (đến ${bim.lifecycle?.warrantyUntil || '—'})`,
      `Thay thế dự kiến: ${bim.lifecycle?.replacementDate || '—'}`,
      `Bảo trì: ${bim.maintenance?.task || '—'} (≈ ${InteriorEstimationEngine.formatVnd(bim.maintenance?.annualCost || 0)}/năm)`,
      `Lắp đặt: ${bim.installation?.method || '—'}`
    ];
    return rows.join('\n');
  }

  static patchJSON(entity, json) {
    if (entity.bimId) json.bimId = entity.bimId;
    if (entity.bimSupplierId) json.bimSupplierId = entity.bimSupplierId;
    if (entity.bimData) json.bimData = entity.bimData;
    return json;
  }

  static restoreTags(entity, data) {
    if (data.bimId) entity.bimId = data.bimId;
    if (data.bimSupplierId) entity.bimSupplierId = data.bimSupplierId;
    if (data.bimData) entity.bimData = data.bimData;
  }
}
