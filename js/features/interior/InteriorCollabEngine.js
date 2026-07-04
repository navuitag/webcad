/**
 * InteriorCollabEngine — Realtime Collaboration cho nội thất (SDD Phase 5)
 */
class InteriorCollabEngine {
  static STORAGE_KEY = 'webcad_interior_collab_enabled';

  static isEnabled() {
    return localStorage.getItem(InteriorCollabEngine.STORAGE_KEY) === '1';
  }

  static setEnabled(on) {
    localStorage.setItem(InteriorCollabEngine.STORAGE_KEY, on ? '1' : '0');
  }

  static init(app) {
    if (app._interiorCollabInit) return;
    app._interiorCollabInit = true;
  }

  static broadcast(app, action, payload = {}) {
    if (!InteriorCollabEngine.isEnabled() || !app.collaboration) return;
    app.collaboration.send({
      type: 'INTERIOR_ACTION',
      payload: { action, ...payload, ts: Date.now() }
    });
  }

  static applyRemote(app, payload, userName) {
    if (!payload?.action) return;
    const who = userName || 'Collaborator';

    switch (payload.action) {
      case 'applyStyle':
        InteriorSceneGenerator.applyStyle(app, payload.styleId, payload.roomId);
        break;
      case 'furnishAll':
        InteriorSceneGenerator.furnishAll(app, payload.styleId);
        break;
      case 'applyDecorTemplate':
        InteriorDecorTemplates.apply(app, payload.templateId);
        break;
      case 'applyLighting':
        InteriorLightingEngine.apply(app, payload.presetId);
        break;
      case 'scanBim':
        InteriorBimEngine.scanDrawing(app);
        break;
      case 'saveCloud':
        break;
      default:
        return;
    }
    app.requestRender();
    app.logCommand?.(`Collab nội thất: ${who} → ${payload.action}`);
  }

  static wrapAction(app, action, payload, fn) {
    const result = fn();
    InteriorCollabEngine.broadcast(app, action, payload);
    return result;
  }

  static getStatus(app) {
    const collab = app.collaboration?.getStatus?.() || {};
    return {
      interiorCollab: InteriorCollabEngine.isEnabled(),
      connected: collab.connected,
      userName: collab.userName,
      peerCount: collab.peerCount,
      message: InteriorCollabEngine.isEnabled()
        ? (collab.connected ? `Collab nội thất ON (${collab.peerCount} peer)` : 'Collab nội thất ON — chờ kết nối')
        : 'Collab nội thất OFF'
    };
  }
}
