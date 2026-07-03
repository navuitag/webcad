/**
 * XrefManager — External reference drawings
 */
class XrefManager {
  constructor() {
    this.xrefs = new Map();
  }

  attach(name, drawingData, insertPoint = { x: 0, y: 0 }) {
    const xref = {
      name,
      insertPoint: { ...insertPoint },
      data: drawingData,
      visible: true
    };
    this.xrefs.set(name, xref);
    return xref;
  }

  detach(name) {
    return this.xrefs.delete(name);
  }

  get(name) {
    return this.xrefs.get(name);
  }

  list() {
    return Array.from(this.xrefs.values());
  }

  instantiateEntities(name) {
    const xref = this.xrefs.get(name);
    if (!xref || !xref.data?.entities2D) return [];
    return xref.data.entities2D.map(eData => {
      const entity = EntityFactory.create(eData);
      if (entity) entity.move(xref.insertPoint.x, xref.insertPoint.y);
      return entity;
    }).filter(Boolean);
  }

  toJSON() {
    return this.list().map(x => ({
      name: x.name,
      insertPoint: x.insertPoint,
      data: x.data,
      visible: x.visible
    }));
  }

  fromJSON(items) {
    this.xrefs.clear();
    if (!Array.isArray(items)) return;
    for (const x of items) this.xrefs.set(x.name, x);
  }
}
