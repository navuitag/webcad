class LayoutManager {
  constructor() {
    this.layouts = [
      { id: 'model', name: 'Model', type: 'model', width: null, height: null },
      {
        id: 'layout1', name: 'Layout1', type: 'paper',
        width: 297, height: 210, scale: 1, margin: 10,
        plotScale: 0.1, orientation: 'landscape',
        viewports: [LayoutManager.createDefaultViewport({ width: 297, height: 210 })]
      }
    ];
    this.currentLayoutId = 'model';
  }

  static createDefaultViewport(layout) {
    const w = layout.width || 297;
    const h = layout.height || 210;
    const margin = layout.margin || 10;
    return {
      id: 'vp_' + Date.now().toString(36),
      x: margin,
      y: margin + 15,
      width: w - margin * 2,
      height: h - margin * 2 - 15,
      centerX: 0,
      centerY: 0,
      scale: 0.5,
      rotation: 0
    };
  }

  getCurrentLayout() {
    return this.layouts.find(l => l.id === this.currentLayoutId) || this.layouts[0];
  }

  setCurrentLayout(id) {
    const layout = this.layouts.find(l => l.id === id);
    if (layout) {
      this.currentLayoutId = id;
      return layout;
    }
    return null;
  }

  addLayout(name) {
    const id = 'layout_' + Date.now().toString(36);
    const layout = {
      id,
      name: name || `Layout${this.layouts.length}`,
      type: 'paper',
      width: 297,
      height: 210,
      scale: 1,
      margin: 10,
      plotScale: 0.1,
      orientation: 'landscape',
      viewports: [LayoutManager.createDefaultViewport({ width: 297, height: 210, margin: 10 })]
    };
    this.layouts.push(layout);
    return layout;
  }

  addViewport(layoutId, viewport) {
    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) return null;
    if (!layout.viewports) layout.viewports = [];
    const vp = { id: 'vp_' + Date.now().toString(36), ...viewport };
    layout.viewports.push(vp);
    return vp;
  }

  isModelSpace() {
    return this.getCurrentLayout().type === 'model';
  }

  toJSON() {
    return {
      layouts: this.layouts.map(l => ({ ...l, viewports: l.viewports ? l.viewports.map(v => ({ ...v })) : [] })),
      currentLayoutId: this.currentLayoutId
    };
  }

  fromJSON(data) {
    if (data.layouts && data.layouts.length > 0) {
      this.layouts = data.layouts.map(l => ({
        ...l,
        viewports: l.viewports || (l.type === 'paper' ? [LayoutManager.createDefaultViewport(l)] : [])
      }));
      this.currentLayoutId = data.currentLayoutId || 'model';
    }
  }
}
