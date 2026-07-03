class OffsetTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'offset';
    this.step = 0;
    this.entity = null;
    this.distance = 10;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.entity = null;
  }

  getPrompt() {
    if (this.step === 0) return 'OFFSET: Chọn đối tượng.';
    return 'OFFSET: Click phía offset (khoảng cách mặc định 10).';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tolerance = 5 / this.app.drawing.view.zoom;

    if (this.step === 0) {
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
      if (hit) {
        this.entity = hit;
        this.step = 1;
        this.app.updateToolInfo(this.getPrompt());
      }
    } else if (this.step === 1) {
      this._run('OFFSET', { entity: this.entity, distance: this.distance, sidePoint: snap });
      this.app.setTool('select');
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class TrimTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'trim';
  }

  getPrompt() {
    return 'TRIM: Click phần đối tượng cần cắt bỏ.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tolerance = 5 / this.app.drawing.view.zoom;
    const entity = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
    if (entity && entity.type === 'LINE') {
      this._run('TRIM', { entity, clickPoint: snap });
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class ExtendTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'extend';
  }

  getPrompt() {
    return 'EXTEND: Click gần đầu mút cần kéo dài.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tolerance = 5 / this.app.drawing.view.zoom;
    const entity = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
    if (entity && entity.type === 'LINE') {
      this._run('EXTEND', { entity, clickPoint: snap });
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class FilletTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'fillet';
    this.step = 0;
    this.line1 = null;
    this.radius = 5;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.line1 = null;
  }

  getPrompt() {
    const prompts = ['FILLET: Chọn đường thẳng thứ nhất.', 'FILLET: Chọn đường thẳng thứ hai.'];
    return prompts[this.step] || prompts[0];
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tolerance = 5 / this.app.drawing.view.zoom;

    if (this.step === 0) {
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
      if (hit?.type === 'LINE') {
        this.line1 = hit;
        this.step = 1;
        this.app.updateToolInfo(this.getPrompt());
      }
    } else {
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
      if (hit?.type === 'LINE' && hit !== this.line1) {
        const result = this._run('FILLET', { line1: this.line1, line2: hit, radius: this.radius });
        if (!result.success) this.app.cadCore.log('FILLET: Không thể bo góc.');
        this.app.setTool('select');
      }
    }
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class MirrorTool extends Tool {
  constructor(app) {
    super(app);
    this.name = 'mirror';
    this.step = 0;
    this.entities = [];
    this.mirrorStart = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.entities = [];
    this.mirrorStart = null;
  }

  getPrompt() {
    if (this.step === 0) return 'MIRROR: Chọn đối tượng. Enter khi xong.';
    if (this.step === 1) return 'MIRROR: Chọn điểm đầu trục gương.';
    return 'MIRROR: Chọn điểm cuối trục gương.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tolerance = 5 / this.app.drawing.view.zoom;

    if (this.step === 0) {
      const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
      if (hit && !this.entities.includes(hit)) this.entities.push(hit);
    } else if (this.step === 1) {
      this.mirrorStart = { x: snap.x, y: snap.y };
      this.step = 2;
      this.app.updateToolInfo(this.getPrompt());
    } else if (this.step === 2) {
      this._run('MIRROR', { entities: this.entities, axisStart: this.mirrorStart, axisEnd: snap });
      this.app.setTool('select');
    }
  }

  onKeyDown(e) {
    if (e.key === 'Enter' && this.step === 0 && this.entities.length > 0) {
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    }
    if (e.key === 'Escape') this.app.setTool('select');
  }
}

class BlockTool extends Tool {
  constructor(app, mode) {
    super(app);
    this.name = mode === 'create' ? 'block-create' : 'block-insert';
    this.mode = mode;
    this.step = 0;
    this.entities = [];
    this.basePoint = null;
  }

  activate() {
    super.activate();
    this.step = 0;
    this.entities = [];
    this.basePoint = null;
  }

  getPrompt() {
    if (this.mode === 'create') {
      if (this.step === 0) return 'BLOCK: Chọn đối tượng. Enter khi xong.';
      return 'BLOCK: Chọn điểm chèn (base point).';
    }
    return this.step === 0 ? 'INSERT: Chọn block.' : 'INSERT: Chọn vị trí chèn.';
  }

  onMouseDown(e, worldPos) {
    const snap = this._getSnappedPos(worldPos);
    const tolerance = 5 / this.app.drawing.view.zoom;

    if (this.mode === 'create') {
      if (this.step === 0) {
        const hit = this.app.cadCore.entities.hitTest(snap.x, snap.y, tolerance);
        if (hit && !this.entities.includes(hit)) this.entities.push(hit);
      } else if (this.step === 1) {
        this.basePoint = { x: snap.x, y: snap.y };
        const name = prompt('Tên block:', 'Block' + (this.app.blockManager.listBlocks().length + 1));
        if (name && this.entities.length > 0) {
          const addAttr = confirm('Thêm Attribute cho block?');
          let attributes = [];
          if (addAttr) {
            const tag = prompt('Tag attribute:', 'NUMBER');
            const def = prompt('Giá trị mặc định:', '001');
            if (tag) {
              attributes = [{ tag, prompt: tag, defaultValue: def || '', position: { ...this.basePoint } }];
            }
          }
          this._run('CREATE_BLOCK', { name, entities: this.entities, basePoint: this.basePoint, attributes });
          this.app._updateBlockPanel();
        }
        this.app.setTool('select');
      }
    } else if (this.mode === 'insert') {
      const blocks = this.app.blockManager.listBlocks();
      if (blocks.length === 0) {
        this.app.cadCore.log('Không có block nào.');
        this.app.setTool('select');
        return;
      }
      if (this.step === 0) {
        const names = blocks.map(b => b.name).join(', ');
        const name = prompt(`Chọn block (${names}):`, blocks[0].name);
        this.blockName = name;
        this.step = 1;
        this.app.updateToolInfo(this.getPrompt());
      } else {
        this._run('INSERT_BLOCK', { name: this.blockName, insertPoint: snap });
        this.app.setTool('select');
      }
    }
  }

  onKeyDown(e) {
    if (this.mode === 'create' && e.key === 'Enter' && this.step === 0 && this.entities.length > 0) {
      this.step = 1;
      this.app.updateToolInfo(this.getPrompt());
    }
    if (e.key === 'Escape') this.app.setTool('select');
  }
}
