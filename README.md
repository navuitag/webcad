# WebCAD

**WebCAD** là phần mềm thiết kế bản vẽ kỹ thuật **2D / Planner / 3D** chạy trên trình duyệt. Ứng dụng hỗ trợ vẽ CAD, mặt bằng kiến trúc (plan view), chuyển **CAD → Planner** (thiết kế nội thất), module **Interior Design** (AI, BIM-lite, Cloud), mô hình 3D render, AI hỗ trợ vẽ, xuất/nhập nhiều định dạng và hoạt động offline qua PWA.

> Tài liệu: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`../WebCAD_SDD.md`](../WebCAD_SDD.md) · [`../CAD_TO_PLANNER_SDD.md`](../CAD_TO_PLANNER_SDD.md) · [`../Interior_Design_Module_SDD.md`](../Interior_Design_Module_SDD.md)

---

## Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt & chạy](#cài-đặt--chạy)
3. [Giao diện](#giao-diện)
4. [Chế độ làm việc](#chế-độ-làm-việc)
5. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
6. [Phím tắt & lệnh](#phím-tắt--lệnh)
7. [Định dạng file](#định-dạng-file)
8. [Xử lý sự cố](#xử-lý-sự-cố)
9. [Phát triển](#phát-triển)
10. [Tác giả & giấy phép](#tác-giả--giấy-phép)

---

## Yêu cầu hệ thống

| Thành phần | Yêu cầu |
|------------|---------|
| Trình duyệt | Chrome 113+, Edge 113+, Firefox 115+, Safari 17+ (khuyến nghị Chrome/Edge) |
| JavaScript | Bật |
| Mạng lần đầu | Cần internet để tải Three.js từ CDN |
| Ổ cứng | ~50 MB (cache PWA sau lần đầu) |
| Màn hình | Desktop khuyến nghị; hỗ trợ tablet/mobile (responsive) |

**Lưu ý:** 3D dùng **WebGPU** nếu trình duyệt hỗ trợ, tự fallback **WebGL2**.

---

## Cài đặt & chạy

WebCAD là ứng dụng web tĩnh (HTML/CSS/JS), **không cần** `npm install` hay build.

### Clone & chạy

```bash
git clone git@github.com:navuitag/webcad.git
cd webcad
python3 -m http.server 8080
```

Mở **http://localhost:8080/**

> **Quan trọng:** Phải chạy qua HTTP(S), không mở trực tiếp `file://` — Service Worker và ES modules sẽ không hoạt động.

Sau khi cập nhật code: **Ctrl+Shift+R** (hard refresh) hoặc xóa cache Service Worker trong DevTools → Application.

### Cấu trúc thư mục chính

```
webcad/
├── index.html              # Trang chính
├── manifest.json           # PWA manifest
├── service-worker.js       # Cache offline (webcad-v54)
├── css/
├── js/
│   ├── app.js              # Ứng dụng chính
│   ├── core/               # Drawing, Layer, History...
│   ├── entities/           # Line, Circle, Hatch, 3D...
│   ├── tools/              # Công cụ vẽ/sửa/chọn
│   ├── features/
│   │   ├── planner/        # CAD → Planner Engine
│   │   ├── interior/       # Interior Design Module
│   │   ├── SelectionResizeEngine.js
│   │   └── ...
│   ├── ai/                 # AiAssistant, AiDrawingEngine
│   ├── renderers/          # Canvas 2D, Three.js 3D
│   └── core3d/             # Engine 3D
├── docs/ARCHITECTURE.md
└── icons/
```

### Cài đặt PWA (tùy chọn)

Chrome/Edge → biểu tượng **Cài đặt** trên thanh địa chỉ → **Install WebCAD**. App có thể mở offline sau lần tải đầu.

---

## Giao diện

```
┌─────────────────────────────────────────────────────────────┐
│  Menu: Tệp · Tính năng · Sửa · Xem · Cloud · Collab · ...   │
├─────────────────────────────────────────────────────────────┤
│  Toolbar: Vẽ · Kiến trúc · Sửa · Đo · Block · 3D           │
├──────────┬──────────────────────────────────────┬───────────┤
│ Panel    │                                      │ Panel     │
│ trái     │         Canvas 2D / 3D               │ phải      │
│ AI +     │    [CAD|Planner|3D]  Zoom · Snap     │ Layers    │
│ Tính     │                                      │ Thuộc     │
│ năng     │                                      │ tính      │
│ (5 tab)  │                                      │ Cloud     │
└──────────┴──────────────────────────────────────┴───────────┘
│  Status: tọa độ · zoom · chế độ · tên bản vẽ              │
└─────────────────────────────────────────────────────────────┘
```

| Vùng | Chức năng |
|------|-----------|
| **Panel trái** | AI Assistant, panel **Tính năng** (5 tab), công cụ |
| **Canvas** | Vùng vẽ; toggle **CAD / Planner / 3D** góc dưới |
| **Panel phải** | Layer, Layout, Block, Cloud, Collab, thuộc tính đối tượng |
| **Thanh lệnh** | Lệnh CAD (`LINE`, `ZOOMEXTENTS`, `UNDO`…) |

Panel **Tính năng** gồm 5 tab: **Planner · Nội thất · Mẫu · BIM · Cloud** (tab được nhớ trong trình duyệt).

---

## Chế độ làm việc

| Chế độ | Mô tả |
|--------|--------|
| **CAD 2D** | Vẽ và sửa bản vẽ kỹ thuật, plan view kiến trúc |
| **Planner** | Không gian thiết kế nội thất (2D canvas, viền xanh) — kéo thả nội thất, chỉnh vật liệu |
| **Render 3D** | Extrude 2D → khối 3D, ánh sáng studio, màu sáng dễ quan sát |

Chuyển chế độ: menu **Chế độ**, toggle trên canvas, hoặc lệnh AI *"chế độ planner"* / *"render 3d"*.

---

## Hướng dẫn sử dụng

### 1. Bản vẽ 2D cơ bản

- Toolbar hoặc lệnh: Line, Polyline, Circle, Arc, Rectangle, Text, Hatch
- Sửa: Move, Copy, Rotate, Scale, Offset, Trim, Extend, Fillet, Mirror, Array…
- **Snap / Ortho / Lưới**: menu Xem hoặc thanh công cụ canvas
- **Esc** → công cụ Select

#### Chỉnh kích cỡ đối tượng (2 cách)

1. **Nhập số** — chọn đối tượng → panel **Thuộc tính**: Chiều rộng, Chiều cao (hoặc đường kính / chiều dài)
2. **Kéo thả** — công cụ Select → grip vuông trắng trên góc/cạnh (8 grip hình hộp, grip bán kính cho tròn, grip điểm cho đường thẳng)

### 2. Kiến trúc & mặt bằng

Toolbar **Kiến trúc** (đơn vị **m**): Tường, Phòng, Cột, Sàn, Trần…

Tab **Planner** (hoặc **Mẫu**):

- **Tạo mặt bằng** — Rộng × Sâu (m)
- **Chuyển Plan view** — chuyển hình 2D sang ký hiệu mặt bằng
- **Mẫu nhà / tầng / phòng / cảnh quan** — click để chèn

Tab **Mẫu** → **Thư viện nội thất & cảnh quan** (đơn vị **cm**): click mẫu → click canvas để đặt.

### 3. CAD → Planner

Tab **Planner**:

1. Chọn **Loại dự án / không gian** (căn hộ, homestay, khách sạn…)
2. **Chuyển sang Planner** — pipeline: Plan view → Semantic → Phát hiện phòng → Nội thất → Ánh sáng → BIM → BOQ
3. **Phân tích Semantic** — phân loại wall/door/room/furniture…
4. **Render 3D** — chuyển sang 3D với preset ánh sáng interior

Lệnh AI: *"chuyển sang planner"*, *"phân tích semantic"*.

### 4. Thiết kế nội thất

Tab **Nội thất**:

- Phát hiện phòng → phong cách → mẫu trang trí → trang trí từng phòng / tất cả
- **Ước tính chi phí** + xuất BOQ (CSV, JSON, BOQ+NCC, Báo giá PDF)
- Thiết kế AI: dùng **AI Assistant** (*"Thiết kế homestay Indochine 6×25m"*)

### 5. BIM-lite & Studio Cloud

| Tab | Chức năng |
|-----|-----------|
| **BIM** | Quét BIM-lite, vòng đời, bảo trì/năm, xuất BIM JSON |
| **Cloud** | Marketplace plugin, Cloud Library (lưu/tải scene), collab nội thất, tài sản thương mại |

### 6. Chế độ 3D

1. Vẽ hình 2D **kín** hoặc dùng mẫu kiến trúc / Planner
2. Bấm **3D** hoặc **Render 3D**
3. Tự extrude (tường ~2,8 m, sàn ~0,12 m…) với **màu sáng** theo plan view
4. Panel **3D Scene**: camera, ánh sáng (Studio/Outdoor/Flat), vật liệu, section

### 7. AI Assistant

Nhập tiếng Việt, ví dụ:

- *Mặt bằng đất 5×20m 2 phòng ngủ*
- *Chuyển sang Planner*
- *Trang trí phòng Japandi*
- *Thiết kế homestay Indochine 6×25m, ngân sách 5 tỷ*
- *Kiểm tra lỗi bản vẽ*
- *Đổi tên bản vẽ Nhà An*
- *Xóa tất cả đối tượng*

**Import phác thảo:** tab Planner → Import phác thảo (tùy chọn Sketch → Nội thất).

### 8. Lưu, mở, quản lý bản vẽ

| Thao tác | Vị trí |
|----------|--------|
| Mới / Mở / Lưu | Menu Tệp |
| **Đổi tên bản vẽ** | Header (ô tên) hoặc Tệp → Đổi tên |
| **Xóa tất cả** | Sửa → Xóa tất cả đối tượng |
| Lưu Cloud / Chia sẻ | Menu Cloud |
| Autosave | IndexedDB (trình duyệt) |

### 9. Nhập / xuất

| Loại | Định dạng |
|------|-----------|
| Nhập | `.wcad.json`, DXF, OBJ, STL, GLTF, ảnh phác thảo |
| Xuất 2D | PNG, SVG, PDF, DXF |
| Xuất 3D | STL, OBJ, GLTF |
| Xuất hồ sơ | PDF kỹ thuật, BOQ CSV/JSON, Báo giá PDF |

### 10. Collaboration & Plugins

- **Collab:** đồng bộ tab (`BroadcastChannel`) hoặc WebSocket
- **Plugins:** menu Plugins → Quản lý Plugins; Marketplace trong tab Cloud

---

## Phím tắt & lệnh

| Phím | Hành động |
|------|-----------|
| `Esc` | Select / hủy công cụ |
| `Ctrl+Z` / `Ctrl+Y` | Hoàn tác / Làm lại |
| `Delete` | Xóa đối tượng chọn |
| `Ctrl+S` | Lưu |
| Cuộn chuột | Zoom |
| Chuột giữa | Pan |

| Lệnh | Công cụ |
|------|---------|
| `L` / `LINE` | Đường thẳng |
| `PL` / `PLINE` | Polyline |
| `C` / `CIRCLE` | Đường tròn |
| `REC` / `R` | Hình chữ nhật |
| `DIM` | Ghi kích thước |
| `EXT` / `EXTRUDE` | Extrude 2D→3D |
| `ZOOMEXTENTS` / `ZE` | Vừa khung |
| `UNDO` / `U` | Hoàn tác |

---

## Định dạng file

| Đuôi | Mô tả |
|------|--------|
| `.wcad.json` | Định dạng native WebCAD |
| `.dxf` | Trao đổi CAD 2D |
| `.svg` / `.png` / `.pdf` | Xuất hình / in |
| `.stl` / `.obj` / `.gltf` | Mô hình 3D |

| Ngữ cảnh | Đơn vị |
|----------|--------|
| Kiến trúc (tường, phòng, mẫu nhà) | **m** |
| Thư viện Block nội thất | **cm** |
| Hiển thị kích thước | mm / cm / m / in (panel Styles) |

---

## Xử lý sự cố

| Triệu chứng | Cách xử lý |
|-------------|------------|
| Canvas trắng | Chạy qua HTTP; kiểm Console (F12) |
| 3D không có khối | Cần hình kín; thử Plan view rồi 3D |
| 3D quá tối | Hard refresh; thử preset **Outdoor** trong panel 3D |
| PWA / cache cũ | **Ctrl+Shift+R**; xóa Service Worker |
| DXF lỗi | Export lại DXF ASCII từ AutoCAD |
| Cloud không lưu | Cloud → Cấu hình API URL |

---

## Phát triển

### Công nghệ

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **2D:** Canvas API
- **3D:** Three.js r170 (WebGPU / WebGL2)
- **Lưu trữ:** IndexedDB, localStorage
- **PWA:** Service Worker (`webcad-v54`)

### Module chính

| Module | Thư mục | SDD |
|--------|---------|-----|
| CAD Core | `js/core/`, `js/tools/` | WebCAD_SDD |
| CAD → Planner | `js/features/planner/` | CAD_TO_PLANNER_SDD |
| Interior Design | `js/features/interior/` | Interior_Design_Module_SDD |
| Resize handles | `js/features/SelectionResizeEngine.js` | — |

### Đóng góp

1. Fork repository
2. Tạo branch tính năng
3. Commit với message rõ ràng
4. Mở Pull Request

---

## Tác giả & giấy phép

**Nguyễn Anh Vũ** — [navuitag@gmail.com](mailto:navuitag@gmail.com)

Repository: [github.com/navuitag/webcad](https://github.com/navuitag/webcad)

Dự án phát triển với **[Cursor AI](https://cursor.com)**.

### Giấy phép MIT

Copyright (c) 2026 Nguyễn Anh Vũ

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

**WebCAD** — Thiết kế CAD, Planner nội thất và render 3D trên web.
