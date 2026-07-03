class BooleanEngine3D {
  static _entityToBrush(mesh) {
    const geo = mesh.geometry.clone();
    const brush = new ThreeAddons.CSG.Brush(geo, mesh.material);
    brush.position.copy(mesh.position);
    brush.rotation.copy(mesh.rotation);
    brush.scale.copy(mesh.scale);
    brush.updateMatrixWorld(true);
    return brush;
  }

  static _geometryToEntityData(geometry) {
    geometry.computeVertexNormals();
    const pos = geometry.attributes.position.array;
    const nor = geometry.attributes.normal?.array;
    const idx = geometry.index?.array;
    return {
      positions: Array.from(pos),
      normals: nor ? Array.from(nor) : null,
      indices: idx ? Array.from(idx) : null
    };
  }

  static operate(op, meshA, meshB, name = 'Boolean') {
    const { Evaluator, ADDITION, SUBTRACTION, INTERSECTION } = ThreeAddons.CSG;
    const evaluator = new Evaluator();
    const brushA = BooleanEngine3D._entityToBrush(meshA);
    const brushB = BooleanEngine3D._entityToBrush(meshB);

    const opMap = { union: ADDITION, subtract: SUBTRACTION, intersect: INTERSECTION };
    const operation = opMap[op] ?? ADDITION;
    const result = evaluator.evaluate(brushA, brushB, operation);
    if (!result?.geometry) return null;

    const entity = new Entity3D('BOOLEAN', name);
    entity.params = {
      operation: op,
      geometry: BooleanEngine3D._geometryToEntityData(result.geometry)
    };
    entity.material = { ...(meshA.userData.entityMaterial || {}) };
    entity._meshDirty = true;
    return entity;
  }

  static operateEntities(op, entityA, entityB, meshA, meshB) {
    const result = BooleanEngine3D.operate(op, meshA, meshB, `${op}_${entityA.name}_${entityB.name}`);
    if (result) result.params.sourceIds = [entityA.id, entityB.id];
    return result;
  }
}
