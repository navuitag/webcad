/**
 * TemplateManager — Drawing templates (.dwt equivalent)
 */
class TemplateManager {
  constructor(app) {
    this.app = app;
    this.templates = {
      'A4-Metric': {
        name: 'A4-Metric',
        description: 'A4 landscape, metric units',
        layers: [
          { id: 'layer_0', name: '0', color: '#ffffff', visible: true, locked: false },
          { id: 'layer_dim', name: 'Dimensions', color: '#4fc3f7', visible: true, locked: false },
          { id: 'layer_hatch', name: 'Hatch', color: '#888888', visible: true, locked: false }
        ],
        layout: { width: 297, height: 210, scale: 1, margin: 10 },
        unit: 'mm'
      },
      'A3-Architectural': {
        name: 'A3-Architectural',
        description: 'A3 landscape, architectural layers',
        layers: [
          { id: 'layer_0', name: '0', color: '#ffffff', visible: true, locked: false },
          { id: 'layer_wall', name: 'Walls', color: '#ffffff', visible: true, locked: false },
          { id: 'layer_door', name: 'Doors', color: '#66bb6a', visible: true, locked: false },
          { id: 'layer_dim', name: 'Dimensions', color: '#4fc3f7', visible: true, locked: false }
        ],
        layout: { width: 420, height: 297, scale: 1, margin: 10 },
        unit: 'mm'
      }
    };
  }

  list() {
    return Object.values(this.templates);
  }

  apply(name) {
    const tpl = this.templates[name];
    if (!tpl) return { success: false, message: `Template not found: ${name}` };

    const app = this.app;
    app.newDrawing(false);

    if (tpl.layers) {
      app.layerManager.layers = tpl.layers.map(l => ({
        id: l.id || ('layer_' + Math.random().toString(36).substr(2, 4)),
        name: l.name,
        color: l.color || '#ffffff',
        visible: l.visible !== false,
        locked: l.locked || false
      }));
      app.layerManager.currentLayerId = app.layerManager.layers[0].id;
    }

    if (tpl.layout) {
      const layout = app.layoutManager.layouts.find(l => l.type === 'paper');
      if (layout) {
        layout.width = tpl.layout.width;
        layout.height = tpl.layout.height;
        layout.scale = tpl.layout.scale || 1;
        layout.margin = tpl.layout.margin || 10;
        if (!layout.viewports || layout.viewports.length === 0) {
          layout.viewports = [LayoutManager.createDefaultViewport(tpl.layout)];
        }
      }
    }

    if (tpl.unit) {
      app.drawing.unit = tpl.unit;
      app.drawing.worldUnit = tpl.unit;
    }
    app.cadCore.syncDrawing(app.drawing);
    app._updateLayerPanel();
    app._updateLayoutPanel();
    app.requestRender();
    return { success: true, template: tpl };
  }
}
