/**
 * DirectInput — nhập kích thước bằng bàn phím khi vẽ (gõ số + Enter)
 */
class DirectInput {
  constructor(app) {
    this.app = app;
    this.buffer = '';
    this.context = null;
    this.rectStep = null;
    this.pendingWidth = null;
  }

  clear() {
    this.buffer = '';
    this.context = null;
    this.rectStep = null;
    this.pendingWidth = null;
    this._updateDisplay();
  }

  setContext(ctx) {
    const same = this.context
      && this.context.type === ctx.type
      && this._samePoint(this.context.anchor, ctx.anchor)
      && (ctx.type !== 'rectangle' || this._samePoint(this.context.corner1, ctx.corner1));
    this.context = ctx;
    if (!same) {
      this.buffer = '';
      this.rectStep = ctx.type === 'rectangle' ? 'width' : null;
      this.pendingWidth = null;
    }
    this._updateDisplay();
  }

  isActive() {
    return !!this.context;
  }

  handleKeyDown(e) {
    if (!this.context) return false;
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;

    if (e.key === 'Enter') {
      if (!this.buffer.trim()) return false;
      e.preventDefault();
      this._submit();
      return true;
    }
    if (e.key === 'Escape') {
      if (this.buffer || this.pendingWidth != null) {
        e.preventDefault();
        this.buffer = '';
        this.pendingWidth = null;
        this.rectStep = this.context.type === 'rectangle' ? 'width' : null;
        this._updateDisplay();
        this._previewFromBuffer();
        return true;
      }
      return false;
    }
    if (e.key === 'Backspace') {
      if (this.buffer) {
        e.preventDefault();
        this.buffer = this.buffer.slice(0, -1);
        this._updateDisplay();
        this._previewFromBuffer();
        return true;
      }
      return false;
    }
    if (e.key === 'Tab' && this.context.type === 'rectangle') {
      e.preventDefault();
      const val = this._parseNumber(this.buffer);
      if (val != null && this.rectStep === 'width') {
        this.pendingWidth = val;
        this.rectStep = 'height';
        this.buffer = '';
      } else if (this.rectStep === 'height') {
        this.rectStep = 'width';
        this.buffer = this.pendingWidth != null ? String(this.pendingWidth) : '';
        this.pendingWidth = null;
      }
      this._updateDisplay();
      return true;
    }
    if (/^[0-9.,xX×]$/.test(e.key)) {
      e.preventDefault();
      if (e.key === ',') this.buffer += '.';
      else if (e.key === '×') this.buffer += 'x';
      else this.buffer += e.key;
      this._updateDisplay();
      this._previewFromBuffer();
      return true;
    }
    return false;
  }

  _samePoint(a, b) {
    if (!a || !b) return false;
    return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
  }

