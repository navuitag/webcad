class ThreeRenderer {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.gridHelper = null;
    this.meshes = new Map();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    const ambient = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    this.scene.add(directional);

    this.gridHelper = new THREE.GridHelper(20, 20, 0x4fc3f7, 0x1a3a5c);
    this.gridHelper.material.opacity = 0.3;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);

    const axesHelper = new THREE.AxesHelper(3);
    this.scene.add(axesHelper);

    this.initialized = true;
  }

  resize(width, height) {
    if (!this.initialized) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  syncEntities(entities3D) {
    if (!this.initialized) return;

    const currentIds = new Set(entities3D.map(e => e.id));

    for (const [id, mesh] of this.meshes) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.meshes.delete(id);
      }
    }

    for (const entity of entities3D) {
      if (!this.meshes.has(entity.id)) {
        const mesh = this._createMesh(entity);
        if (mesh) {
          entity.mesh = mesh;
          this.meshes.set(entity.id, mesh);
          this.scene.add(mesh);
        }
      } else {
        this._updateMesh(entity, this.meshes.get(entity.id));
      }
    }
  }

  _createMesh(entity) {
    let geometry;
    const color = new THREE.Color(entity.material.color);
    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: entity.material.transparent,
      opacity: entity.material.opacity,
      side: THREE.DoubleSide
    });

    switch (entity.type) {
      case 'BOX':
        geometry = new THREE.BoxGeometry(
          entity.params.width || 2,
          entity.params.height || 2,
          entity.params.depth || 2
        );
        break;
      case 'SPHERE':
        geometry = new THREE.SphereGeometry(entity.params.radius || 1, 32, 32);
        break;
      case 'CYLINDER':
        geometry = new THREE.CylinderGeometry(
          entity.params.radiusTop || 1,
          entity.params.radiusBottom || 1,
          entity.params.height || 2,
          32
        );
        break;
      case 'CONE':
        geometry = new THREE.ConeGeometry(
          entity.params.radius || 1,
          entity.params.height || 2,
          32
        );
        break;
      default:
        return null;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.entityId = entity.id;
    this._updateMesh(entity, mesh);
    return mesh;
  }

  _updateMesh(entity, mesh) {
    mesh.position.set(entity.position.x, entity.position.y, entity.position.z);
    mesh.rotation.set(entity.rotation.x, entity.rotation.y, entity.rotation.z);
    mesh.scale.set(entity.scale.x, entity.scale.y, entity.scale.z);
    if (mesh.material) {
      mesh.material.color.set(entity.material.color);
      mesh.material.opacity = entity.material.opacity;
      mesh.material.transparent = entity.material.transparent || entity.material.opacity < 1;
    }
  }

  setCameraMode(mode) {
    if (!this.initialized) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const pos = this.camera.position.clone();

    if (mode === 'orthographic') {
      const frustum = 10;
      this.camera = new THREE.OrthographicCamera(
        -frustum * width / height, frustum * width / height,
        frustum, -frustum, 0.1, 1000
      );
      this.camera.position.copy(pos);
      this.camera.lookAt(0, 0, 0);
    } else {
      this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      this.camera.position.copy(pos);
      this.camera.lookAt(0, 0, 0);
    }

    this.controls.object = this.camera;
    this.controls.update();
  }

  render() {
    if (!this.initialized) return;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  getScene() {
    return this.scene;
  }

  dispose() {
    if (!this.initialized) return;
    for (const [, mesh] of this.meshes) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.meshes.clear();
    this.renderer.dispose();
    this.initialized = false;
  }
}
