class MaterialManager3D {
  constructor() {
    this.presets = {
      Standard: { color: '#90caf9', metalness: 0, roughness: 0.72, opacity: 0.92 },
      Metal: { color: '#b0bec5', metalness: 0.9, roughness: 0.25, opacity: 1 },
      Plastic: { color: '#81c784', metalness: 0.0, roughness: 0.45, opacity: 1 },
      Glass: { color: '#81d4fa', metalness: 0.0, roughness: 0.05, opacity: 0.55 },
      Concrete: { color: '#cfd8dc', metalness: 0.0, roughness: 0.85, opacity: 1 }
    };
    this.currentPreset = 'Standard';
  }

  createMaterial(opts = {}) {
    const preset = { ...this.presets[this.currentPreset], ...opts };
    const opacity = preset.opacity ?? 1;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(preset.color),
      metalness: preset.metalness ?? 0,
      roughness: preset.roughness ?? 0.88,
      transparent: preset.transparent ?? opacity < 0.99,
      opacity,
      depthWrite: preset.depthWrite ?? opacity >= 0.65,
      side: THREE.DoubleSide
    });
  }

  updateMaterial(material, entityMaterial) {
    if (!material || !entityMaterial) return;
    material.color.set(entityMaterial.color || '#b0bec5');
    material.metalness = entityMaterial.metalness ?? 0;
    material.roughness = entityMaterial.roughness ?? 0.88;
    material.opacity = entityMaterial.opacity ?? 0.55;
    material.transparent = entityMaterial.transparent ?? material.opacity < 0.99;
    material.depthWrite = entityMaterial.depthWrite ?? material.opacity >= 0.65;
  }

  applyPreset(name) {
    if (this.presets[name]) this.currentPreset = name;
  }

  listPresets() {
    return Object.keys(this.presets);
  }
}
