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
      CameraManager3D.configureControls(this.controls);
    }
    return this.camera;
  }

  static configureControls(controls) {
    if (!controls) return;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI - 0.01;
    controls.screenSpacePanning = true;
    if (window.THREE?.MOUSE) {
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
    }
    if (window.THREE?.TOUCH) {
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    }
  }

  setPreset(preset) {
    if (!this.camera) return;
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
    if (this.controls) {
      this.controls.target.set(...p.target);
      this.controls.update();
    } else {
      this.camera.lookAt(...p.target);
    }
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
    if (!this.camera) return;
    if (!box || box.isEmpty()) {
      this.setPreset('home');
      return;
    }
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);

    if (this.camera.isOrthographicCamera) {
      const w = this.container.clientWidth || 800;
      const h = this.container.clientHeight || 600;
      const frustum = maxDim * 0.65;
      this.camera.left = -frustum * w / h;
      this.camera.right = frustum * w / h;
      this.camera.top = frustum;
      this.camera.bottom = -frustum;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(center.x, center.y + maxDim * 0.01, center.z + maxDim * 0.01);
    } else {
      const fovRad = (this.camera.fov * Math.PI) / 180;
      const dist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.35;
      const offset = new THREE.Vector3(1, 0.55, 1).normalize().multiplyScalar(dist);
      this.camera.position.copy(center).add(offset);
    }

    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    } else {
      this.camera.lookAt(center);
    }
  }
}
