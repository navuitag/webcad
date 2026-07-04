/**
 * InteriorAiDesigner — Prompt To Interior & AI Designer pipeline (SDD §12, Phase 3)
 */
class InteriorAiDesigner {
  static STYLE_IDS = ['indochine', 'japandi', 'scandinavian', 'minimalist', 'modern', 'tropical', 'wabi', 'luxury'];

  static normalize(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static isInteriorPrompt(input) {
    const s = InteriorAiDesigner.normalize(input);
    if (/(?:mat\s*bang|thua\s*dat)\s*\d/.test(s) && !/(?:thiet\s*ke|ngan\s*sach|budget|smart\s*decor|ai\s*design)/.test(s)) {
      return false;
    }
    return /(?:thiet\s*ke|ai\s*design|prompt\s*to\s*interior|homestay|can\s*ho|apartment|ngan\s*sach|budget|indochine|japandi|\d+\s*phong|\d+\s*m2|\d+\s*[x×]\s*\d+|cafe\s*san|ho\s*(ca\s*)?koi|smart\s*decor)/.test(s);
  }

  static parsePrompt(input) {
    const raw = (input || '').trim();
    const s = InteriorAiDesigner.normalize(raw);
    const brief = {
      raw,
      spaceType: 'apartment',
      styleId: 'modern',
      width: null,
      depth: null,
      areaM2: null,
      roomCount: null,
      bedrooms: null,
      budgetVnd: null,
      features: [],
      decorTemplateId: null,
      lightingId: null,
      generatePlan: false
    };

    for (const id of InteriorAiDesigner.STYLE_IDS) {
      if (s.includes(id)) { brief.styleId = id; break; }
    }

    if (/homestay|nha\s*nghi/.test(s)) brief.spaceType = 'homestay';
    else if (/khach\s*san|hotel/.test(s)) brief.spaceType = 'hotel';
    else if (/nha\s*hang|restaurant/.test(s)) brief.spaceType = 'restaurant';
    else if (/phong\s*tra|tea\s*house/.test(s)) brief.spaceType = 'teahouse';
    else if (/showroom|cua\s*hang/.test(s)) brief.spaceType = 'showroom';
    else if (/cafe|ca\s*phe|quán/.test(s)) brief.spaceType = 'cafe';
    else if (/can\s*ho|apartment/.test(s)) brief.spaceType = 'apartment';

    let m = s.match(/([\d.]+)\s*[x×]\s*([\d.]+)\s*m?/);
    if (m) {
      brief.width = parseFloat(m[1]);
      brief.depth = parseFloat(m[2]);
      brief.generatePlan = true;
    }

    m = s.match(/([\d.]+)\s*m2|([\d.]+)\s*m\s*2|dien\s*tich\s*([\d.]+)/);
    if (m) {
      brief.areaM2 = parseFloat(m[1] || m[2] || m[3]);
      if (!brief.width) brief.generatePlan = true;
    }

    m = s.match(/(\d+)\s*phong\s*ngu|(\d+)\s*pn\b|(\d+)\s*bedroom/);
    if (m) brief.bedrooms = parseInt(m[1] || m[2] || m[3], 10);

    m = s.match(/(\d+)\s*phong(?!\s*ngu)/);
    if (m) brief.roomCount = parseInt(m[1], 10);

    m = s.match(/([\d.]+)\s*(ty|tỷ|billion)\b/);
    if (m) brief.budgetVnd = parseFloat(m[1]) * 1e9;
    if (!brief.budgetVnd) {
      m = s.match(/([\d.]+)\s*(tr|trieu|triệu|million)\b/);
      if (m) {
        const n = parseFloat(m[1]);
        brief.budgetVnd = /million/.test(m[2]) ? n * 1e6 * 24000 : n * 1e6;
      }
    }

    if (/ho\s*ca\s*koi|koi/.test(s)) brief.features.push('koi');
    if (/ho\s*boi|pool|be\s*boi/.test(s)) brief.features.push('pool');
    if (/vuon|garden|san\s*vuon/.test(s)) brief.features.push('garden');
    if (/cafe\s*san|san\s*thuong|rooftop/.test(s)) brief.features.push('rooftop');

    if (!brief.width && brief.areaM2) {
      const ratio = brief.spaceType === 'homestay' ? 0.24 : 1.35;
      brief.depth = Math.sqrt(brief.areaM2 / ratio);
      brief.width = brief.areaM2 / brief.depth;
    }

    brief.decorTemplateId = InteriorAiDesigner._matchDecorTemplate(brief);
    const style = InteriorStyleEngine.get(brief.styleId);
    brief.lightingId = style.lightingPreset || InteriorLightingEngine._mapLegacy(style.lighting);

    return brief;
  }

  static _matchDecorTemplate(brief) {
    const list = InteriorDecorTemplates.list(brief.spaceType);
    const byStyle = list.find(t => t.styleId === brief.styleId);
    if (byStyle) return byStyle.id;
    if (list.length) return list[0].id;
    return null;
  }

  static _floorPreset(brief) {
    if (brief.roomCount && brief.roomCount > 6) return 'studio';
    if (brief.bedrooms === 1) return '1bed';
    if (brief.bedrooms === 0 || brief.spaceType === 'studio') return 'studio';
    if (brief.bedrooms >= 2) return '2bed';
    if (brief.spaceType === 'homestay' || brief.spaceType === 'hotel') return 'studio';
    return '2bed';
  }

  static _generateMultiRoomPlan(app, w, d, roomCount) {
    if (typeof ArchitecturalTemplates !== 'undefined') {
      ArchitecturalTemplates._drawSite(app, 0, 0, w, d);
    } else {
      app.cadCore.run('DRAW_RECTANGLE', { x1: 0, y1: 0, x2: w, y2: d });
    }
    const cols = roomCount <= 4 ? 2 : roomCount <= 9 ? 3 : roomCount <= 15 ? 5 : 6;
    const rows = Math.ceil(roomCount / cols);
    const margin = 0.4;
    const rw = (w - margin * 2) / cols;
    const rh = (d - margin * 2) / rows;
    let n = 0;
    for (let r = 0; r < rows && n < roomCount; r++) {
      for (let c = 0; c < cols && n < roomCount; c++) {
        n++;
        const x1 = margin + c * rw;
        const y1 = margin + r * rh;
        ArchDrawEngine.createRoom(app, x1, y1, x1 + rw - 0.15, y1 + rh - 0.15, { name: `P.${n}` });
      }
    }
    AutoDimensionEngine.dimensionAll(app);
    return n;
  }

  static _siteBounds(app) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of app.drawing.entities) {
      const bb = e.getBoundingBox?.();
      if (!bb) continue;
      minX = Math.min(minX, bb.minX);
      minY = Math.min(minY, bb.minY);
      maxX = Math.max(maxX, bb.maxX);
      maxY = Math.max(maxY, bb.maxY);
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 12, maxY: 10, w: 12, h: 10 };
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }

  static _addLandscape(app, brief) {
    const site = InteriorAiDesigner._siteBounds(app);
    const placed = [];
    const ox = site.minX;
    const oy = site.minY;

    if (brief.features.includes('pool')) {
      BlockLibrary.insert(app, 'pool-rect', { x: ox + Math.max(0, site.w - 5), y: oy + 0.5 });
      placed.push('Hồ bơi');
    }
    if (brief.features.includes('koi')) {
      BlockLibrary.insert(app, 'pool-round', { x: ox + 0.5, y: oy + Math.max(0, site.h - 5) });
      placed.push('Hồ cá Koi');
    }
    if (brief.features.includes('garden')) {
      BlockLibrary.insert(app, 'lawn-patch', { x: ox, y: oy });
      BlockLibrary.insert(app, 'flower-bed', { x: ox + 2.2, y: oy + 0.3 });
      BlockLibrary.insert(app, 'bush-round', { x: ox + site.w - 1.5, y: oy + 0.5 });
      placed.push('Vườn & cảnh quan');
    }
    if (brief.features.includes('rooftop')) {
      BlockLibrary.insert(app, 'outdoor-table', { x: ox + site.w * 0.55, y: oy + site.h * 0.65 });
      BlockLibrary.insert(app, 'pergola', { x: ox + site.w * 0.45, y: oy + site.h * 0.55 });
      placed.push('Cafe sân thượng');
    }
    return placed;
  }

  static _budgetNote(brief, estimate) {
    if (!brief.budgetVnd) return '';
    const diff = brief.budgetVnd - estimate.total;
    if (diff >= 0) {
      return `\n✓ Trong ngân sách (dư ${InteriorEstimationEngine.formatVnd(diff)})`;
    }
    return `\n⚠ Vượt ngân sách ${InteriorEstimationEngine.formatVnd(-diff)}`;
  }

  static designFromPrompt(app, input) {
    const brief = InteriorAiDesigner.parsePrompt(input);
    const steps = [];

    if (brief.generatePlan && brief.width && brief.depth) {
      if (brief.roomCount && brief.roomCount > 4) {
        const n = InteriorAiDesigner._generateMultiRoomPlan(app, brief.width, brief.depth, brief.roomCount);
        steps.push(`Mặt bằng ${brief.width}×${brief.depth}m (${n} phòng)`);
      } else {
        const preset = InteriorAiDesigner._floorPreset(brief);
        FloorPlanGenerator.generate(app, brief.width, brief.depth, preset);
        steps.push(`Mặt bằng ${brief.width}×${brief.depth}m (${preset})`);
      }
      PlanConversionEngine.convert(app);
    }

    let placed = 0;
    if (brief.decorTemplateId && brief.generatePlan) {
      const tpl = InteriorDecorTemplates.apply(app, brief.decorTemplateId);
      placed = tpl.placed || 0;
      brief.styleId = tpl.style || brief.styleId;
      steps.push('Vật liệu & phong cách');
      steps.push('Nội thất & trang trí');
    } else {
      const rooms = InteriorEngine.detectRooms(app);
      if (!rooms.length && brief.width && brief.depth) {
        const preset = InteriorAiDesigner._floorPreset(brief);
        FloorPlanGenerator.generate(app, brief.width, brief.depth, preset);
        PlanConversionEngine.convert(app);
        steps.push('Mặt bằng');
      }

      InteriorSceneGenerator.applyStyle(app, brief.styleId);
      steps.push('Vật liệu & bảng màu');

      const fr = InteriorSceneGenerator.furnishAll(app, brief.styleId);
      placed = fr.placed || 0;
      steps.push('Bố trí nội thất');

      for (const room of InteriorEngine.detectRooms(app)) {
        placed += InteriorSceneGenerator.applyDecorations(app, room, brief.styleId);
      }
      steps.push('Trang trí (rèm, cây, thảm)');
    }

    InteriorLightingEngine.apply(app, brief.lightingId);
    steps.push(`Ánh sáng (${InteriorLightingEngine.get(brief.lightingId).name})`);

    const landscape = InteriorAiDesigner._addLandscape(app, brief);
    if (landscape.length) steps.push(`Cảnh quan: ${landscape.join(', ')}`);

    app.drawing.metadata.interiorAiBrief = brief;
    app.drawing.metadata.interiorStyle = brief.styleId;
    app.requestRender();
    if (typeof app.zoomExtents === 'function') app.zoomExtents();

    const estimate = InteriorEstimationEngine.estimate(app, brief.styleId);
    steps.push('BOQ & chi phí');

    const styleName = InteriorStyleEngine.get(brief.styleId).name;
    const pipeline = steps.join(' → ');
    const report = InteriorEstimationEngine.formatReport(estimate);
    const budget = InteriorAiDesigner._budgetNote(brief, estimate);

    return {
      handled: true,
      success: true,
      brief,
      steps,
      placed,
      estimate,
      styleId: brief.styleId,
      message: `AI Designer (${styleName}): ${pipeline}\n${placed} chi tiết nội thất.\n${estimate.message}${budget}\n\n${report}`
    };
  }

  static smartDecorator(app, input) {
    const brief = InteriorAiDesigner.parsePrompt(input);
    if (!brief.areaM2 && !brief.width) brief.areaM2 = 65;
    if (brief.bedrooms == null) brief.bedrooms = 2;
    if (brief.styleId === 'modern' && !InteriorAiDesigner.normalize(input).includes('modern')) {
      brief.styleId = 'japandi';
    }
    brief.spaceType = brief.spaceType || 'apartment';
    if (!brief.width && brief.areaM2) {
      brief.depth = Math.sqrt(brief.areaM2 / 1.35);
      brief.width = brief.areaM2 / brief.depth;
      brief.generatePlan = true;
    }

    const roomsBefore = InteriorEngine.detectRooms(app).length;
    const result = InteriorAiDesigner.designFromPrompt(app, input || `Apartment ${brief.areaM2}m2 ${brief.bedrooms} phong ngu ${brief.styleId}`);
    result.message = `Smart Decorator: ${brief.areaM2 || Math.round(brief.width * brief.depth)}m², ${brief.bedrooms} PN, ${InteriorStyleEngine.get(brief.styleId).name}.\n` +
      (roomsBefore ? '' : `Đã tạo mặt bằng ${brief.width?.toFixed(1)}×${brief.depth?.toFixed(1)}m.\n`) +
      result.message.replace(/^AI Designer[^:]*:\s*/, '');
    return result;
  }
}
