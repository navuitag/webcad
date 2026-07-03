/**
 * FormatRegistry — định nghĩa định dạng file chuyên nghiệp WebCAD
 */
const FormatRegistry = {
  formats: {
    wcad: {
      id: 'wcad',
      label: 'WebCAD Drawing',
      primaryExtension: '.wcad.json',
      extensions: ['.wcad.json', '.wcad', '.json'],
      mime: 'application/vnd.webcad+json',
      import: true,
      export: true,
      scope: 'project'
    },
    svg: {
      id: 'svg',
      label: 'Scalable Vector Graphics',
      primaryExtension: '.svg',
      extensions: ['.svg'],
      mime: 'image/svg+xml',
      export: true,
      scope: '2d'
    },
    png: {
      id: 'png',
      label: 'Portable Network Graphics',
      primaryExtension: '.png',
      extensions: ['.png'],
      mime: 'image/png',
      export: true,
      scope: '2d'
    },
    pdf: {
      id: 'pdf',
      label: 'Portable Document Format',
      primaryExtension: '.pdf',
      extensions: ['.pdf'],
      mime: 'application/pdf',
      export: true,
      scope: '2d'
    },
    dxf: {
      id: 'dxf',
      label: 'AutoCAD DXF',
      primaryExtension: '.dxf',
      extensions: ['.dxf'],
      mime: 'application/dxf',
      import: true,
      export: true,
      scope: '2d'
    },
    obj: {
      id: 'obj',
      label: 'Wavefront OBJ',
      primaryExtension: '.obj',
      extensions: ['.obj'],
      mime: 'model/obj',
      import: true,
      export: true,
      scope: '3d'
    },
    stl: {
      id: 'stl',
      label: 'STL Mesh',
      primaryExtension: '.stl',
      extensions: ['.stl'],
      mime: 'model/stl',
      import: true,
      export: true,
      scope: '3d'
    },
    gltf: {
      id: 'gltf',
      label: 'glTF',
      primaryExtension: '.gltf',
      extensions: ['.gltf', '.glb'],
      mime: 'model/gltf+json',
      import: true,
      export: true,
      scope: '3d'
    }
  },

  get(id) {
    return this.formats[id] || null;
  },

  list({ import: canImport, export: canExport, scope } = {}) {
    return Object.values(this.formats).filter(f => {
      if (canImport && !f.import) return false;
      if (canExport && !f.export) return false;
      if (scope && f.scope !== scope && f.scope !== 'project') return false;
      return true;
    });
  },

  detect(filename) {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.wcad.json')) return this.formats.wcad;
    for (const fmt of Object.values(this.formats)) {
      for (const ext of fmt.extensions) {
        if (ext === '.wcad.json') continue;
        if (lower.endsWith(ext)) return fmt;
      }
    }
    if (lower.endsWith('.json')) return this.formats.wcad;
    return null;
  },

  baseName(name) {
    return (name || 'drawing').replace(/[\\/:*?"<>|]/g, '_').trim() || 'drawing';
  },

  filename(name, formatId) {
    const fmt = this.get(formatId);
    if (!fmt) return FormatRegistry.baseName(name);
    return FormatRegistry.baseName(name) + fmt.primaryExtension;
  },

  acceptAttribute(formatIds) {
    return formatIds
      .map(id => this.get(id))
      .filter(Boolean)
      .flatMap(f => f.extensions)
      .join(',');
  },

  exportAccept() {
    return this.acceptAttribute(Object.keys(this.formats).filter(id => this.formats[id].export));
  },

  importAccept() {
    return this.acceptAttribute(Object.keys(this.formats).filter(id => this.formats[id].import));
  }
};
