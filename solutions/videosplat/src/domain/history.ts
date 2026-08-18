export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  constructor(private current: T, private readonly limit = 100) {}
  get value() { return this.current; }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  commit(next: T) { this.past.push(this.current); if (this.past.length > this.limit) this.past.shift(); this.current = next; this.future = []; return this.current; }
  undo() { const previous = this.past.pop(); if (!previous) return this.current; this.future.push(this.current); this.current = previous; return this.current; }
  redo() { const next = this.future.pop(); if (!next) return this.current; this.past.push(this.current); this.current = next; return this.current; }
  reset(value: T) { this.current = value; this.past = []; this.future = []; }
}
