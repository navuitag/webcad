class AiAssistant {
  constructor(app) {
    this.app = app;
    this.history = [];
    this.apiKey = localStorage.getItem('webcad_ai_key') || '';
    this.apiUrl = localStorage.getItem('webcad_ai_url') || 'https://api.openai.com/v1/chat/completions';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('webcad_ai_key', key);
  }

  async process(input) {
    const trimmed = input.trim();
    if (!trimmed) return { success: false, message: 'Nhập yêu cầu...' };

    this.history.push({ role: 'user', content: trimmed });

    if (typeof InteriorAiDesigner !== 'undefined' && InteriorAiDesigner.isInteriorPrompt(trimmed)) {
      const r = InteriorAiDesigner.designFromPrompt(this.app, trimmed);
      this.history.push({ role: 'assistant', content: r.message });
      return { success: r.success, message: r.message };
    }

    const local = AiDrawingEngine.parse(this.app, trimmed) || await this._parseLocal(trimmed);
    if (local) {
      this.history.push({ role: 'assistant', content: local.message });
      return local;
    }

    if (this.apiKey) {
      return await this._callAI(trimmed);
    }

    return {
      success: false,
      message: 'Không hiểu lệnh. Thử: "vẽ hình chữ nhật 100x50", "vẽ đường tròn r=20", "zoom vừa khung". Hoặc cấu hình API key cho AI.'
    };
  }

  async _parseLocal(input) {
    const s = input.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const patterns = [
      {
        re: /(?:ve|draw|tao)\s*(?:duong\s*thang|line)\s*(?:tu|from)?\s*([\d.-]+)\s*[,\s]\s*([\d.-]+)\s*(?:den|to)\s*([\d.-]+)\s*[,\s]\s*([\d.-]+)/,
        fn: (m) => this._drawLine(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4]))
      },
      {
        re: /(?:ve|draw|tao)\s*(?:hinh\s*chu\s*nhat|rectangle|rect)\s*([\d.-]+)\s*[x×]\s*([\d.-]+)/,
        fn: (m) => this._drawRectangle(parseFloat(m[1]), parseFloat(m[2]))
      },
      {
        re: /(?:ve|draw|tao)\s*(?:duong\s*tron|circle)\s*(?:r\s*=?\s*|ban\s*kinh\s*)?([\d.-]+)/,
        fn: (m) => this._drawCircle(parseFloat(m[1]))
      },
      {
        re: /(?:ve|draw)\s*(?:chu\s*|text\s+)(?:["']?(.+?)["']?\s*)?(?:cao|height)?\s*([\d.-]+)?$/,
        fn: (m) => this._drawText(m[1] || 'Text', parseFloat(m[2]) || 10)
      },
      {
        re: /(?:zoom|phong\s*to|thu\s*nho)\s*(?:vua\s*khung|extents|fit|all)/,
        fn: () => { this.app.zoomExtents(); return 'Đã zoom vừa khung.'; }
      },
      {
        re: /(?:xoa|delete|erase)\s*(?:tat\s*ca|all|het)/,
        fn: () => {
          const ok = this.app.deleteAllEntities();
          return ok ? 'Đã xóa tất cả đối tượng.' : 'Không có đối tượng để xóa.';
        }
      },
      {
        re: /^(?:line|l)$/,
        fn: () => { this.app.setTool('line'); return 'Chế độ vẽ Line.'; }
      },
      {
        re: /^(?:circle|c)$/,
        fn: () => { this.app.setTool('circle'); return 'Chế độ vẽ Circle.'; }
      },
      {
        re: /^(?:move|m)$/,
        fn: () => { this.app.setTool('move'); return 'Chế độ Move.'; }
      },
      {
        re: /(?:luu|save)/,
        fn: () => { this.app.saveDrawing(); return 'Đang lưu...'; }
      },
      {
        re: /(?:hoan\s*tac|undo)/,
        fn: () => { this.app.undo(); return 'Hoàn tác.'; }
      },
      {
        re: /(?:grid|luoi)\s*(on|bat|off|tat)/,
        fn: (m) => {
          const on = ['on', 'bat'].includes(m[1]);
          this.app.drawing.view.showGrid = on;
          this.app.requestRender();
          return `Grid: ${on ? 'ON' : 'OFF'}`;
        }
      },
      {
        re: /(?:them|add)\s*layer\s*(.+)/,
        fn: (m) => {
          this.app.layerManager.createLayer(m[1].trim());
          this.app._updateLayerPanel();
          return `Đã tạo layer "${m[1].trim()}".`;
        }
      },
      {
        re: /(?:hop|box)\s*3d\s*([\d.-]+)?/,
        fn: async (m) => {
          await this.app.setMode('3d');
          const size = parseFloat(m[1]) || 2;
          const entity = Entity3D.createBox(size, size, size);
          entity.position = { x: 0, y: size / 2, z: 0 };
          this.app.drawing.addEntity3D(entity);
          this.app.renderer3D.syncEntities(this.app.drawing.entities3D);
          this.app.requestRender();
          return `Đã tạo Box 3D ${size}x${size}x${size}.`;
        }
      }
    ];

    for (const { re, fn } of patterns) {
      const m = s.match(re);
      if (m) {
        const result = await fn(m);
        const message = typeof result === 'string' ? result : result?.message;
        return { success: true, message: message || 'OK' };
      }
    }
    return null;
  }

  _drawLine(x1, y1, x2, y2) {
    const layerId = this.app.layerManager.currentLayerId;
    const line = new LineEntity(layerId, x1, y1, x2, y2);
    this.app.drawing.addEntity(line);
    this.app.collaboration?.broadcastEntityAdded(line);
    this.app.requestRender();
    this.app.updateStatusBar();
    return { success: true, message: `Đã vẽ line (${x1},${y1})→(${x2},${y2}).` };
  }

  _drawRectangle(w, h) {
    const layerId = this.app.layerManager.currentLayerId;
    const rect = new RectangleEntity(layerId, 0, 0, w, h);
    this.app.drawing.addEntity(rect);
    this.app.collaboration?.broadcastEntityAdded(rect);
    this.app.requestRender();
    this.app.updateStatusBar();
    return { success: true, message: `Đã vẽ rectangle ${w}×${h}.` };
  }

  _drawCircle(r) {
    const layerId = this.app.layerManager.currentLayerId;
    const circle = new CircleEntity(layerId, 0, 0, r);
    this.app.drawing.addEntity(circle);
    this.app.collaboration?.broadcastEntityAdded(circle);
    this.app.requestRender();
    this.app.updateStatusBar();
    return { success: true, message: `Đã vẽ circle r=${r}.` };
  }

  _drawText(text, height) {
    const layerId = this.app.layerManager.currentLayerId;
    const entity = new TextEntity(layerId, 0, 0, text, height);
    this.app.drawing.addEntity(entity);
    this.app.requestRender();
    return { success: true, message: `Đã thêm text "${text}".` };
  }

  async _callAI(input) {
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Bạn là trợ lý CAD. Trả lời bằng lệnh WebCAD ngắn gọn: LINE, CIRCLE, RECTANGLE w h, ZOOM EXTENTS, MOVE, v.v. Chỉ trả lệnh, không giải thích.'
            },
            { role: 'user', content: input }
          ],
          max_tokens: 100
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const cmd = data.choices?.[0]?.message?.content?.trim();
      if (cmd) {
        const result = await this._parseLocal(cmd) || { success: this.app.commandManager.execute(cmd), message: cmd };
        this.history.push({ role: 'assistant', content: result.message || cmd });
        return result;
      }
    } catch (e) {
      return { success: false, message: 'AI lỗi: ' + e.message };
    }
    return { success: false, message: 'AI không trả lời.' };
  }

  getSuggestions() {
    return AiDrawingEngine.getSuggestions();
  }
}
