class MaterialManager3D {
  constructor() {
    this.presets = {
      Standard: { color: '#4fc3f7', metalness: 0.1, roughness: 0.6, opacity: 1 },
      Metal: { color: '#b0bec5', metalness: 0.9, roughness: 0.25, opacity: 1 },
      Plastic: { color: '#66bb6a', metalness: 0.0, roughness: 0.45, opacity: 1 },
      Glass: { color: '#81d4fa', metalness: 0.0, roughness: 0.05, opacity: 0.35 },
      Concrete: { color: '#9e9e9e', metalness: 0.0, roughness: 0.85, opacity: 1 }
    };
    this.currentPreset = 'Standard';
  }

  createMaterial(opts = {}) {
    const preset = { ...this.presets[this.currentPreset], ...opts };
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(preset.color),
      metalness: preset.metalness ?? 0.1,
      roughness: preset.roughness ?? 0.6,
      transparent: preset.opacity < 1,
      opacity: preset.opacity ?? 1,
      side: THREE.DoubleSide
    });
  }

  updateMaterial(material, entityMaterial) {
    if (!material || !entityMaterial) return;
    material.color.set(entityMaterial.color || '#4fc3f7');
    material.metalness = entityMaterial.metalness ?? 0.1;
    material.roughness = entityMaterial.roughness ?? 0.6;
    material.opacity = entityMaterial.opacity ?? 1;
    material.transparent = entityMaterial.transparent || material.opacity < 1;
  }

  applyPreset(name) {
    if (this.presets[name]) this.currentPreset = name;
  }

  listPresets() {
    return Object.keys(this.presets);
  }
}
