/**
 * ThreeRenderer — 3D engine với WebGPU (fallback WebGL2)
 */
class ThreeRenderer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.renderer = null;
    this.backend = 'webgl2';
    this.cameraManager = null;
    this.materialManager = null;
    this.lighting = null;
    this.section = null;
    this.viewer = null;
    this.gridHelper = null;
    this.meshes = new Map();
    this._raycaster = null;
    this._pointer = null;
    this.initialized = false;
    this.viewerMode = false;
  }

  async init() {
    if (this.initialized) return;
    if (!window.THREE) {
      console.warn('Three.js chưa load — chờ three-bootstrap');
      await (window.ThreeBootstrap?.ready || Promise.resolve());
    }

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);

    this.materialManager = new MaterialManager3D();
    this.cameraManager = new CameraManager3D(this.container);
    this.cameraManager.setMode('perspective');

    await this._createRenderer(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.cameraManager.controls = new ThreeAddons.OrbitControls(
      this.cameraManager.camera,
      this.renderer.domElement
    );
    this.cameraManager.controls.enableDamping = true;
    this.cameraManager.controls.dampingFactor = 0.08;

    this.lighting = new LightingManager3D(this.scene);
    this.section = new SectionEngine3D(this.renderer, this.scene);
    this.viewer = new Viewer3D(this);

    this.gridHelper = new THREE.GridHelper(30, 30, 0x4fc3f7, 0x1a3a5c);
    this.gridHelper.material.opacity = 0.25;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);

    const axesHelper = new THREE.AxesHelper(4);
    this.scene.add(axesHelper);

    this.initialized = true;
  }

  async _createRenderer(width, height) {
    if (navigator.gpu) {
      try {
        const { WebGPURenderer } = await import('three/webgpu');
        const wgpu = new WebGPURenderer({ antialias: true, alpha: false });
        await wgpu.init();
        wgpu.setPixelRatio(window.devicePixelRatio);
        wgpu.setSize(width, height);
        this.renderer = wgpu;
        this.backend = 'webgpu';
        console.info('WebCAD 3D: WebGPURenderer active');
        return;
      } catch (err) {
        console.warn('WebGPU unavailable, fallback WebGL2:', err);
      }
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.backend = 'webgl2';
    console.info('WebCAD 3D: WebGLRenderer active');
  }

  get camera() { return this.cameraManager?.camera; }
  get controls() { return this.cameraManager?.controls; }

  resize(width, height) {
    if (!this.initialized) return;
    this.cameraManager.resize(width, height);
    this.renderer.setSize(width, height);
  }

  syncEntities(entities3D) {
    if (!this.initialized) return;

    const currentIds = new Set(entities3D.map(e => e.id));

    for (const [id, mesh] of this.meshes) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry?.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
          else mesh.material.dispose();
        }
        this.meshes.delete(id);
      }
    }

    for (const entity of entities3D) {
      const existing = this.meshes.get(entity.id);
      if (!existing || entity._meshDirty) {
        if (existing) {
          this.scene.remove(existing);
          existing.geometry?.dispose();
          existing.material?.dispose();
        }
        const mesh = this._createMesh(entity);
        if (mesh) {
          entity.mesh = mesh;
          entity._meshDirty = false;
          this.meshes.set(entity.id, mesh);
          this.scene.add(mesh);
        }
      } else {
        this._updateMesh(entity, existing);
      }
    }
  }

  _createMesh(entity) {
    const geometry = MeshFactory3D.buildGeometry(entity);
    if (!geometry) return null;

    const material = this.materialManager.createMaterial(entity.material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.entityId = entity.id;
    mesh.userData.entityMaterial = { ...entity.material };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (entity.type === 'EXTRUDE') {
      mesh.rotation.x = -Math.PI / 2;
    }

    this._updateMesh(entity, mesh);
    return mesh;
  }

  _updateMesh(entity, mesh) {
    mesh.position.set(entity.position.x, entity.position.y, entity.position.z);
    mesh.rotation.set(entity.rotation.x, entity.rotation.y, entity.rotation.z);
    mesh.scale.set(entity.scale.x, entity.scale.y, entity.scale.z);
    this.materialManager.updateMaterial(mesh.material, entity.material);
    mesh.userData.entityMaterial = { ...entity.material };
  }

  setCameraMode(mode) {
    if (!this.initialized) return;
    this.cameraManager.setMode(mode, this.renderer, this.renderer.domElement);
  }

  setCameraPreset(preset) {
    this.cameraManager.setPreset(preset);
  }

  setLightingPreset(preset) {
    this.lighting.setPreset(preset);
  }

  setMaterialPreset(preset) {
    this.materialManager.applyPreset(preset);
  }

  setSection(axis, offset) {
    this.section.setAxis(axis, offset);
  }

  toggleSection(enabled) {
    this.section.enable(enabled ?? !this.section.enabled);
  }

  fitView() {
    const box = new THREE.Box3();
    for (const mesh of this.meshes.values()) {
      box.expandByObject(mesh);
    }
    this.cameraManager.fitToBox(box);
  }

  get raycaster() {
    if (!this._raycaster) this._raycaster = new THREE.Raycaster();
    return this._raycaster;
  }

  get pointer() {
    if (!this._pointer) this._pointer = new THREE.Vector2();
    return this._pointer;
  }

  pick(clientX, clientY) {
    if (!this.initialized) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.meshes.values()], false);
    return hits[0]?.object?.userData?.entityId || null;
  }

  getMesh(entityId) {
    return this.meshes.get(entityId);
  }

  render() {
    if (!this.initialized) return;
    this.cameraManager.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  getScene() {
    return this.scene;
  }

  getStatus() {
    return {
      backend: this.backend,
      meshCount: this.meshes.size,
      section: this.section?.enabled,
      camera: this.cameraManager?.mode
    };
  }

  dispose() {
    if (!this.initialized) return;
    this.section?.dispose();
    for (const [, mesh] of this.meshes) {
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    }
    this.meshes.clear();
    this.renderer?.dispose();
    this.initialized = false;
  }
}
