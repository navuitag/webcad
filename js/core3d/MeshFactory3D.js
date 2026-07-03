class MeshFactory3D {
  static buildGeometry(entity) {
    switch (entity.type) {
      case 'BOX':
        return new THREE.BoxGeometry(
          entity.params.width || 2,
          entity.params.height || 2,
          entity.params.depth || 2
        );
      case 'SPHERE':
        return new THREE.SphereGeometry(entity.params.radius || 1, 32, 24);
      case 'CYLINDER':
        return new THREE.CylinderGeometry(
          entity.params.radiusTop || 1,
          entity.params.radiusBottom || 1,
          entity.params.height || 2,
          32
        );
      case 'CONE':
        return new THREE.ConeGeometry(entity.params.radius || 1, entity.params.height || 2, 32);
      case 'EXTRUDE':
        return MeshFactory3D._extrudeGeometry(entity);
      case 'BOOLEAN':
      case 'MESH':
        return MeshFactory3D._bufferGeometry(entity);
      default:
        return null;
    }
  }

  static _extrudeGeometry(entity) {
    const shape = MeshFactory3D._shapeFromProfile(entity.params.profile);
    if (!shape) return new THREE.BoxGeometry(1, 1, 1);
    return new THREE.ExtrudeGeometry(shape, {
      depth: entity.params.height || 1,
      bevelEnabled: !!entity.params.bevel,
      bevelThickness: entity.params.bevelThickness || 0.1,
      bevelSize: entity.params.bevelSize || 0.1,
      curveSegments: 24
    });
  }

  static _shapeFromProfile(profile) {
    if (!profile || !profile.points || profile.points.length < 3) return null;
    const shape = new THREE.Shape();
    const pts = profile.points;
    shape.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
    shape.closePath();
    return shape;
  }

  /** Đưa profile về gốc, trả thêm tâm để đặt mesh 3D */
  static centerProfile(profile) {
    if (!profile?.points?.length) return { profile, center: { x: 0, y: 0 } };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of profile.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      profile: { points: profile.points.map(p => ({ x: p.x - cx, y: p.y - cy })) },
      center: { x: cx, y: cy }
    };
  }

  static _bufferGeometry(entity) {
    const g = entity.params.geometry;
    if (!g || !g.positions) return new THREE.BoxGeometry(1, 1, 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
    if (g.normals) geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
    if (g.indices) geo.setIndex(g.indices);
    else geo.computeVertexNormals();
    return geo;
  }

  static profileFrom2DEntity(entity2d) {
    const mapPt = (p) => ({ x: p.x, y: -p.y });

    if (entity2d.type === 'HATCH' && entity2d.boundary?.length >= 3) {
      return { points: entity2d.boundary.map(mapPt) };
    }
    if (entity2d.type === 'RECTANGLE') {
      const bb = entity2d.getBoundingBox();
      return {
        points: [
          mapPt({ x: bb.minX, y: bb.minY }), mapPt({ x: bb.maxX, y: bb.minY }),
          mapPt({ x: bb.maxX, y: bb.maxY }), mapPt({ x: bb.minX, y: bb.maxY })
        ]
      };
    }
    if (entity2d.type === 'POLYLINE' && entity2d.closed && entity2d.points.length >= 3) {
      return { points: entity2d.points.map(mapPt) };
    }
    if (entity2d.type === 'CIRCLE') {
      const pts = [];
      const n = 32;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push(mapPt({
          x: entity2d.center.x + entity2d.radius * Math.cos(a),
          y: entity2d.center.y + entity2d.radius * Math.sin(a)
        }));
      }
      return { points: pts };
    }
    return null;
  }
}
