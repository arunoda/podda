import Immutable from 'immutable';

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
    const op = {
      opId,
      type,
      payload,
      timestamp: Date.now(),
    };

    this.ops.push(op);

    // Fire watchers
    this.watchCallbacks.forEach((callback) => {
      callback(op);
    });
  }

  jumpTo(opId) {
    if (!opId || typeof opId !== 'number') {
      throw new Error('You need to provide a valid opId');
    }

    let state = this.initialState;
    if (this.ops.length === 0 || this.ops[0].opId > opId) {
      this.store.forceSetState(state);
      return null;
    }

    for (const op of this.ops) {
      switch (op.type) {
        case 'set': {
          const { key, value } = op.payload;
          state = state.set(key, Immutable.fromJS(value));
          break;
        }
        case 'update': {
          /* eslint-disable */
          Object.keys(op.payload).forEach((key) => {
            state = state.set(key, Immutable.fromJS(op.payload[key]));
          });
          /* eslint-enable */
          break;
        }
        default:
          throw new Error(`unsupported op type: ${op.type}`);
      }

      if (op.opId === opId) {
        break;
      }
    }

    this.store.forceSetState(state);
    this.pause(opId);
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
    return this.ops;
  }

  watch(cb) {
    this.watchCallbacks.add(cb);
    return () => {
      this.watchCallbacks.delete(cb);
    };
  }
}
