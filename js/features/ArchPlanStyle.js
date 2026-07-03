/**
 * ArchPlanStyle — ký hiệu mặt bằng (mặt cắt ngang nhìn từ trên)
 */
class ArchPlanStyle {
  static COLORS = {
    wall: '#37474f',
    wallCut: '#455a64',
    column: '#263238',
    columnFill: '#546e7a',
    floor: '#66bb6a',
    ceiling: '#ab47bc',
    openWall: '#78909c',
    roomFloor: '#eceff1',
    furniture: '#8d6e63',
    furnitureFill: '#6d4c41',
    lawn: '#43a047',
    garden: '#7cb342',
    water: '#29b6f6',
    pool: '#0288d1',
    path: '#bdbdbd',
    paving: '#9e9e9e',
    sand: '#ffd54f',
    deck: '#8d6e63',
    flower: '#ec407a',
    tree: '#2e7d32',
    symbol: '#b0bec5',
    outline: '#cfd8dc'
  };

  static mark(entity, role, opts = {}) {
    entity.planView = true;
    entity.planRole = role;
    if (opts.color != null) entity.style.color = opts.color;
    if (opts.lineWidth != null) entity.style.lineWidth = opts.lineWidth;
    if (opts.lineDash != null) entity.style.lineDash = opts.lineDash;
    if (opts.pattern != null) entity.pattern = opts.pattern;
    if (opts.fillOpacity != null) entity.planFillOpacity = opts.fillOpacity;
    if (opts.scale != null) entity.scale = opts.scale;
    return entity;
  }

  static styleBlockEntity(entity, templateId) {
    const tpl = BlockLibrary.templates[templateId];
    const cat = tpl?.category || 'furniture';
    entity.planView = true;
    entity.blockTemplateId = templateId;

    if (entity.type === 'HATCH') {
      if (cat === 'landscape') {
        const water = templateId?.includes('pool');
        ArchPlanStyle.mark(entity, water ? 'landscape-water' : 'landscape-fill', {
          color: water ? ArchPlanStyle.COLORS.pool : ArchPlanStyle.COLORS.lawn,
          fillOpacity: water ? 0.5 : 0.4
        });
        return entity;
      }
      const role = cat === 'house' ? 'wall' : 'furniture-fill';
      ArchPlanStyle.mark(entity, role, {
        color: role === 'wall' ? ArchPlanStyle.COLORS.wallCut : ArchPlanStyle.COLORS.furnitureFill,
        fillOpacity: role === 'wall' ? 0.92 : 0.4
      });
      return entity;
    }

    if (entity.type === 'RECTANGLE') {
      if (cat === 'landscape') {
        const kind = templateId?.includes('pool') ? 'landscape-water'
          : templateId?.includes('path') || templateId?.includes('paving') ? 'landscape-path'
          : templateId?.includes('flower') ? 'landscape-flower'
          : 'landscape-fill';
        const color = kind === 'landscape-water' ? ArchPlanStyle.COLORS.pool
          : kind === 'landscape-path' ? ArchPlanStyle.COLORS.path
          : kind === 'landscape-flower' ? ArchPlanStyle.COLORS.flower
          : ArchPlanStyle.COLORS.lawn;
        ArchPlanStyle.mark(entity, kind, { color, fillOpacity: 0.45, lineWidth: 1 });
        return entity;
      }
      const isWall = templateId === 'wall-segment' || cat === 'house';
      ArchPlanStyle.mark(entity, isWall ? 'wall' : 'furniture-fill', {
        color: isWall ? ArchPlanStyle.COLORS.wallCut : ArchPlanStyle.COLORS.furnitureFill,
        fillOpacity: isWall ? 0.92 : 0.35,
        lineWidth: isWall ? 1 : 1
      });
      return entity;
    }

    if (entity.type === 'CIRCLE') {
      if (cat === 'landscape') {
        const water = templateId?.includes('pool') || templateId?.includes('fountain');
        ArchPlanStyle.mark(entity, water ? 'landscape-water' : 'landscape-tree', {
          color: water ? ArchPlanStyle.COLORS.pool : ArchPlanStyle.COLORS.tree,
          fillOpacity: water ? 0.45 : 0.55,
          lineWidth: 1.5
        });
        return entity;
      }
      const filled = templateId?.includes('column') || entity.radius > 15;
      ArchPlanStyle.mark(entity, filled ? 'column' : 'symbol', {
        color: filled ? ArchPlanStyle.COLORS.columnFill : ArchPlanStyle.COLORS.symbol,
        fillOpacity: filled ? 0.9 : 0,
        lineWidth: 1.5
      });
      return entity;
    }

    ArchPlanStyle.mark(entity, 'symbol', {
      color: ArchPlanStyle.COLORS.symbol,
      lineWidth: 1
    });
    return entity;
  }

  static fillOpacity(entity) {
    if (entity.planFillOpacity != null) return entity.planFillOpacity;
    switch (entity.planRole) {
      case 'wall':
      case 'column':
        return 0.92;
      case 'floor':
        return 0.2;
      case 'ceiling':
        return 0.18;
      case 'room-floor':
        return 0.12;
      case 'furniture-fill':
        return 0.38;
      case 'landscape-fill':
      case 'landscape-tree':
        return 0.45;
      case 'landscape-water':
        return 0.5;
      case 'landscape-path':
        return 0.55;
      case 'landscape-flower':
        return 0.35;
      default:
        return 0.35;
    }
  }

  static drawRectFill(entity, ctx, p1, p2, layerManager) {
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    const color = entity.getColor(layerManager);
    const opacity = ArchPlanStyle.fillOpacity(entity);
    if (opacity > 0) {
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = entity.planRole === 'wall' ? ArchPlanStyle.COLORS.column : color;
    ctx.lineWidth = entity.style.lineWidth || 1;
    if (entity.style.lineDash?.length) ctx.setLineDash(entity.style.lineDash);
    else ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);
  }

  static drawCircleFill(entity, ctx, sc, sr, layerManager) {
    const color = entity.getColor(layerManager);
    const opacity = ArchPlanStyle.fillOpacity(entity);
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sr, 0, Math.PI * 2);
    if (opacity > 0) {
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = entity.planRole === 'column' ? ArchPlanStyle.COLORS.column : color;
    ctx.lineWidth = entity.style.lineWidth || 1.5;
    if (entity.style.lineDash?.length) ctx.setLineDash(entity.style.lineDash);
    else ctx.setLineDash([]);
    ctx.stroke();
  }
}
