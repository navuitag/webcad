class WebCADApp {
  constructor() {
    this.drawing = new Drawing();
    this.layerManager = new LayerManager();
    this.selectionManager = new SelectionManager();
    this.history = new HistoryManager();
    this.snapEngine = new SnapEngine();
    this.storage = new StorageEngine();
    this.commandManager = new CommandManager(this);

    this.mode = '2d';
    this.currentTool = null;
    this.tools = {};
    this.renderScheduled = false;
    this.autosaveInterval = null;

    this._initDOM();
    this._initTools();
    this._initEvents();
    this._initPWA();
  }

  async init() {
    await this.storage.init();

    this.renderer2D = new CanvasRenderer(this.canvas);
    this.renderer3D = new ThreeRenderer(this.container3D);

    this._resize();
    this._loadAutosave();
    this._startAutosave();
    this.setTool('select');
    this._updateLayerPanel();
    this.updateStatusBar();
    this.requestRender();

    window.addEventListener('resize', () => this._resize());
  }

  _initDOM() {
    this.canvas = document.getElementById('canvas-2d');
    this.container3D = document.getElementById('canvas-3d');
    this.canvasContainer = document.getElementById('canvas-container');
    this.commandInput = document.getElementById('command-input');
    this.toolInfo = document.getElementById('tool-info');
    this.propertiesPanel = document.getElementById('properties-panel');
    this.layerList = document.getElementById('layer-list');
    this.fileInput = document.getElementById('file-input');
    this.crosshairH = document.getElementById('crosshair-h');
    this.crosshairV = document.getElementById('crosshair-v');
  }

  _initTools() {
    this.tools = {
      select: new SelectTool(this),
      line: new LineTool(this),
      polyline: new PolylineTool(this),
      circle: new CircleTool(this),
      arc: new ArcTool(this),
      rectangle: new RectangleTool(this),
      text: new TextTool(this),
      move: ModifyTools.createMoveTool(this),
      copy: ModifyTools.createCopyTool(this),
      rotate: ModifyTools.createRotateTool(this),
      scale: ModifyTools.createScaleTool(this),
      delete: new DeleteTool(this),
      dimension: new DimensionTool(this),
      distance: new DistanceTool(this),
      pan: new PanTool(this),
      zoom: new ZoomTool(this),
      box3d: new Tool3D(this, 'box3d'),
      sphere3d: new Tool3D(this, 'sphere3d'),
      cylinder3d: new Tool3D(this, 'cylinder3d'),
      cone3d: new Tool3D(this, 'cone3d')
    };
  }

  _initEvents() {
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.currentTool && this.currentTool.name === 'polyline') {
        this.currentTool._finish();
      }
    });

    document.addEventListener('keydown', (e) => this._onKeyDown(e));

    this.commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = this.commandInput.value;
        if (this.commandManager.execute(cmd)) {
          this.logCommand(cmd);
        } else if (cmd.trim()) {
          this.logCommand(`Unknown command: ${cmd}`);
        }
        this.commandInput.value = '';
      }
    });

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTool(btn.dataset.tool);
      });
    });

    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
      dropdown.querySelector('.menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.menu-dropdown').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
    });

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleMenuAction(btn.dataset.action);
      });
    });

    document.getElementById('add-layer-btn').addEventListener('click', () => this._addLayer());

    const snapCheckboxes = {
      'snap-endpoint': 'endpoint',
      'snap-midpoint': 'midpoint',
      'snap-center': 'center',
      'snap-intersection': 'intersection',
      'snap-nearest': 'nearest',
      'snap-grid': 'grid'
    };
    for (const [id, mode] of Object.entries(snapCheckboxes)) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          this.snapEngine.setMode(mode, el.checked);
        });
      }
    }

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) this._loadFile(e.target.files[0]);
      e.target.value = '';
    });

    this.selectionManager.onChange(() => {
      this.updatePropertiesPanel();
      this.requestRender();
    });
  }

  _initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  _handleMenuAction(action) {
    const actions = {
      'new': () => this.newDrawing(),
      'open': () => this.openDrawing(),
      'save': () => this.saveDrawing(),
      'save-as': () => this.storage.saveToFile(this.drawing, this.layerManager),
      'export-png': () => ExportEngine.exportPNG(this.canvas),
      'export-svg': () => ExportEngine.exportSVG(this.drawing, this.layerManager, this.canvas.width, this.canvas.height),
      'export-pdf': () => ExportEngine.exportPDF(this.canvas, this.drawing),
      'export-stl': () => {
        if (this.renderer3D.initialized) {
          ExportEngine.exportSTL(this.renderer3D.getScene(), 'model.stl');
        }
      },
      'export-obj': () => {
        if (this.renderer3D.initialized) {
          ExportEngine.exportOBJ(this.renderer3D.getScene(), 'model.obj');
        }
      },
      'undo': () => this.undo(),
      'redo': () => this.redo(),
      'delete': () => this.setTool('delete'),
      'zoom-in': () => this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 1.25),
      'zoom-out': () => this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 0.8),
      'zoom-extents': () => this.zoomExtents(),
      'toggle-grid': () => this.toggleGrid(),
      'toggle-ortho': () => this.toggleOrtho(),
      'toggle-snap': () => this.toggleSnap(),
      'mode-2d': () => this.setMode('2d'),
      'mode-3d': () => this.setMode('3d')
    };
    if (actions[action]) actions[action]();
  }

  setTool(name) {
    if (this.currentTool) {
      this.currentTool.deactivate();
    }

    this.currentTool = this.tools[name] || this.tools.select;
    this.currentTool.activate();

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === name);
    });

    this.canvasContainer.style.cursor =
      name === 'pan' ? 'grab' : name === 'select' ? 'default' : 'crosshair';
  }

  setMode(mode) {
    this.mode = mode;
    const is2D = mode === '2d';

    this.canvas.style.display = is2D ? 'block' : 'none';
    this.container3D.style.display = is2D ? 'none' : 'block';
    document.getElementById('toolbar-3d').style.display = is2D ? 'none' : 'flex';

    document.querySelectorAll('[data-action="mode-2d"], [data-action="mode-3d"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === `mode-${mode}`);
    });

    if (!is2D) {
      this.renderer3D.init();
      this.renderer3D.syncEntities(this.drawing.entities3D);
      this._resize();
    }

    document.getElementById('status-mode').textContent = mode.toUpperCase();
    this.requestRender();
  }

  _getWorldPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    return this.drawing.screenToWorld(sx, sy, this.canvas.width, this.canvas.height);
  }

  _onMouseDown(e) {
    if (this.mode !== '2d') return;
    if (e.button === 1) {
      this._panStart = { x: e.clientX, y: e.clientY };
      return;
    }
    const worldPos = this._getWorldPos(e);
    if (this.currentTool) {
      this.currentTool.onMouseDown(e, worldPos);
    }
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldPos = this.drawing.screenToWorld(sx, sy, this.canvas.width, this.canvas.height);

    this.crosshairH.style.top = sy + 'px';
    this.crosshairV.style.left = sx + 'px';

    document.getElementById('status-coords').textContent =
      `X: ${worldPos.x.toFixed(2)}  Y: ${worldPos.y.toFixed(2)}`;

    if (this._panStart) {
      const dx = e.clientX - this._panStart.x;
      const dy = e.clientY - this._panStart.y;
      this.drawing.view.offsetX += dx;
      this.drawing.view.offsetY += dy;
      this._panStart = { x: e.clientX, y: e.clientY };
      this.requestRender();
      return;
    }

    if (this.mode === '2d' && this.currentTool) {
      this.currentTool.onMouseMove(e, worldPos);
    }
  }

  _onMouseUp(e) {
    if (this._panStart) {
      this._panStart = null;
      return;
    }
    if (this.mode !== '2d') return;
    const worldPos = this._getWorldPos(e);
    if (this.currentTool) {
      this.currentTool.onMouseUp(e, worldPos);
    }
  }

  _onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.zoomAt(sx, sy, factor);
  }

  _onKeyDown(e) {
    if (e.target === this.commandInput) return;

    const shortcuts = {
      'l': 'line', 'c': 'circle', 'r': 'rectangle', 'p': 'pan',
      'm': 'move', 'Delete': 'delete', 'Backspace': 'delete',
      'Escape': 'select'
    };

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); this.undo(); return; }
      if (e.key === 'y') { e.preventDefault(); this.redo(); return; }
      if (e.key === 's') { e.preventDefault(); this.saveDrawing(); return; }
      if (e.key === 'o') { e.preventDefault(); this.openDrawing(); return; }
    }

    if (shortcuts[e.key] || shortcuts[e.key.toLowerCase()]) {
      this.setTool(shortcuts[e.key] || shortcuts[e.key.toLowerCase()]);
      return;
    }

    if (this.currentTool) {
      this.currentTool.onKeyDown(e);
    }
  }

  zoomAt(sx, sy, factor) {
    const worldBefore = this.drawing.screenToWorld(sx, sy, this.canvas.width, this.canvas.height);
    this.drawing.view.zoom *= factor;
    this.drawing.view.zoom = Math.max(0.01, Math.min(100, this.drawing.view.zoom));
    const worldAfter = this.drawing.screenToWorld(sx, sy, this.canvas.width, this.canvas.height);
    this.drawing.view.offsetX += (worldBefore.x - worldAfter.x) * this.drawing.view.zoom;
    this.drawing.view.offsetY -= (worldBefore.y - worldAfter.y) * this.drawing.view.zoom;
    this.updateStatusBar();
    this.requestRender();
  }

  zoomExtents() {
    const bb = this.drawing.getBoundingBox();
    const padding = 50;
    const w = this.canvas.width - padding * 2;
    const h = this.canvas.height - padding * 2;
    const dw = bb.maxX - bb.minX || 100;
    const dh = bb.maxY - bb.minY || 100;
    const zoom = Math.min(w / dw, h / dh);
    this.drawing.view.zoom = zoom;
    const cx = (bb.minX + bb.maxX) / 2;
    const cy = (bb.minY + bb.maxY) / 2;
    this.drawing.view.offsetX = -cx * zoom;
    this.drawing.view.offsetY = cy * zoom;
    this.updateStatusBar();
    this.requestRender();
  }

  toggleGrid() {
    this.drawing.view.showGrid = !this.drawing.view.showGrid;
    this.requestRender();
  }

  toggleOrtho() {
    this.drawing.view.ortho = !this.drawing.view.ortho;
    document.getElementById('status-ortho').textContent =
      `Ortho: ${this.drawing.view.ortho ? 'ON' : 'OFF'}`;
  }

  toggleSnap() {
    this.drawing.view.snapEnabled = !this.drawing.view.snapEnabled;
    this.snapEngine.enabled = this.drawing.view.snapEnabled;
    document.getElementById('status-snap').textContent =
      `Snap: ${this.drawing.view.snapEnabled ? 'ON' : 'OFF'}`;
  }

  undo() {
    if (this.history.undo(this.drawing, this.layerManager, this.selectionManager)) {
      this.requestRender();
      this.updateStatusBar();
      this._updateLayerPanel();
    }
  }

  redo() {
    if (this.history.redo(this.drawing, this.layerManager, this.selectionManager)) {
      this.requestRender();
      this.updateStatusBar();
      this._updateLayerPanel();
    }
  }

  newDrawing() {
    if (confirm('Tạo bản vẽ mới? Dữ liệu chưa lưu sẽ bị mất.')) {
      this.drawing = new Drawing();
      this.layerManager = new LayerManager();
      this.selectionManager.clearSelection();
      this.history.clear();
      this._updateLayerPanel();
      this.updateStatusBar();
      this.requestRender();
    }
  }

  async saveDrawing() {
    try {
      await this.storage.save(this.drawing, this.layerManager);
      this.logCommand('Đã lưu bản vẽ.');
    } catch (e) {
      this.logCommand('Lỗi khi lưu: ' + e.message);
    }
  }

  openDrawing() {
    this.fileInput.click();
  }

  async _loadFile(file) {
    try {
      const data = await this.storage.loadFromFile(file);
      this._loadDrawingData(data);
      this.logCommand(`Đã mở: ${file.name}`);
    } catch (e) {
      this.logCommand('Lỗi khi mở file: ' + e.message);
    }
  }

  _loadDrawingData(data) {
    this.layerManager = new LayerManager();
    this.drawing = Drawing.fromJSON(data, this.layerManager);
    this.selectionManager.clearSelection();
    this.history.clear();
    this._updateLayerPanel();
    this.updateStatusBar();
    if (this.renderer3D.initialized) {
      this.renderer3D.syncEntities(this.drawing.entities3D);
    }
    this.requestRender();
  }

  _loadAutosave() {
    const data = this.storage.loadAutosave();
    if (data && data.entities2D && data.entities2D.length > 0) {
      this._loadDrawingData(data);
    }
  }

  _startAutosave() {
    this.autosaveInterval = setInterval(() => {
      this.storage.autosave(this.drawing, this.layerManager);
    }, 30000);
  }

  _addLayer() {
    const name = prompt('Tên layer mới:', `Layer ${this.layerManager.layers.length}`);
    if (name) {
      const colors = ['#ff7043', '#66bb6a', '#42a5f5', '#ab47bc', '#ffa726', '#26c6da'];
      const color = colors[this.layerManager.layers.length % colors.length];
      this.layerManager.createLayer(name, color);
      this._updateLayerPanel();
    }
  }

  _updateLayerPanel() {
    this.layerList.innerHTML = '';
    for (const layer of this.layerManager.layers) {
      const count = this.drawing.getEntitiesByLayer(layer.id).length;
      const item = document.createElement('div');
      item.className = 'layer-item' + (layer.id === this.layerManager.currentLayerId ? ' active' : '');
      item.innerHTML = `
        <div class="layer-color" style="background:${layer.color}"></div>
        <span class="layer-name">${layer.name}</span>
        <span class="layer-count">${count}</span>
        <div class="layer-actions">
          <button class="layer-action-btn ${layer.visible ? '' : 'hidden'}" data-action="visibility" title="Hiện/Ẩn">${layer.visible ? '👁' : '👁‍🗨'}</button>
          <button class="layer-action-btn ${layer.locked ? 'locked' : ''}" data-action="lock" title="Khóa">${layer.locked ? '🔒' : '🔓'}</button>
          <button class="layer-action-btn" data-action="delete" title="Xóa">✕</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.layer-actions')) return;
        this.layerManager.setCurrentLayer(layer.id);
        this._updateLayerPanel();
        this.updateStatusBar();
      });

      item.querySelector('[data-action="visibility"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.layerManager.toggleVisibility(layer.id);
        this._updateLayerPanel();
        this.requestRender();
      });

      item.querySelector('[data-action="lock"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.layerManager.toggleLock(layer.id);
        this._updateLayerPanel();
      });

      item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.layerManager.deleteLayer(layer.id)) {
          this._updateLayerPanel();
          this.requestRender();
        }
      });

      this.layerList.appendChild(item);
    }
  }

  updateToolInfo(text) {
    this.toolInfo.innerHTML = `<p>${text}</p>`;
  }

  updatePropertiesPanel() {
    const selected = this.selectionManager.getSelected();
    if (selected.length === 0) {
      this.propertiesPanel.innerHTML = '<p class="empty-state">Chọn đối tượng để xem thuộc tính</p>';
      return;
    }

    const entity = selected[0];
    let html = `<div class="prop-row"><label>Loại</label><span>${entity.type}</span></div>`;
    html += `<div class="prop-row"><label>Layer</label><span>${this.layerManager.getLayer(entity.layerId)?.name || '-'}</span></div>`;

    switch (entity.type) {
      case 'LINE':
        html += `<div class="prop-row"><label>Start X</label><span>${entity.start.x.toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><label>Start Y</label><span>${entity.start.y.toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><label>End X</label><span>${entity.end.x.toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><label>End Y</label><span>${entity.end.y.toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><label>Length</label><span>${GeometryEngine.formatDistance(GeometryEngine.distance(entity.start.x, entity.start.y, entity.end.x, entity.end.y))}</span></div>`;
        break;
      case 'CIRCLE':
        html += `<div class="prop-row"><label>Center X</label><span>${entity.center.x.toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><label>Center Y</label><span>${entity.center.y.toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><label>Radius</label><span>${entity.radius.toFixed(2)}</span></div>`;
        break;
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        html += `<div class="prop-row"><label>Width</label><span>${(bb.maxX - bb.minX).toFixed(2)}</span></div>`;
        html += `<div class="prop-row"><label>Height</label><span>${(bb.maxY - bb.minY).toFixed(2)}</span></div>`;
        break;
      }
      case 'TEXT':
        html += `<div class="prop-row"><label>Text</label><span>${entity.text}</span></div>`;
        break;
      case 'DIMENSION':
        html += `<div class="prop-row"><label>Distance</label><span>${GeometryEngine.formatDistance(entity.getDistance())}</span></div>`;
        break;
    }

    this.propertiesPanel.innerHTML = html;
  }

  updateStatusBar() {
    document.getElementById('status-zoom').textContent =
      `Zoom: ${(this.drawing.view.zoom * 100).toFixed(0)}%`;
    const layer = this.layerManager.getCurrentLayer();
    document.getElementById('status-layer').textContent =
      `Layer: ${layer ? layer.name : '0'}`;
    document.getElementById('status-entities').textContent =
      `Entities: ${this.drawing.entities.length + this.drawing.entities3D.length}`;
  }

  logCommand(text) {
    const history = document.getElementById('command-history');
    const div = document.createElement('div');
    div.textContent = text;
    history.appendChild(div);
    history.classList.add('visible');
    setTimeout(() => history.classList.remove('visible'), 3000);
  }

  requestRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.renderScheduled = false;
      if (this.mode === '2d') {
        this.renderer2D.render(
          this.drawing, this.layerManager,
          this.selectionManager, this.snapEngine
        );
      } else if (this.renderer3D.initialized) {
        this.renderer3D.render();
      }
    });
  }

  _resize() {
    const container = this.canvasContainer;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer2D.resize(w, h);
    if (this.renderer3D.initialized) {
      this.renderer3D.resize(w, h);
    }
    this.requestRender();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new WebCADApp();
  app.init();
  window.webcad = app;
});
