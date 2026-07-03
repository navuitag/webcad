/**
 * EntityDimensionOverlay — nhãn kích thước đè lên giữa đối tượng (không tạo entity DIMENSION)
 */
class EntityDimensionOverlay {
  static TYPES = new Set(['LINE', 'RECTANGLE', 'CIRCLE', 'ARC', 'POLYLINE']);

  static collect(drawing, layerManager, dimensionEngine) {
    if (!drawing.view.showDimensions) return [];
    const labels = [];
    for (const entity of drawing.getVisibleEntities(layerManager)) {
      if (!EntityDimensionOverlay.TYPES.has(entity.type)) continue;
      labels.push(...EntityDimensionOverlay.buildLabels(
        entity, dimensionEngine, drawing.unit, drawing.worldUnit || drawing.unit
      ));
    }
    return labels;
  }

  static countLabels(drawing, layerManager, dimensionEngine) {
    return EntityDimensionOverlay.collect(drawing, layerManager, dimensionEngine).length;
  }

  static buildLabels(entity, dimensionEngine, unit = 'mm', worldUnit = unit) {
    const fmt = (v) => GeometryKernel.formatDistance(v, unit, 2, worldUnit);
    const bb = entity.getBoundingBox?.();

    if (entity.type === 'LINE') {
      const mid = GeometryKernel.midpoint(entity.start.x, entity.start.y, entity.end.x, entity.end.y);
      const dist = GeometryKernel.distance(entity.start.x, entity.start.y, entity.end.x, entity.end.y);
      return [{ x: mid.x, y: mid.y, text: fmt(dist) }];
    }

    if (entity.type === 'RECTANGLE' && bb) {
      const w = bb.maxX - bb.minX;
      const h = bb.maxY - bb.minY;
      return [{
        x: (bb.minX + bb.maxX) / 2,
        y: (bb.minY + bb.maxY) / 2,
        text: `${fmt(w)} × ${fmt(h)}`
      }];
    }

    if (entity.type === 'CIRCLE') {
      return [{
        x: entity.center.x,
        y: entity.center.y,
        text: `Ø ${fmt(entity.radius * 2)}`
      }];
    }

    if (entity.type === 'ARC') {
      let sweep = entity.endAngle - entity.startAngle;
      while (sweep < 0) sweep += Math.PI * 2;
      while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
      const midAngle = entity.startAngle + sweep / 2;
      const r = entity.radius * 0.45;
      return [{
        x: entity.center.x + Math.cos(midAngle) * r,
        y: entity.center.y + Math.sin(midAngle) * r,
        text: fmt(entity.radius * sweep)
      }];
    }

    if (entity.type === 'POLYLINE' && entity.points?.length >= 2) {
      if (entity.closed && bb) {
        const w = bb.maxX - bb.minX;
        const h = bb.maxY - bb.minY;
        return [{
          x: (bb.minX + bb.maxX) / 2,
          y: (bb.minY + bb.maxY) / 2,
          text: `${fmt(w)} × ${fmt(h)}`
        }];
      }
      let total = 0;
      for (let i = 1; i < entity.points.length; i++) {
        const a = entity.points[i - 1];
        const b = entity.points[i];
        total += GeometryKernel.distance(a.x, a.y, b.x, b.y);
      }
      if (bb) {
        return [{
          x: (bb.minX + bb.maxX) / 2,
          y: (bb.minY + bb.maxY) / 2,
          text: fmt(total)
        }];
      }
    }

    return [];
  }
}
