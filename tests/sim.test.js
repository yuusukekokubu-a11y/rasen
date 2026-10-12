// シミュレーターのテスト
const test = require('node:test');
const assert = require('node:assert');
const R = require('../tools/load.js').loadGame();

test('シミュレーター：勝率・平均ターンが出る', () => {
  const r = R.Sim.runBattles({ members: R.Sim.presetMembers('starter'), enemies: ['slime'], n: 20, seed: 1 });
  assert.strictEqual(r.n, 20);
  assert.strictEqual(r.wins + r.losses + r.timeouts, 20);
  assert.ok(r.avgTurns > 0);
});

test('シミュレーター：同じシードなら同じ結果', () => {
  const a = R.Sim.runBattles({ members: R.Sim.presetMembers('starter'), enemies: ['golem'], n: 10, seed: 7 });
  const b = R.Sim.runBattles({ members: R.Sim.presetMembers('starter'), enemies: ['golem'], n: 10, seed: 7 });
  assert.deepStrictEqual(a, b);
});
