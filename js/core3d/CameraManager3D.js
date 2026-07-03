class CameraManager3D {
  constructor(container) {
    this.container = container;
    this.mode = 'perspective';
    this.camera = null;
    this.controls = null;
  }

  createPerspective() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
    cam.position.set(8, 6, 8);
    cam.lookAt(0, 0, 0);
    return cam;
  }

  createOrthographic(fromCamera) {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    const frustum = 12;
    const cam = new THREE.OrthographicCamera(
      -frustum * w / h, frustum * w / h, frustum, -frustum, 0.1, 2000
    );
    if (fromCamera) cam.position.copy(fromCamera.position);
    cam.lookAt(0, 0, 0);
    return cam;
  }

  setMode(mode, renderer, domElement) {
    const prev = this.camera;
    this.mode = mode;
    this.camera = mode === 'orthographic'
      ? this.createOrthographic(prev)
      : this.createPerspective();
    if (prev) this.camera.position.copy(prev.position);

    if (this.controls) {
      this.controls.object = this.camera;
      this.controls.update();
    } else if (domElement) {
      this.controls = new ThreeAddons.OrbitControls(this.camera, domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
    }
    return this.camera;
  }

  setPreset(preset) {
    const d = 12;
    const presets = {
      top: { pos: [0, d, 0.001], target: [0, 0, 0] },
      front: { pos: [0, 0, d], target: [0, 0, 0] },
      right: { pos: [d, 0, 0], target: [0, 0, 0] },
      iso: { pos: [d, d * 0.7, d], target: [0, 0, 0] },
      home: { pos: [8, 6, 8], target: [0, 0, 0] }
    };
    const p = presets[preset] || presets.home;
    this.camera.position.set(...p.pos);
    this.controls.target.set(...p.target);
    this.controls.update();
  }

  resize(w, h) {
    if (!this.camera) return;
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = w / h;
    } else {
      const frustum = 12;
      this.camera.left = -frustum * w / h;
      this.camera.right = frustum * w / h;
      this.camera.top = frustum;
      this.camera.bottom = -frustum;
    }
    this.camera.updateProjectionMatrix();
  }

  fitToBox(box) {
    if (!box || box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const dist = maxDim * 1.8;
    this.camera.position.set(center.x + dist, center.y + dist * 0.6, center.z + dist);
    this.controls.target.copy(center);
    this.controls.update();
  }
}
