class Viewer3D {
  constructor(engine) {
    this.engine = engine;
    this.readOnly = false;
  }

  enter() {
    this.readOnly = true;
    if (this.engine.controls) {
      this.engine._controlsEnabled = this.engine.cameraManager.controls.enabled;
      this.engine.cameraManager.controls.enableRotate = true;
      this.engine.cameraManager.controls.enablePan = true;
      this.engine.cameraManager.controls.enableZoom = true;
    }
    this.engine.fitView();
  }

  exit() {
    this.readOnly = false;
  }

  loadFromEntities(entities3D) {
    this.engine.syncEntities(entities3D);
    this.engine.fitView();
  }
}
