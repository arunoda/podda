import Immutable from 'immutable';

export default class Podda {
  constructor(defaults = {}) {
    this.data = Immutable.Map(defaults); //eslint-disable-line
    this.callbacks = [];
    this.watchCallbacks = {};
  }

  fire(key, value) {
    const watchCallbacks = this.watchCallbacks[key] || [];
    watchCallbacks.forEach((callback) => {
      callback(value);
    });
  }

  set(arg1, arg2) {
    if (typeof arg1 === 'function') {
      return this._setFn(arg1);
    }

    return this._setItem(arg1, arg2);
  }

  _setFn(fn) {
    const currentState = this.data.toJS();
    const newFields = fn(currentState);
    if (newFields === null || newFields === undefined) {
      throw new Error('You must provide an object with updated values for Podda.set(fn)');
    }

    Object.keys(newFields).forEach((key) => {
      this._setItem(key, newFields[key]);
    });
  }

  _setItem(key, value) {
    this.data = this.data.set(key, Immutable.fromJS(value));
    this.callbacks.forEach((cb) => {
      cb(this.getAll());
    });

    this.fire(key, value);
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
}
