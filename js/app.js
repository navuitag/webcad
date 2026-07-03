class WebCADApp {
  constructor() {
    this.drawing = new Drawing();
    this.layerManager = new LayerManager();
    this.selectionManager = new SelectionManager();
    this.selectionManager3D = new SelectionManager();
    this.history = new HistoryManager();
    this.snapEngine = new SnapEngine();
    this.storage = new StorageEngine();
    this.blockManager = new BlockManager();
    this.layoutManager = new LayoutManager();
    this.commandManager = new CommandManager(this);
    this.directInput = new DirectInput(this);

    this.cloudStorage = null;
    this.collaboration = null;
    this.pluginManager = null;
    this.aiAssistant = null;
    this.cadViewer = null;
    this.toolbar = null;

    this.mode = '2d';
    this.currentTool = null;
    this.tools = {};
    this.renderScheduled = false;
    this.autosaveInterval = null;
    this._ready = false;

    this._initDOM();
    this._initTools();
    this._initEvents();
    this._initResponsive();
    this._initPWA();
  }

  async init() {
    await this.storage.init();
    if (window.ThreeBootstrap?.ready) await window.ThreeBootstrap.ready;

    this.cloudStorage = new CloudStorageEngine(this.storage);
    await this.cloudStorage.init();
    this.collaboration = new CollaborationEngine(this);
    this.collaboration.init();
    this._initCollabUI();
    this.pluginManager = new PluginManager(this);
    this.pluginManager.loadBuiltIn();
    this.aiAssistant = new AiAssistant(this);
    this.cadViewer = new CadViewer(this);
    this.features = null;

    this.renderer2D = new CanvasRenderer(this.canvas);
    this.renderer3D = new ThreeRenderer(this.container3D);

    this.platform = new WebCADPlatform(this);
    await this.platform.boot();
    this.platform.attachPlugins(this.pluginManager);
    this.cadCore = this.platform.cad.core;
    this.features = new FeaturesHub(this);

    this._resize();
    this._loadAutosave();
    if (typeof AutoDimensionEngine !== 'undefined') {
      AutoDimensionEngine.purgeAutoDimensions(this);
    }
    this._startAutosave();
    this.setTool('select');
    this._updateLayerPanel();
    this._updateBlockPanel();
    this._updateLayoutPanel();
    this._updateCloudPanel();
    this._updatePluginPanel();
    this._updateStylesPanel();
    this._update3DPanel();
    this._initAiPanel();
    this._initFeaturesPanel();
    this._updateOfflineStatus();
    window.addEventListener('online', () => this._updateOfflineStatus());
    window.addEventListener('offline', () => this._updateOfflineStatus());
    this._checkShareLink();
    this.updateCollabStatus();
    this._updateCanvasViewToggles();
    this.updateStatusBar();
    this.requestRender();

    window.addEventListener('resize', () => this._resize());
    this._ready = true;
  }

  _initDOM() {
    this.canvas = document.getElementById('canvas-2d');
    this.container3D = document.getElementById('canvas-3d');
    this.canvasContainer = document.getElementById('canvas-container');
    this.commandInput = document.getElementById('command-input');
    this.toolInfo = document.getElementById('tool-info');
    this.propertiesPanel = document.getElementById('properties-panel');
    this.layerList = document.getElementById('layer-list');
    this.blockList = document.getElementById('block-list');
    this.layoutList = document.getElementById('layout-list');
    this.fileInput = document.getElementById('file-input');
    this.dxfInput = document.getElementById('dxf-input');
    this.importInput = document.getElementById('import-input');
    this.viewerInput = document.getElementById('viewer-input');
    this.toolbar = document.getElementById('toolbar');
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
      cone3d: new Tool3D(this, 'cone3d'),
      extrude: new ExtrudeTool(this),
      boolean3d: new BooleanTool3D(this),
      offset: new OffsetTool(this),
      trim: new TrimTool(this),
      extend: new ExtendTool(this),
      fillet: new FilletTool(this),
      mirror: new MirrorTool(this),
      'block-create': new BlockTool(this, 'create'),
      'block-insert': new BlockTool(this, 'insert'),
      chamfer: new ChamferTool(this),
      array: new ArrayTool(this),
      stretch: new StretchTool(this),
      explode: new ExplodeTool(this),
      join: new JoinTool(this),
      break: new BreakTool(this),
      divide: new DivideTool(this),
      measure: new MeasureTool(this),
      hatch: new HatchTool(this),
      'insert-template': new InsertTemplateTool(this),
      wall: new WallTool(this),
      'open-wall': new OpenWallTool(this),
      room: ArchDrawTools.createRoomTool(this),
      'open-floor': ArchDrawTools.createOpenFloorTool(this),
      'open-ceiling': ArchDrawTools.createOpenCeilingTool(this),
      column: ArchDrawTools.createColumnTool(this),
      'round-column': new RoundColumnTool(this)
    };
    this._templateCategory = 'all';
    this._archTemplateCategory = 'house';
  }

  startInsertTemplate(id) {
    this.tools['insert-template'].setTemplate(id);
    this.setTool('insert-template');
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
      if (btn.closest('.features-panel')) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleMenuAction(btn.dataset.action);
      });
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.features-panel [data-action]');
      if (!btn) return;
      e.stopPropagation();
      this._handleMenuAction(btn.dataset.action);
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

    if (this.dxfInput) {
      this.dxfInput.addEventListener('change', (e) => {
        if (e.target.files[0]) this._importFile(e.target.files[0]);
        e.target.value = '';
      });
    }

    if (this.importInput) {
      this.importInput.addEventListener('change', (e) => {
        if (e.target.files[0]) this._importFile(e.target.files[0]);
        e.target.value = '';
      });
    }

    if (this.viewerInput) {
      this.viewerInput.addEventListener('change', (e) => {
        if (e.target.files[0]) this.cadViewer.openFile(e.target.files[0]);
        e.target.value = '';
      });
    }

    document.getElementById('cloud-save-btn')?.addEventListener('click', () => this.saveToCloud());
    document.getElementById('cloud-share-btn')?.addEventListener('click', () => this.createShareLink());

    document.getElementById('ai-send-btn')?.addEventListener('click', () => this._sendAiMessage());
    document.getElementById('ai-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._sendAiMessage();
    });

    document.getElementById('add-layout-btn')?.addEventListener('click', () => {
      const name = prompt('Tên layout:', `Layout${this.layoutManager.layouts.length}`);
      if (name) {
        this.layoutManager.addLayout(name);
        this._updateLayoutPanel();
      }
    });

    this.selectionManager.onChange(() => {
      this.updatePropertiesPanel();
      this.updateStatusBar();
      this.requestRender();
    });

    this.selectionManager3D.onChange(() => {
      this._update3DSelectionHighlight();
      this.updatePropertiesPanel();
      this.updateStatusBar();
    });
  }

  _initResponsive() {
    this.leftPanel = document.querySelector('.left-panel');
    this.rightPanel = document.querySelector('.right-panel');
    this.panelBackdrop = document.getElementById('panel-backdrop');

    document.getElementById('menu-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelector('.menu-bar')?.classList.toggle('menu-expanded');
    });

    document.getElementById('toggle-left-panel')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleSidePanel('left');
    });

    document.getElementById('toggle-right-panel')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleSidePanel('right');
    });

    this.panelBackdrop?.addEventListener('click', () => this._closeSidePanels());

    document.addEventListener('click', (e) => {
      if (!document.querySelector('.menu-bar')?.classList.contains('menu-expanded')) return;
      if (e.target.closest('.menu-bar')) return;
      document.querySelector('.menu-bar')?.classList.remove('menu-expanded');
    });

    window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
      if (e.matches) this._closeSidePanels();
    });

    if (typeof ResizeObserver !== 'undefined' && this.canvasContainer) {
      this._resizeObserver = new ResizeObserver(() => this._resize());
      this._resizeObserver.observe(this.canvasContainer);
    }

    window.visualViewport?.addEventListener('resize', () => {
      clearTimeout(this._viewportResizeTimer);
      this._viewportResizeTimer = setTimeout(() => this._resize(), 100);
    });
  }

  _toggleSidePanel(side) {
    const panel = side === 'left' ? this.leftPanel : this.rightPanel;
    const other = side === 'left' ? this.rightPanel : this.leftPanel;
    if (!panel) return;
    const opening = !panel.classList.contains('panel-open');
    other?.classList.remove('panel-open');
    panel.classList.toggle('panel-open', opening);
    this.panelBackdrop?.classList.toggle('visible', opening);
    this.panelBackdrop?.setAttribute('aria-hidden', opening ? 'false' : 'true');
    if (opening) setTimeout(() => this._resize(), 280);
  }

  _closeSidePanels() {
    this.leftPanel?.classList.remove('panel-open');
    this.rightPanel?.classList.remove('panel-open');
    this.panelBackdrop?.classList.remove('visible');
    this.panelBackdrop?.setAttribute('aria-hidden', 'true');
    this._resize();
  }

  _initCollabUI() {
    if (!this.collaboration) return;

    document.getElementById('collab-sync-btn')?.addEventListener('click', () => this.collaboration.broadcastFullSync());
    document.getElementById('collab-connect-btn')?.addEventListener('click', () => {
      const url = document.getElementById('collab-ws-url')?.value;
      if (url) this.collaboration.connect(url);
    });
    document.getElementById('collab-username')?.addEventListener('change', (e) => {
      this.collaboration.setUserName(e.target.value);
    });

    const usernameInput = document.getElementById('collab-username');
    if (usernameInput && !usernameInput.value) {
      usernameInput.value = this.collaboration.userName;
    }

    this.collaboration.onEvent(() => this.updateCollabStatus());
  }

  _initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  _handleMenuAction(action) {
    if (!this._ready) {
      this.logCommand('Đang khởi tạo, vui lòng đợi...');
      return;
    }
    const actions = {
      'new': () => this.newDrawing(),
      'open': () => this.openDrawing(),
      'save': () => this.saveDrawing(),
      'save-as': () => this._exportFormat('wcad'),
      'export-wcad': () => this._exportFormat('wcad'),
      'export-png': () => this._exportFormat('png'),
      'export-svg': () => this._exportFormat('svg'),
      'export-pdf': () => this._exportFormat('pdf'),
      'export-dxf': () => this._exportFormat('dxf'),
      'import-dxf': () => this._openImportDialog(['dxf']),
      'import-3d': () => this._openImportDialog(['obj', 'stl', 'gltf']),
      'import-file': () => this._openImportDialog(),
      'print': () => {
        if (!this.layoutManager.isModelSpace()) {
          this.cadCore.run('PLOT', {});
        } else {
          ExportEngine.print(this.canvas, this.drawing);
        }
      },
      'plot': () => this.cadCore.run('PLOT', {}),
      'template-a4': () => this.cadCore.run('LOAD_TEMPLATE', { name: 'A4-Metric' }),
      'template-a3': () => this.cadCore.run('LOAD_TEMPLATE', { name: 'A3-Architectural' }),
      'attach-xref': () => this._attachXref(),
      'export-stl': () => this._exportFormat('stl'),
      'export-obj': () => this._exportFormat('obj'),
      'export-gltf': () => this._exportFormat('gltf'),
      'export-tech-pdf': () => this._exportTechnicalPdf(),
      'auto-dimension': () => {
        const r = this.features.autoDimension(true);
        this.logCommand(`Auto DIM: ${r.count} kích thước.`);
      },
      'qa-check': () => {
        const r = this.features.aiCheck();
        this.logCommand(r.message);
        alert(r.message);
      },
      'import-sketch': () => document.getElementById('sketch-input')?.click(),
      'convert-plan-view': () => {
        const sel = this.selectionManager.getSelected();
        const r = this.features.convertToPlanView(sel.length > 0);
        this.logCommand(r.message);
      },
      'share-link': () => this.createShareLink(),
      'undo': () => this.undo(),
      'redo': () => this.redo(),
      'delete': () => this.setTool('delete'),
      'zoom-in': () => this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 1.25),
      'zoom-out': () => this.zoomAt(this.canvas.width / 2, this.canvas.height / 2, 0.8),
      'zoom-extents': () => this.zoomExtents(),
      'toggle-grid': () => this.toggleGrid(),
      'toggle-ortho': () => this.toggleOrtho(),
      'toggle-snap': () => this.toggleSnap(),
      'toggle-dimensions': () => this.toggleDimensions(),
      'mode-2d': () => this.setMode('2d'),
      'mode-3d': () => this.setMode('3d'),
      'block-create': () => this.setTool('block-create'),
      'block-insert': () => this.setTool('block-insert'),
      'offset': () => this.setTool('offset'),
      'trim': () => this.setTool('trim'),
      'extend': () => this.setTool('extend'),
      'fillet': () => this.setTool('fillet'),
      'chamfer': () => this.setTool('chamfer'),
      'array': () => this.setTool('array'),
      'stretch': () => this.setTool('stretch'),
      'explode': () => this.setTool('explode'),
      'join': () => this.setTool('join'),
      'break': () => this.setTool('break'),
      'divide': () => this.setTool('divide'),
      'measure': () => this.setTool('measure'),
      'hatch': () => this.setTool('hatch'),
      'mirror': () => this.setTool('mirror'),
      'open-viewer': () => this.viewerInput?.click(),
      'cloud-save': () => this.saveToCloud(),
      'cloud-share': () => this.createShareLink(),
      'cloud-sync': () => this.saveToCloud(),
      'cloud-settings': () => {
        const url = prompt('Cloud API URL (để trống = chỉ local):', this.cloudStorage.apiUrl);
        if (url !== null) this.cloudStorage.setApiUrl(url);
      },
      'collab-sync': () => this.collaboration.broadcastFullSync(),
      'collab-connect': () => {
        const url = prompt('WebSocket server URL:', document.getElementById('collab-ws-url')?.value || 'ws://localhost:8081');
        if (url) this.collaboration.connect(url);
      },
      'collab-disconnect': () => this.collaboration.disconnect(),
      'plugins-panel': () => this._updatePluginPanel()
    };
    if (actions[action]) actions[action]();
  }

  setTool(name) {
    if (this.cadViewer?.isReadOnly() && !['pan', 'zoom', 'select'].includes(name)) {
      this.logCommand('Viewer mode: chỉ Pan/Zoom.');
      return;
    }
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

  async setMode(mode) {
    this.mode = mode;
    const is2D = mode === '2d';

    this.canvas.style.display = is2D ? 'block' : 'none';
    this.container3D.style.display = is2D ? 'none' : 'block';
    document.getElementById('toolbar-3d').style.display = is2D ? 'none' : 'flex';
    document.getElementById('toolbar-2d-extrude')?.style.setProperty('display', is2D ? 'flex' : 'none');

    document.querySelectorAll('[data-action="mode-2d"], [data-action="mode-3d"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === `mode-${mode}`);
    });

    if (!is2D) {
      const sync = ModeConversionEngine.onEnter3D(this);
      if (sync.created || sync.updated) {
        this.logCommand(`2D→3D: ${sync.created} mới, ${sync.updated} cập nhật.`);
      } else if (this.drawing.entities.length > 0) {
        this.logCommand('2D→3D: Không có hình kín để extrude (hatch, rectangle, polyline đóng, circle).');
      }
      await this.renderer3D.init();
      this.renderer3D.setLightingPreset('studio');
      this.renderer3D.syncEntities(this.drawing.entities3D);
      this._bind3DEvents();
      this.renderer3D.setLoopActive(true);
      this._resize();
      this._update3DPanel();
      if (this.drawing.entities3D.length > 0) this.renderer3D.fitView();
      this._update3DSelectionHighlight();
    } else {
      this.renderer3D.setLoopActive(false);
      const sync = ModeConversionEngine.onEnter2D(this);
      if (sync.created || sync.updated) {
        this.logCommand(`3D→2D: ${sync.created} mới, ${sync.updated} cập nhật.`);
      }
      this._updateLayerPanel();
      this.requestRender();
    }

    document.getElementById('status-mode').textContent = mode.toUpperCase();
    const backend = this.renderer3D.initialized ? this.renderer3D.backend.toUpperCase() : '';
    document.getElementById('status-3d-backend').textContent = backend ? `3D: ${backend}` : '';
    this.requestRender();
  }

  _bind3DEvents() {
    if (this._3dEventsBound || !this.renderer3D.renderer) return;
    const el = this.renderer3D.renderer.domElement;
    el.style.touchAction = 'none';

    let dragStart = null;
    el.addEventListener('pointerdown', (e) => {
      if (this.mode !== '3d') return;
      dragStart = { x: e.clientX, y: e.clientY };
    });
    el.addEventListener('pointerup', (e) => {
      if (this.mode !== '3d' || e.button !== 0 || !dragStart) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      dragStart = null;
      if (Math.hypot(dx, dy) > 5) return;

      if (this.currentTool?.onMouseDown3D) {
        this.currentTool.onMouseDown3D(e);
      } else if (this.currentTool?.name === 'select') {
        new SelectTool3D(this).onMouseDown3D(e);
      }
    });

    this._3dEventsBound = true;
  }

  _update3DPanel() {
    const panel = document.getElementById('panel-3d');
    if (!panel || !this.renderer3D.initialized) return;
    const r = this.renderer3D;
    const st = r.getStatus();
    panel.innerHTML = `
      <div class="prop-row"><label>Renderer</label><span>${st.backend}</span></div>
      <div class="prop-row"><label>Material</label>
        <select id="3d-material">${r.materialManager.listPresets().map(p =>
          `<option value="${p}">${p}</option>`).join('')}</select></div>
      <div class="prop-row"><label>Lighting</label>
        <select id="3d-lighting"><option value="studio">Studio</option><option value="outdoor">Outdoor</option><option value="flat">Flat</option></select></div>
      <div class="prop-row"><label>Camera</label>
        <select id="3d-camera"><option value="perspective">Perspective</option><option value="orthographic">Orthographic</option></select></div>
      <div class="prop-row"><label>View</label>
        <select id="3d-view-preset"><option value="home">Home</option><option value="top">Top</option><option value="front">Front</option><option value="right">Right</option><option value="iso">Iso</option></select></div>
      <div class="prop-row"><label>Section</label>
        <select id="3d-section-axis"><option value="x">X</option><option value="y" selected>Y</option><option value="z">Z</option></select></div>
      <div class="prop-row"><label>Section offset</label><input type="range" id="3d-section-offset" min="-10" max="10" step="0.5" value="0"></div>
      <div class="prop-row"><label>Section on</label><input type="checkbox" id="3d-section-enable"></div>
      <div class="prop-actions">
        <button type="button" id="3d-reset-view">Reset view</button>
        <button type="button" id="3d-fit-view">Fit view</button>
      </div>
      <p class="orbit-hint">Chuột trái: xoay 360° · Giữa: zoom · Phải: pan</p>
    `;
    document.getElementById('3d-material')?.addEventListener('change', (e) => {
      r.setMaterialPreset(e.target.value);
    });
    document.getElementById('3d-lighting')?.addEventListener('change', (e) => {
      r.setLightingPreset(e.target.value);
      this.requestRender();
    });
    document.getElementById('3d-camera')?.addEventListener('change', (e) => {
      r.setCameraMode(e.target.value);
      this.requestRender();
    });
    document.getElementById('3d-view-preset')?.addEventListener('change', (e) => {
      r.setCameraPreset(e.target.value);
      this.requestRender();
    });
    document.getElementById('3d-reset-view')?.addEventListener('click', () => {
      r.resetView();
      const preset = document.getElementById('3d-view-preset');
      if (preset) preset.value = 'home';
      this.requestRender();
    });
    document.getElementById('3d-section-axis')?.addEventListener('change', (e) => {
      const off = parseFloat(document.getElementById('3d-section-offset').value);
      r.setSection(e.target.value, off);
      this.requestRender();
    });
    document.getElementById('3d-section-offset')?.addEventListener('input', (e) => {
      const axis = document.getElementById('3d-section-axis').value;
      r.setSection(axis, parseFloat(e.target.value));
      this.requestRender();
    });
    document.getElementById('3d-section-enable')?.addEventListener('change', (e) => {
      r.toggleSection(e.target.checked);
      this.requestRender();
    });
    document.getElementById('3d-fit-view')?.addEventListener('click', () => {
      r.fitView();
      this.requestRender();
    });
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

    if (this.directInput?.handleKeyDown(e)) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (this._deleteSelection()) return;
      this.setTool('delete');
      return;
    }

    const shortcuts = {
      'l': 'line', 'c': 'circle', 'r': 'rectangle', 'p': 'pan',
      'm': 'move',
      'Escape': 'select'
    };

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); this.undo(); return; }
      if (e.key === 'y') { e.preventDefault(); this.redo(); return; }
      if (e.key === 's') { e.preventDefault(); this.saveDrawing(); return; }
      if (e.key === 'o') { e.preventDefault(); this.openDrawing(); return; }
      if (e.key === 'p') { e.preventDefault(); ExportEngine.print(this.canvas, this.drawing); return; }
      if (e.key === 'a') {
        e.preventDefault();
        this._selectAll();
        return;
      }
      if (e.key === '/' && this._aiShortcutEnabled !== false) {
        e.preventDefault();
        document.getElementById('ai-input')?.focus();
        return;
      }
    }

    if (!this.directInput?.isActive()) {
      if (shortcuts[e.key] || shortcuts[e.key.toLowerCase()]) {
        this.setTool(shortcuts[e.key] || shortcuts[e.key.toLowerCase()]);
        return;
      }
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

  formatDistance(value, decimals = 2) {
    return UnitEngine.format(
      value,
      this.drawing.unit,
      this.drawing.worldUnit || this.drawing.unit,
      decimals
    );
  }

  setDrawingUnits(displayUnit, worldUnit) {
    if (!UnitEngine.UNITS[displayUnit]) return;
    this.drawing.unit = displayUnit;
    if (worldUnit && UnitEngine.UNITS[worldUnit]) {
      this.drawing.worldUnit = worldUnit;
    }
    this._updateStylesPanel();
    this.updateStatusBar();
    this.requestRender();
  }

  zoomExtents() {
    if (this.mode === '3d') {
      if (this.renderer3D?.initialized) {
        this.renderer3D.resetView();
      }
      return;
    }
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
    this._updateCanvasViewToggles();
    this.requestRender();
  }

  toggleOrtho() {
    this.drawing.view.ortho = !this.drawing.view.ortho;
    document.getElementById('status-ortho').textContent =
      `Ortho: ${this.drawing.view.ortho ? 'ON' : 'OFF'}`;
    this._updateCanvasViewToggles();
  }

  toggleSnap() {
    this.drawing.view.snapEnabled = !this.drawing.view.snapEnabled;
    this.snapEngine.enabled = this.drawing.view.snapEnabled;
    document.getElementById('status-snap').textContent =
      `Snap: ${this.drawing.view.snapEnabled ? 'ON' : 'OFF'}`;
    this._updateCanvasViewToggles();
  }

  toggleDimensions() {
    this.drawing.view.showDimensions = !this.drawing.view.showDimensions;
    document.getElementById('status-dimensions').textContent =
      `Dim: ${this.drawing.view.showDimensions ? 'ON' : 'OFF'}`;
    this._updateCanvasViewToggles();
    this.requestRender();
  }

  _updateCanvasViewToggles() {
    const v = this.drawing?.view;
    if (!v) return;
    document.querySelectorAll('[data-view-toggle]').forEach((btn) => {
      const key = btn.dataset.viewToggle;
      const on = key === 'grid' ? v.showGrid
        : key === 'ortho' ? v.ortho
        : key === 'snap' ? v.snapEnabled
        : key === 'dimensions' ? v.showDimensions
        : false;
      btn.classList.toggle('active', !!on);
    });
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

  newDrawing(skipConfirm = false) {
    if (!skipConfirm && !confirm('Tạo bản vẽ mới? Dữ liệu chưa lưu sẽ bị mất.')) return;
    if (!this.cadCore) return;
    this.drawing = new Drawing();
    this.layerManager = new LayerManager();
    this.blockManager = new BlockManager();
    this.layoutManager = new LayoutManager();
    this.cadCore.styles = new StyleManager();
    this.cadCore.xrefs = new XrefManager();
    this.cadCore.syncDrawing(this.drawing);
    this.cadCore.syncManagers(this.layerManager, this.blockManager, this.layoutManager);
    this.selectionManager.clearSelection();
    this.history.clear();
    this._updateLayerPanel();
    this._updateBlockPanel();
    this._updateLayoutPanel();
    this._updateStylesPanel();
    this._updateCanvasViewToggles();
    if (this.renderer3D?.initialized) {
      this.renderer3D.syncEntities(this.drawing.entities3D);
    }
    this.updateStatusBar();
    this.requestRender();
  }

  async _attachXref() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wcad.json,.wcad,.json';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const data = await this.storage.loadFromFile(file);
        const name = prompt('Tên Xref:', file.name.replace(/\.[^.]+$/, ''));
        if (!name) return;
        this.cadCore.run('ATTACH_XREF', { name, data, insertPoint: { x: 0, y: 0 } });
        this.logCommand(`Xref attached: ${name}`);
      } catch (e) {
        this.logCommand('Xref error: ' + e.message);
      }
    };
    input.click();
  }

  async saveDrawing() {
    try {
      await this.storage.save(
        this.drawing, this.layerManager, this.blockManager, this.layoutManager,
        this.cadCore.styles, this.cadCore.xrefs
      );
      this.platform?.collab?.onSave();
      this.platform?.collab?.versions?.snapshot('Auto-save');
      this.logCommand('Đã lưu bản vẽ.');
    } catch (e) {
      this.logCommand('Lỗi khi lưu: ' + e.message);
    }
  }

  openDrawing() {
    this.importInput.accept = FormatRegistry.importAccept();
    this.importInput.click();
  }

  async _exportFormat(formatId) {
    const result = await this.cadCore.fileFormat.exportFormat(this, formatId);
    if (result.success) {
      this.logCommand(`Xuất ${result.filename}`);
    } else {
      this.logCommand(`Lỗi xuất file: ${result.message}`);
    }
    return result;
  }

  _openImportDialog(formatIds) {
    const input = this.importInput || this.fileInput;
    if (formatIds && formatIds.length) {
      input.accept = FormatRegistry.acceptAttribute(formatIds);
    } else {
      input.accept = FormatRegistry.importAccept();
    }
    input.click();
  }

  async _importFile(file) {
    try {
      const result = await this.cadCore.fileFormat.importFile(this, file);
      if (result.success) {
        const detail = result.entities != null ? ` (${result.entities} entities)` : '';
        this.logCommand(`Đã nhập ${file.name}${detail}`);
      } else {
        this.logCommand(`Lỗi nhập file: ${result.message}`);
      }
    } catch (e) {
      this.logCommand('Lỗi nhập file: ' + e.message);
    }
  }

  async _loadFile(file) {
    await this._importFile(file);
  }

  _loadDrawingData(data) {
    this.layerManager = new LayerManager();
    this.blockManager = new BlockManager();
    this.layoutManager = new LayoutManager();
    this.drawing = Drawing.fromJSON(
      data, this.layerManager, this.blockManager, this.layoutManager,
      this.cadCore.styles, this.cadCore.xrefs
    );
    this.cadCore.syncDrawing(this.drawing);
    this.cadCore.syncManagers(this.layerManager, this.blockManager, this.layoutManager);
    this.selectionManager.clearSelection();
    this.history.clear();
    this._updateLayerPanel();
    this._updateBlockPanel();
    this._updateLayoutPanel();
    this._updateStylesPanel();
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
      this.storage.autosave(
        this.drawing, this.layerManager, this.blockManager, this.layoutManager,
        this.cadCore.styles, this.cadCore.xrefs
      );
    }, 30000);
  }

  async _importDxf(file, replace = false) {
    try {
      const text = await file.text();
      if (replace) {
        this.drawing.entities = [];
      }
      const entities = DxfEngine.import(text, this.layerManager);
      for (const entity of entities) {
        this.drawing.addEntity(entity);
      }
      this._updateLayerPanel();
      this.requestRender();
      this.updateStatusBar();
      this.logCommand(`DXF: Đã import ${entities.length} entities.`);
    } catch (e) {
      this.logCommand('Lỗi import DXF: ' + e.message);
    }
  }

  switchLayout(layoutId) {
    this.layoutManager.setCurrentLayout(layoutId);
    this._updateLayoutPanel();
    if (!this.layoutManager.isModelSpace()) {
      const layout = this.layoutManager.getCurrentLayout();
      this.logCommand(`Layout: ${layout.name} (${layout.width}x${layout.height}mm)`);
    }
    this.requestRender();
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
          <button class="layer-action-btn ${layer.visible ? '' : 'hidden'}" data-layer-action="visibility" title="Hiện/Ẩn">${layer.visible ? '👁' : '👁‍🗨'}</button>
          <button class="layer-action-btn ${layer.locked ? 'locked' : ''}" data-layer-action="lock" title="Khóa">${layer.locked ? '🔒' : '🔓'}</button>
          <button class="layer-action-btn" data-layer-action="delete" title="Xóa">✕</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.layer-actions')) return;
        this.layerManager.setCurrentLayer(layer.id);
        this._updateLayerPanel();
        this.updateStatusBar();
      });

      item.querySelector('[data-layer-action="visibility"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.layerManager.toggleVisibility(layer.id);
        this._updateLayerPanel();
        this.requestRender();
      });

      item.querySelector('[data-layer-action="lock"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.layerManager.toggleLock(layer.id);
        this._updateLayerPanel();
      });

      item.querySelector('[data-layer-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.layerManager.deleteLayer(layer.id)) {
          this._updateLayerPanel();
          this.requestRender();
        }
      });

      this.layerList.appendChild(item);
    }
  }

  _updateBlockPanel() {
    if (!this.blockList) return;
    this.blockList.innerHTML = '';
    const blocks = this.blockManager.listBlocks();
    if (blocks.length === 0) {
      this.blockList.innerHTML = '<p class="empty-state">Chưa có block</p>';
      return;
    }
    for (const block of blocks) {
      const item = document.createElement('div');
      item.className = 'layer-item';
      item.innerHTML = `
        <span class="layer-name">${block.name}</span>
        <span class="layer-count">${block.entities.length}</span>
      `;
      item.addEventListener('dblclick', () => {
        this.setTool('block-insert');
        this.tools['block-insert'].blockName = block.name;
        this.tools['block-insert'].step = 1;
        this.updateToolInfo('INSERT: Chọn vị trí chèn.');
      });
      this.blockList.appendChild(item);
    }
  }

  _updateLayoutPanel() {
    if (!this.layoutList) return;
    this.layoutList.innerHTML = '';
    for (const layout of this.layoutManager.layouts) {
      const item = document.createElement('div');
      item.className = 'layer-item' + (layout.id === this.layoutManager.currentLayoutId ? ' active' : '');
      item.innerHTML = `<span class="layer-name">${layout.name}</span><span class="layer-count">${layout.type}</span>`;
      item.addEventListener('click', () => this.switchLayout(layout.id));
      this.layoutList.appendChild(item);
    }
  }

  async saveToCloud() {
    try {
      const result = await this.cloudStorage.saveToCloud(
        this.drawing, this.layerManager, this.blockManager, this.layoutManager
      );
      let msg = 'Đã lưu lên Cloud (local).';
      if (result.remote) msg += ' Đã sync remote.';
      else if (result.error) msg += ` Remote lỗi: ${result.error}`;
      this.logCommand(msg);
      this._updateCloudPanel();
    } catch (e) {
      this.logCommand('Cloud lỗi: ' + e.message);
    }
  }

  createShareLink() {
    const link = this.cloudStorage.generateShareLink(
      this.drawing, this.layerManager, this.blockManager, this.layoutManager
    );
    const input = document.getElementById('share-link');
    if (input) {
      input.value = link;
      input.select();
      navigator.clipboard?.writeText(link);
    }
    this.logCommand('Link chia sẻ đã tạo (copied).');
  }

  _exportTechnicalPdf() {
    if (!this.features) return;
    const r = this.features.exportTechnicalPdf();
    this.logCommand(r.success ? `Đã xuất ${r.filename}` : r.message);
  }

  _initFeaturesPanel() {
    this._renderTemplateLibrary();
    this._renderArchTemplateLibrary();
    this._renderArchDrawGrid();
    const sketchInput = document.getElementById('sketch-input');
    if (sketchInput) {
      sketchInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const r = await this.features.importSketch(file);
          this.logCommand(r.message || 'Đã import phác thảo.');
        } catch (err) {
          this.logCommand('Import phác thảo lỗi: ' + err.message);
        }
        e.target.value = '';
      });
    }
    const floorBtn = document.getElementById('btn-floor-plan');
    if (floorBtn) {
      floorBtn.addEventListener('click', () => {
        const w = parseFloat(document.getElementById('land-width')?.value || '8');
        const d = parseFloat(document.getElementById('land-depth')?.value || '12');
        const r = this.features.generateFloorPlan(w, d);
        this.logCommand(r.message || `Mặt bằng ${w}×${d}m`);
      });
    }
    const qaBtn = document.getElementById('btn-qa-check');
    if (qaBtn) {
      qaBtn.addEventListener('click', () => {
        const r = this.features.aiCheck();
        const out = document.getElementById('qa-report');
        if (out) {
          out.textContent = r.issues?.length
            ? r.issues.map((i) => `[${i.severity}] ${i.message}`).join('\n')
            : 'Không phát hiện lỗi.';
        }
        this.logCommand(r.message);
      });
    }
  }

  _renderTemplateLibrary() {
    const tabsEl = document.getElementById('template-library-tabs');
    const grid = document.getElementById('template-library-grid');
    if (!grid || !this.features) return;

    if (tabsEl) {
      tabsEl.innerHTML = '';
      for (const [key, cat] of Object.entries(BlockLibrary.categories)) {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'template-tab' + (key === this._templateCategory ? ' active' : '');
        tab.textContent = `${cat.icon} ${cat.label}`;
        tab.title = cat.label;
        tab.addEventListener('click', () => {
          this._templateCategory = key;
          this._renderTemplateLibrary();
        });
        tabsEl.appendChild(tab);
      }
    }

    grid.innerHTML = '';
    for (const t of this.features.listTemplates(this._templateCategory)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'feature-tile';
      btn.innerHTML = `<span class="feature-tile-icon">${t.icon || '📦'}</span><span class="feature-tile-name">${t.name}</span>`;
      btn.title = `${t.name} — click để chèn`;
      btn.addEventListener('click', () => {
        this.startInsertTemplate(t.id);
        this.logCommand(`Chọn vị trí chèn: ${t.name}`);
      });
      grid.appendChild(btn);
    }
  }

  _renderArchTemplateLibrary() {
    const tabsEl = document.getElementById('arch-template-tabs');
    const grid = document.getElementById('arch-template-grid');
    if (!grid || !this.features || typeof ArchitecturalTemplates === 'undefined') return;

    if (tabsEl) {
      tabsEl.innerHTML = '';
      for (const [key, cat] of Object.entries(ArchitecturalTemplates.categories)) {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'template-tab' + (key === this._archTemplateCategory ? ' active' : '');
        tab.textContent = `${cat.icon} ${cat.label}`;
        tab.addEventListener('click', () => {
          this._archTemplateCategory = key;
          this._renderArchTemplateLibrary();
        });
        tabsEl.appendChild(tab);
      }
    }

    grid.innerHTML = '';
    for (const t of this.features.listArchTemplates(this._archTemplateCategory)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'feature-tile';
      btn.innerHTML = `<span class="feature-tile-icon">${t.icon || '🏠'}</span><span class="feature-tile-name">${t.name}</span>`;
      btn.title = t.desc || t.name;
      btn.addEventListener('click', () => {
        const r = this.features.applyArchTemplate(t.id);
        this.logCommand(r.message || `Đã tạo ${t.name}`);
      });
      grid.appendChild(btn);
    }
  }

  _renderArchDrawGrid() {
    const grid = document.getElementById('arch-draw-grid');
    if (!grid) return;
    const tools = [
      { id: 'wall', icon: '🧱', name: 'Tường' },
      { id: 'room', icon: '📐', name: 'Phòng + diện tích' },
      { id: 'column', icon: '⬛', name: 'Cột vuông' },
      { id: 'round-column', icon: '⭕', name: 'Cột tròn' },
      { id: 'open-wall', icon: '〰️', name: 'Tường mở' },
      { id: 'open-floor', icon: '🟩', name: 'Sàn mở + S=' },
      { id: 'open-ceiling', icon: '🟪', name: 'Trần mở + T=' }
    ];
    grid.innerHTML = '';
    for (const t of tools) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'feature-tile';
      btn.innerHTML = `<span class="feature-tile-icon">${t.icon}</span><span class="feature-tile-name">${t.name}</span>`;
      btn.title = t.name;
      btn.addEventListener('click', () => {
        this.setTool(t.id);
        this.logCommand(`Công cụ: ${t.name}`);
      });
      grid.appendChild(btn);
    }
  }

  _updateOfflineStatus() {
    const el = document.getElementById('offline-status');
    if (!el) return;
    const online = navigator.onLine;
    el.textContent = online ? '● Online' : '● Offline (desktop)';
    el.classList.toggle('is-offline', !online);
  }

  _checkShareLink() {
    const data = this.cloudStorage.parseShareLink();
    if (data) {
      this._loadDrawingData(data);
      this.cloudStorage.clearShareLink();
      this.logCommand('Đã mở bản vẽ từ link chia sẻ.');
    }
  }

  async _updateCloudPanel() {
    const list = document.getElementById('cloud-list');
    if (!list) return;
    try {
      const drawings = await this.cloudStorage.listCloudDrawings();
      list.innerHTML = '';
      if (drawings.length === 0) {
        list.innerHTML = '<p class="empty-state">Chưa có bản vẽ cloud</p>';
        return;
      }
      for (const d of drawings.slice(-5).reverse()) {
        const item = document.createElement('div');
        item.className = 'cloud-item';
        item.innerHTML = `<span>${d.name || 'Untitled'}</span><span>${new Date(d.cloudSavedAt || d.metadata?.modifiedAt).toLocaleDateString()}</span>`;
        item.addEventListener('click', async () => {
          const data = await this.cloudStorage.loadFromCloud(d.id);
          if (data) this._loadDrawingData(data);
        });
        list.appendChild(item);
      }
    } catch (_) {}
  }

  _updatePluginPanel() {
    const list = document.getElementById('plugin-list');
    if (!list) return;
    list.innerHTML = '';
    for (const plugin of this.pluginManager.list()) {
      const item = document.createElement('div');
      item.className = 'plugin-item';
      const checked = this.pluginManager.isEnabled(plugin.id) ? 'checked' : '';
      item.innerHTML = `
        <input type="checkbox" id="plugin-${plugin.id}" ${checked}>
        <div class="plugin-info">
          <div class="plugin-name">${plugin.name} <span class="plugin-badge">${plugin.category}</span></div>
          <div class="plugin-desc">${plugin.description}</div>
        </div>
      `;
      item.querySelector('input').addEventListener('change', (e) => {
        this.pluginManager.toggle(plugin.id);
      });
      list.appendChild(item);
    }
  }

  _initAiPanel() {
    const suggestions = document.getElementById('ai-suggestions');
    if (!suggestions) return;
    for (const s of this.aiAssistant.getSuggestions()) {
      const chip = document.createElement('span');
      chip.className = 'ai-chip';
      chip.textContent = s;
      chip.addEventListener('click', () => {
        document.getElementById('ai-input').value = s;
        this._sendAiMessage();
      });
      suggestions.appendChild(chip);
    }
  }

  async _sendAiMessage() {
    const input = document.getElementById('ai-input');
    const messages = document.getElementById('ai-messages');
    if (!input || !messages) return;
    const text = input.value.trim();
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg user';
    userMsg.textContent = text;
    messages.appendChild(userMsg);
    input.value = '';

    const result = await this.aiAssistant.process(text);
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg bot';
    botMsg.textContent = result.message;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
    this.logCommand('AI: ' + result.message);
  }

  updateCollabStatus() {
    const status = this.collaboration.getStatus();
    const dot = document.getElementById('collab-dot');
    const text = document.getElementById('collab-status-text');
    const bar = document.getElementById('status-collab');
    if (dot) dot.classList.toggle('active', status.connected);
    if (text) text.textContent = status.wsActive ? 'WebSocket' : (status.connected ? 'Tab sync' : 'Offline');
    if (bar) bar.textContent = `Collab: ${status.connected ? 'ON' : 'OFF'}`;
  }

  updateToolInfo(text) {
    this.toolInfo.innerHTML = `<p>${text}</p>`;
  }

  _selectAll() {
    if (this.mode === '3d') {
      this.selectionManager3D.selectAll(this.drawing.entities3D);
      return;
    }
    this.selectionManager.selectAll(this.drawing.getVisibleEntities(this.layerManager));
  }

  _update3DSelectionHighlight() {
    if (!this.renderer3D?.initialized) return;
    const ids = this.selectionManager3D.getSelected().map(e => e.id);
    this.renderer3D.setSelection(ids);
  }

  _deleteSelection() {
    if (!this._ready) return false;

    if (this.mode === '3d') {
      const selected = this.selectionManager3D.getSelected();
      if (selected.length === 0) return false;
      for (const sel of [...selected]) {
        this.drawing.removeEntity3D(sel);
        this.collaboration?.broadcastEntityRemoved?.(sel);
      }
      this.selectionManager3D.clearSelection();
      this.renderer3D.syncEntities(this.drawing.entities3D);
      this.updatePropertiesPanel();
      this.updateStatusBar();
      this.requestRender();
      this.logCommand(`Đã xóa ${selected.length} solid 3D.`);
      return true;
    }

    const selected = this.selectionManager.getSelected();
    if (selected.length === 0 || !this.cadCore) return false;

    this.cadCore.run('DELETE', { entities: [...selected] });
    this.selectionManager.clearSelection();
    this.updatePropertiesPanel();
    this.updateStatusBar();
    this.logCommand(`Đã xóa ${selected.length} đối tượng.`);
    return true;
  }

  updatePropertiesPanel() {
    if (this.mode === '3d') {
      const selected = this.selectionManager3D.getSelected();
      if (selected.length === 0) {
        this.propertiesPanel.innerHTML = '<p class="empty-state">Chọn solid 3D (Shift/Ctrl+click chọn nhiều)</p>';
        return;
      }
      const entity = selected[selected.length - 1];
      let html = '';
      if (selected.length > 1) {
        html += `<div class="prop-row"><label>Chọn</label><span>${selected.length} solid</span></div>`;
      }
      html += `
        <div class="prop-row"><label>Loại 3D</label><span>${entity.type}</span></div>
        <div class="prop-row"><label>Tên</label><span>${entity.name}</span></div>
        <div class="prop-row"><label>Màu</label><input type="color" id="mat-color" value="${entity.material.color}"></div>
        <div class="prop-row"><label>Metalness</label><input type="range" id="mat-metal" min="0" max="1" step="0.05" value="${entity.material.metalness ?? 0.1}"></div>
        <div class="prop-row"><label>Roughness</label><input type="range" id="mat-rough" min="0" max="1" step="0.05" value="${entity.material.roughness ?? 0.6}"></div>
        <div class="prop-row"><label>Opacity</label><input type="range" id="mat-opacity" min="0.1" max="1" step="0.1" value="${entity.material.opacity}"></div>
      `;
      this.propertiesPanel.innerHTML = html;
      const sync = () => {
        for (const ent of selected) {
          ent.markDirty();
        }
        this.renderer3D.syncEntities(this.drawing.entities3D);
        this._update3DSelectionHighlight();
        this.requestRender();
      };
      document.getElementById('mat-color')?.addEventListener('input', (e) => {
        for (const ent of selected) ent.material.color = e.target.value;
        sync();
      });
      document.getElementById('mat-metal')?.addEventListener('input', (e) => {
        for (const ent of selected) ent.material.metalness = parseFloat(e.target.value);
        sync();
      });
      document.getElementById('mat-rough')?.addEventListener('input', (e) => {
        for (const ent of selected) ent.material.roughness = parseFloat(e.target.value);
        sync();
      });
      document.getElementById('mat-opacity')?.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        for (const ent of selected) {
          ent.material.opacity = v;
          ent.material.transparent = v < 1;
        }
        sync();
      });
      return;
    }

    const selected = this.selectionManager.getSelected();
    if (selected.length === 0) {
      this.propertiesPanel.innerHTML = '<p class="empty-state">Chọn đối tượng để xem thuộc tính</p>';
      return;
    }

    const entity = selected[0];
    const styles = this.cadCore.styles;
    const layer = this.layerManager.getLayer(entity.layerId);
    const color = entity.style.color || layer?.color || '#ffffff';

    let html = '';
    if (selected.length > 1) {
      html += `<div class="prop-row"><label>Chọn</label><span>${selected.length} đối tượng</span></div>`;
    }
    html += `<div class="prop-row"><label>Loại</label><span>${entity.type}</span></div>`;
    html += `<div class="prop-row"><label>Layer</label>
      <select id="prop-layer">${this.layerManager.layers.map(l =>
        `<option value="${l.id}" ${l.id === entity.layerId ? 'selected' : ''}>${l.name}</option>`
      ).join('')}</select></div>`;
    html += `<div class="prop-row"><label>Linetype</label>
      <select id="prop-linetype">${styles.listLinetypes().map(lt =>
        `<option value="${lt.id}" ${lt.id === (entity.linetypeId || 'Continuous') ? 'selected' : ''}>${lt.name}</option>`
      ).join('')}</select></div>`;
    html += `<div class="prop-row"><label>Màu</label><input type="color" id="prop-color" value="${color}"></div>`;
    html += `<div class="prop-row"><label>Line width</label><input type="number" id="prop-linewidth" min="0.1" step="0.5" value="${entity.style.lineWidth || 1}"></div>`;

    if (entity.type === 'TEXT') {
      html += `<div class="prop-row"><label>Text Style</label>
        <select id="prop-textstyle">${styles.listTextStyles().map(ts =>
          `<option value="${ts.id}" ${ts.id === (entity.textStyleId || 'Standard') ? 'selected' : ''}>${ts.name}</option>`
        ).join('')}</select></div>`;
    }
    if (entity.type === 'DIMENSION') {
      html += `<div class="prop-row"><label>Dim Style</label>
        <select id="prop-dimstyle">${styles.listDimStyles().map(ds =>
          `<option value="${ds.id}" ${ds.id === (entity.dimStyleId || 'Standard') ? 'selected' : ''}>${ds.name}</option>`
        ).join('')}</select></div>`;
    }
    if (entity.type === 'HATCH') {
      html += `<div class="prop-row"><label>Pattern</label>
        <select id="prop-hatch">${['SOLID', 'ANSI31', 'CROSS', 'DOTS'].map(p =>
          `<option value="${p}" ${p === entity.pattern ? 'selected' : ''}>${p}</option>`
        ).join('')}</select></div>`;
    }

    switch (entity.type) {
      case 'LINE': {
        const len = GeometryEngine.distance(entity.start.x, entity.start.y, entity.end.x, entity.end.y);
        html += `<div class="prop-row"><label>Chiều dài</label><input type="number" id="prop-length" min="0.01" step="0.01" value="${len.toFixed(3)}"></div>`;
        break;
      }
      case 'CIRCLE':
        html += `<div class="prop-row"><label>Đường kính</label><input type="number" id="prop-width" min="0.01" step="0.01" value="${(entity.radius * 2).toFixed(3)}"></div>`;
        html += `<div class="prop-row"><label>Bán kính</label><input type="number" id="prop-radius" min="0.01" step="0.01" value="${entity.radius.toFixed(3)}"></div>`;
        break;
      case 'ARC':
        html += `<div class="prop-row"><label>Bán kính</label><input type="number" id="prop-radius" min="0.01" step="0.01" value="${entity.radius.toFixed(3)}"></div>`;
        break;
      case 'RECTANGLE':
      case 'HATCH':
      case 'POLYLINE': {
        const bb = entity.getBoundingBox();
        if (bb) {
          const w = bb.maxX - bb.minX;
          const h = bb.maxY - bb.minY;
          html += `<div class="prop-row"><label>Chiều dài</label><input type="number" id="prop-width" min="0.01" step="0.01" value="${w.toFixed(3)}"></div>`;
          html += `<div class="prop-row"><label>Chiều cao</label><input type="number" id="prop-height" min="0.01" step="0.01" value="${h.toFixed(3)}"></div>`;
        }
        break;
      }
      case 'TEXT': {
        const rotDeg = ((entity.rotation || 0) * 180 / Math.PI).toFixed(1);
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        const fonts = [
          ['Arial, sans-serif', 'Arial'],
          ['Georgia, serif', 'Georgia'],
          ['Times New Roman, serif', 'Times New Roman'],
          ['Courier New, monospace', 'Courier'],
          ['Verdana, sans-serif', 'Verdana']
        ];
        const curFont = entity.fontFamily || styles.getTextStyle(entity.textStyleId).fontFamily || 'Arial, sans-serif';
        html += `<div class="prop-row"><label>Nội dung</label><textarea id="prop-text" rows="2">${esc(entity.text)}</textarea></div>`;
        html += `<div class="prop-row"><label>Chiều cao</label><input type="number" id="prop-text-height" min="0.1" step="0.1" value="${entity.height}"></div>`;
        html += `<div class="prop-row"><label>Font</label><select id="prop-font-family">${fonts.map(([v, n]) =>
          `<option value="${v}" ${v === curFont ? 'selected' : ''}>${n}</option>`
        ).join('')}</select></div>`;
        html += `<div class="prop-row prop-checks"><label>Định dạng</label>
          <label class="prop-check"><input type="checkbox" id="prop-text-bold" ${entity.fontWeight === 'bold' ? 'checked' : ''}> Đậm</label>
          <label class="prop-check"><input type="checkbox" id="prop-text-italic" ${entity.fontStyle === 'italic' ? 'checked' : ''}> Nghiêng</label>
          <label class="prop-check"><input type="checkbox" id="prop-text-center" ${entity.centered ? 'checked' : ''}> Giữa</label>
        </div>`;
        html += `<div class="prop-row"><label>Xoay (°)</label><input type="number" id="prop-text-rotation" step="1" value="${rotDeg}"></div>`;
        break;
      }
      case 'DIMENSION':
        html += `<div class="prop-row"><label>Distance</label><span>${this.formatDistance(entity.getDistance())}</span></div>`;
        break;
    }

    html += `<div class="prop-actions"><button id="prop-constraint-btn">Ràng buộc cố định</button></div>`;

    this.propertiesPanel.innerHTML = html;

    const setProp = (key, value) => {
      this.cadCore.run('SET_PROPERTY', { entities: selected, key, value });
      this.requestRender();
    };

    document.getElementById('prop-layer')?.addEventListener('change', (e) => setProp('layerId', e.target.value));
    document.getElementById('prop-linetype')?.addEventListener('change', (e) => setProp('linetypeId', e.target.value));
    document.getElementById('prop-color')?.addEventListener('input', (e) => setProp('color', e.target.value));
    document.getElementById('prop-linewidth')?.addEventListener('change', (e) => setProp('lineWidth', e.target.value));
    document.getElementById('prop-textstyle')?.addEventListener('change', (e) => {
      const ts = styles.getTextStyle(e.target.value);
      setProp('textStyleId', e.target.value);
      if (entity.type === 'TEXT' && ts) {
        if (ts.height) setProp('height', ts.height);
        if (ts.fontFamily) setProp('fontFamily', ts.fontFamily);
        if (ts.fontWeight) setProp('fontWeight', ts.fontWeight);
        if (ts.fontStyle) setProp('fontStyle', ts.fontStyle);
        this.updatePropertiesPanel();
      }
    });
    document.getElementById('prop-dimstyle')?.addEventListener('change', (e) => setProp('dimStyleId', e.target.value));
    document.getElementById('prop-hatch')?.addEventListener('change', (e) => setProp('pattern', e.target.value));
    document.getElementById('prop-text')?.addEventListener('input', (e) => setProp('text', e.target.value));
    document.getElementById('prop-text-height')?.addEventListener('input', (e) => setProp('height', e.target.value));
    document.getElementById('prop-font-family')?.addEventListener('change', (e) => setProp('fontFamily', e.target.value));
    document.getElementById('prop-text-bold')?.addEventListener('change', (e) => setProp('fontWeight', e.target.checked ? 'bold' : 'normal'));
    document.getElementById('prop-text-italic')?.addEventListener('change', (e) => setProp('fontStyle', e.target.checked ? 'italic' : 'normal'));
    document.getElementById('prop-text-center')?.addEventListener('change', (e) => setProp('centered', e.target.checked));
    document.getElementById('prop-text-rotation')?.addEventListener('input', (e) => setProp('rotation', e.target.value));
    document.getElementById('prop-length')?.addEventListener('input', (e) => setProp('length', e.target.value));
    document.getElementById('prop-width')?.addEventListener('input', (e) => setProp('width', e.target.value));
    document.getElementById('prop-height')?.addEventListener('input', (e) => setProp('height', e.target.value));
    document.getElementById('prop-radius')?.addEventListener('input', (e) => setProp('radius', e.target.value));
    document.getElementById('prop-constraint-btn')?.addEventListener('click', () => {
      this.cadCore.run('ADD_CONSTRAINT', {
        type: 'FIXED',
        entityIds: selected.map(e => e.id),
        params: {}
      });
      this.logCommand('Constraint FIXED added.');
    });
  }

  _updateStylesPanel() {
    const panel = document.getElementById('styles-panel');
    if (!panel) return;
    const s = this.cadCore.styles;
    panel.innerHTML = `
      <div class="prop-row"><label>Linetype</label>
        <select id="global-linetype">${s.listLinetypes().map(lt =>
          `<option value="${lt.id}" ${lt.id === s.currentLinetypeId ? 'selected' : ''}>${lt.name}</option>`
        ).join('')}</select></div>
      <div class="prop-row"><label>Text Style</label>
        <select id="global-textstyle">${s.listTextStyles().map(ts =>
          `<option value="${ts.id}" ${ts.id === s.currentTextStyleId ? 'selected' : ''}>${ts.name}</option>`
        ).join('')}</select></div>
      <div class="prop-row"><label>Dim Style</label>
        <select id="global-dimstyle">${s.listDimStyles().map(ds =>
          `<option value="${ds.id}" ${ds.id === s.currentDimStyleId ? 'selected' : ''}>${ds.name}</option>`
        ).join('')}</select></div>
      <div class="prop-row"><label>Đơn vị hiển thị</label>
        <select id="global-display-unit">${UnitEngine.LIST.map(u =>
          `<option value="${u}" ${u === this.drawing.unit ? 'selected' : ''}>${UnitEngine.UNITS[u].label}</option>`
        ).join('')}</select></div>
      <div class="prop-row"><label>Đơn vị bản vẽ</label>
        <select id="global-world-unit">${UnitEngine.LIST.map(u =>
          `<option value="${u}" ${u === (this.drawing.worldUnit || this.drawing.unit) ? 'selected' : ''}>${UnitEngine.UNITS[u].label}</option>`
        ).join('')}</select></div>
      <p class="feature-hint" style="margin-top:4px">Đơn vị bản vẽ = 1 đơn vị tọa độ trên canvas (m cho kiến trúc, cm cho mẫu nội thất).</p>
    `;
    document.getElementById('global-linetype')?.addEventListener('change', (e) => {
      s.currentLinetypeId = e.target.value;
    });
    document.getElementById('global-textstyle')?.addEventListener('change', (e) => {
      s.currentTextStyleId = e.target.value;
    });
    document.getElementById('global-dimstyle')?.addEventListener('change', (e) => {
      s.currentDimStyleId = e.target.value;
    });
    document.getElementById('global-display-unit')?.addEventListener('change', (e) => {
      this.setDrawingUnits(e.target.value, this.drawing.worldUnit || this.drawing.unit);
    });
    document.getElementById('global-world-unit')?.addEventListener('change', (e) => {
      this.setDrawingUnits(this.drawing.unit, e.target.value);
    });
  }

  updateStatusBar() {
    document.getElementById('status-zoom').textContent =
      `Zoom: ${(this.drawing.view.zoom * 100).toFixed(0)}%`;
    const layer = this.layerManager.getCurrentLayer();
    document.getElementById('status-layer').textContent =
      `Layer: ${layer ? layer.name : '0'}`;
    document.getElementById('status-dimensions').textContent =
      `Dim: ${this.drawing.view.showDimensions ? 'ON' : 'OFF'}`;
    const du = this.drawing.unit || 'mm';
    const wu = this.drawing.worldUnit || du;
    const unitEl = document.getElementById('status-unit');
    if (unitEl) unitEl.textContent = wu === du ? du : `${du}←${wu}`;
    const selCount = this.mode === '3d'
      ? this.selectionManager3D.getSelected().length
      : this.selectionManager.getSelected().length;
    const total = this.drawing.entities.length + this.drawing.entities3D.length;
    document.getElementById('status-entities').textContent =
      selCount > 0 ? `Entities: ${total}  ·  Chọn: ${selCount}` : `Entities: ${total}`;
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
      if (this.mode === '2d' && this.renderer2D && this.cadCore) {
        this.renderer2D.render(
          this.drawing, this.layerManager,
          this.selectionManager, this.snapEngine,
          this.layoutManager, this.cadCore.styles
        );
      } else if (this.renderer3D?.initialized) {
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
  app.init().catch((err) => {
    console.error('WebCAD init failed:', err);
    app.logCommand?.('Khởi tạo lỗi: ' + err.message);
  });
  window.webcad = app;
});
