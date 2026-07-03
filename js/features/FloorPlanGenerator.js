/**
 * FloorPlanGenerator — tự động mặt bằng từ kích thước đất
 */
class FloorPlanGenerator {
  static generate(app, landWidth, landDepth, preset = '2bed') {
    app.drawing.worldUnit = 'm';

    const scaled = typeof ArchitecturalTemplates !== 'undefined'
      && ArchitecturalTemplates.presetRooms(preset, landWidth, landDepth);

    if (scaled) {
      if (scaled.length) {
        ArchitecturalTemplates._drawSite(app, 0, 0, landWidth, landDepth);
        for (const room of scaled) {
          ArchitecturalTemplates._placeRoom(
            app, room.x, room.y, room.w, room.h, room.name
          );
        }
      }
    } else {
      FloorPlanGenerator._legacyGenerate(app, landWidth, landDepth, preset);
    }

    AutoDimensionEngine.dimensionAll(app);
    app.zoomExtents();
    app.requestRender();
    return {
      success: true, preset, landWidth, landDepth,
      roomCount: scaled?.length || 0,
      message: `Đã tạo mặt bằng ${landWidth}×${landDepth}m (${preset}).`
    };
  }

  static _legacyGenerate(app, landWidth, landDepth, preset) {
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
      ArchDrawEngine.createRoom(
        app, room.x, room.y, room.x + room.w, room.y + room.h, { name: room.name }
      );
    }
  }
}
