/**
 * AiVisionEngine — bóc tách kích thước từ ảnh/phác thảo
 */
class AiVisionEngine {
  constructor(app) {
    this.app = app;
    this.sketchImage = null;
    this.scale = 1;
  }

  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.sketchImage = img;
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Trace ảnh thành lines (edge detection đơn giản)
   * @param {number} refPixels — chiều dài pixel của cạnh tham chiếu
   * @param {number} refMm — chiều dài thực (mm/m)
   */
  traceToDrawing(refPixels, refMm) {
    if (!this.sketchImage) return { success: false, message: 'Chưa tải ảnh phác thảo' };

    const scale = refMm / refPixels;
    const canvas = document.createElement('canvas');
    const maxW = 400;
    const ratio = this.sketchImage.width / this.sketchImage.height;
    canvas.width = maxW;
    canvas.height = Math.round(maxW / ratio);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.sketchImage, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const lines = AiVisionEngine._detectLines(imgData, canvas.width, canvas.height);

    const layerId = this.app.layerManager.currentLayerId;
    let count = 0;
    for (const ln of lines.slice(0, 200)) {
      const line = new LineEntity(
        layerId,
        (ln.x1 - canvas.width / 2) * scale,
        (canvas.height / 2 - ln.y1) * scale,
        (ln.x2 - canvas.width / 2) * scale,
        (canvas.height / 2 - ln.y2) * scale
      );
      this.app.drawing.addEntity(line);
      count++;
    }

    this.app.zoomExtents();
    this.app.requestRender();
    return { success: true, message: `Đã trace ${count} đường từ phác thảo (tỷ lệ 1:${(1/scale).toFixed(0)}).`, lineCount: count };
  }

  static _detectLines(imgData, w, h) {
    const data = imgData.data;
    const lines = [];
    const threshold = 80;
    const step = 4;

    // Horizontal scan
    for (let y = step; y < h - step; y += step) {
      let start = null;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const dark = lum < threshold;
        if (dark && start === null) start = x;
        if (!dark && start !== null && x - start > 15) {
          lines.push({ x1: start, y1: y, x2: x, y2: y });
          start = null;
        }
      }
    }

    // Vertical scan
    for (let x = step; x < w - step; x += step) {
      let start = null;
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const dark = lum < threshold;
        if (dark && start === null) start = y;
        if (!dark && start !== null && y - start > 15) {
          lines.push({ x1: x, y1: start, x2: x, y2: y });
          start = null;
        }
      }
    }

    return lines;
  }

  async analyzeWithAI(file, apiKey, apiUrl) {
    if (!apiKey) return { success: false, message: 'Cần API key cho vision AI' };
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    try {
      const response = await fetch(apiUrl || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Phân tích bản vẽ kiến trúc. Trả JSON: {"lines":[{"x1":0,"y1":0,"x2":100,"y2":0}],"dimensions":[{"value":3600,"label":"chiều rộng"}]}. Đơn vị mm.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }],
          max_tokens: 800
        })
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const json = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return AiVisionEngine._applyJson(this.app, json);
    } catch (e) {
      return { success: false, message: 'Vision AI: ' + e.message };
    }
  }

  static _applyJson(app, json) {
    const layerId = app.layerManager.currentLayerId;
    let count = 0;
    for (const ln of json.lines || []) {
      app.drawing.addEntity(new LineEntity(layerId, ln.x1 / 10, ln.y1 / 10, ln.x2 / 10, ln.y2 / 10));
      count++;
    }
    app.requestRender();
    return { success: true, message: `AI vision: ${count} lines, ${(json.dimensions || []).length} dims`, data: json };
  }
}
