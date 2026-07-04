class LightingManager3D {
  constructor(scene) {
    this.scene = scene;
    this.lights = {};
    this.settings = {
      ambientIntensity: 0.65,
      directionalIntensity: 0.95,
      hemisphereIntensity: 0.5,
      fillIntensity: 0.45,
      shadows: false
    };
    this._build();
  }

  _build() {
    this.lights.ambient = new THREE.AmbientLight(0xffffff, this.settings.ambientIntensity);
    this.scene.add(this.lights.ambient);

    this.lights.hemisphere = new THREE.HemisphereLight(0xffffff, 0xeceff1, this.settings.hemisphereIntensity);
    this.scene.add(this.lights.hemisphere);

    this.lights.directional = new THREE.DirectionalLight(0xffffff, this.settings.directionalIntensity);
    this.lights.directional.position.set(10, 15, 8);
    this.lights.directional.castShadow = this.settings.shadows;
    this.scene.add(this.lights.directional);

    this.lights.fill = new THREE.DirectionalLight(0xffffff, this.settings.fillIntensity ?? 0.45);
    this.lights.fill.position.set(-6, 4, -8);
    this.scene.add(this.lights.fill);
  }

  applySettings(settings) {
    Object.assign(this.settings, settings);
    this.lights.ambient.intensity = this.settings.ambientIntensity;
    this.lights.directional.intensity = this.settings.directionalIntensity;
    this.lights.hemisphere.intensity = this.settings.hemisphereIntensity;
    this.lights.directional.castShadow = !!this.settings.shadows;
    if (this.settings.fillIntensity != null && this.lights.fill) {
      this.lights.fill.intensity = this.settings.fillIntensity;
    }
  }

  applyInteriorPreset(preset) {
    if (!preset) return;
    this.applySettings(preset);
    if (preset.ambientColor != null) this.lights.ambient.color.setHex(preset.ambientColor);
    if (preset.directionalColor != null) this.lights.directional.color.setHex(preset.directionalColor);
    if (preset.hemisphereSky != null) this.lights.hemisphere.color.setHex(preset.hemisphereSky);
    if (preset.hemisphereGround != null) this.lights.hemisphere.groundColor.setHex(preset.hemisphereGround);
    if (preset.fillIntensity != null && this.lights.fill) {
      this.lights.fill.intensity = preset.fillIntensity;
    }
  }

  setPreset(preset) {
    const presets = {
      studio: { ambientIntensity: 0.72, directionalIntensity: 1.0, hemisphereIntensity: 0.55, fillIntensity: 0.5, shadows: false },
      outdoor: { ambientIntensity: 0.78, directionalIntensity: 1.15, hemisphereIntensity: 0.65, fillIntensity: 0.4, shadows: true },
      flat: { ambientIntensity: 0.92, directionalIntensity: 0.55, hemisphereIntensity: 0.45, fillIntensity: 0.35, shadows: false },
      dark: { ambientIntensity: 0.9, directionalIntensity: 1.25, hemisphereIntensity: 0.28, fillIntensity: 0.8, shadows: false }
    };
    this.applySettings(presets[preset] || presets.studio);
  }
}
