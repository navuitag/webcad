class HistoryManager {
  constructor(maxSize = 100) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
    this.listeners = [];
  }

  push(action) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this._notify();
  }

  undo(drawing, layerManager, selectionManager) {
    if (this.undoStack.length === 0) return false;
    const action = this.undoStack.pop();
    this._applyReverse(action, drawing, layerManager, selectionManager);
    this.redoStack.push(action);
    this._notify();
    return true;
  }

  redo(drawing, layerManager, selectionManager) {
    if (this.redoStack.length === 0) return false;
    const action = this.redoStack.pop();
    this._applyForward(action, drawing, layerManager, selectionManager);
    this.undoStack.push(action);
    this._notify();
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this._notify();
  }

  _applyForward(action, drawing, layerManager, selectionManager) {
    switch (action.type) {
      case 'ADD_ENTITY':
        drawing.addEntity(action.entity);
        break;
      case 'REMOVE_ENTITY':
        drawing.removeEntity(action.entity);
        selectionManager.deselect(action.entity);
        break;
      case 'MODIFY_ENTITY':
        Object.assign(action.entity, action.after);
        break;
      case 'ADD_ENTITIES':
        for (const e of action.entities) drawing.addEntity(e);
        break;
      case 'REMOVE_ENTITIES':
        for (const e of action.entities) {
          drawing.removeEntity(e);
          selectionManager.deselect(e);
        }
        break;
      case 'LAYER_CHANGE':
        layerManager.fromJSON(action.after);
        break;
    }
  }

  _applyReverse(action, drawing, layerManager, selectionManager) {
    switch (action.type) {
      case 'ADD_ENTITY':
        drawing.removeEntity(action.entity);
        selectionManager.deselect(action.entity);
        break;
      case 'REMOVE_ENTITY':
        drawing.addEntity(action.entity);
        break;
      case 'MODIFY_ENTITY':
        Object.assign(action.entity, action.before);
        break;
      case 'ADD_ENTITIES':
        for (const e of action.entities) {
          drawing.removeEntity(e);
          selectionManager.deselect(e);
        }
        break;
      case 'REMOVE_ENTITIES':
        for (const e of action.entities) drawing.addEntity(e);
        break;
      case 'LAYER_CHANGE':
        layerManager.fromJSON(action.before);
        break;
    }
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  _notify() {
    for (const cb of this.listeners) {
      cb({ canUndo: this.canUndo(), canRedo: this.canRedo() });
    }
  }
}
