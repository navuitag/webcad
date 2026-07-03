/**
 * LiveMeasureOverlay — hiển thị kích thước khi vẽ / chỉnh sửa
 */
class LiveMeasureOverlay {
  static _fmt(app, value) {
    if (app?.formatDistance) return app.formatDistance(value);
    const d = app?.drawing;
    return GeometryEngine.formatDistance(value, d?.unit || 'mm', 2, d?.worldUnit || d?.unit || 'mm');
  }

  static segment(app, x1, y1, x2, y2, label) {
    const dist = GeometryEngine.distance(x1, y1, x2, y2);
    app.renderer2D.setLiveMeasures([{
      kind: 'segment',
      x1, y1, x2, y2,
      label: label || LiveMeasureOverlay._fmt(app, dist)
    }]);
  }

  static radius(app, cx, cy, px, py) {
    const r = GeometryEngine.distance(cx, cy, px, py);
    LiveMeasureOverlay.segment(
      app, cx, cy, px, py,
      `R ${LiveMeasureOverlay._fmt(app, r)}`
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
      { kind: 'segment', x1: minX, y1: minY, x2: maxX, y2: minY, label: LiveMeasureOverlay._fmt(app, w) },
      { kind: 'segment', x1: minX, y1: minY, x2: minX, y2: maxY, label: LiveMeasureOverlay._fmt(app, h) }
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
      label: LiveMeasureOverlay._fmt(app, seg)
    }];
    if (points.length > 1) {
      measures.push({
        kind: 'label',
        x: cursor.x,
        y: cursor.y,
        text: `Σ ${LiveMeasureOverlay._fmt(app, total)}`,
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
        label: `R ${LiveMeasureOverlay._fmt(app, r)}`
      },
      {
        kind: 'label',
        x: lx,
        y: ly,
        text: LiveMeasureOverlay._fmt(app, arcLen)
      }
    ]);
  }

  static clear(app) {
    app.renderer2D.setLiveMeasures([]);
  }
}
