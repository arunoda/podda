import Immutable from 'immutable';

export default class Podda {
  constructor(defaults = {}, oplog) {
    this.data = Immutable.Map(defaults); //eslint-disable-line
    this.callbacks = [];
    this.watchCallbacks = {};
    this.oplog = oplog;

    if (this.oplog) {
      this.oplog.setStore(this);
    }
  }

  fireSubscriptions() {
    this.callbacks.forEach((cb) => {
      cb(this.getAll());
    });
  }

  fire(key, value) {
    const watchCallbacks = this.watchCallbacks[key] || [];
    watchCallbacks.forEach((callback) => {
      callback(value);
    });
  }

  _set(key, value) {
    this.data = this.data.set(key, Immutable.fromJS(value));
    this.fire(key, value);
  }

  set(key, value) {
    this._set(key, value);
    this.fireSubscriptions();
    if (this.oplog) {
      this.oplog.addOp('set', { key, value });
    }
  }

  update(fn) {
    const currentState = this.data.toJS();
    const newFields = fn(currentState);
    if (newFields === null || newFields === undefined) {
      throw new Error('You must provide an object with updated values for Podda.set(fn)');
    }

    Object.keys(newFields).forEach((key) => {
      this._set(key, newFields[key]);
    });
    this.fireSubscriptions();

    if (this.oplog) {
      this.oplog.addOp('update', newFields);
    }
  }

  get(key) {
    const value = this.data.get(key);
    if (value === null || value === undefined) {
      return value;
    }

    return value.toJS ? value.toJS() : value;
  }

  getAll() {
    return this.data.toJS();
  }

  subscribe(cb) {
    this.callbacks.push(cb);
    let stopped = false;

    const stop = () => {
      if (stopped) return;
      const index = this.callbacks.indexOf(cb);
      this.callbacks.splice(index, 1);
      stopped = true;
    };

    return stop;
  }

  watch(key, callback) {
    if (!this.watchCallbacks[key]) {
      this.watchCallbacks[key] = [];
    }

    const callbacks = this.watchCallbacks[key];
    callbacks.push(callback);

    let stopped = false;
    function stop() {
      if (stopped) return;

      const index = callbacks.indexOf(callback);
      callbacks.splice(index, 1);
      stopped = true;
    }

    return stop;
  }

  watchFor(key, expectedValue, callback) {
    const callbackAndCheck = (value) => {
      if (value === expectedValue) {
        callback(value);
      }
    };

    return this.watch(key, callbackAndCheck);
  }

  registerAPI(method, fn) {
    if (this[method]) {
      throw new Error(`Cannot add an API for the existing API: "${method}".`);
    }

    this[method] = (...args) => {
      return fn(this, ...args);
    };
  }

  forceSetState(state) {
    this.data = state;

    // Fire subscriptions
    this.fireSubscriptions();

    // Fire watchers
    this.data.keySeq().toArray().forEach((key) => {
      this.fire(key, this.get(key));
    });
  }
}
