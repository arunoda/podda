import { expect } from 'chai';
import Podda from '../';
import Oplog from '../oplog';

const { describe, it } = global;

function removeTimestamp(ops) {
  return ops.map(({ opId, type, payload }) => ({ opId, type, payload }));
}

describe('oplog', () => {
  describe('core', () => {
    it('should return all the ops', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.set('abc', 10);
      store.update(() => ({
        abc: 20,
        bbc: 50,
      }));

      const ops = removeTimestamp(oplog.getAllOps());
      expect(ops).to.deep.equal([
        { opId: 1, type: 'set', payload: { key: 'abc', value: 10 } },
        { opId: 2, type: 'update', payload: { abc: 20, bbc: 50 } },
      ]);
    });

    it('should not receive ops while paused', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);
      oplog.pause();

      store.set('abc', 10);
      expect(oplog.getAllOps()).to.deep.equal([]);
    });

    it('should receive ops when resumed', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      oplog.pause();
      store.set('abc', 10);

      oplog.resume();
      store.set('ccy', 20);

      const ops = removeTimestamp(oplog.getAllOps());
      expect(ops).to.deep.equal([
        { opId: 1, type: 'set', payload: { key: 'ccy', value: 20 } },
      ]);
    });
  });

  describe('watch', () => {
    it('should allow us to listen', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      let ops = [];
      oplog.watch(op => ops.push(op));

      store.set('aac', 20);
      ops = removeTimestamp(ops);

      expect(ops).to.deep.equal([
        { opId: 1, type: 'set', payload: { key: 'aac', value: 20 } },
      ]);
    });

    it('should support stop listening', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      let ops = [];
      oplog.watch(op => ops.push(op));

      store.set('aac', 20);
      ops = removeTimestamp(ops);

      expect(ops).to.deep.equal([
        { opId: 1, type: 'set', payload: { key: 'aac', value: 20 } },
      ]);
    });
  });

  describe('jumpTo', () => {
    it('should jump to a given opId (with set)', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.set('abc', 10);
      store.set('bbc', 20);
      store.set('cnn', 60);

      oplog.jumpTo(2);

      expect(store.getAll()).to.deep.equal({
        kkr: 10,
        abc: 10,
        bbc: 20,
      });
    });

    it('should jump to a given opId (with update)', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.update(() => ({ kkr: 50, gyc: 70 }));
      store.set('bbc', 20);
      store.set('cnn', 60);

      oplog.jumpTo(2);

      expect(store.getAll()).to.deep.equal({
        kkr: 50,
        gyc: 70,
        bbc: 20,
      });
    });

    it('should throw an error when passed a invalid opId', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.set('abc', 499);

      const run = () => oplog.jumpTo('99C');
      expect(run).to.throw(/You need to provide a valid opId/);
    });

    it('should not jump to a smaller opId', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.update(() => ({ kkr: 50, gyc: 70 }));
      store.set('bbc', 20);
      store.set('cnn', 60);

      oplog.jumpTo(-1);

      expect(store.getAll()).to.deep.equal({
        kkr: 10,
      });
    });

    it('should pause the oplog when jumping', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.set('bbc', 20);
      oplog.jumpTo(1);
      expect(oplog.getAllOps().length).to.be.equal(1);

      store.set('kkr', 50);
      expect(oplog.getAllOps().length).to.be.equal(1);
    });
  });

  describe('commit', () => {
    it('should set the paused state permantantly', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.set('bbc', 20);
      store.set('bbc', 50);
      oplog.jumpTo(1);
      oplog.commit();

      expect(store.getAll()).to.deep.equal({
        kkr: 10,
        bbc: 20,
      });
    });

    it('should clear all the ops', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.set('bbc', 20);
      store.set('bbc', 50);
      oplog.jumpTo(1);
      oplog.commit();

      expect(oplog.getAllOps().length).to.be.equal(0);
    });

    it('should the initialState to the paused state', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      store.set('bbc', 20);
      store.set('bbc', 50);

      oplog.jumpTo(1);
      const { stateAtPaused } = oplog;
      oplog.commit();

      expect(oplog.initialState).to.be.equal(stateAtPaused);
    });

    it('should throw an error when not paused', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);
      store.set('bbc', 20);

      const run = () => oplog.commit();

      expect(run).to.throw(/Jump to an opId before invoke/);
    });
  });
});
