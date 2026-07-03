/**
 * LiveMeasureOverlay — hiển thị kích thước khi vẽ / chỉnh sửa
 */
class LiveMeasureOverlay {
  static segment(app, x1, y1, x2, y2, label) {
    const dist = GeometryEngine.distance(x1, y1, x2, y2);
    app.renderer2D.setLiveMeasures([{
      kind: 'segment',
      x1, y1, x2, y2,
      label: label || GeometryEngine.formatDistance(dist)
    }]);
  }

  static radius(app, cx, cy, px, py) {
    const r = GeometryEngine.distance(cx, cy, px, py);
    LiveMeasureOverlay.segment(
      app, cx, cy, px, py,
      `R ${GeometryEngine.formatDistance(r)}`
    );
  }

  static rectangle(app, x1, y1, x2, y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const w = maxX - minX;
    const h = maxY - minY;
    app.renderer2D.setLiveMeasures([
      { kind: 'segment', x1: minX, y1: minY, x2: maxX, y2: minY, label: GeometryEngine.formatDistance(w) },
      { kind: 'segment', x1: minX, y1: minY, x2: minX, y2: maxY, label: GeometryEngine.formatDistance(h) }
    ]);
  }

  static polylineSegment(app, points, cursor) {
    const last = points[points.length - 1];
    const seg = GeometryEngine.distance(last.x, last.y, cursor.x, cursor.y);
    let total = seg;
    for (let i = 1; i < points.length; i++) {
      total += GeometryEngine.distance(
        points[i - 1].x, points[i - 1].y,
        points[i].x, points[i].y
      );
    }
    const measures = [{
      kind: 'segment',
      x1: last.x, y1: last.y, x2: cursor.x, y2: cursor.y,
      label: GeometryEngine.formatDistance(seg)
    }];
    if (points.length > 1) {
      measures.push({
        kind: 'label',
        x: cursor.x,
        y: cursor.y,
        text: `Σ ${GeometryEngine.formatDistance(total)}`,
        offsetY: -20
      });
    }
    app.renderer2D.setLiveMeasures(measures);
  }

  static arc(app, cx, cy, r, startAngle, endAngle) {
    let sweep = endAngle - startAngle;
    while (sweep < 0) sweep += Math.PI * 2;
    while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
    const arcLen = r * sweep;
    const midAngle = startAngle + sweep / 2;
    const lx = cx + Math.cos(midAngle) * r * 0.65;
    const ly = cy + Math.sin(midAngle) * r * 0.65;
    app.renderer2D.setLiveMeasures([
      {
        kind: 'segment',
        x1: cx, y1: cy,
        x2: cx + Math.cos(startAngle) * r,
        y2: cy + Math.sin(startAngle) * r,
        label: `R ${GeometryEngine.formatDistance(r)}`
      },
      {
        kind: 'label',
        x: lx,
        y: ly,
        text: GeometryEngine.formatDistance(arcLen)
      }
    ]);
  }

  static clear(app) {
    app.renderer2D.setLiveMeasures([]);
  }
}
