/**
 * CommentEngine — pin comment trên bản vẽ
 */
class CommentEngine {
  constructor(app) {
    this.app = app;
    this.comments = JSON.parse(localStorage.getItem('webcad_comments') || '[]');
  }

  add(x, y, text, author) {
    const c = {
      id: 'cmt_' + Date.now().toString(36),
      drawingId: this.app.drawing.id,
      x, y,
      text,
      author: author || this.app.collaboration?.userName || 'User',
      createdAt: new Date().toISOString(),
      resolved: false
    };
    this.comments.push(c);
    this._save();
    return c;
  }

  list(drawingId) {
    const id = drawingId || this.app.drawing.id;
    return this.comments.filter(c => c.drawingId === id && !c.resolved);
  }

  resolve(id) {
    const c = this.comments.find(x => x.id === id);
    if (c) { c.resolved = true; this._save(); }
    return c;
  }

  _save() {
    localStorage.setItem('webcad_comments', JSON.stringify(this.comments));
  }
}
