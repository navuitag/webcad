/**
 * StyleManager — Linetype, Text Style, Dimension Style
 */
class StyleManager {
  constructor() {
    this.linetypes = new Map([
      ['Continuous', { id: 'Continuous', name: 'Continuous', pattern: [] }],
      ['Dashed', { id: 'Dashed', name: 'Dashed', pattern: [12, 6] }],
      ['Dotted', { id: 'Dotted', name: 'Dotted', pattern: [2, 4] }],
      ['Center', { id: 'Center', name: 'Center', pattern: [20, 4, 4, 4] }],
      ['Hidden', { id: 'Hidden', name: 'Hidden', pattern: [8, 4] }]
    ]);

    this.textStyles = new Map([
      ['Standard', {
        id: 'Standard', name: 'Standard',
        fontFamily: 'Arial, sans-serif', height: 2.5, widthFactor: 1, oblique: 0
      }]
    ]);

    this.dimStyles = new Map([
      ['Standard', {
        id: 'Standard', name: 'Standard',
        arrowSize: 2.5, textHeight: 2.5, extensionOffset: 1, dimLineOffset: 8, textStyleId: 'Standard'
      }]
    ]);

    this.currentLinetypeId = 'Continuous';
    this.currentTextStyleId = 'Standard';
    this.currentDimStyleId = 'Standard';
  }

  getLinetype(id) {
    return this.linetypes.get(id || this.currentLinetypeId) || this.linetypes.get('Continuous');
  }

  getTextStyle(id) {
    return this.textStyles.get(id || this.currentTextStyleId) || this.textStyles.get('Standard');
  }

  getDimStyle(id) {
    return this.dimStyles.get(id || this.currentDimStyleId) || this.dimStyles.get('Standard');
  }

  getLineDash(linetypeId, entityDash = []) {
    if (entityDash && entityDash.length) return entityDash;
    const lt = this.getLinetype(linetypeId);
    return lt ? lt.pattern : [];
  }

  listLinetypes() { return Array.from(this.linetypes.values()); }
  listTextStyles() { return Array.from(this.textStyles.values()); }
  listDimStyles() { return Array.from(this.dimStyles.values()); }

  addLinetype(id, name, pattern) {
    this.linetypes.set(id, { id, name, pattern });
  }

  addTextStyle(id, opts) {
    this.textStyles.set(id, { id, name: opts.name || id, ...opts });
  }

  addDimStyle(id, opts) {
    this.dimStyles.set(id, { id, name: opts.name || id, ...opts });
  }

  toJSON() {
    return {
      linetypes: this.listLinetypes(),
      textStyles: this.listTextStyles(),
      dimStyles: this.listDimStyles(),
      currentLinetypeId: this.currentLinetypeId,
      currentTextStyleId: this.currentTextStyleId,
      currentDimStyleId: this.currentDimStyleId
    };
  }

  fromJSON(data) {
    if (!data) return;
    if (data.linetypes) {
      this.linetypes.clear();
      for (const lt of data.linetypes) this.linetypes.set(lt.id, lt);
    }
    if (data.textStyles) {
      this.textStyles.clear();
      for (const ts of data.textStyles) this.textStyles.set(ts.id, ts);
    }
    if (data.dimStyles) {
      this.dimStyles.clear();
      for (const ds of data.dimStyles) this.dimStyles.set(ds.id, ds);
    }
    this.currentLinetypeId = data.currentLinetypeId || 'Continuous';
    this.currentTextStyleId = data.currentTextStyleId || 'Standard';
    this.currentDimStyleId = data.currentDimStyleId || 'Standard';
  }
}
