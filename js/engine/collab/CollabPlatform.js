/**
 * CollabPlatform — Collaboration layer façade
 */
class CollabPlatform {
  constructor(app) {
    this.app = app;
    this.realtime = null;
    this.workspace = new WorkspaceEngine(app);
    this.versions = new VersionHistoryEngine(app);
    this.comments = new CommentEngine(app);
  }

  attach(realtimeEngine) {
    this.realtime = realtimeEngine;
  }

  init() {
    if (!this.workspace.getCurrent()) {
      this.workspace.create(this.app.drawing.name || 'Untitled');
    }
  }

  getStatus() {
    return {
      connected: this.realtime?.connected || false,
      workspace: this.workspace.getCurrent()?.name,
      commentCount: this.comments.list().length,
      versionCount: this.versions.list(this.workspace.getCurrent()?.id).length
    };
  }

  onSave() {
    this.workspace.touch();
  }
}
