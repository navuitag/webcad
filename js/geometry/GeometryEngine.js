const GeometryEngine = {
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  distancePoint(x, y, px, py) {
    return this.distance(x, y, px, py);
  },

  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  midpoint(x1, y1, x2, y2) {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  },

  dot(v1x, v1y, v2x, v2y) {
    return v1x * v2x + v1y * v2y;
  },

  cross(v1x, v1y, v2x, v2y) {
    return v1x * v2y - v1y * v2x;
  },

  normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  },

  projectPointOnLine(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: x1, y: y1, t: 0 };
    const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    return { x: x1 + t * dx, y: y1 + t * dy, t };
  },

  nearestPointOnSegment(px, py, x1, y1, x2, y2) {
    const proj = this.projectPointOnLine(px, py, x1, y1, x2, y2);
    const t = Math.max(0, Math.min(1, proj.t));
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
      distance: this.distance(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1))
    };
  },

  lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
    }
    return null;
  },

  lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  },

  pointInRect(px, py, x1, y1, x2, y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  },

  rotatePoint(x, y, cx, cy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos
    };
  },

  scalePoint(x, y, cx, cy, factor) {
    return {
      x: cx + (x - cx) * factor,
      y: cy + (y - cy) * factor
    };
  },

  snapToGrid(x, y, gridSize) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  },

  applyOrtho(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    if (dx > dy) {
      return { x: x2, y: y1 };
    }
    return { x: x1, y: y2 };
  },

  mergeBoundingBoxes(boxes) {
    if (boxes.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const bb of boxes) {
      if (!bb) continue;
      minX = Math.min(minX, bb.minX);
      minY = Math.min(minY, bb.minY);
      maxX = Math.max(maxX, bb.maxX);
      maxY = Math.max(maxY, bb.maxY);
    }
    return { minX, minY, maxX, maxY };
  },

  formatDistance(dist, unit = 'mm', decimals = 2) {
    return dist.toFixed(decimals) + ' ' + unit;
  }
};
