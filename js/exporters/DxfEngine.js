class DxfEngine {
  static export(drawing, layerManager, filename) {
    const lines = [];
    lines.push('0', 'SECTION', '2', 'HEADER');
    lines.push('9', '$ACADVER', '1', 'AC1009');
    lines.push('9', '$INSUNITS', '70', '4');
    lines.push('0', 'ENDSEC');
    lines.push('0', 'SECTION', '2', 'TABLES');
    lines.push('0', 'TABLE', '2', 'LAYER', '70', String(layerManager.layers.length));
    for (const layer of layerManager.layers) {
      lines.push('0', 'LAYER', '2', layer.name, '70', '0', '62', '7', '6', 'CONTINUOUS');
    }
    lines.push('0', 'ENDTAB', '0', 'ENDSEC');
    lines.push('0', 'SECTION', '2', 'ENTITIES');

    const entities = drawing.getVisibleEntities(layerManager);
    for (const entity of entities) {
      DxfEngine._writeEntity(lines, entity, layerManager);
    }

    lines.push('0', 'ENDSEC', '0', 'EOF');
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || (drawing.name || 'drawing') + '.dxf';
    a.click();
    URL.revokeObjectURL(url);
  }

  static _writeEntity(lines, entity, layerManager) {
    const layer = layerManager.getLayer(entity.layerId);
    const layerName = layer ? layer.name : '0';

    switch (entity.type) {
      case 'LINE':
        lines.push('0', 'LINE', '8', layerName);
        lines.push('10', String(entity.start.x), '20', String(entity.start.y), '30', '0');
        lines.push('11', String(entity.end.x), '21', String(entity.end.y), '31', '0');
        break;
      case 'CIRCLE':
        lines.push('0', 'CIRCLE', '8', layerName);
        lines.push('10', String(entity.center.x), '20', String(entity.center.y), '30', '0');
        lines.push('40', String(entity.radius));
        break;
      case 'ARC':
        lines.push('0', 'ARC', '8', layerName);
        lines.push('10', String(entity.center.x), '20', String(entity.center.y), '30', '0');
        lines.push('40', String(entity.radius));
        lines.push('50', String(entity.startAngle * 180 / Math.PI));
        lines.push('51', String(entity.endAngle * 180 / Math.PI));
        break;
      case 'POLYLINE':
        lines.push('0', 'POLYLINE', '8', layerName, '66', '1');
        for (const pt of entity.points) {
          lines.push('0', 'VERTEX', '8', layerName);
          lines.push('10', String(pt.x), '20', String(pt.y), '30', '0');
        }
        lines.push('0', 'SEQEND');
        break;
      case 'TEXT':
        lines.push('0', 'TEXT', '8', layerName);
        lines.push('10', String(entity.position.x), '20', String(entity.position.y), '30', '0');
        lines.push('40', String(entity.height));
        lines.push('1', entity.text);
        break;
      case 'RECTANGLE': {
        const corners = entity._getCorners ? entity._getCorners() : [];
        lines.push('0', 'POLYLINE', '8', layerName, '66', '1', '70', '1');
        for (const pt of corners) {
          lines.push('0', 'VERTEX', '8', layerName);
          lines.push('10', String(pt.x), '20', String(pt.y), '30', '0');
        }
        lines.push('0', 'SEQEND');
        break;
      }
    }
  }

  static import(text, layerManager) {
    const tokens = text.split(/\r?\n/).map(t => t.trim());
    const entities = [];
    const layerMap = {};
    let i = 0;

    while (i < tokens.length - 1) {
      if (tokens[i] === '0' && tokens[i + 1] === 'LAYER') {
        const layerInfo = DxfEngine._parseLayer(tokens, i + 2, layerManager);
        if (layerInfo) {
          layerMap[layerInfo.name] = layerInfo.id;
          i = layerInfo.next;
          continue;
        }
      }
      i++;
    }

    i = 0;
    while (i < tokens.length - 1) {
      const code = tokens[i];
      const value = tokens[i + 1];

      if (code === '0') {
        const defaultLayer = layerManager.getCurrentLayer().id;
        if (value === 'LINE') {
          const parsed = DxfEngine._parseLine(tokens, i + 2, defaultLayer, layerMap);
          if (parsed) { entities.push(parsed.entity); i = parsed.next; continue; }
        } else if (value === 'CIRCLE') {
          const parsed = DxfEngine._parseCircle(tokens, i + 2, defaultLayer, layerMap);
          if (parsed) { entities.push(parsed.entity); i = parsed.next; continue; }
        } else if (value === 'ARC') {
          const parsed = DxfEngine._parseArc(tokens, i + 2, defaultLayer, layerMap);
          if (parsed) { entities.push(parsed.entity); i = parsed.next; continue; }
        } else if (value === 'TEXT') {
          const parsed = DxfEngine._parseText(tokens, i + 2, defaultLayer, layerMap);
          if (parsed) { entities.push(parsed.entity); i = parsed.next; continue; }
        } else if (value === 'POLYLINE' || value === 'LWPOLYLINE') {
          const parsed = DxfEngine._parsePolyline(tokens, i + 2, defaultLayer, layerMap, value);
          if (parsed) { entities.push(parsed.entity); i = parsed.next; continue; }
        }
      }
      i += 2;
    }
    return entities;
  }

  static _parseLayer(tokens, start, layerManager) {
    let name = '';
    let i = start;
    while (i < tokens.length - 1) {
      if (tokens[i] === '0') break;
      if (tokens[i] === '2') name = tokens[i + 1];
      i += 2;
    }
    if (!name) return null;
    let layer = layerManager.layers.find(l => l.name === name);
    if (!layer) layer = layerManager.createLayer(name);
    return { name, id: layer.id, next: i };
  }

  static _resolveLayer(tokens, start, defaultLayer, layerMap) {
    let layerId = defaultLayer;
    let i = start;
    while (i < tokens.length - 1) {
      if (tokens[i] === '0') break;
      if (tokens[i] === '8' && layerMap[tokens[i + 1]]) {
        layerId = layerMap[tokens[i + 1]];
      }
      i += 2;
    }
    return layerId;
  }

  static _parseLine(tokens, start, defaultLayer, layerMap) {
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    let layerId = defaultLayer;
    let i = start;
    while (i < tokens.length - 1) {
      const code = tokens[i];
      const value = tokens[i + 1];
      if (code === '0') break;
      if (code === '8' && layerMap[value]) layerId = layerMap[value];
      if (code === '10') x1 = parseFloat(value);
      if (code === '20') y1 = parseFloat(value);
      if (code === '11') x2 = parseFloat(value);
      if (code === '21') y2 = parseFloat(value);
      i += 2;
    }
    return { entity: new LineEntity(layerId, x1, y1, x2, y2), next: i };
  }

  static _parseCircle(tokens, start, defaultLayer, layerMap) {
    let cx = 0, cy = 0, r = 0;
    let layerId = defaultLayer;
    let i = start;
    while (i < tokens.length - 1) {
      const code = tokens[i];
      const value = tokens[i + 1];
      if (code === '0') break;
      if (code === '8' && layerMap[value]) layerId = layerMap[value];
      if (code === '10') cx = parseFloat(value);
      if (code === '20') cy = parseFloat(value);
      if (code === '40') r = parseFloat(value);
      i += 2;
    }
    return { entity: new CircleEntity(layerId, cx, cy, r), next: i };
  }

  static _parseArc(tokens, start, defaultLayer, layerMap) {
    let cx = 0, cy = 0, r = 0, startAngle = 0, endAngle = 0;
    let layerId = defaultLayer;
    let i = start;
    while (i < tokens.length - 1) {
      const code = tokens[i];
      const value = tokens[i + 1];
      if (code === '0') break;
      if (code === '8' && layerMap[value]) layerId = layerMap[value];
      if (code === '10') cx = parseFloat(value);
      if (code === '20') cy = parseFloat(value);
      if (code === '40') r = parseFloat(value);
      if (code === '50') startAngle = parseFloat(value) * Math.PI / 180;
      if (code === '51') endAngle = parseFloat(value) * Math.PI / 180;
      i += 2;
    }
    return { entity: new ArcEntity(layerId, cx, cy, r, startAngle, endAngle), next: i };
  }

  static _parseText(tokens, start, defaultLayer, layerMap) {
    let x = 0, y = 0, height = 10, text = '';
    let layerId = defaultLayer;
    let i = start;
    while (i < tokens.length - 1) {
      const code = tokens[i];
      const value = tokens[i + 1];
      if (code === '0') break;
      if (code === '8' && layerMap[value]) layerId = layerMap[value];
      if (code === '10') x = parseFloat(value);
      if (code === '20') y = parseFloat(value);
      if (code === '40') height = parseFloat(value);
      if (code === '1') text = value;
      i += 2;
    }
    return { entity: new TextEntity(layerId, x, y, text, height), next: i };
  }

  static _parsePolyline(tokens, start, defaultLayer, layerMap, type) {
    const points = [];
    let layerId = defaultLayer;
    let closed = false;
    let i = start;

    if (type === 'LWPOLYLINE') {
      let x = null;
      while (i < tokens.length - 1) {
        const code = tokens[i];
        const value = tokens[i + 1];
        if (code === '0') break;
        if (code === '8' && layerMap[value]) layerId = layerMap[value];
        if (code === '70') closed = (parseInt(value) & 1) === 1;
        if (code === '10') x = parseFloat(value);
        if (code === '20' && x !== null) {
          points.push({ x, y: parseFloat(value) });
          x = null;
        }
        i += 2;
      }
    } else {
      while (i < tokens.length - 1) {
        if (tokens[i] === '0' && tokens[i + 1] === 'VERTEX') {
          let vx = 0, vy = 0;
          i += 2;
          while (i < tokens.length - 1) {
            if (tokens[i] === '0') break;
            if (tokens[i] === '10') vx = parseFloat(tokens[i + 1]);
            if (tokens[i] === '20') vy = parseFloat(tokens[i + 1]);
            i += 2;
          }
          points.push({ x: vx, y: vy });
          continue;
        }
        if (tokens[i] === '0') break;
        i += 2;
      }
    }

    if (points.length < 2) return null;
    const pline = new PolylineEntity(layerId, points);
    pline.closed = closed;
    return { entity: pline, next: i };
  }
}
