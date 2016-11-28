export default class Oplog {
  constructor() {
    this.store = null;
    this.initialState = null;
    this.ops = [];
    this.id = 0;
    this.paused = false;
    this.watchCallbacks = new Set();
  }

  setStore(store) {
    this.store = store;
    this.initialState = this.store.data;
  }

  addOp(type, payload) {
    // Do not accept any ops when paused
    if (this.paused) return;
    const opId = this.id = this.id += 1;
    const timestamp = Date.now();

    this.ops.push({
      opId,
      type,
      payload,
      timestamp: Date.now(),
    });

    // Fire watchers
    this.watchCallbacks.forEach((callback) => {
      callback(opId, timestamp);
    });
  }

  jumpTo(opId) {
    this.pause(opId);

    let state = this.initialState;
    if (this.ops.length === 0 || this.ops[0].opId < opId) {
      this.store.forceSetState(state);
      return null;
    }

    this.ops.forEach((op) => {
      const { key, value } = op.payload;
      state = state.set(key, value);
    });

    this.store.forceSetState(state);
    return null;
  }

  pause(opId) {
    if (this.paused) return;
    this.stateAtPaused = this.store.data;
    this.paused = true;
    this.currentOpId = opId;
  }

  resume() {
    this.store.forceSetState(this.stateAtPaused);
    this.stateAtPaused = null;
    this.currentOpId = null;
    this.paused = false;
  }

  commit() {
    if (!this.paused) {
      throw new Error('Jump to an opId before invoke .jumpTo() or .pause()');
    }

    this.initialState = this.stateAtPaused;
    this.ops = [];
    this.resume();
  }

  getAllOps() {
    // We only return opId and timestamp only.
    return this.ops.map(({ opId, timestamp }) => ({ opId, timestamp }));
  }

  watch(cb) {
    this.watchCallbacks.add(cb);
    return () => {
      this.watchCallbacks.delete(cb);
    };
  }
}
