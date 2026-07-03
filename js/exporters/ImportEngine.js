/**
 * ImportEngine — nhập file 2D/3D chuyên nghiệp
 */
class ImportEngine {
  static async importFile(file, app) {
    const fmt = FormatRegistry.detect(file.name);
    if (!fmt) throw new Error(`Unsupported format: ${file.name}`);

    switch (fmt.id) {
      case 'wcad':
        return ImportEngine.importWcad(file, app);
      case 'dxf':
        return ImportEngine.importDxf(file, app);
      case 'obj':
        return ImportEngine.importOBJ(file, app);
      case 'stl':
        return ImportEngine.importSTL(file, app);
      case 'gltf':
        return ImportEngine.importGLTF(file, app);
      default:
        throw new Error(`Import not implemented: ${fmt.id}`);
    }
  }

  static async importWcad(file, app) {
    const text = await file.text();
    const data = JSON.parse(text);
    app._loadDrawingData(data);
    if (data.name) app.drawing.name = data.name;
    else app.drawing.name = file.name.replace(/\.(wcad\.json|wcad|json)$/i, '');
    return { type: 'wcad', entities: data.entities2D?.length || 0 };
  }

  static async importDxf(file, app) {
    const text = await file.text();
    const entities = DxfEngine.import(text, app.layerManager);
    for (const e of entities) app.drawing.addEntity(e);
    app.requestRender();
    app._updateLayerPanel();
    app.updateStatusBar();
    return { type: 'dxf', entities: entities.length };
  }

  static async importOBJ(file, app) {
    await ImportEngine._ensure3D(app);
    const loader = new ThreeAddons.OBJLoader();
    const url = URL.createObjectURL(file);
    const object = await loader.loadAsync(url);
    URL.revokeObjectURL(url);
    return ImportEngine._addLoadedObject(object, file.name, app);
  }

  static async importSTL(file, app) {
    await ImportEngine._ensure3D(app);
    const loader = new ThreeAddons.STLLoader();
    const url = URL.createObjectURL(file);
    const geometry = await loader.loadAsync(url);
    URL.revokeObjectURL(url);
    const mesh = new THREE.Mesh(geometry);
    return ImportEngine._addLoadedObject(mesh, file.name, app);
  }

  static async importGLTF(file, app) {
    await ImportEngine._ensure3D(app);
    const loader = new ThreeAddons.GLTFLoader();
    const url = URL.createObjectURL(file);
    const gltf = await loader.loadAsync(url);
    URL.revokeObjectURL(url);
    return ImportEngine._addLoadedObject(gltf.scene, file.name, app);
  }

  static async _ensure3D(app) {
    if (window.ThreeBootstrap?.ready) await window.ThreeBootstrap.ready;
    if (!app.renderer3D.initialized) await app.renderer3D.init();
    await app.setMode('3d');
  }

  static _addLoadedObject(object, filename, app) {
    const entities = [];
    const baseName = filename.replace(/\.[^.]+$/, '');

    object.traverse?.((child) => {
      if (child.isMesh && child.geometry) {
        entities.push(ImportEngine._meshToEntity3D(child, baseName));
      }
    });

    if (!entities.length && object.isMesh) {
      entities.push(ImportEngine._meshToEntity3D(object, baseName));
    }

    for (const e of entities) app.drawing.addEntity3D(e);
    app.renderer3D.syncEntities(app.drawing.entities3D);
    app.renderer3D.fitView();
    app.requestRender();
    app.updateStatusBar();
    return { type: '3d', entities: entities.length };
  }

  static _meshToEntity3D(mesh, name) {
    mesh.updateMatrixWorld(true);
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);
    if (!geo.attributes.normal) geo.computeVertexNormals();

    const entity = new Entity3D('MESH', name || 'Import');
    entity.params.geometry = {
      positions: Array.from(geo.attributes.position.array),
      normals: Array.from(geo.attributes.normal.array),
      indices: geo.index ? Array.from(geo.index.array) : null
    };
    entity._meshDirty = true;
    return entity;
  }
}
