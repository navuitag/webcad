class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.previewEntity = null;
    this.measureLine = null;
    this.selectionRect = null;
    this.selectionWindowMode = false;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(drawing, layerManager, selectionManager, snapEngine, layoutManager, styleManager) {
    this.clear();

    if (drawing.view.showGrid) {
      this._drawGrid(drawing);
    }

    this._drawAxes(drawing);

    if (layoutManager && !layoutManager.isModelSpace()) {
      const layout = layoutManager.getCurrentLayout();
      this._drawPaperLayout(layout, drawing);
      if (layout.viewports) {
        for (const vp of layout.viewports) {
          this._drawViewport(vp, layout, drawing, layerManager, styleManager);
        }
      }
    }

    const entities = drawing.getVisibleEntities(layerManager);
    for (const entity of entities) {
      entity.draw(this.ctx, drawing, layerManager, styleManager);
    }

    if (this.previewEntity) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.6;
      this.previewEntity.draw(this.ctx, drawing, layerManager, styleManager);
      this.ctx.restore();
    }

    const selected = selectionManager.getSelected();
    for (const entity of selected) {
      entity.drawSelection(this.ctx, drawing, layerManager);
    }

    if (this.measureLine) {
      this._drawMeasureLine(drawing, this.measureLine);
    }

    if (this.selectionRect) {
      this._drawSelectionRect(drawing);
    }

    snapEngine.drawSnapIndicator(this.ctx, drawing, drawing.view, this.canvas.width, this.canvas.height);
  }

  setSelectionRect(rect, windowMode = false) {
    this.selectionRect = rect;
    this.selectionWindowMode = windowMode;
  }

  _drawSelectionRect(drawing) {
    const { x1, y1, x2, y2 } = this.selectionRect;
    const p1 = drawing.worldToScreen(Math.min(x1, x2), Math.min(y1, y2), this.canvas.width, this.canvas.height);
    const p2 = drawing.worldToScreen(Math.max(x1, x2), Math.max(y1, y2), this.canvas.width, this.canvas.height);
    const w = p2.x - p1.x;
    const h = p2.y - p1.y;
    this.ctx.save();
    this.ctx.strokeStyle = this.selectionWindowMode ? '#4fc3f7' : '#66bb6a';
    this.ctx.fillStyle = this.selectionWindowMode ? 'rgba(79, 195, 247, 0.08)' : 'rgba(102, 187, 106, 0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 3]);
    this.ctx.fillRect(p1.x, p1.y, w, h);
    this.ctx.strokeRect(p1.x, p1.y, w, h);
    this.ctx.restore();
  }

  _drawGrid(drawing) {
    const { zoom, gridSize, offsetX, offsetY } = drawing.view;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const worldLeft = (-cx - offsetX) / zoom;
    const worldRight = (w - cx - offsetX) / zoom;
    const worldTop = (cy + offsetY) / zoom;
    const worldBottom = (-(h - cy) + offsetY) / zoom;

    const startX = Math.floor(worldLeft / gridSize) * gridSize;
    const endX = Math.ceil(worldRight / gridSize) * gridSize;
    const startY = Math.floor(worldBottom / gridSize) * gridSize;
    const endY = Math.ceil(worldTop / gridSize) * gridSize;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.08)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x += gridSize) {
      const sx = x * zoom + offsetX + cx;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, 0);
      this.ctx.lineTo(sx, h);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const sy = -y * zoom + offsetY + cy;
      this.ctx.beginPath();
      this.ctx.moveTo(0, sy);
      this.ctx.lineTo(w, sy);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  _drawAxes(drawing) {
    const cx = this.canvas.width / 2 + drawing.view.offsetX;
    const cy = this.canvas.height / 2 + drawing.view.offsetY;

    this.ctx.save();
    this.ctx.lineWidth = 1;

    this.ctx.strokeStyle = 'rgba(239, 83, 80, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(cx, 0);
    this.ctx.lineTo(cx, this.canvas.height);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(102, 187, 106, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy);
    this.ctx.lineTo(this.canvas.width, cy);
    this.ctx.stroke();

    this.ctx.restore();
  }

  _drawMeasureLine(drawing, line) {
    const p1 = drawing.worldToScreen(line.x1, line.y1, this.canvas.width, this.canvas.height);
    const p2 = drawing.worldToScreen(line.x2, line.y2, this.canvas.width, this.canvas.height);
    const dist = GeometryEngine.distance(line.x1, line.y1, line.x2, line.y2);

    this.ctx.save();
    this.ctx.strokeStyle = '#ffa726';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.fillStyle = '#ffa726';
    this.ctx.font = '12px sans-serif';
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    this.ctx.fillText(GeometryEngine.formatDistance(dist), midX + 8, midY - 8);
    this.ctx.restore();
  }

  setPreview(entity) {
    this.previewEntity = entity;
  }

  setMeasureLine(line) {
    this.measureLine = line;
  }

  _drawPaperLayout(layout, drawing) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const margin = 40;
    const paperW = layout.width * drawing.view.zoom * 0.5;
    const paperH = layout.height * drawing.view.zoom * 0.5;
    const x = (w - paperW) / 2;
    const y = (h - paperH) / 2;

    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#4fc3f7';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(x, y, paperW, paperH);
    this.ctx.strokeRect(x, y, paperW, paperH);
    this.ctx.fillStyle = '#666';
    this.ctx.font = '11px sans-serif';
    this.ctx.fillText(`${layout.name} (${layout.width}x${layout.height}mm)`, x + 8, y + 16);
    this.ctx.restore();
  }

  _drawViewport(vp, layout, drawing, layerManager, styleManager) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const paperW = layout.width * drawing.view.zoom * 0.5;
    const paperH = layout.height * drawing.view.zoom * 0.5;
    const paperX = (w - paperW) / 2;
    const paperY = (h - paperH) / 2;
    const scale = drawing.view.zoom * 0.5;
    const vx = paperX + vp.x * scale;
    const vy = paperY + vp.y * scale;
    const vw = vp.width * scale;
    const vh = vp.height * scale;

    this.ctx.save();
    this.ctx.strokeStyle = '#81c784';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 3]);
    this.ctx.strokeRect(vx, vy, vw, vh);
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = 'rgba(129, 199, 132, 0.08)';
    this.ctx.fillRect(vx, vy, vw, vh);

    this.ctx.beginPath();
    this.ctx.rect(vx, vy, vw, vh);
    this.ctx.clip();

    const vpScale = (vp.scale || 0.5) * scale;
    this.ctx.translate(vx + vw / 2, vy + vh / 2);
    this.ctx.scale(vpScale, -vpScale);
    this.ctx.translate(-(vp.centerX || 0), -(vp.centerY || 0));

    const fakeDrawing = {
      view: { zoom: 1, offsetX: 0, offsetY: 0, gridSize: 10, showGrid: false },
      worldToScreen(wx, wy) { return { x: wx, y: wy }; }
    };
    const entities = drawing.entities.filter(e => {
      const layer = layerManager.getLayer(e.layerId);
      return layer && layer.visible;
    });
    for (const entity of entities) {
      entity.draw(this.ctx, fakeDrawing, layerManager, styleManager);
    }
    this.ctx.restore();
  }
}
