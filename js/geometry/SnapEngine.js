class SnapEngine {
  constructor() {
    this.enabled = true;
    this.tolerance = 15;
    this.modes = {
      endpoint: true,
      midpoint: true,
      center: true,
      intersection: false,
      nearest: false,
      grid: true
    };
    this.lastSnap = null;
  }

  setMode(mode, value) {
    if (mode in this.modes) {
      this.modes[mode] = value;
    }
  }

  snap(worldX, worldY, drawing, layerManager, view, canvasWidth, canvasHeight) {
    if (!this.enabled) {
      this.lastSnap = null;
      return { x: worldX, y: worldY, snapped: false };
    }

    const screenTolerance = this.tolerance / view.zoom;
    let bestSnap = null;
    let bestDist = screenTolerance;

    if (this.modes.grid) {
      const gridSnap = GeometryEngine.snapToGrid(worldX, worldY, view.gridSize);
      const gridDist = GeometryEngine.distance(worldX, worldY, gridSnap.x, gridSnap.y);
      if (gridDist < bestDist) {
        bestDist = gridDist;
        bestSnap = { x: gridSnap.x, y: gridSnap.y, type: 'grid' };
      }
    }

    const entities = drawing.getVisibleEntities(layerManager);

    for (const entity of entities) {
      const snapPoints = entity.getSnapPoints();
      for (const sp of snapPoints) {
        if (!this.modes[sp.type]) continue;
        const dist = GeometryEngine.distance(worldX, worldY, sp.x, sp.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestSnap = { x: sp.x, y: sp.y, type: sp.type };
        }
      }
    }

    if (this.modes.nearest) {
      for (const entity of entities) {
        const nearest = entity.getNearestPoint(worldX, worldY);
        if (nearest && nearest.distance < bestDist) {
          bestDist = nearest.distance;
          bestSnap = { x: nearest.x, y: nearest.y, type: 'nearest' };
        }
      }
    }

    if (this.modes.intersection) {
      const intersections = this._findIntersections(entities, worldX, worldY, bestDist);
      for (const pt of intersections) {
        const dist = GeometryEngine.distance(worldX, worldY, pt.x, pt.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestSnap = { x: pt.x, y: pt.y, type: 'intersection' };
        }
      }
    }

    if (bestSnap) {
      this.lastSnap = bestSnap;
      return { x: bestSnap.x, y: bestSnap.y, snapped: true, type: bestSnap.type };
    }

    this.lastSnap = null;
    return { x: worldX, y: worldY, snapped: false };
  }

  _findIntersections(entities, wx, wy, tolerance) {
    const points = [];
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const pts1 = entities[i].getSegmentPoints();
        const pts2 = entities[j].getSegmentPoints();
        for (const s1 of pts1) {
          for (const s2 of pts2) {
            const inter = GeometryEngine.lineIntersection(
              s1.x1, s1.y1, s1.x2, s1.y2,
              s2.x1, s2.y1, s2.x2, s2.y2
            );
            if (inter) {
              const dist = GeometryEngine.distance(wx, wy, inter.x, inter.y);
              if (dist < tolerance) {
                points.push(inter);
              }
            }
          }
        }
      }
    }
    return points;
  }

  drawSnapIndicator(ctx, drawing, view, canvasWidth, canvasHeight) {
    if (!this.lastSnap) return;
    const screen = drawing.worldToScreen(this.lastSnap.x, this.lastSnap.y, canvasWidth, canvasHeight);

    ctx.save();
    ctx.strokeStyle = '#ff7043';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const size = 8;
    switch (this.lastSnap.type) {
      case 'endpoint':
        ctx.strokeRect(screen.x - size/2, screen.y - size/2, size, size);
        break;
      case 'midpoint':
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y - size/2);
        ctx.lineTo(screen.x + size/2, screen.y + size/2);
        ctx.lineTo(screen.x - size/2, screen.y + size/2);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'center':
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, size/2, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'intersection':
        ctx.beginPath();
        ctx.moveTo(screen.x - size/2, screen.y - size/2);
        ctx.lineTo(screen.x + size/2, screen.y + size/2);
        ctx.moveTo(screen.x + size/2, screen.y - size/2);
        ctx.lineTo(screen.x - size/2, screen.y + size/2);
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
  }
}
