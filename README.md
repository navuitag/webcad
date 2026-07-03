# WebCAD

**WebCAD** là phần mềm thiết kế bản vẽ kỹ thuật **2D/3D** chạy trên trình duyệt. Ứng dụng hỗ trợ vẽ CAD cơ bản, mặt bằng kiến trúc (plan view), mô hình 3D, thư viện mẫu nội thất/cảnh quan, AI hỗ trợ vẽ, xuất/nhập nhiều định dạng và hoạt động offline qua PWA.

> Tài liệu thiết kế hệ thống chi tiết: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Đặc tả dự án: [`../WebCAD_SDD.md`](../WebCAD_SDD.md)

---

## Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt](#cài-đặt)
3. [Chạy ứng dụng](#chạy-ứng-dụng)
4. [Cài đặt PWA (tùy chọn)](#cài-đặt-pwa-tùy-chọn)
5. [Giao diện](#giao-diện)
6. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
7. [Phím tắt & lệnh dòng lệnh](#phím-tắt--lệnh-dòng-lệnh)
8. [Định dạng file](#định-dạng-file)
9. [Xử lý sự cố](#xử-lý-sự-cố)
10. [Phát triển](#phát-triển)

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

## Cài đặt

WebCAD là ứng dụng web tĩnh (HTML/CSS/JS), **không cần** `npm install` hay build.

### 1. Clone repository

```bash
git clone git@github.com:navuitag/webcad.git
cd webcad
```

Hoặc tải ZIP và giải nén vào thư mục `webcad/`.

### 2. Cấu trúc thư mục chính

```
webcad/
├── index.html          # Trang chính
├── manifest.json       # PWA manifest
├── service-worker.js   # Cache offline
├── css/                # Giao diện
├── js/
│   ├── app.js          # Ứng dụng chính
│   ├── core/           # Drawing, Layer, History...
│   ├── entities/       # Line, Circle, Hatch, 3D...
│   ├── tools/          # Công cụ vẽ/sửa
│   ├── features/       # Mẫu kiến trúc, AI, QA...
│   ├── renderers/      # Canvas 2D, Three.js 3D
│   └── core3d/         # Engine 3D
├── docs/ARCHITECTURE.md
└── icons/
```

---

## Chạy ứng dụng

WebCAD **phải** được phục vụ qua HTTP(S), không mở trực tiếp file `index.html` (`file://`) — Service Worker, ES modules và PWA sẽ không hoạt động đúng.

### Cách 1: Python (khuyến nghị)

```bash
cd webcad
python3 -m http.server 8080
```

Mở trình duyệt: **http://localhost:8080/**

### Cách 2: Node.js (npx)

```bash
cd webcad
npx --yes serve -l 8080
```

### Cách 3: PHP

```bash
cd webcad
php -S localhost:8080
```

### Sau khi cập nhật code

Nếu dùng PWA/cache, nhấn **Ctrl+Shift+R** (hard refresh) hoặc xóa cache Service Worker trong DevTools → Application.

---

## Cài đặt PWA (tùy chọn)

1. Chạy app qua `localhost` hoặc HTTPS
2. Trên Chrome/Edge: biểu tượng **Cài đặt** trên thanh địa chỉ → **Install WebCAD**
3. App có thể mở offline sau lần tải đầu (trừ Three.js CDN lần đầu cần mạng)

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
│ (Công    │    [2D|3D]  Zoom · Lưới · Snap       │ Layers    │
│  cụ, AI, │                                      │ Layouts   │
│  Tính    │                                      │ Blocks    │
│  năng)   │                                      │ Styles    │
└──────────┴──────────────────────────────────────┴───────────┘
│  Status: tọa độ · zoom · chế độ · đơn vị                    │
└─────────────────────────────────────────────────────────────┘
```

| Vùng | Chức năng |
|------|-----------|
| **Panel trái** | Công cụ, AI Assistant, tạo mặt bằng, mẫu kiến trúc, thư viện nội thất |
| **Canvas** | Vùng vẽ; nút **2D / 3D** góc dưới trái |
| **Panel phải** | Layer, Layout, Block, Cloud, Snap, Styles, thuộc tính đối tượng |
| **Thanh lệnh** | Nhập lệnh CAD (ví dụ `LINE`, `ZOOMEXTENTS`, `UNDO`) |

Trên mobile/tablet: dùng nút **Công cụ** / **Layers** để mở panel trượt.

---

## Hướng dẫn sử dụng

### 1. Bản vẽ 2D cơ bản

1. Chọn công cụ trên toolbar hoặc gõ lệnh (ví dụ `L` → Line)
2. Click trên canvas để đặt điểm; một số công cụ hỗ trợ **nhập kích thước trực tiếp** khi vẽ
3. Bật **Snap** và **Ortho** (menu Xem hoặc thanh công cụ canvas) để bắt điểm chính xác
4. **Esc** hoặc công cụ Select để thoát công cụ hiện tại

**Công cụ vẽ:** Line, Polyline, Circle, Arc, Rectangle, Text, Hatch

**Công cụ sửa:** Move, Copy, Rotate, Scale, Offset, Trim, Extend, Fillet, Mirror, Array, Stretch, Explode, Join, Break, Divide

**Đo lường:** Dimension, Distance, Measure

### 2. Kiến trúc & mặt bằng (Plan view)

#### Vẽ nhanh kiến trúc (đơn vị **mét**)

Toolbar nhóm **Kiến trúc**:

| Công cụ | Mô tả |
|---------|--------|
| Tường | Vẽ đoạn tường (hatch mặt cắt) |
| Phòng | Kéo vùng → tường + nền + nhãn diện tích |
| Cột / C.Tròn | Cột vuông hoặc tròn |
| T.Mở | Tường mở (nét đứt) |
| Sàn / Trần | Vùng mở có hatch + ghi diện tích |

Panel **Tính năng nổi bật**:

- **Tạo mặt bằng** — nhập Rộng × Sâu (m) → tự tạo layout phòng
- **Mẫu nhà / tầng / phòng / cảnh quan** — click mẫu để chèn mặt bằng hoàn chỉnh
- **Chuyển Plan view** — chuyển hình 2D thường sang ký hiệu mặt bằng (tô tường, nền phòng…)
- **Thư viện mẫu nội thất & cảnh quan** — click mẫu → click canvas để đặt (đơn vị **cm**)

#### Chuyển bản vẽ sang Plan view

1. Vẽ hoặc import bản vẽ 2D (rectangle, polyline đóng, hatch…)
2. (Tùy chọn) Chọn đối tượng cần chuyển
3. Panel Tính năng → **Chuyển Plan view**

Các đối tượng kiến trúc (tường, phòng, cảnh quan) tạo bằng công cụ Arch đã ở plan view sẵn.

### 3. Chế độ 3D

1. Vẽ hình 2D **kín** (Hatch, Rectangle, Polyline đóng, Circle) hoặc dùng mẫu kiến trúc
2. Bấm **3D** (menu Chế độ, góc canvas, hoặc **Xem 3D** trong panel Tính năng)
3. Ứng dụng **tự extrude** hình 2D sang khối 3D (tường ~2,8 m, sàn ~0,12 m…)
4. Trong 3D: xoay view (chuột), thêm Box/Sphere/Cylinder/Cone, Extrude thủ công, Boolean

**Extrude thủ công (2D):** Công cụ Extrude → chọn profile kín → chuyển sang 3D

**Quay lại 2D:** Bấm **2D** — vị trí khối 3D được đồng bộ ngược về footprint 2D

Panel **3D Scene** (phải): camera, ánh sáng, vật liệu, mặt cắt (section).

### 4. Layer, Block, Layout

- **Layers** (panel phải): bật/tắt hiển thị, đổi màu, thêm/xóa layer
- **Blocks**: Tạo Block (chọn đối tượng) → Chèn Block vào bản vẽ
- **Layouts**: thêm layout in ấn, viewport (menu Tệp → Plot)

### 5. AI Assistant

Panel trái → **AI Assistant**:

- Nhập mô tả tiếng Việt, ví dụ: *"Mặt bằng đất 5×20m 2 phòng ngủ"*, *"Vẽ cửa đi 900"*, *"Thêm bàn ăn"*
- AI phân tích và thực hiện lệnh vẽ / chèn mẫu

**Import phác thảo:** Tính năng → Import phác thảo → chọn ảnh JPG/PNG → trace thành nét vẽ

### 6. Kiểm tra & kích thước tự động

- **Tự động ghi kích thước** (menu Tính năng): dimension toàn bản vẽ
- **Kiểm tra lỗi**: phát hiện entity chồng chéo, layer ẩn, v.v.
- Chọn đối tượng → panel **Thuộc tính**: sửa chiều dài/cao, đơn vị hiển thị (Styles panel: mm/cm/m/in)

### 7. Lưu & mở bản vẽ

| Thao tác | Menu / Phím |
|----------|-------------|
| Mới | Tệp → Mới |
| Mở | Tệp → Mở… (`.wcad.json`) |
| Lưu local | Tệp → Lưu (IndexedDB + tải file) |
| Lưu Cloud | Cloud → Lưu lên Cloud (cần cấu hình API) |
| Chia sẻ link | Cloud → Tạo link chia sẻ |

Bản vẽ tự **autosave** vào trình duyệt (IndexedDB).

### 8. Nhập / xuất file

**Nhập:** DXF, OBJ, STL, GLTF, ảnh phác thảo

**Xuất 2D:** PNG, SVG, PDF, DXF

**Xuất 3D** (cần chế độ 3D): STL, OBJ, GLTF

**Xuất hồ sơ:** PDF kỹ thuật (menu Tệp)

**Lưu ý DWG:** Import DWG cần chuyển sang DXF (AutoCAD Save As) hoặc SDK server-side; xem thông báo trong app.

### 9. Collaboration (tùy chọn)

Panel phải → **Collaboration**:

- **Sync tab khác**: đồng bộ qua `BroadcastChannel` (cùng trình duyệt)
- **Kết nối WS**: cần WebSocket server (nhập URL, mặc định gợi ý `ws://localhost:8081`)

### 10. Plugins

Menu **Plugins → Quản lý Plugins** — bật/tắt plugin mở rộng (tool, export, AI…).

---

## Phím tắt & lệnh dòng lệnh

Nhập lệnh vào **dòng lệnh** (command line) phía dưới canvas.

### Phím thường dùng

| Phím | Hành động |
|------|-----------|
| `Esc` | Select / hủy công cụ |
| `Ctrl+Z` | Hoàn tác |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Làm lại |
| `Delete` | Xóa đối tượng chọn |
| `Ctrl+S` | Lưu |
| `Ctrl+P` | In |
| Cuộn chuột | Zoom tại con trỏ |
| Giữ chuột giữa | Pan |
| `Shift` + click | Chọn thêm (3D) |

### Lệnh CAD (một số)

| Lệnh | Công cụ |
|------|---------|
| `L` / `LINE` | Đường thẳng |
| `PL` / `PLINE` | Polyline |
| `C` / `CIRCLE` | Đường tròn |
| `REC` / `R` | Hình chữ nhật |
| `M` / `MOVE` | Di chuyển |
| `CO` / `COPY` | Sao chép |
| `DIM` | Ghi kích thước |
| `H` / `HATCH` | Hatch |
| `EXT` / `EXTRUDE` | Extrude 2D→3D |
| `ZOOMEXTENTS` / `ZE` | Vừa khung |
| `GRID` / `SNAP` / `ORTHO` | Bật/tắt lưới, snap, ortho |
| `UNDO` / `U` | Hoàn tác |
| `PNGOUT` / `SVGOUT` / `PDFOUT` | Xuất file |

---

## Định dạng file

| Đuôi | Mô tả |
|------|--------|
| `.wcad.json` | Định dạng native WebCAD (entities 2D/3D, layers, blocks) |
| `.dxf` | Trao đổi CAD 2D |
| `.svg` / `.png` / `.pdf` | Xuất hình ảnh / in |
| `.stl` / `.obj` / `.gltf` | Mô hình 3D |

### Đơn vị

| Ngữ cảnh | Đơn vị mặc định |
|----------|-----------------|
| Vẽ kiến trúc (tường, phòng, mẫu nhà) | **m** (mét) |
| Thư viện Block nội thất | **cm** |
| Hiển thị kích thước | Chọn trong panel **Styles** (mm / cm / m / in) |

---

## Xử lý sự cố

| Triệu chứng | Cách xử lý |
|-------------|------------|
| Canvas trắng, không load | Kiểm tra Console (F12); chạy qua HTTP, không `file://` |
| 3D không hiện khối | Cần hình **kín** (hatch, rectangle, polyline đóng, circle); thử **Chuyển Plan view** rồi bấm 3D |
| Three.js lỗi | Cần internet lần đầu; thử refresh |
| PWA / cache cũ | Hard refresh **Ctrl+Shift+R**; xóa Service Worker trong DevTools |
| DXF import lỗi | Kiểm tra file DXF ASCII; thử export lại từ AutoCAD |
| DWG không mở | Chuyển sang DXF hoặc dùng ODA File Converter |
| Cloud không lưu | Cấu hình API URL (Cloud → Cấu hình API) |

---

## Phát triển

### Công nghệ

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **2D:** Canvas API
- **3D:** Three.js r170 (WebGPU / WebGL2)
- **Lưu trữ:** IndexedDB, localStorage
- **PWA:** Service Worker (`webcad-v37`)

### Tài liệu kỹ thuật

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — kiến trúc module, pipeline lệnh
- [`../WebCAD_SDD.md`](../WebCAD_SDD.md) — đặc tả phần mềm (SDD)

### Đóng góp

1. Fork repository
2. Tạo branch tính năng
3. Commit với message tiếng Anh rõ ràng
4. Mở Pull Request

---

## Giấy phép

Xem thông tin license trong repository (nếu có). Liên hệ maintainer qua GitHub: [navuitag/webcad](https://github.com/navuitag/webcad).

---

**WebCAD** — Thiết kế bản vẽ kỹ thuật 2D/3D trên web, không cần cài AutoCAD.
