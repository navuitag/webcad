/**
 * GeometryKernelWASM — adapter WASM với fallback JS
 *
 * Khi có webcad-geometry.wasm → delegate sang WASM
 * Hiện tại: proxy sang GeometryKernel (JS)
 */
class GeometryKernelWASM {
  static _wasm = null;
  static _ready = null;
  static backend = 'javascript';

  static async init(wasmUrl = './wasm/webcad-geometry.wasm') {
    if (GeometryKernelWASM._ready) return GeometryKernelWASM._ready;

    GeometryKernelWASM._ready = (async () => {
      try {
        if (typeof WebAssembly !== 'undefined') {
          const resp = await fetch(wasmUrl, { method: 'HEAD' });
          if (resp.ok) {
            // Future: instantiate WASM module
            // const bytes = await fetch(wasmUrl).then(r => r.arrayBuffer());
            // GeometryKernelWASM._wasm = await WebAssembly.instantiate(bytes, imports);
            // GeometryKernelWASM.backend = 'wasm';
          }
        }
      } catch (_) {
        /* WASM not available — use JS kernel */
      }
      GeometryKernelWASM.backend = 'javascript';
      return GeometryKernelWASM.backend;
    })();

    return GeometryKernelWASM._ready;
  }

  static getKernel() {
    return GeometryKernel;
  }

  static distance(x1, y1, x2, y2) {
    return GeometryKernel.distance(x1, y1, x2, y2);
  }

  static offsetLine(x1, y1, x2, y2, dist) {
    return GeometryKernel.offsetLine(x1, y1, x2, y2, dist);
  }

  static filletLines(l1, l2, r) {
    return GeometryKernel.filletLines(l1, l2, r);
  }

  static chamferLines(l1, l2, d) {
    return GeometryKernel.chamferLines(l1, l2, d);
  }

  static boolean(op, polyA, polyB) {
    return GeometryKernel.boolean(op, polyA, polyB);
  }

  static getStatus() {
    return { backend: GeometryKernelWASM.backend, wasmLoaded: !!GeometryKernelWASM._wasm };
  }
}

// Optional: expose as primary geometry for CadEngine
const GeometryEngineWASM = GeometryKernelWASM;
