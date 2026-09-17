export class DisjointSet {
  constructor() { this.parent = new Map(); }
  
  find(item) {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      return item;
    }
    const root = this.parent.get(item);
    if (root === item) return item;
    const actual = this.find(root);
    this.parent.set(item, actual);
    return actual;
  }
  
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}