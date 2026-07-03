class BlockManager {
  constructor() {
    this.blocks = new Map();
  }

  createBlock(name, entities, basePoint = { x: 0, y: 0 }, attributes = []) {
    const block = {
      name,
      basePoint: { ...basePoint },
      entities: entities.map(e => e.toJSON()),
      attributes: attributes.map(a => ({
        tag: a.tag,
        prompt: a.prompt || a.tag,
        defaultValue: a.defaultValue || '',
        value: a.value || a.defaultValue || '',
        position: { ...(a.position || basePoint) },
        height: a.height || 2.5
      }))
    };
    this.blocks.set(name, block);
    return block;
  }

  getBlock(name) {
    return this.blocks.get(name);
  }

  listBlocks() {
    return Array.from(this.blocks.values());
  }

  deleteBlock(name) {
    return this.blocks.delete(name);
  }

  instantiate(name, insertPoint, rotation = 0, scale = 1, attributeValues = {}) {
    const block = this.getBlock(name);
    if (!block) return [];
    const entities = block.entities.map(eData => {
      const entity = EntityFactory.create(eData);
      if (!entity) return null;
      entity.move(-block.basePoint.x, -block.basePoint.y);
      entity.scale(0, 0, scale);
      entity.rotate(0, 0, rotation);
      entity.move(insertPoint.x, insertPoint.y);
      entity.id = 'ent_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      return entity;
    }).filter(Boolean);

    if (block.attributes) {
      for (const attr of block.attributes) {
        const value = attributeValues[attr.tag] ?? attr.value ?? attr.defaultValue ?? '';
        const pos = { ...attr.position };
        pos.x = (pos.x - block.basePoint.x) * scale;
        pos.y = (pos.y - block.basePoint.y) * scale;
        const rotated = GeometryEngine.rotatePoint(pos.x, pos.y, 0, 0, rotation);
        const text = new TextEntity(
          entities[0]?.layerId || 'layer_0',
          insertPoint.x + rotated.x,
          insertPoint.y + rotated.y,
          value,
          (attr.height || 2.5) * scale
        );
        text.tag = attr.tag;
        entities.push(text);
      }
    }
    return entities;
  }

  toJSON() {
    return Array.from(this.blocks.values());
  }

  fromJSON(blocks) {
    this.blocks.clear();
    if (!Array.isArray(blocks)) return;
    for (const block of blocks) {
      this.blocks.set(block.name, block);
    }
  }
}
