# WebCAD — Kiến trúc chuyên nghiệp

> Phiên bản kiến trúc: **2.0** · Cập nhật: 03/2026

## Tổng quan

```
WebCAD
│
├── Frontend                    ← UI, render, PWA
│   ├── HTML/CSS/JavaScript
│   ├── Canvas 2D
│   ├── Three.js / WebGPU
│   └── PWA
│
├── CAD Engine                  ← Logic hình học & mô hình
│   ├── Geometry Kernel (WASM)  ← JS fallback → WASM
│   ├── Entity Engine
│   ├── Constraint Engine
│   ├── Command Engine
│   └── History Engine
│
├── File Engine                 ← Import / Export / Native format
│   ├── JSON (.wcad.json)
│   ├── SVG / PDF
│   ├── DXF
│   ├── DWG SDK Adapter         ← stub → ODA / LibreDWG
│   └── 3D Exporter (STL/OBJ/GLTF)
│
├── Collaboration               ← Multi-user & project
│   ├── Project Workspace
│   ├── Version History
│   ├── Comment
│   └── Realtime Editing
│
└── Plugin System               ← Mở rộng không sửa core
    ├── Tool Plugin
    ├── Entity Plugin
    ├── Export Plugin
    └── AI Plugin
```

---

## 1. Frontend Layer

| Thành phần | Module hiện tại | Vai trò |
|------------|-----------------|---------|
| Shell UI | `index.html`, `css/*` | Menu, toolbar, panel, status |
| App controller | `js/app.js` | Lifecycle, events, tool routing |
| Canvas 2D | `js/renderers/CanvasRenderer.js` | Grid, entities, layout/viewport |
| 3D | `js/renderers/ThreeRenderer.js`, `js/core3d/*` | WebGPU → WebGL2 fallback |
| PWA | `manifest.json`, `service-worker.js` | Offline, install, file_handlers |
| Platform | `js/platform/WebCADPlatform.js` | Bootstrap & wiring |

**Luồng render:** `Tool → Command Engine → Entity Engine → CanvasRenderer / ThreeRenderer`

---

## 2. CAD Engine

Facade: `js/engine/cad/CadEngine.js` → `CadCore`

| Engine | File | Trạng thái |
|--------|------|------------|
| Geometry Kernel | `GeometryKernel.js` + `GeometryKernelWASM.js` | ✅ JS · 🔲 WASM |
| Entity Engine | `EntitySystem.js`, `entities/*` | ✅ |
| Constraint Engine | `ConstraintSolver.js`, `ParametricEngine.js` | ✅ cơ bản |
| Command Engine | `CommandSystem.js`, `CommandManager.js` | ✅ |
| History Engine | `HistoryManager.js` | ✅ undo/redo |

**Pipeline lệnh chuẩn:**

```
User Input → Tool → cadEngine.run(cmd) → CommandSystem
  → EntitySystem (+ GeometryKernel) → HistoryEngine → Render
```

**WASM roadmap:** `GeometryKernelWASM` load `webcad-geometry.wasm` khi có; fallback `GeometryKernel` (JS).

---

## 3. File Engine

Facade: `js/engine/file/FileEngine.js`

| Format | Import | Export | Module |
|--------|--------|--------|--------|
| `.wcad.json` | ✅ | ✅ | `FileFormatEngine`, `FormatRegistry` |
| `.svg` | — | ✅ | `ExportEngine` |
| `.png` | — | ✅ | `ExportEngine` |
| `.pdf` | — | ✅ | `ExportEngine` |
| `.dxf` | ✅ | ✅ | `DxfEngine`, `ImportEngine` |
| `.dwg` | 🔲 | 🔲 | `DwgAdapter` (SDK stub) |
| `.stl/.obj/.gltf` | ✅ | ✅ | `ImportEngine`, `ExportEngine` |

---

## 4. Collaboration Layer

Facade: `js/engine/collab/CollabPlatform.js`

| Module | File | Trạng thái |
|--------|------|------------|
| Realtime Editing | `CollaborationEngine.js` | ✅ BroadcastChannel + WS |
| Project Workspace | `WorkspaceEngine.js` | ✅ local + cloud metadata |
| Version History | `VersionHistoryEngine.js` | ✅ snapshot chain |
| Comment | `CommentEngine.js` | ✅ pin trên drawing |

---

## 5. Plugin System

Host: `js/plugins/PluginHost.js` + `PluginManager.js`

| Loại | Hook | Ví dụ |
|------|------|-------|
| Tool Plugin | `registerTool(id, factory)` | Custom draw tool |
| Entity Plugin | `registerEntity(type, factory)` | Custom entity type |
| Export Plugin | `registerExporter(format, handler)` | Custom format |
| AI Plugin | `registerAiProvider(provider)` | LLM backend |

---

## 6. Khởi tạo Platform

```javascript
// app.js init()
this.platform = new WebCADPlatform(this);
await this.platform.boot();

// Truy cập engine
this.platform.cad.run('OFFSET', { ... });
this.platform.file.export('dxf');
this.platform.collab.workspace.create('Project A');
this.platform.plugins.registerTool({ id: 'my-tool', ... });
```

---

## 7. Cấu trúc thư mục đề xuất (dần migrate)

```
webcad/
├── index.html
├── manifest.json
├── service-worker.js
├── docs/
│   └── ARCHITECTURE.md
├── css/                          # Frontend
├── js/
│   ├── app.js
│   ├── platform/
│   │   └── WebCADPlatform.js
│   ├── engine/
│   │   ├── cad/
│   │   │   ├── CadEngine.js
│   │   │   └── GeometryKernelWASM.js
│   │   ├── file/
│   │   │   ├── FileEngine.js
│   │   │   └── DwgAdapter.js
│   │   └── collab/
│   │       ├── CollabPlatform.js
│   │       ├── WorkspaceEngine.js
│   │       ├── VersionHistoryEngine.js
│   │       └── CommentEngine.js
│   ├── core/                     # Legacy → CAD Engine internals
│   ├── core/cad/
│   ├── core3d/
│   ├── entities/
│   ├── tools/
│   ├── renderers/
│   ├── exporters/
│   ├── storage/
│   ├── collab/
│   ├── plugins/
│   └── ai/
└── wasm/                         # Future: geometry kernel
    └── webcad-geometry.wasm
```

---

## 8. Lộ trình triển khai

| Phase | Mục tiêu |
|-------|----------|
| **P0** ✅ | CadCore, Command/Entity/History, formats cơ bản |
| **P1** ✅ | 2D pro, 3D WebGPU, FormatRegistry |
| **P2** ✅ | Platform facade, Collab sub-engines, PluginHost |
| **P3** 🔲 | Geometry WASM, DWG SDK adapter |
| **P4** 🔲 | Realtime CRDT, server workspace API |

---

## 9. Nguyên tắc thiết kế

1. **Mọi thao tác qua Command** — không geometry rời trong Tool
2. **Engine độc lập UI** — testable, WASM-ready
3. **Format qua FileEngine** — một điểm import/export
4. **Plugin không patch core** — đăng ký qua PluginHost
5. **Backward compatible** — `.wcad` và `.wcad.json` cùng hỗ trợ
