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
    this._loopActive = false;
    this._animId = null;
    this._selectedIds = new Set();
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
    this.scene.background = new THREE.Color(0x37474f);

    this.materialManager = new MaterialManager3D();
    this.cameraManager = new CameraManager3D(this.container);
    this.cameraManager.setMode('perspective');

    await this._createRenderer(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.cameraManager.controls = new ThreeAddons.OrbitControls(
      this.cameraManager.camera,
      this.renderer.domElement
    );
    CameraManager3D.configureControls(this.cameraManager.controls);

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
        if (wgpu.outputColorSpace !== undefined) {
          wgpu.outputColorSpace = THREE.SRGBColorSpace;
        }
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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
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
          this._applyMeshHighlight(mesh, entity.id);
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

    this._updateMesh(entity, mesh);
    return mesh;
  }

  /** ExtrudeGeometry extrude theo trục Z — xoay -90° quanh X để chiều cao hướng lên trục Y */
  static _extrudeRotationX(entity) {
    return entity.type === 'EXTRUDE' ? -Math.PI / 2 : 0;
  }

  _updateMesh(entity, mesh) {
    mesh.position.set(entity.position.x, entity.position.y, entity.position.z);
    mesh.rotation.set(
      ThreeRenderer._extrudeRotationX(entity) + (entity.rotation.x || 0),
      entity.rotation.y || 0,
      entity.rotation.z || 0
    );
    mesh.scale.set(entity.scale.x, entity.scale.y, entity.scale.z);
    this.materialManager.updateMaterial(mesh.material, entity.material);
    mesh.userData.entityMaterial = { ...entity.material };
    this._applyMeshHighlight(mesh, entity.id);
  }

  setSelection(entityIds = []) {
    this._selectedIds = new Set(entityIds);
    for (const [id, mesh] of this.meshes) {
      this._applyMeshHighlight(mesh, id);
    }
  }

  _applyMeshHighlight(mesh, entityId) {
    if (!mesh.material) return;
    const selected = this._selectedIds.has(entityId);
    if (mesh.material.emissive) {
      mesh.material.emissive.setHex(selected ? 0x1565c0 : 0x000000);
      mesh.material.emissiveIntensity = selected ? 0.45 : 0;
    }
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
    if (!this.initialized) return;
    const box = new THREE.Box3();
    for (const mesh of this.meshes.values()) {
      box.expandByObject(mesh);
    }
    this.cameraManager.fitToBox(box);
  }

  resetView() {
    if (!this.initialized) return;
    if (this.meshes.size > 0) {
      this.fitView();
    } else {
      this.cameraManager.setPreset('home');
    }
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

  setLoopActive(active) {
    this._loopActive = active;
    if (active) this._startLoop();
  }

  _startLoop() {
    if (this._animId != null) return;
    const tick = () => {
      this._animId = requestAnimationFrame(tick);
      if (!this._loopActive || !this.initialized) return;
      this.cameraManager.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  _stopLoop() {
    if (this._animId != null) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
    this._loopActive = false;
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
    this._stopLoop();
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
