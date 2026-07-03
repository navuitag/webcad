class ExportEngine {
  static exportPNG(canvas, filename = 'drawing.png') {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  static exportSVG(drawing, layerManager, width, height) {
    const bb = drawing.getBoundingBox();
    const padding = 20;
    const svgWidth = bb.maxX - bb.minX + padding * 2;
    const svgHeight = bb.maxY - bb.minY + padding * 2;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="${bb.minX - padding} ${-(bb.maxY + padding)} ${svgWidth} ${svgHeight}">\n`;
    svg += `<g transform="scale(1,-1)">\n`;

    const entities = drawing.getVisibleEntities(layerManager);
    for (const entity of entities) {
      svg += ExportEngine._entityToSVG(entity, layerManager);
    }

    svg += `</g>\n</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (drawing.name || 'drawing') + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  static _entityToSVG(entity, layerManager) {
    const color = entity.getColor(layerManager);
    switch (entity.type) {
      case 'LINE':
        return `<line x1="${entity.start.x}" y1="${entity.start.y}" x2="${entity.end.x}" y2="${entity.end.y}" stroke="${color}" stroke-width="1"/>\n`;
      case 'CIRCLE':
        return `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${entity.radius}" fill="none" stroke="${color}" stroke-width="1"/>\n`;
      case 'RECTANGLE': {
        const bb = entity.getBoundingBox();
        const w = bb.maxX - bb.minX;
        const h = bb.maxY - bb.minY;
        return `<rect x="${bb.minX}" y="${bb.minY}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="1"/>\n`;
      }
      case 'POLYLINE': {
        const points = entity.points.map(p => `${p.x},${p.y}`).join(' ');
        return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1"/>\n`;
      }
      case 'TEXT':
        return `<text x="${entity.position.x}" y="${entity.position.y}" fill="${color}" font-size="${entity.height}">${entity.text}</text>\n`;
      default:
        return '';
    }
  }

  static exportPDF(canvas, drawing, filename = 'drawing.pdf') {
    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename || drawing.name + '.pdf');
  }

  static exportJSON(drawing, layerManager) {
    const data = drawing.toJSON(layerManager);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (drawing.name || 'drawing') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  static exportSTL(scene, filename = 'model.stl') {
    if (!scene) return;
    let stl = 'solid WebCAD\n';
    scene.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        const geo = obj.geometry;
        const pos = geo.attributes.position;
        if (!pos) return;
        const indices = geo.index ? geo.index.array : null;
        const matrix = obj.matrixWorld;

        const getVertex = (i) => {
          const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
          v.applyMatrix4(matrix);
          return v;
        };

        const writeFace = (a, b, c) => {
          const vA = getVertex(a), vB = getVertex(b), vC = getVertex(c);
          const ux = vB.x - vA.x, uy = vB.y - vA.y, uz = vB.z - vA.z;
          const vx = vC.x - vA.x, vy = vC.y - vA.y, vz = vC.z - vA.z;
          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;
          stl += `  facet normal ${nx} ${ny} ${nz}\n`;
          stl += `    outer loop\n`;
          stl += `      vertex ${vA.x} ${vA.y} ${vA.z}\n`;
          stl += `      vertex ${vB.x} ${vB.y} ${vB.z}\n`;
          stl += `      vertex ${vC.x} ${vC.y} ${vC.z}\n`;
          stl += `    endloop\n  endfacet\n`;
        };

        if (indices) {
          for (let i = 0; i < indices.length; i += 3) {
            writeFace(indices[i], indices[i + 1], indices[i + 2]);
          }
        } else {
          for (let i = 0; i < pos.count; i += 3) {
            writeFace(i, i + 1, i + 2);
          }
        }
      }
    });
    stl += 'endsolid WebCAD\n';

    const blob = new Blob([stl], { type: 'application/sla' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static exportOBJ(scene, filename = 'model.obj') {
    if (!scene) return;
    let obj = '# WebCAD OBJ Export\n';
    let vertexOffset = 0;

    scene.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.geometry) return;
      obj += `o ${mesh.name || 'object'}\n`;
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const matrix = mesh.matrixWorld;

      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        v.applyMatrix4(matrix);
        obj += `v ${v.x} ${v.y} ${v.z}\n`;
      }

      const indices = geo.index ? geo.index.array : null;
      if (indices) {
        for (let i = 0; i < indices.length; i += 3) {
          obj += `f ${indices[i] + 1 + vertexOffset} ${indices[i + 1] + 1 + vertexOffset} ${indices[i + 2] + 1 + vertexOffset}\n`;
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          obj += `f ${i + 1 + vertexOffset} ${i + 2 + vertexOffset} ${i + 3 + vertexOffset}\n`;
        }
      }
      vertexOffset += pos.count;
    });

    const blob = new Blob([obj], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
