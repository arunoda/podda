export default class Podda {
  constructor() {
    this.data = {};
    this.callbacks = [];
    this.watchCallbacks = {};
  }

  fire(key, value) {
    const watchCallbacks = this.watchCallbacks[key] || [];
    watchCallbacks.forEach((callback) => {
      callback(value);
    });
  }

  set(key, value) {
    this.data[key] = value;
    this.callbacks.forEach((cb) => {
      cb(this.getAll());
    });

    this.fire(key, value);
  }

  get(key) {
    return this.data[key];
  }

  getAll() {
    const newData = { ...this.data };
    return newData;
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
        callback();
      }
    };

    return this.watch(key, callbackAndCheck);
  }
}
