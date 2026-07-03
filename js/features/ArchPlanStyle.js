/**
 * ArchPlanStyle — ký hiệu mặt bằng (mặt cắt ngang nhìn từ trên)
 */
class ArchPlanStyle {
  static COLORS = {
    wall: '#42a5f5',
    wallCut: '#64b5f6',
    column: '#ef6c00',
    columnFill: '#ffb74d',
    floor: '#81c784',
    ceiling: '#ba68c8',
    openWall: '#4dd0e1',
    roomFloor: '#e1f5fe',
    furniture: '#ffb74d',
    furnitureFill: '#ffcc80',
    lawn: '#aed581',
    garden: '#c5e1a5',
    water: '#4fc3f7',
    pool: '#29b6f6',
    path: '#eeeeee',
    paving: '#cfd8dc',
    sand: '#fff59d',
    deck: '#bcaaa4',
    flower: '#f48fb1',
    tree: '#66bb6a',
    symbol: '#90caf9',
    outline: '#b0bec5'
  };

  /** Màu vật liệu 3D theo loại kiến trúc */
  static MATERIAL_3D = {
    wall: { color: '#42a5f5', metalness: 0.05, roughness: 0.62 },
    column: { color: '#ffa726', metalness: 0.12, roughness: 0.48 },
    'room-fill': { color: '#4dd0e1', metalness: 0.0, roughness: 0.72 },
    floor: { color: '#66bb6a', metalness: 0.0, roughness: 0.68 },
    ceiling: { color: '#ab47bc', metalness: 0.0, roughness: 0.7 },
    landscape: { color: '#9ccc65', metalness: 0.0, roughness: 0.75 },
    lawn: { color: '#aed581', metalness: 0.0, roughness: 0.78 },
    garden: { color: '#c5e1a5', metalness: 0.0, roughness: 0.76 },
    water: { color: '#4fc3f7', metalness: 0.05, roughness: 0.35, opacity: 0.88 },
    pool: { color: '#29b6f6', metalness: 0.08, roughness: 0.3, opacity: 0.9 },
    path: { color: '#e0e0e0', metalness: 0.0, roughness: 0.82 },
    paving: { color: '#cfd8dc', metalness: 0.0, roughness: 0.8 },
    sand: { color: '#fff176', metalness: 0.0, roughness: 0.9 },
    deck: { color: '#a1887f', metalness: 0.0, roughness: 0.72 },
    flower: { color: '#f06292', metalness: 0.0, roughness: 0.65 },
    'furniture-fill': { color: '#ffca28', metalness: 0.05, roughness: 0.55 },
    'room-floor': { color: '#80deea', metalness: 0.0, roughness: 0.74 },
    'landscape-fill': { color: '#9ccc65', metalness: 0.0, roughness: 0.76 },
    'landscape-tree': { color: '#66bb6a', metalness: 0.0, roughness: 0.7 },
    'landscape-water': { color: '#4fc3f7', metalness: 0.05, roughness: 0.35, opacity: 0.88 },
    'landscape-path': { color: '#e0e0e0', metalness: 0.0, roughness: 0.82 },
    'landscape-flower': { color: '#f48fb1', metalness: 0.0, roughness: 0.65 },
    symbol: { color: '#90caf9', metalness: 0.08, roughness: 0.6 },
    default: { color: '#4fc3f7', metalness: 0.08, roughness: 0.6 }
  };

