/**
 * PlotEngine — Plot/Print configuration for paper space
 */
class PlotEngine {
  static plot(app, options = {}) {
    const layout = app.layoutManager.getCurrentLayout();
    const scale = options.scale || layout.plotScale || layout.scale || 1;
    const paperW = layout.width;
    const paperH = layout.height;
    const orientation = options.orientation || layout.orientation || 'landscape';

    const plotCanvas = document.createElement('canvas');
    const pxPerMm = options.dpi ? options.dpi / 25.4 : 3.78;
    const w = Math.round(paperW * pxPerMm);
    const h = Math.round(paperH * pxPerMm);
    plotCanvas.width = w;
    plotCanvas.height = h;
    const ctx = plotCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    ctx.fillStyle = '#333';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${app.drawing.name} — ${layout.name} — Scale 1:${Math.round(1 / scale)}`, 8, 14);

    const margin = (layout.margin || 10) * pxPerMm;
    const drawArea = { x: margin, y: margin, w: w - margin * 2, h: h - margin * 2 };

    if (layout.viewports && layout.viewports.length > 0) {
      for (const vp of layout.viewports) {
        PlotEngine._drawViewport(ctx, app, vp, drawArea, pxPerMm);
      }
    } else {
      PlotEngine._drawModelContent(ctx, app, drawArea, scale);
    }

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<html><head><title>Plot — ${layout.name}</title></head><body style="margin:0;background:#555;display:flex;justify-content:center;padding:20px">`);
      win.document.write(`<img src="${plotCanvas.toDataURL('image/png')}" style="max-width:100%;box-shadow:0 2px 12px rgba(0,0,0,.4)">`);
      win.document.write('</body></html>');
      win.document.close();
    }

    return { success: true, canvas: plotCanvas, scale, orientation, paperW, paperH };
  }

  static _drawViewport(ctx, app, vp, drawArea, pxPerMm) {
    const vpX = drawArea.x + vp.x * pxPerMm;
    const vpY = drawArea.y + vp.y * pxPerMm;
    const vpW = vp.width * pxPerMm;
    const vpH = vp.height * pxPerMm;

    ctx.save();
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 1;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
    ctx.beginPath();
    ctx.rect(vpX, vpY, vpW, vpH);
    ctx.clip();

    const vpScale = (vp.scale || 1) * pxPerMm;
    ctx.translate(vpX + vpW / 2, vpY + vpH / 2);
    ctx.scale(vpScale, -vpScale);
    ctx.translate(-(vp.centerX || 0), -(vp.centerY || 0));

    const entities = app.drawing.getVisibleEntities(app.layerManager);
    for (const entity of entities) {
      PlotEngine._drawEntity(ctx, entity, app.layerManager);
    }
    ctx.restore();
  }

  static _drawModelContent(ctx, app, drawArea, scale) {
    const bb = app.drawing.getBoundingBox();
    const contentW = (bb.maxX - bb.minX) || 100;
    const contentH = (bb.maxY - bb.minY) || 100;
    const fitScale = Math.min(drawArea.w / contentW, drawArea.h / contentH) * scale;
    const cx = (bb.minX + bb.maxX) / 2;
    const cy = (bb.minY + bb.maxY) / 2;

    ctx.save();
    ctx.translate(drawArea.x + drawArea.w / 2, drawArea.y + drawArea.h / 2);
    ctx.scale(fitScale, -fitScale);
    ctx.translate(-cx, -cy);

    const entities = app.drawing.getVisibleEntities(app.layerManager);
    for (const entity of entities) {
      PlotEngine._drawEntity(ctx, entity, app.layerManager);
    }
    ctx.restore();
  }

  static _drawEntity(ctx, entity, layerManager) {
    const fakeDrawing = {
      view: { zoom: 1, offsetX: 0, offsetY: 0 },
      worldToScreen(wx, wy) { return { x: wx, y: wy }; }
    };
    entity.draw(ctx, fakeDrawing, layerManager);
  }
}
