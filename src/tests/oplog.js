import { expect } from 'chai';
import Immutable from 'immutable';
import Podda from '../';
import Oplog from '../oplog';

const { describe, it } = global;

function removeTimestamp(ops) {
  return ops.map(({opId, type, payload}) => ({opId, type, payload}));
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
        { opId: 1, type: 'set', payload: { key: 'abc', value: 10 }},
        { opId: 2, type: 'update', payload: { abc: 20, bbc: 50 }},
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
        { opId: 1, type: 'set', payload: { key: 'ccy', value: 20 }}
      ]);
    });
  });

  describe('watch', () => {
    it('should allow us to listen', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      let ops = [];
      oplog.watch((op) => ops.push(op));

      store.set('aac', 20);
      ops = removeTimestamp(ops);

      expect(ops).to.deep.equal([
        { opId: 1, type: 'set', payload: { key: 'aac', value: 20 }}
      ]);
    });

    it('should support stop listening', () => {
      const oplog = new Oplog();
      const store = new Podda({ kkr: 10 }, oplog);

      let ops = [];
      oplog.watch((op) => ops.push(op));

      store.set('aac', 20);
      ops = removeTimestamp(ops);

      expect(ops).to.deep.equal([
        { opId: 1, type: 'set', payload: { key: 'aac', value: 20 }}
      ]);
    });
  });

  describe('jumpTo', () => {
    it('should jump to a given opId');
    it('should throw an error when passed a invalid opId');
    it('should not jump to a smaller opId');
    it('should pause the oplog when jumping');
  });

  describe('commit', () => {
    it('should set the paused state permantantly');
    it('should clear all the ops');
    it('should the initialState to the paused state');
  });
});
