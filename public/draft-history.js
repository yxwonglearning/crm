/* Bounded, in-memory draft history. Never writes to a server or published state. */
class DraftHistory {
  constructor(value, limit = 50) {
    this.saved = JSON.stringify(value);
    this.current = this.saved;
    this.past = [];
    this.future = [];
    this.limit = limit;
  }

  record(value) {
    const next = JSON.stringify(value);
    if (next === this.current) return false;
    this.past.push(this.current);
    if (this.past.length > this.limit) this.past.shift();
    this.current = next;
    this.future = [];
    return true;
  }

  undo() {
    if (!this.past.length) return null;
    this.future.push(this.current);
    this.current = this.past.pop();
    return JSON.parse(this.current);
  }

  redo() {
    if (!this.future.length) return null;
    this.past.push(this.current);
    this.current = this.future.pop();
    return JSON.parse(this.current);
  }

  markSaved(value) {
    this.saved = JSON.stringify(value);
    this.current = this.saved;
    this.past = [];
    this.future = [];
  }

  get dirty() { return this.current !== this.saved; }
}

if (typeof module !== 'undefined' && module.exports) module.exports = DraftHistory;