  static PLAN_SPEC = {
    wall: { role: 'wall', color: '#64b5f6', fillOpacity: 0.72 },
    column: { role: 'column', color: '#ffb74d', fillOpacity: 0.82 },
    'room-floor': { role: 'room-floor', color: '#e1f5fe', fillOpacity: 0.58 },
    floor: { role: 'floor', color: '#c8e6c9', fillOpacity: 0.62 },
    ceiling: { role: 'ceiling', color: '#e1bee7', fillOpacity: 0.55 },
    'furniture-fill': { role: 'furniture-fill', color: '#ffe082', fillOpacity: 0.62 },
    'landscape-fill': { role: 'landscape-fill', color: '#c5e1a5', fillOpacity: 0.58 },
    'landscape-tree': { role: 'landscape-tree', color: '#81c784', fillOpacity: 0.65 },
    'landscape-water': { role: 'landscape-water', color: '#81d4fa', fillOpacity: 0.68 },
    'landscape-path': { role: 'landscape-path', color: '#f5f5f5', fillOpacity: 0.72 },
    'landscape-flower': { role: 'landscape-flower', color: '#f8bbd0', fillOpacity: 0.6 },
    'open-wall': { role: 'open-wall', color: '#80deea', fillOpacity: 0 },
    symbol: { role: 'symbol', color: '#90caf9', fillOpacity: 0.35 }
  };

  static ARCH_PLAN = {
    wall: { role: 'wall', color: '#64b5f6', fillOpacity: 0.72 },
    'room-fill': { role: 'room-floor', color: '#e1f5fe', fillOpacity: 0.58 },
    floor: { role: 'floor', color: '#c8e6c9', fillOpacity: 0.62 },
    ceiling: { role: 'ceiling', color: '#e1bee7', fillOpacity: 0.55 },
    column: { role: 'column', color: '#ffb74d', fillOpacity: 0.82 },
    landscape: { role: 'landscape-fill', color: '#c5e1a5', fillOpacity: 0.58 },
    site: { role: 'symbol', color: '#b0bec5', fillOpacity: 0.25, lineDash: [12, 6] }
  };

  static applyMaterial3D(entity3d, entity2d) {
    const mat = ArchPlanStyle.materialForEntity2D(entity2d);
    entity3d.material.color = mat.color;
    entity3d.material.metalness = mat.metalness ?? 0.08;
    entity3d.material.roughness = mat.roughness ?? 0.62;
    const opacity = mat.opacity ?? 1;
    entity3d.material.opacity = opacity;
    entity3d.material.transparent = opacity < 1;
    return entity3d;
  }

  static materialForEntity2D(entity2d) {
    if (entity2d?.landscapeKind && typeof ArchitecturalTemplates !== 'undefined') {
      const kind = entity2d.landscapeKind;
      if (ArchPlanStyle.MATERIAL_3D[kind]) {
        return { ...ArchPlanStyle.MATERIAL_3D[kind] };
      }
    }
    const arch = entity2d?.archType;
    if (arch && ArchPlanStyle.MATERIAL_3D[arch]) {
      return { ...ArchPlanStyle.MATERIAL_3D[arch] };
    }
    const role = entity2d?.planRole;
    if (role && ArchPlanStyle.MATERIAL_3D[role]) {
      return { ...ArchPlanStyle.MATERIAL_3D[role] };
    }
    if (entity2d?.style?.color) {
      return {
        color: entity2d.style.color,
        metalness: 0.08,
        roughness: 0.62
      };
    }
    return { ...ArchPlanStyle.MATERIAL_3D.default };
  }

  static applyEntityPlanStyle(entity) {
    if (entity.landscapeKind && typeof ArchitecturalTemplates !== 'undefined') {
      const st = ArchitecturalTemplates.ZONE_KINDS[entity.landscapeKind]
        || ArchitecturalTemplates.ZONE_KINDS.lawn;
      ArchPlanStyle.mark(entity, 'landscape-fill', {
        color: st.color,
        fillOpacity: Math.min(0.72, (st.fillOpacity || 0.4) + 0.15),
        lineDash: st.dash || undefined
      });
      return true;
    }
    if (entity.archType && ArchPlanStyle.ARCH_PLAN[entity.archType]) {
      const spec = ArchPlanStyle.ARCH_PLAN[entity.archType];
      ArchPlanStyle.mark(entity, spec.role, {
        color: spec.color,
        fillOpacity: spec.fillOpacity,
        lineDash: spec.lineDash
      });
      return true;
    }
    if (entity.planRole && ArchPlanStyle.PLAN_SPEC[entity.planRole]) {
      const spec = ArchPlanStyle.PLAN_SPEC[entity.planRole];
      ArchPlanStyle.mark(entity, spec.role, {
        color: spec.color,
        fillOpacity: spec.fillOpacity
      });
      return true;
    }
    return false;
  }

