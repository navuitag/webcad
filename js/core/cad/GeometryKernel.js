/**
 * GeometryKernel — lõi hình học 2D của WebCAD
 * Giao điểm, offset, trim, extend, fillet, boolean, projection, bounding box
 */
class GeometryKernel {
  static EPS = 1e-10;

  // ─── Primitives ───────────────────────────────────────────

  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  static midpoint(x1, y1, x2, y2) {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  }

  static dot(ax, ay, bx, by) {
    return ax * bx + ay * by;
  }

  static cross(ax, ay, bx, by) {
    return ax * by - ay * bx;
  }

  static normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len < this.EPS) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  }

  static rotatePoint(x, y, cx, cy, a) {
    const cos = Math.cos(a), sin = Math.sin(a);
    const dx = x - cx, dy = y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  static scalePoint(x, y, cx, cy, f) {
    return { x: cx + (x - cx) * f, y: cy + (y - cy) * f };
  }

  static mirrorPoint(x, y, x1, y1, x2, y2) {
    const proj = this.projectPointOnLine(x, y, x1, y1, x2, y2);
    return { x: 2 * proj.x - x, y: 2 * proj.y - y };
  }

  static snapToGrid(x, y, gridSize) {
    return { x: Math.round(x / gridSize) * gridSize, y: Math.round(y / gridSize) * gridSize };
  }

  static applyOrtho(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) > Math.abs(y2 - y1)
      ? { x: x2, y: y1 } : { x: x1, y: y2 };
  }

  static formatDistance(dist, displayUnit = 'mm', decimals = 2, worldUnit = null) {
    const wu = worldUnit || displayUnit;
    if (typeof UnitEngine !== 'undefined') {
      return UnitEngine.format(dist, displayUnit, wu, decimals);
    }
    return dist.toFixed(decimals) + ' ' + displayUnit;
  }

  // ─── Projection ───────────────────────────────────────────

  static projectPointOnLine(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < this.EPS) return { x: x1, y: y1, t: 0 };
    const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    return { x: x1 + t * dx, y: y1 + t * dy, t };
  }

  static projectPointOnSegment(px, py, x1, y1, x2, y2) {
    const proj = this.projectPointOnLine(px, py, x1, y1, x2, y2);
    const t = Math.max(0, Math.min(1, proj.t));
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1), t };
  }

  static nearestPointOnSegment(px, py, x1, y1, x2, y2) {
    const p = this.projectPointOnSegment(px, py, x1, y1, x2, y2);
    return { ...p, distance: this.distance(px, py, p.x, p.y) };
  }

  static pointSideOfLine(px, py, x1, y1, x2, y2) {
    return this.cross(x2 - x1, y2 - y1, px - x1, py - y1);
  }

  // ─── Intersection ─────────────────────────────────────────

  static lineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = this.cross(x1 - x2, y1 - y2, x3 - x4, y3 - y4);
    if (Math.abs(denom) < this.EPS) return null;
    const t = this.cross(x1 - x3, y1 - y3, x3 - x4, y3 - y4) / denom;
    const u = this.cross(x1 - x3, y1 - y3, x1 - x2, y1 - y2) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1), t, u };
    }
    return null;
  }

  static lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = this.cross(x1 - x2, y1 - y2, x3 - x4, y3 - y4);
    if (Math.abs(denom) < this.EPS) return null;
    const t = this.cross(x1 - x3, y1 - y3, x3 - x4, y3 - y4) / denom;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }

  static lineCircleIntersections(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const fx = x1 - cx, fy = y1 - cy;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0 || a < this.EPS) return [];
    const sqrtDisc = Math.sqrt(disc);
    const results = [];
    for (const sign of [-1, 1]) {
      const t = (-b + sign * sqrtDisc) / (2 * a);
      if (t >= 0 && t <= 1) results.push({ x: x1 + t * dx, y: y1 + t * dy, t });
    }
    return results;
  }

  static circleCircleIntersections(c1x, c1y, r1, c2x, c2y, r2) {
    const d = this.distance(c1x, c1y, c2x, c2y);
    if (d < this.EPS || d > r1 + r2 || d < Math.abs(r1 - r2)) return [];
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const hSq = r1 * r1 - a * a;
    if (hSq < 0) return [];
    const h = Math.sqrt(hSq);
    const px = c1x + a * (c2x - c1x) / d;
    const py = c1y + a * (c2y - c1y) / d;
    if (h < this.EPS) return [{ x: px, y: py }];
    return [
      { x: px + h * (c2y - c1y) / d, y: py - h * (c2x - c1x) / d },
      { x: px - h * (c2y - c1y) / d, y: py + h * (c2x - c1x) / d }
    ];
  }

  static intersectSegments(segmentsA, segmentsB) {
    const points = [];
    for (const a of segmentsA) {
      for (const b of segmentsB) {
        const hit = this.lineSegmentIntersection(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1, b.x2, b.y2);
        if (hit) points.push(hit);
      }
    }
    return points;
  }

  static collectIntersectionsOnSegment(x1, y1, x2, y2, entities, exclude = null) {
    const points = [];
    for (const entity of entities) {
      if (entity === exclude) continue;
      const segments = entity.getSegmentPoints ? entity.getSegmentPoints() : [];
      for (const seg of segments) {
        const hit = this.lineSegmentIntersection(x1, y1, x2, y2, seg.x1, seg.y1, seg.x2, seg.y2);
        if (hit) {
          const t = this.projectPointOnLine(hit.x, hit.y, x1, y1, x2, y2).t;
          points.push({ x: hit.x, y: hit.y, t });
        }
      }
      if (entity.type === 'CIRCLE') {
        for (const hit of this.lineCircleIntersections(
          x1, y1, x2, y2, entity.center.x, entity.center.y, entity.radius
        )) {
          points.push(hit);
        }
      }
    }
    points.sort((a, b) => a.t - b.t);
    return points;
  }

  static intersectEntities(entityA, entityB) {
    const segA = entityA.getSegmentPoints ? entityA.getSegmentPoints() : [];
    const segB = entityB.getSegmentPoints ? entityB.getSegmentPoints() : [];
    const hits = this.intersectSegments(segA, segB);
    if (entityA.type === 'CIRCLE' && entityB.type === 'LINE') {
      const l = entityB;
      hits.push(...this.lineCircleIntersections(
        l.start.x, l.start.y, l.end.x, l.end.y,
        entityA.center.x, entityA.center.y, entityA.radius
      ));
    }
    if (entityA.type === 'CIRCLE' && entityB.type === 'CIRCLE') {
      hits.push(...this.circleCircleIntersections(
        entityA.center.x, entityA.center.y, entityA.radius,
        entityB.center.x, entityB.center.y, entityB.radius
      ));
    }
    return hits;
  }

  // ─── Bounding Box ─────────────────────────────────────────

  static boundingBoxFromPoints(points) {
    if (!points || points.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  static mergeBoundingBoxes(boxes) {
    const pts = [];
    for (const bb of boxes) {
      if (!bb) continue;
      pts.push({ x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.maxY });
    }
    return this.boundingBoxFromPoints(pts);
  }

  static entityToPolygon(entity) {
    switch (entity.type) {
      case 'LINE':
        return [{ x: entity.start.x, y: entity.start.y }, { x: entity.end.x, y: entity.end.y }];
      case 'CIRCLE': {
        const pts = [];
        for (let i = 0; i < 32; i++) {
          const a = (i / 32) * Math.PI * 2;
          pts.push({ x: entity.center.x + Math.cos(a) * entity.radius, y: entity.center.y + Math.sin(a) * entity.radius });
        }
        return pts;
      }
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        return [
          { x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.minY },
          { x: bb.maxX, y: bb.maxY }, { x: bb.minX, y: bb.maxY }
        ];
      }
      case 'POLYLINE':
        return entity.closed ? [...entity.points] : [...entity.points];
      default:
        return entity.getBoundingBox ? (() => {
          const bb = entity.getBoundingBox();
          return bb ? [
            { x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.minY },
            { x: bb.maxX, y: bb.maxY }, { x: bb.minX, y: bb.maxY }
          ] : [];
        })() : [];
    }
  }

  // ─── Offset ───────────────────────────────────────────────

  static offsetLine(x1, y1, x2, y2, dist) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < this.EPS) return null;
    const nx = -dy / len * dist, ny = dx / len * dist;
    return { x1: x1 + nx, y1: y1 + ny, x2: x2 + nx, y2: y2 + ny };
  }

  static offsetPolyline(points, dist) {
    if (points.length < 2) return null;
    const result = [];
    for (let i = 0; i < points.length - 1; i++) {
      const off = this.offsetLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, dist);
      if (off) result.push({ x: off.x1, y: off.y1 });
    }
    const last = this.offsetLine(
      points[points.length - 2].x, points[points.length - 2].y,
      points[points.length - 1].x, points[points.length - 1].y, dist
    );
    if (last) result.push({ x: last.x2, y: last.y2 });
    return result;
  }

  static offsetCircle(cx, cy, r, dist) {
    const newR = r + dist;
    return newR > 0 ? { cx, cy, r: newR } : null;
  }

  // ─── Trim / Extend / Fillet ───────────────────────────────

  static trimLineAtPoint(line, clickX, clickY, entities) {
    const { x: x1, y: y1 } = line.start, { x: x2, y: y2 } = line.end;
    const intersections = this.collectIntersectionsOnSegment(x1, y1, x2, y2, entities, line);
    if (intersections.length === 0) return null;

    const clickT = this.projectPointOnLine(clickX, clickY, x1, y1, x2, y2).t;
    let nearest = null, minDist = Infinity;
    for (const pt of intersections) {
      const d = Math.abs(pt.t - clickT);
      if (d < minDist) { minDist = d; nearest = pt; }
    }
    if (!nearest) return null;

    const keepStart = clickT < nearest.t;
    return keepStart
      ? { start: { x: x1, y: y1 }, end: { x: nearest.x, y: nearest.y } }
      : { start: { x: nearest.x, y: nearest.y }, end: { x: x2, y: y2 } };
  }

  static extendLine(line, fromStart, entities) {
    const { x: x1, y: y1 } = line.start, { x: x2, y: y2 } = line.end;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < this.EPS) return null;

    const far = 1e6;
    let ax, ay, bx, by;
    if (fromStart) {
      ax = x1 - dx / len * far; ay = y1 - dy / len * far; bx = x1; by = y1;
    } else {
      ax = x2; ay = y2; bx = x2 + dx / len * far; by = y2 + dy / len * far;
    }

    const hits = this.collectIntersectionsOnSegment(ax, ay, bx, by, entities, line);
    if (hits.length === 0) return null;
    const target = fromStart ? hits[hits.length - 1] : hits[0];
    return fromStart
      ? { start: { x: target.x, y: target.y }, end: { x: x2, y: y2 } }
      : { start: { x: x1, y: y1 }, end: { x: target.x, y: target.y } };
  }

  static filletLines(line1, line2, radius) {
    const x1 = line1.start.x, y1 = line1.start.y, x2 = line1.end.x, y2 = line1.end.y;
    const x3 = line2.start.x, y3 = line2.start.y, x4 = line2.end.x, y4 = line2.end.y;

    const inter = this.lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
    if (!inter) return null;

    const d1 = this.normalize(x2 - x1, y2 - y1);
    const d2 = this.normalize(x4 - x3, y4 - y3);
    let u1x = d1.x, u1y = d1.y, u2x = d2.x, u2y = d2.y;
    if (this.dot(u1x, u1y, inter.x - x1, inter.y - y1) < 0) { u1x = -u1x; u1y = -u1y; }
    if (this.dot(u2x, u2y, inter.x - x3, inter.y - y3) < 0) { u2x = -u2x; u2y = -u2y; }

    const dotVal = Math.max(-1, Math.min(1, this.dot(u1x, u1y, u2x, u2y)));
    const angle = Math.acos(dotVal);
    if (angle < 0.01 || angle > Math.PI - 0.01) return null;

    const dist = radius / Math.tan(angle / 2);
    const t1x = inter.x - u1x * dist, t1y = inter.y - u1y * dist;
    const t2x = inter.x - u2x * dist, t2y = inter.y - u2y * dist;

    const bisX = u1x + u2x, bisY = u1y + u2y;
    const bisLen = Math.sqrt(bisX * bisX + bisY * bisY);
    if (bisLen < this.EPS) return null;

    const cx = inter.x - (bisX / bisLen) * (radius / Math.sin(angle / 2));
    const cy = inter.y - (bisY / bisLen) * (radius / Math.sin(angle / 2));

    return {
      arc: { center: { x: cx, y: cy }, radius, startAngle: Math.atan2(t1y - cy, t1x - cx), endAngle: Math.atan2(t2y - cy, t2x - cx) },
      line1: { start: { x: x1, y: y1 }, end: { x: t1x, y: t1y } },
      line2: { start: { x: x3, y: y3 }, end: { x: t2x, y: t2y } }
    };
  }

  // ─── Boolean (polygon clipping) ───────────────────────────

  static _clipEdge(subject, x1, y1, x2, y2, insideFn) {
    const output = [];
    if (subject.length === 0) return output;
    let prev = subject[subject.length - 1];
    for (const curr of subject) {
      const currIn = insideFn(curr.x, curr.y);
      const prevIn = insideFn(prev.x, prev.y);
      if (currIn) {
        if (!prevIn) {
          const inter = this.lineLineIntersection(prev.x, prev.y, curr.x, curr.y, x1, y1, x2, y2);
          if (inter) output.push(inter);
        }
        output.push(curr);
      } else if (prevIn) {
        const inter = this.lineLineIntersection(prev.x, prev.y, curr.x, curr.y, x1, y1, x2, y2);
        if (inter) output.push(inter);
      }
      prev = curr;
    }
    return output;
  }

  static _clipPolygon(subject, clip, edgeFn) {
    let output = [...subject];
    const n = clip.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      output = this._clipEdge(output, clip[i].x, clip[i].y, clip[j].x, clip[j].y, edgeFn(i, clip));
      if (output.length === 0) break;
    }
    return output;
  }

  static booleanIntersect(polyA, polyB) {
    if (polyA.length < 3 || polyB.length < 3) return [];
    const result = this._clipPolygon(polyA, polyB, (i, clip) => {
      const j = (i + 1) % clip.length;
      return (x, y) => this.pointSideOfLine(x, y, clip[i].x, clip[i].y, clip[j].x, clip[j].y) >= 0;
    });
    return result.length >= 3 ? [result] : [];
  }

  static booleanSubtract(subject, clip) {
    if (subject.length < 3 || clip.length < 3) return [subject];
    const result = this._clipPolygon(subject, clip, (i, c) => {
      const j = (i + 1) % c.length;
      return (x, y) => this.pointSideOfLine(x, y, c[j].x, c[j].y, c[i].x, c[i].y) >= 0;
    });
    return result.length >= 3 ? [result] : [];
  }

  static booleanUnion(polyA, polyB) {
    const bbA = this.boundingBoxFromPoints(polyA);
    const bbB = this.boundingBoxFromPoints(polyB);
    if (!bbA || !bbB) return [polyA, polyB];
    const overlap = !(bbA.maxX < bbB.minX || bbB.maxX < bbA.minX || bbA.maxY < bbB.minY || bbB.maxY < bbA.minY);
    if (!overlap) return [polyA, polyB];
    const hull = this._convexHull([...polyA, ...polyB]);
    return hull.length >= 3 ? [hull] : [polyA, polyB];
  }

  static boolean(op, polyA, polyB) {
    switch (op) {
      case 'intersect': return this.booleanIntersect(polyA, polyB);
      case 'subtract': return this.booleanSubtract(polyA, polyB);
      case 'union': return this.booleanUnion(polyA, polyB);
      default: return [];
    }
  }

  static _convexHull(points) {
    if (points.length < 3) return [...points];
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => this.cross(a.x - o.x, a.y - o.y, b.x - o.x, b.y - o.y);
    const lower = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
  }

  // ─── Professional CAD ops ─────────────────────────────────

  static chamferLines(line1, line2, distance) {
    const x1 = line1.start.x, y1 = line1.start.y, x2 = line1.end.x, y2 = line1.end.y;
    const x3 = line2.start.x, y3 = line2.start.y, x4 = line2.end.x, y4 = line2.end.y;

    const inter = this.lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
    if (!inter) return null;

    const d1 = this.normalize(x2 - x1, y2 - y1);
    const d2 = this.normalize(x4 - x3, y4 - y3);
    let u1x = d1.x, u1y = d1.y, u2x = d2.x, u2y = d2.y;
    if (this.dot(u1x, u1y, inter.x - x1, inter.y - y1) < 0) { u1x = -u1x; u1y = -u1y; }
    if (this.dot(u2x, u2y, inter.x - x3, inter.y - y3) < 0) { u2x = -u2x; u2y = -u2y; }

    const dotVal = Math.max(-1, Math.min(1, this.dot(u1x, u1y, u2x, u2y)));
    const angle = Math.acos(dotVal);
    if (angle < 0.01 || angle > Math.PI - 0.01) return null;

    const dist = distance / Math.tan(angle / 2);
    const t1x = inter.x - u1x * dist, t1y = inter.y - u1y * dist;
    const t2x = inter.x - u2x * dist, t2y = inter.y - u2y * dist;

    return {
      line1: { start: { x: x1, y: y1 }, end: { x: t1x, y: t1y } },
      line2: { start: { x: x3, y: y3 }, end: { x: t2x, y: t2y } },
      chamfer: { start: { x: t1x, y: t1y }, end: { x: t2x, y: t2y } }
    };
  }

  static pointInPolygon(x, y, polygon) {
    if (!polygon || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  static pointInRect(x, y, minX, minY, maxX, maxY) {
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  static divideLinePoints(x1, y1, x2, y2, segments) {
    const n = Math.max(2, segments);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
    return pts;
  }

  static breakLineAtPoint(line, wx, wy) {
    const nearest = this.nearestPointOnSegment(wx, wy, line.start.x, line.start.y, line.end.x, line.end.y);
    const eps = this.EPS * 10;
    const dStart = this.distance(nearest.x, nearest.y, line.start.x, line.start.y);
    const dEnd = this.distance(nearest.x, nearest.y, line.end.x, line.end.y);
    if (dStart < eps || dEnd < eps) return null;
    return {
      line1: { start: { ...line.start }, end: { x: nearest.x, y: nearest.y } },
      line2: { start: { x: nearest.x, y: nearest.y }, end: { ...line.end } }
    };
  }

  static linesShareEndpoint(l1, l2, tolerance = 0.01) {
    const pts1 = [l1.start, l1.end];
    const pts2 = [l2.start, l2.end];
    for (const a of pts1) {
      for (const b of pts2) {
        if (this.distance(a.x, a.y, b.x, b.y) <= tolerance) return true;
      }
    }
    return false;
  }

  static entityToBoundary(entity) {
    switch (entity.type) {
      case 'POLYLINE':
        return entity.closed ? [...entity.points] : null;
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        return [
          { x: bb.minX, y: bb.minY }, { x: bb.maxX, y: bb.minY },
          { x: bb.maxX, y: bb.maxY }, { x: bb.minX, y: bb.maxY }
        ];
      }
      case 'CIRCLE': {
        const pts = [];
        const n = 32;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          pts.push({ x: entity.center.x + entity.radius * Math.cos(a), y: entity.center.y + entity.radius * Math.sin(a) });
        }
        return pts;
      }
      default:
        return null;
    }
  }
}

// Backward compatibility alias
const GeometryEngine = GeometryKernel;
