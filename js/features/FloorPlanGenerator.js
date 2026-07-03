/**
 * FloorPlanGenerator — tự động mặt bằng từ kích thước đất
 */
class FloorPlanGenerator {
  /** Chiều cao chữ nhãn phòng (đơn vị m) — tỉ lệ theo kích thước phòng */
  static _roomLabelHeight(w, h) {
    const minSide = Math.min(w, h);
    const area = w * h;
    return Math.max(0.12, Math.min(minSide * 0.07, Math.sqrt(area) * 0.045, 0.22));
  }

  static generate(app, landWidth, landDepth, preset = '2bed') {
    const layerId = app.layerManager.currentLayerId;
    const margin = 0.5;

    app.cadCore.run('DRAW_RECTANGLE', { x1: 0, y1: 0, x2: landWidth, y2: landDepth });

    const presets = {
      '1bed': [
        { name: 'PHÒNG KHÁCH', x: margin, y: margin, w: landWidth * 0.55, h: landDepth * 0.45 },
        { name: 'PHÒNG NGỦ', x: landWidth * 0.55, y: margin, w: landWidth * 0.42, h: landDepth * 0.45 },
        { name: 'BẾP+WC', x: margin, y: landDepth * 0.48, w: landWidth * 0.92, h: landDepth * 0.48 }
      ],
      '2bed': [
        { name: 'PHÒNG KHÁCH', x: margin, y: margin, w: landWidth * 0.45, h: landDepth * 0.4 },
        { name: 'PN 1', x: landWidth * 0.48, y: margin, w: landWidth * 0.49, h: landDepth * 0.35 },
        { name: 'PN 2', x: landWidth * 0.48, y: landDepth * 0.38, w: landWidth * 0.49, h: landDepth * 0.35 },
        { name: 'BẾP', x: margin, y: landDepth * 0.45, w: landWidth * 0.3, h: landDepth * 0.5 },
        { name: 'WC', x: landWidth * 0.33, y: landDepth * 0.45, w: landWidth * 0.12, h: landDepth * 0.25 }
      ],
      'studio': [
        { name: 'STUDIO', x: margin, y: margin, w: landWidth - margin * 2, h: landDepth * 0.65 },
        { name: 'WC', x: margin, y: landDepth * 0.68, w: landWidth * 0.3, h: landDepth * 0.28 }
      ]
    };

    const rooms = presets[preset] || presets['2bed'];

    for (const room of rooms) {
      app.cadCore.run('DRAW_RECTANGLE', {
        x1: room.x, y1: room.y, x2: room.x + room.w, y2: room.y + room.h
      });
      const labelH = FloorPlanGenerator._roomLabelHeight(room.w, room.h);
      const textResult = app.cadCore.run('DRAW_TEXT', {
        x: room.x + room.w / 2,
        y: room.y + room.h / 2,
        text: room.name,
        height: labelH
      });
      if (textResult.entity) {
        textResult.entity.centered = true;
        textResult.entity.textStyleId = 'RoomLabel';
      }
      const doorX = room.x + room.w / 2;
      app.cadCore.run('DRAW_LINE', { x1: doorX - 0.45, y1: room.y, x2: doorX + 0.45, y2: room.y });
    }

    AutoDimensionEngine.dimensionAll(app);
    app.zoomExtents();
    app.requestRender();
    return {
      success: true, preset, landWidth, landDepth, roomCount: rooms.length,
      message: `Đã tạo mặt bằng ${landWidth}×${landDepth}m (${preset}, ${rooms.length} phòng).`
    };
  }
}
