import { expect } from 'chai';
import Podda from '../';

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
});