  _parseNumber(str) {
    const v = parseFloat(String(str).trim().replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  _parseRectangle(str) {
    const s = String(str).trim().replace(/,/g, '.');
    const m = s.match(/^([\d.]+)\s*[xX×]\s*([\d.]+)$/);
    if (m) {
      const w = parseFloat(m[1]);
      const h = parseFloat(m[2]);
      if (w > 0 && h > 0) return { w, h };
    }
    return null;
  }

  _submit() {
    const ctx = this.context;
    if (!ctx) return;

    if (ctx.type === 'length') {
      const len = this._parseNumber(this.buffer);
      if (len == null) return;
      const pt = DirectInput.pointAtLength(ctx.anchor, ctx.cursor, len, ctx.ortho);
      ctx.onApply(pt);
      this.buffer = '';
      this._updateDisplay();
      return;
    }

    if (ctx.type === 'radius') {
      const r = this._parseNumber(this.buffer);
      if (r == null) return;
      ctx.onApply(r);
      this.buffer = '';
      this._updateDisplay();
      return;
    }

    if (ctx.type === 'rectangle') {
      const both = this._parseRectangle(this.buffer);
      if (both) {
        ctx.onApply(DirectInput.rectangleCorners(ctx.corner1, ctx.cursor, both.w, both.h, ctx.ortho));
        this._resetRect();
        return;
      }
      const val = this._parseNumber(this.buffer);
      if (val == null) return;
      if (this.rectStep === 'width') {
        this.pendingWidth = val;
        this.rectStep = 'height';
        this.buffer = '';
        this._updateDisplay();
        return;
      }
      if (this.pendingWidth != null) {
        ctx.onApply(DirectInput.rectangleCorners(
          ctx.corner1, ctx.cursor, this.pendingWidth, val, ctx.ortho
        ));
        this._resetRect();
      }
    }
  }

  _resetRect() {
    this.buffer = '';
    this.pendingWidth = null;
    this.rectStep = 'width';
    this._updateDisplay();
  }

  _previewFromBuffer() {
    const ctx = this.context;
    if (!ctx || !this.buffer.trim()) {
      if (ctx?.onPreview && ctx.cursor) ctx.onPreview(ctx.cursor);
      this.app.requestRender();
      return;
    }

    if (ctx.type === 'length') {
      const len = this._parseNumber(this.buffer);
      if (len != null) {
        ctx.onPreview(DirectInput.pointAtLength(ctx.anchor, ctx.cursor, len, ctx.ortho));
      }
    } else if (ctx.type === 'radius') {
      const r = this._parseNumber(this.buffer);
      if (r != null) ctx.onPreview(r);
    } else if (ctx.type === 'rectangle') {
      const both = this._parseRectangle(this.buffer);
      if (both) {
        ctx.onPreview(DirectInput.rectangleCorners(ctx.corner1, ctx.cursor, both.w, both.h, ctx.ortho));
      } else {
        const val = this._parseNumber(this.buffer);
        if (val != null) {
          if (this.rectStep === 'height' && this.pendingWidth != null) {
            ctx.onPreview(DirectInput.rectangleCorners(
              ctx.corner1, ctx.cursor, this.pendingWidth, val, ctx.ortho
            ));
          } else {
            const h = Math.abs(ctx.cursor.y - ctx.corner1.y) || Math.abs(ctx.cursor.x - ctx.corner1.x) || 1;
            ctx.onPreview(DirectInput.rectangleCorners(ctx.corner1, ctx.cursor, val, h, ctx.ortho));
          }
        }
      }
    }
    this.app.requestRender();
  }

  _updateDisplay() {
    const el = document.getElementById('status-direct-input');
    if (!el) return;
    const ctx = this.context;
    if (!ctx) {
      el.textContent = '';
      el.title = '';
      return;
    }

    const unit = this.app.drawing?.unit || 'mm';
    let hint = '';
    if (ctx.type === 'rectangle') {
      if (this.rectStep === 'height' && this.pendingWidth != null) {
        hint = `Rộng ${this.pendingWidth} ${unit} — nhập sâu + Enter`;
      } else {
        hint = `R×S (vd 4000x3000) hoặc rộng + Tab + sâu + Enter`;
      }
    } else if (ctx.type === 'radius') {
      hint = 'Bán kính + Enter';
    } else {
      hint = 'Chiều dài + Enter';
    }

    el.title = hint;
    if (this.buffer) {
      el.textContent = `${ctx.label || 'KT'}: ${this.buffer}`;
    } else if (this.pendingWidth != null && ctx.type === 'rectangle') {
      el.textContent = `Rộng: ${this.pendingWidth} ${unit}`;
    } else {
      el.textContent = hint;
    }
  }

  static pointAtLength(anchor, cursor, length, ortho) {
    let end = ortho
      ? GeometryKernel.applyOrtho(anchor.x, anchor.y, cursor.x, cursor.y)
      : { x: cursor.x, y: cursor.y };
    const dx = end.x - anchor.x;
    const dy = end.y - anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1e-10) return { x: anchor.x + length, y: anchor.y };
    const f = length / dist;
    return { x: anchor.x + dx * f, y: anchor.y + dy * f };
  }

  static rectangleCorners(corner1, cursor, width, height, ortho) {
    const sx = cursor.x >= corner1.x ? 1 : -1;
    const sy = cursor.y >= corner1.y ? 1 : -1;
    if (ortho) {
      return {
        x: corner1.x + sx * Math.abs(width),
        y: corner1.y + sy * Math.abs(height)
      };
    }
    const angle = Math.atan2(cursor.y - corner1.y, cursor.x - corner1.x);
    return {
      x: corner1.x + Math.cos(angle) * width,
      y: corner1.y + Math.sin(angle) * height
    };
  }
}
