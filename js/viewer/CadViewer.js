class CadViewer {
  constructor(app) {
    this.app = app;
    this.readOnly = false;
    this.loadedFile = null;
  }

  enterViewerMode(fileName) {
    this.readOnly = true;
    this.loadedFile = fileName;
    this.app.setTool('pan');
    this.app.toolbar?.classList.add('viewer-mode');
    this.app.logCommand(`Viewer: ${fileName} (chỉ xem — Pan/Zoom)`);
    document.getElementById('status-mode').textContent = 'VIEWER';
  }

  exitViewerMode() {
    this.readOnly = false;
    this.loadedFile = null;
    this.app.toolbar?.classList.remove('viewer-mode');
    document.getElementById('status-mode').textContent = this.app.mode.toUpperCase();
  }

  isReadOnly() {
    return this.readOnly;
  }

  async openFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'dwg') {
      this.app.logCommand('DWG: File nhị phân — vui lòng chuyển sang DXF (Save As trong AutoCAD) hoặc dùng ODA File Converter.');
      const useDxf = confirm(
        'WebCAD chưa đọc trực tiếp file .dwg.\n\n' +
        'Bạn có file DXF tương ứng không?\nOK = chọn file DXF, Cancel = hủy.'
      );
      if (useDxf) {
        this.app.dxfInput?.click();
      }
      return false;
    }

    if (ext === 'dxf') {
      await this.app._importDxf(file, true);
      this.enterViewerMode(file.name);
      this.app.zoomExtents();
      return true;
    }

    if (ext === 'wcad' || ext === 'json') {
      await this.app._loadFile(file);
      this.enterViewerMode(file.name);
      this.app.zoomExtents();
      return true;
    }

    this.app.logCommand(`Viewer: Định dạng .${ext} không được hỗ trợ.`);
    return false;
  }

  getSupportedFormats() {
    return ['.dxf', '.dwg (via DXF)', '.wcad.json', '.wcad', '.json', '.obj', '.stl', '.gltf'];
  }
}
