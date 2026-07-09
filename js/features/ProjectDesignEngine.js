/**
 * ProjectDesignEngine — tích hợp các module trong system_design.md theo hướng local-first.
 * Lưu metadata dự án/tầng/phòng vào drawing.metadata để đi cùng file .wcad.json.
 */
class ProjectDesignEngine {
  static PROJECT_TYPES = {
    house: 'Nhà ở',
    apartment: 'Chung cư',
    hotel: 'Khách sạn',
    restaurant: 'Nhà hàng',
    cafe: 'Quán cà phê',
    homestay: 'Homestay',
    showroom: 'Showroom'
  };

  static IMAGE_PRESETS = {
    hd: { label: 'HD', width: 1280, height: 720 },
    fhd: { label: 'Full HD', width: 1920, height: 1080 },
    '2k': { label: '2K', width: 2560, height: 1440 },
    '4k': { label: '4K', width: 3840, height: 2160 }
  };

  static ensureProject(app) {
    const md = app.drawing.metadata ||= {};
    if (!md.project) {
      md.project = {
        projectId: `P${Date.now().toString(36).toUpperCase()}`,
        name: app.drawing.name || 'Dự án mới',
        type: app._getSpaceType?.() || 'house',
        user: { userId: 'local-user', fullName: '', email: '', role: 'designer' },
        floors: [],
        cameraPath: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    if (!Array.isArray(md.project.floors)) md.project.floors = [];
    if (!Array.isArray(md.project.cameraPath)) md.project.cameraPath = [];
    return md.project;
  }

  static createProject(app, opts = {}) {
    const project = ProjectDesignEngine.ensureProject(app);
    project.name = (opts.name || project.name || app.drawing.name || 'Dự án mới').trim();
    project.type = opts.type || project.type || 'house';
    project.user = { ...project.user, ...(opts.user || {}) };
    project.updatedAt = new Date().toISOString();
    app.setDrawingName?.(project.name);
    if (!project.floors.length) ProjectDesignEngine.addFloor(app, { name: 'Tầng 1', level: 1 });
    return { success: true, project, message: `Đã tạo/cập nhật dự án: ${project.name}` };
  }

  static addFloor(app, opts = {}) {
    const project = ProjectDesignEngine.ensureProject(app);
    const nextLevel = project.floors.length + 1;
    const floor = {
      floorId: `F${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5)}`,
      name: opts.name || `Tầng ${nextLevel}`,
      level: opts.level ?? nextLevel,
      walls: [],
      rooms: [],
      furniture: [],
      createdAt: new Date().toISOString()
    };
    project.floors.push(floor);
    project.updatedAt = new Date().toISOString();
    app.drawing.metadata.modifiedAt = project.updatedAt;
    return { success: true, floor, message: `Đã thêm ${floor.name}` };
  }

  static syncRoomsFromDrawing(app) {
    const project = ProjectDesignEngine.ensureProject(app);
    if (!project.floors.length) ProjectDesignEngine.addFloor(app, { name: 'Tầng 1', level: 1 });
    const floor = project.floors[0];
    const rooms = typeof PlannerRoomDetector !== 'undefined'
      ? PlannerRoomDetector.detectAll(app, { scanPolylines: true, createRooms: false })
      : [];
    floor.rooms = rooms.map((room, index) => ({
      roomId: room.id || `R${index + 1}`,
      name: room.name || `Phòng ${index + 1}`,
      type: room.type || 'room',
      area: Number(room.areaM2 ?? room.area ?? 0),
      floorMaterial: room.floorMaterial || '',
      wallMaterial: room.wallMaterial || ''
    }));
    floor.furniture = app.drawing.entities
      .filter((e) => e.interiorAssetId || e.blockTemplateId)
      .map((e) => ({
        itemId: e.interiorAssetId || e.blockTemplateId,
        name: e.interiorName || e.templateName || e.type,
        x: e.position?.x ?? e.center?.x ?? e.start?.x ?? 0,
        y: e.position?.y ?? e.center?.y ?? e.start?.y ?? 0,
        material: e.materialId || e.style?.material || ''
      }));
    project.updatedAt = new Date().toISOString();
    return { success: true, rooms: floor.rooms, message: `Đã đồng bộ ${floor.rooms.length} phòng vào dự án.` };
  }

  static summarize(app) {
    const project = ProjectDesignEngine.ensureProject(app);
    const rooms = ProjectDesignEngine._detectRoomsSafe(app);
    const bb = app.drawing.getBoundingBox();
    const grossArea = ProjectDesignEngine._areaFromBounds(bb, app.drawing.worldUnit || app.drawing.unit);
    const estimate = ProjectDesignEngine.estimate(app);
    return {
      success: true,
      project,
      rooms,
      grossArea,
      entity2D: app.drawing.entities.length,
      entity3D: app.drawing.entities3D.length,
      floors: project.floors.length,
      estimate,
      message: ProjectDesignEngine.formatSummary(project, rooms, grossArea, estimate)
    };
  }

  static estimate(app) {
    const rooms = ProjectDesignEngine._detectRoomsSafe(app);
    const area = rooms.reduce((sum, r) => sum + Number(r.areaM2 ?? r.area ?? 0), 0);
    const furnitureCount = app.drawing.entities.filter((e) => e.interiorAssetId || e.blockTemplateId).length;
    const areaForCost = area || ProjectDesignEngine._areaFromBounds(app.drawing.getBoundingBox(), app.drawing.worldUnit || app.drawing.unit);
    const floor = Math.round(areaForCost * 350000);
    const wall = Math.round(areaForCost * 220000);
    const ceiling = Math.round(areaForCost * 180000);
    const furniture = Math.round(furnitureCount * 8500000);
    const lighting = Math.round(Math.max(1, rooms.length || 1) * 4500000);
    const decor = Math.round(areaForCost * 120000);
    const total = floor + wall + ceiling + furniture + lighting + decor;
    return { area: areaForCost, rooms: rooms.length, furnitureCount, floor, wall, ceiling, furniture, lighting, decor, total };
  }

  static formatSummary(project, rooms, grossArea, estimate) {
    const type = ProjectDesignEngine.PROJECT_TYPES[project.type] || project.type;
    return [
      `Dự án: ${project.name}`,
      `Loại: ${type}`,
      `Số tầng: ${project.floors.length || 1}`,
      `Phòng phát hiện: ${rooms.length}`,
      `Diện tích tham chiếu: ${grossArea.toFixed(1)} m²`,
      `Đối tượng nội thất: ${estimate.furnitureCount}`,
      `Dự toán sơ bộ: ${ProjectDesignEngine.formatMoney(estimate.total)}`
    ].join('\n');
  }

  static formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
  }

  static exportProjectJson(app) {
    ProjectDesignEngine.syncRoomsFromDrawing(app);
    const project = ProjectDesignEngine.ensureProject(app);
    const payload = {
      ...project,
      drawingId: app.drawing.id,
      drawingName: app.drawing.name,
      summary: ProjectDesignEngine.summarize(app)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const filename = `${FormatRegistry.baseName(app.drawing.name || project.name)}.project.json`;
    ExportEngine._downloadBlob(blob, filename);
    return { success: true, filename, message: 'Đã xuất JSON dự án.' };
  }

  static exportImage(app, opts = {}) {
    const preset = ProjectDesignEngine.IMAGE_PRESETS[opts.quality || 'fhd'] || ProjectDesignEngine.IMAGE_PRESETS.fhd;
    const format = opts.format || 'png';
    const source = app.mode === '3d' && app.renderer3D?.initialized
      ? app.renderer3D.renderer.domElement
      : app.canvas;
    if (app.mode === '3d' && app.renderer3D?.initialized) app.renderer3D.render();
    const out = document.createElement('canvas');
    out.width = preset.width;
    out.height = preset.height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = app.mode === '3d' ? '#4b5563' : '#0d1117';
    ctx.fillRect(0, 0, out.width, out.height);
    const scale = Math.min(out.width / source.width, out.height / source.height);
    const w = source.width * scale;
    const h = source.height * scale;
    ctx.drawImage(source, (out.width - w) / 2, (out.height - h) / 2, w, h);
    const mime = format === 'webp' ? 'image/webp' : format === 'jpg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpg' ? 'jpg' : format;
    const filename = `${FormatRegistry.baseName(app.drawing.name)}.${ext}`;
    out.toBlob((blob) => {
      if (blob) ExportEngine._downloadBlob(blob, filename);
    }, mime, 0.94);
    return { success: true, filename, message: `Đã xuất ảnh ${preset.label}.` };
  }

  static addCameraPoint(app, name) {
    if (!app.renderer3D?.initialized || !app.renderer3D.camera) {
      return { success: false, message: 'Chuyển sang 3D trước khi thêm điểm camera.' };
    }
    const project = ProjectDesignEngine.ensureProject(app);
    const cam = app.renderer3D.camera;
    const target = app.renderer3D.controls?.target || new THREE.Vector3();
    const point = {
      id: `C${Date.now().toString(36).toUpperCase()}`,
      name: name || `Camera ${project.cameraPath.length + 1}`,
      position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
      target: { x: target.x, y: target.y, z: target.z }
    };
    project.cameraPath.push(point);
    project.updatedAt = new Date().toISOString();
    return { success: true, point, message: `Đã thêm ${point.name}.` };
  }

  static clearCameraPath(app) {
    const project = ProjectDesignEngine.ensureProject(app);
    project.cameraPath = [];
    project.updatedAt = new Date().toISOString();
    return { success: true, message: 'Đã xóa camera path.' };
  }

  static async playCameraPath(app, opts = {}) {
    if (!app.renderer3D?.initialized) return { success: false, message: 'Chuyển sang 3D trước.' };
    const project = ProjectDesignEngine.ensureProject(app);
    const path = project.cameraPath;
    if (path.length < 2) return { success: false, message: 'Cần ít nhất 2 điểm camera.' };
    const duration = Math.max(2, Number(opts.duration || 8));
    await ProjectDesignEngine._animateCamera(app, path, duration);
    return { success: true, message: `Đã chạy walkthrough ${duration}s.` };
  }

  static async exportWalkthroughVideo(app, opts = {}) {
    if (!app.renderer3D?.initialized) return { success: false, message: 'Chuyển sang 3D trước khi xuất video.' };
    const canvas = app.renderer3D.renderer.domElement;
    if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
      return { success: false, message: 'Trình duyệt chưa hỗ trợ MediaRecorder/canvas capture.' };
    }
    const project = ProjectDesignEngine.ensureProject(app);
    if (project.cameraPath.length < 2) {
      app.renderer3D.setCameraPreset('front');
      ProjectDesignEngine.addCameraPoint(app, 'Front');
      app.renderer3D.setCameraPreset('iso');
      ProjectDesignEngine.addCameraPoint(app, 'Iso');
    }
    const duration = Math.max(3, Number(opts.duration || 10));
    const fps = Math.max(12, Number(opts.fps || 30));
    const stream = canvas.captureStream(fps);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: ProjectDesignEngine._videoMimeType() });
    rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    const done = new Promise((resolve) => { rec.onstop = resolve; });
    rec.start();
    await ProjectDesignEngine._animateCamera(app, project.cameraPath, duration);
    rec.stop();
    await done;
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
    const filename = `${FormatRegistry.baseName(app.drawing.name)}.webm`;
    ExportEngine._downloadBlob(blob, filename);
    return { success: true, filename, message: `Đã xuất video walkthrough ${duration}s.` };
  }

  static _videoMimeType() {
    const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || 'video/webm';
  }

  static _animateCamera(app, path, duration) {
    return new Promise((resolve) => {
      const cam = app.renderer3D.camera;
      const controls = app.renderer3D.controls;
      const start = performance.now();
      const totalSegments = path.length - 1;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / (duration * 1000));
        const segFloat = t * totalSegments;
        const seg = Math.min(totalSegments - 1, Math.floor(segFloat));
        const local = segFloat - seg;
        const a = path[seg];
        const b = path[seg + 1];
        ProjectDesignEngine._lerpVec(cam.position, a.position, b.position, local);
        if (controls) {
          ProjectDesignEngine._lerpVec(controls.target, a.target, b.target, local);
          controls.update();
        } else {
          cam.lookAt(b.target.x, b.target.y, b.target.z);
        }
        app.renderer3D.render();
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  static _lerpVec(vec, a, b, t) {
    vec.set(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t
    );
  }

  static _detectRoomsSafe(app) {
    try {
      if (typeof PlannerRoomDetector !== 'undefined') {
        return PlannerRoomDetector.detectAll(app, { scanPolylines: true, createRooms: false }) || [];
      }
    } catch (_) {}
    return [];
  }

  static _areaFromBounds(bb, unit) {
    if (!bb || !isFinite(bb.minX) || !isFinite(bb.maxX)) return 0;
    const raw = Math.max(0, bb.maxX - bb.minX) * Math.max(0, bb.maxY - bb.minY);
    if (unit === 'mm') return raw / 1000000;
    if (unit === 'cm') return raw / 10000;
    return raw;
  }
}
