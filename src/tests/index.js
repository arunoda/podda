import { expect } from 'chai';
import Podda from '../';
import Immutable from 'immutable';

const { describe, it } = global;

const shouldNotFire = () => {
  throw new Error('This callback should not get fired.');
};

describe('Podda', () => {
  describe('primitive ops', () => {
    it('should support set and get', () => {
      const store = new Podda();
      store.set('abc', 'kkr');
      expect(store.get('abc')).to.be.equal('kkr');
    });

    it('should replace the existing value after set', () => {
      const store = new Podda();
      store.set('abc', 'kkr');
      store.set('abc', 'ppc');
      expect(store.get('abc')).to.be.equal('ppc');
    });

    it('should support to update with a function', () => {
      const store = new Podda({
        abc: 10,
        bbc: 20,
      });

      store.update((state) => {
        expect(state).to.deep.equal({ abc: 10, bbc: 20 });
        // this is not going to add to the store.
        state.someItem = 1000; // eslint-disable-line

        return { bbc: 50, cnn: 100 };
      });

      expect(store.getAll()).to.deep.equal({
        abc: 10,
        bbc: 50,
        cnn: 100,
      });
    });

    it('should throw an error if update function returns nothing', () => {
      const store = new Podda();
      const run1 = () => {
        store.update(() => null);
      };

      const run2 = () => {
        store.update(() => {});
      };

      expect(run1).to.throw(/an object with updated values/);
      expect(run2).to.throw(/an object with updated values/);
    });

    it('should support getting all the values', () => {
      const store = new Podda();
      store.set('abc', 'kkr');
      store.set('bbc', { aa: 10 });
      expect(store.getAll()).to.deep.equal({
        abc: 'kkr',
        bbc: { aa: 10 },
      });
    });

    it('should accept default values', () => {
      const store = new Podda({ aa: 10, bb: 20 });
      expect(store.get('aa')).to.be.equal(10);
      expect(store.get('bb')).to.be.equal(20);
    });

    it('should clone default values before setting it', () => {
      const defaults = { aa: 10 };
      const store = new Podda(defaults);

      defaults.aa = 20;
      expect(store.get('aa')).to.be.equal(10);
    });
  });

  describe('subscribe', () => {
    it('should get the values just set', (done) => {
      const store = new Podda();
      store.subscribe((data) => {
        expect(data).to.deep.equal({ ppd: 'kky' });
        done();
      });
      store.set('ppd', 'kky');
    });

    it('should not receive the current values when subscribed', (done) => {
      const store = new Podda();
      store.set('ccy', 'kku');
      store.subscribe(shouldNotFire);

      setTimeout(done, 50);
    });

    it('should not receive updated after stopped', () => {
      const store = new Podda();
      const stop = store.subscribe(shouldNotFire);
      stop();
      store.set('ppd', 'kky');
    });

    it('should fire subsription only once for update', () => {
      const store = new Podda();
      let count = 0;
      store.subscribe((data) => {
        expect(data).to.deep.equal({ abc: 10, bbc: 20 });
        count += 1;
      });

      store.update(() => ({
        abc: 10,
        bbc: 20,
      }));

      expect(count).to.be.equal(1);
    });
  });

  describe('watch', () => {
    it('should receive updates for a given key', () => {
      const store = new Podda();
      store.set('ppd', 1);
      const gotItems = [];

      store.watch('ppd', (result) => {
        gotItems.push(result);
      });

      store.set('ppd', 10);
      store.set('ppd', 20);

      expect(gotItems).to.deep.equal([10, 20]);
    });

    it('should not receive updates for some other key', () => {
      const store = new Podda();

      store.watch('ppd', shouldNotFire);
      store.set('kkr', 10);
    });

    it('should receive manual firings for a key', () => {
      const store = new Podda();
      store.set('ppd', 1);
      const gotItems = [];

      store.watch('ppd', (result) => {
        gotItems.push(result);
      });

      store.set('ppd', 10);
      store.fire('ppd', 20);

      expect(gotItems).to.deep.equal([10, 20]);
      expect(store.get('ppd')).to.be.equal(10);
    });

    it('should not receive updates after stopped', () => {
      const store = new Podda();
      const stop = store.watch('kkr', shouldNotFire);
      stop();
      store.set('kkr', 'kky');
    });
  });

  describe('watchFor', () => {
    it('should receive updates if the given key meets the expected', () => {
      const store = new Podda();
      store.set('ppd', 1);
      const gotItems = [];

      store.watchFor('ppd', 20, (result) => {
        gotItems.push(result);
      });

      store.set('ppd', 10);
      store.set('ppd', 20);

      expect(gotItems).to.deep.equal([20]);
    });

    it('should not receive updates if the given key does not meets the expected', () => {
      const store = new Podda();
      store.set('ppd', 1);

      store.watchFor('ppd', 20, shouldNotFire);
      store.set('ppd', 10);
    });

    it('should receive manual firings for a key', () => {
      const store = new Podda();
      store.set('ppd', 1);
      const gotItems = [];

      store.watchFor('ppd', 40, (result) => {
        gotItems.push(result);
      });

      store.set('ppd', 10);
      store.fire('ppd', 40);

      expect(gotItems).to.deep.equal([40]);
      expect(store.get('ppd')).to.be.equal(10);
    });

    it('should not receive updates after stopped', () => {
      const store = new Podda();
      const stop = store.watchFor('kkr', 30, shouldNotFire);
      stop();
      store.set('kkr', 30);
    });
  });

  describe('registerAPI', () => {
    it('should add new APIs to the store', () => {
      const store = new Podda({ lights: false });
      store.registerAPI('toggle', (s, key) => {
        s.set(key, !store.get(key));
        return s.get(key);
      });

      expect(store.toggle('lights')).to.be.equal(true);
    });

    it('should not override existing APIs', () => {
      const store = new Podda({ lights: false });
      const run = () => {
        store.registerAPI('set', () => null);
      };

      expect(run).to.throw(/Cannot add an API for the existing API: "set"/);
    });
  });

  describe('forceSetState', () => {
    it('should reset the store\'s state', () => {
      const store = new Podda({ abc: 10 });
      const state = Immutable.fromJS({ abc: 15, ccd: 20 });
      store.forceSetState(state);

      expect(store.get('abc')).to.be.equal(15);
      expect(store.get('ccd')).to.be.equal(20);
    });

    it('should fire all subscriptions', (done) => {
      const store = new Podda({ abc: 10 });
      const state = Immutable.fromJS({ abc: 15, ccd: 20 });

      const stop = store.subscribe((s) => {
        expect(s).to.deep.equal(state.toJS());
        done();
        stop();
      });

      store.forceSetState(state);
    });

    it('should fire all watchers', () => {
      const store = new Podda({ abc: 10 });
      const fired = [];

      const getWatcher = (key) => {
        return (value) => fired.push({ key, value });
      };

      store.watch('abc', getWatcher('abc'));
      store.watch('bbc', getWatcher('bbc'));
      store.watch('ccd', getWatcher('ccd'));

      const state = Immutable.fromJS({ abc: 15, ccd: 20 });
      store.forceSetState(state);

      expect(fired).to.deep.equal([
        { key: 'abc', value: 15 },
        { key: 'ccd', value: 20 },
      ]);
    });
  })
});
