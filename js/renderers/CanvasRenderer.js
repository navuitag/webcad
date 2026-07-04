class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.previewEntity = null;
    this.measureLine = null;
    this.liveMeasures = [];
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

    if (drawing.view.showDimensions && typeof EntityDimensionOverlay !== 'undefined') {
      this._drawEntityDimensionLabels(drawing, layerManager);
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
    if (selected.length === 1 && typeof SelectionResizeEngine !== 'undefined'
      && SelectionResizeEngine.canResize(selected[0])) {
      SelectionResizeEngine.drawHandles(this.ctx, drawing, selected[0]);
    }

    if (this.liveMeasures.length) {
      this._drawLiveMeasures(drawing);
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
    this._drawMeasureSegment(drawing, line.x1, line.y1, line.x2, line.y2, null);
  }

  _drawMeasureSegment(drawing, x1, y1, x2, y2, label) {
    const p1 = drawing.worldToScreen(x1, y1, this.canvas.width, this.canvas.height);
    const p2 = drawing.worldToScreen(x2, y2, this.canvas.width, this.canvas.height);
    const dist = GeometryEngine.distance(x1, y1, x2, y2);
    const text = label || GeometryKernel.formatDistance(
      dist, drawing.unit, 2, drawing.worldUnit || drawing.unit
    );

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
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    this._drawMeasureLabel(text, midX, midY - 6);
    this.ctx.restore();
  }

  _drawMeasureLabel(text, x, y) {
    const padX = 6;
    const padY = 3;
    const metrics = this.ctx.measureText(text);
    const w = metrics.width + padX * 2;
    const h = 14 + padY * 2;
    this.ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
    this.ctx.fillRect(x - w / 2, y - h, w, h);
    this.ctx.fillStyle = '#ffa726';
    this.ctx.fillText(text, x, y - padY);
  }

  _drawEntityDimensionLabels(drawing, layerManager) {
    const labels = EntityDimensionOverlay.collect(drawing, layerManager, null);
    const color = DimensionEngine.COLOR;
    for (const item of labels) {
      const p = drawing.worldToScreen(item.x, item.y, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const padX = 6;
      const padY = 4;
      const metrics = this.ctx.measureText(item.text);
      const w = metrics.width + padX * 2;
      const h = 14 + padY * 2;
      this.ctx.fillStyle = 'rgba(13, 17, 23, 0.82)';
      this.ctx.fillRect(p.x - w / 2, p.y - h / 2, w, h);
      this.ctx.fillStyle = color;
      this.ctx.fillText(item.text, p.x, p.y);
      this.ctx.restore();
    }
  }

  _drawLiveMeasures(drawing) {
    for (const item of this.liveMeasures) {
      if (item.kind === 'segment') {
        this._drawMeasureSegment(drawing, item.x1, item.y1, item.x2, item.y2, item.label);
      } else if (item.kind === 'label') {
        const p = drawing.worldToScreen(item.x, item.y, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = item.align || 'center';
        this.ctx.textBaseline = 'bottom';
        this._drawMeasureLabel(item.text, p.x, p.y + (item.offsetY || -8));
        this.ctx.restore();
      }
    }
  }

  setPreview(entity) {
    this.previewEntity = entity;
  }

  setMeasureLine(line) {
    this.measureLine = line;
    if (line) {
      this.setLiveMeasures([{
        kind: 'segment',
        x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2
      }]);
    } else {
      this.setLiveMeasures([]);
    }
  }

  setLiveMeasures(measures) {
    this.liveMeasures = measures || [];
    if (!this.liveMeasures.length) this.measureLine = null;
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
