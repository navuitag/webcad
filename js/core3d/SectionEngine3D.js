class SectionEngine3D {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.enabled = false;
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.helper = null;
  }

  setPlane(normal = { x: 0, y: 1, z: 0 }, constant = 0) {
    this.plane.normal.set(normal.x, normal.y, normal.z).normalize();
    this.plane.constant = constant;
    this._apply();
    this._updateHelper();
  }

  setAxis(axis, offset = 0) {
    const normals = {
      x: { x: 1, y: 0, z: 0 },
      y: { x: 0, y: 1, z: 0 },
      z: { x: 0, y: 0, z: 1 }
    };
    this.setPlane(normals[axis] || normals.y, offset);
  }

  enable(on = true) {
    this.enabled = on;
    this._apply();
    if (this.helper) this.helper.visible = on;
  }

  toggle() {
    this.enable(!this.enabled);
    return this.enabled;
  }

  _apply() {
    if (!this.renderer) return;
    if (this.renderer.isWebGPURenderer) {
      if (this.helper) this.helper.visible = this.enabled;
      return;
    }
    this.renderer.clippingPlanes = this.enabled ? [this.plane] : [];
    this.renderer.localClippingEnabled = this.enabled;
    this.scene.traverse(obj => {
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          m.clippingPlanes = this.enabled ? [this.plane] : [];
          m.clipIntersection = true;
          m.needsUpdate = true;
        }
      }
    });
  }

  _updateHelper() {
    if (!this.helper) {
      this.helper = new THREE.PlaneHelper(this.plane, 8, 0xff7043);
      this.helper.visible = this.enabled;
      this.scene.add(this.helper);
    } else {
      this.helper.plane.copy(this.plane);
    }
  }

  dispose() {
    if (this.helper) {
      this.scene.remove(this.helper);
      this.helper = null;
    }
  }
}