  static edgeColor(entity, fillColor) {
    const map = {
      wall: '#1e88e5',
      column: '#ef6c00',
      'room-floor': '#4fc3f7',
      floor: '#43a047',
      ceiling: '#8e24aa',
      'landscape-fill': '#689f38',
      'landscape-water': '#0288d1',
      'furniture-fill': '#ffa000'
    };
    return map[entity.planRole] || fillColor || entity.style?.color || ArchPlanStyle.COLORS.outline;
  }

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
        fillOpacity: role === 'wall' ? 0.72 : 0.58
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
        fillOpacity: isWall ? 0.72 : 0.58,
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
        return 0.78;
      case 'floor':
        return 0.62;
      case 'ceiling':
        return 0.55;
      case 'room-floor':
        return 0.58;
      case 'furniture-fill':
        return 0.62;
      case 'landscape-fill':
      case 'landscape-tree':
        return 0.65;
      case 'landscape-water':
        return 0.68;
      case 'landscape-path':
        return 0.72;
      case 'landscape-flower':
        return 0.6;
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
    ctx.strokeStyle = ArchPlanStyle.edgeColor(entity, color);
    ctx.lineWidth = entity.style.lineWidth || (entity.planRole === 'wall' ? 1.2 : 1);
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
    ctx.strokeStyle = ArchPlanStyle.edgeColor(entity, color);
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
      return ArchPlanStyle.applyEntityPlanStyle(entity);
    }

    if (entity.planView && entity.planRole) return false;

    const scale = worldUnit === 'mm' ? 1000 : (worldUnit === 'cm' ? 100 : 1);
    const wallThick = 0.3 * scale;

    switch (entity.type) {
      case 'HATCH':
        ArchPlanStyle.mark(entity, 'furniture-fill', {
          color: ArchPlanStyle.COLORS.furnitureFill,
          fillOpacity: 0.58
        });
        return true;
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        const w = bb.maxX - bb.minX;
        const h = bb.maxY - bb.minY;
        const thin = Math.min(w, h) < wallThick && Math.max(w, h) > Math.min(w, h) * 3;
        ArchPlanStyle.mark(entity, thin ? 'wall' : 'furniture-fill', {
          color: thin ? ArchPlanStyle.COLORS.wallCut : ArchPlanStyle.COLORS.furnitureFill,
          fillOpacity: thin ? 0.72 : 0.58
        });
        return true;
      }
      case 'CIRCLE': {
        const colTh = 0.8 * scale;
        if (entity.radius <= colTh) {
          ArchPlanStyle.mark(entity, 'column', {
            color: ArchPlanStyle.COLORS.columnFill,
            fillOpacity: 0.82
          });
        } else if (entity.radius <= 1.5 * scale) {
          ArchPlanStyle.mark(entity, 'landscape-tree', {
            color: ArchPlanStyle.COLORS.tree,
            fillOpacity: 0.65
          });
        } else {
          ArchPlanStyle.mark(entity, 'symbol', {
            color: ArchPlanStyle.COLORS.symbol,
            fillOpacity: 0.35
          });
        }
        return true;
      }
      case 'POLYLINE':
        if (entity.closed) {
          const dashed = entity.style?.lineDash?.length;
          ArchPlanStyle.mark(entity, dashed ? 'floor' : 'room-floor', {
            color: dashed ? ArchPlanStyle.COLORS.floor : ArchPlanStyle.COLORS.roomFloor,
            fillOpacity: dashed ? 0.62 : 0.58,
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
}
