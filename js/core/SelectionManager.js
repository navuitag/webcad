class SelectionManager {
  constructor() {
    this.selected = [];
    this.listeners = [];
  }

  select(entity, additive = false) {
    if (!additive) {
      this.clearSelection(false);
    }
    if (!this.selected.includes(entity)) {
      entity.selected = true;
      this.selected.push(entity);
      this._notify();
    }
  }

  deselect(entity) {
    const idx = this.selected.indexOf(entity);
    if (idx !== -1) {
      entity.selected = false;
      this.selected.splice(idx, 1);
      this._notify();
    }
  }

  toggle(entity) {
    if (this.selected.includes(entity)) {
      this.deselect(entity);
    } else {
      this.select(entity, true);
    }
  }

  clearSelection(notify = true) {
    for (const entity of this.selected) {
      entity.selected = false;
    }
    this.selected = [];
    if (notify) this._notify();
  }

  getSelected() {
    return [...this.selected];
  }

  hasSelection() {
    return this.selected.length > 0;
  }

  isSelected(entity) {
    return this.selected.includes(entity);
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  _notify() {
    for (const cb of this.listeners) {
      cb(this.selected);
    }
  }
}
