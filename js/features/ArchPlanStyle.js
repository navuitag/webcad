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

  /** Chuyển entity 2D thường sang ký hiệu mặt bằng */
  static convertEntity(entity, worldUnit = 'm') {
    if (entity.type === 'TEXT' || entity.type === 'DIMENSION') return false;

    if (entity.archLabel) {
      entity.planView = true;
      return true;
    }

    if (entity.archType || entity.landscapeKind) {
      return ArchPlanStyle._convertArchEntity(entity);
    }

    if (entity.planView && entity.planRole) return false;

    const scale = worldUnit === 'mm' ? 1000 : (worldUnit === 'cm' ? 100 : 1);
    const wallThick = 0.3 * scale;

    switch (entity.type) {
      case 'HATCH':
        ArchPlanStyle.mark(entity, 'furniture-fill', {
          color: ArchPlanStyle.COLORS.furnitureFill,
          fillOpacity: 0.35
        });
        return true;
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        const w = bb.maxX - bb.minX;
        const h = bb.maxY - bb.minY;
        const thin = Math.min(w, h) < wallThick && Math.max(w, h) > Math.min(w, h) * 3;
        ArchPlanStyle.mark(entity, thin ? 'wall' : 'furniture-fill', {
          color: thin ? ArchPlanStyle.COLORS.wallCut : ArchPlanStyle.COLORS.furnitureFill,
          fillOpacity: thin ? 0.92 : 0.35
        });
        return true;
      }
      case 'CIRCLE': {
        const colTh = 0.8 * scale;
        if (entity.radius <= colTh) {
          ArchPlanStyle.mark(entity, 'column', {
            color: ArchPlanStyle.COLORS.columnFill,
            fillOpacity: 0.9
          });
        } else if (entity.radius <= 1.5 * scale) {
          ArchPlanStyle.mark(entity, 'landscape-tree', {
            color: ArchPlanStyle.COLORS.tree,
            fillOpacity: 0.5
          });
        } else {
          ArchPlanStyle.mark(entity, 'symbol', {
            color: ArchPlanStyle.COLORS.outline,
            fillOpacity: 0
          });
        }
        return true;
      }
      case 'POLYLINE':
        if (entity.closed) {
          const dashed = entity.style?.lineDash?.length;
          ArchPlanStyle.mark(entity, dashed ? 'floor' : 'room-floor', {
            color: dashed ? ArchPlanStyle.COLORS.floor : ArchPlanStyle.COLORS.roomFloor,
            fillOpacity: dashed ? 0.2 : 0.12,
            lineDash: entity.style?.lineDash
          });
        } else {
          ArchPlanStyle.mark(entity, entity.style?.lineDash?.length ? 'open-wall' : 'symbol', {
            color: entity.style?.lineDash?.length
              ? ArchPlanStyle.COLORS.openWall : ArchPlanStyle.COLORS.symbol,
            lineWidth: 1.5
          });
        }
        return true;
      case 'LINE':
        ArchPlanStyle.mark(entity, entity.style?.lineDash?.length ? 'open-wall' : 'symbol', {
          color: entity.style?.lineDash?.length
            ? ArchPlanStyle.COLORS.openWall : ArchPlanStyle.COLORS.symbol,
          lineWidth: 1
        });
        return true;
      default:
        return false;
    }
  }

  static _convertArchEntity(entity) {
    if (entity.landscapeKind && typeof ArchitecturalTemplates !== 'undefined') {
      const st = ArchitecturalTemplates.ZONE_KINDS[entity.landscapeKind]
        || ArchitecturalTemplates.ZONE_KINDS.lawn;
      ArchPlanStyle.mark(entity, 'landscape-fill', {
        color: st.color,
        fillOpacity: st.fillOpacity,
        lineDash: st.dash || undefined
      });
      return true;
    }

    const roles = {
      wall: ['wall', ArchPlanStyle.COLORS.wallCut, 0.92],
      'room-fill': ['room-floor', ArchPlanStyle.COLORS.roomFloor, 0.12],
      floor: ['floor', ArchPlanStyle.COLORS.floor, 0.2],
      ceiling: ['ceiling', ArchPlanStyle.COLORS.ceiling, 0.18],
      column: ['column', ArchPlanStyle.COLORS.columnFill, 0.9],
      landscape: ['landscape-fill', ArchPlanStyle.COLORS.lawn, 0.4],
      site: ['symbol', '#78909c', 0, [12, 6]]
    };

    const spec = roles[entity.archType];
    if (!spec) {
      if (entity.planView) return false;
      ArchPlanStyle.mark(entity, 'symbol', { color: ArchPlanStyle.COLORS.symbol });
      return true;
    }

    ArchPlanStyle.mark(entity, spec[0], {
      color: spec[1],
      fillOpacity: spec[2],
      lineDash: spec[3] || entity.style?.lineDash
    });
    return true;
  }
}
