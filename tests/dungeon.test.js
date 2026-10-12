// ダンジョン・採集・セーブのテスト
const test = require('node:test');
const assert = require('node:assert');
const R = require('../tools/load.js').loadGame();

function newRun(seed) {
  return new R.DungeonRun({ dungeonId: 'cave', members: R.Sim.presetMembers('starter'), rng: R.createRng(seed || 1) });
}
function winCombat(c) { for (const e of c.enemies) { e.hp = 0; e.alive = false; } c._checkEnd(); }

test('4階層・各階2〜3戦・4階にボス', () => {
  for (let s = 0; s < 20; s++) {
    const run = newRun(s);
    assert.strictEqual(run.plan.length, 4);
    for (let f = 0; f < 3; f++) assert.ok(run.plan[f].length >= 2 && run.plan[f].length <= 3);
    const last = run.plan[3];
    assert.ok(R.DATA.encounters[last[last.length - 1]].boss);
  }
});

test('戦闘間でHPは回復しない（持ち越し）', () => {
  const run = newRun(2);
  const c = run.createCombat();
  c.party.hp -= 30;
  winCombat(c);
  run.finishCombat(c);
  assert.strictEqual(run.hp, run.maxHp - 30);
  run.chooseReward(run.rewardOptions.find(k => k !== 'rest' && k !== 'mining' && k !== 'logging') || run.rewardOptions[0]);
  if (run.phase === 'gather') run.finishGather(['good']);
  const c2 = run.createCombat();
  assert.ok(c2.party.hp <= run.maxHp - 30 + Math.round(run.maxHp * 0.35));
});

test('戦闘勝利でモンスター素材が確定入手・報酬は3択', () => {
  const run = newRun(3);
  const c = run.createCombat();
  winCombat(c);
  const r = run.finishCombat(c);
  assert.ok(Object.keys(r.drops).length > 0);
  assert.strictEqual(run.rewardOptions.length, 3);
  assert.strictEqual(new Set(run.rewardOptions).size, 3);
});

test('全滅すると集めた素材と持ち込みアイテムを失う', () => {
  const run = newRun(4);
  run.items = [{ id: 'dummy', quality: 'normal' }];
  run.bag = { copper_ore: 5 };
  const c = run.createCombat();
  c.party.hp = 0; c._checkEnd();
  run.finishCombat(c);
  assert.strictEqual(run.phase, 'wiped');
  assert.deepStrictEqual(run.bag, {});
  assert.deepStrictEqual(run.items, []);
});

test('最後まで進めるとクリアになる', () => {
  const run = newRun(5);
  let guard = 0;
  while (run.phase !== 'cleared' && guard++ < 50) {
    if (run.phase === 'battle') { const c = run.createCombat(); winCombat(c); run.finishCombat(c); }
    else if (run.phase === 'reward') run.chooseReward(run.rewardOptions[0]);
    else if (run.phase === 'gather') run.finishGather(['good', 'good', 'good', 'good']);
  }
  assert.strictEqual(run.phase, 'cleared');
  assert.strictEqual(run.battlesWon, run.totalBattles());
});

test('採集：上手いほど量とレアの確率が上がる', () => {
  const node = R.DATA.dungeons.cave.gather.mining[0];
  const params = R.Gather.gatherParams(node, 1, 1);
  const good = R.Gather.resolveMinigame(node, params, ['great', 'great', 'great', 'great', 'great', 'great'], R.createRng(1));
  const bad = R.Gather.resolveMinigame(node, params, ['miss', 'miss', 'miss', 'miss', 'miss', 'miss'], R.createRng(1));
  const count = (b) => Object.values(b).reduce((a, n) => a + n, 0);
  assert.ok(good.broken && !bad.broken);
  assert.ok(count(good.bag) > count(bad.bag));
  assert.ok(good.rareChance > bad.rareChance);
});

test('採集：Lvが高いほど1回で多く削れる', () => {
  const node = R.DATA.dungeons.cave.gather.mining[2];
  assert.ok(R.Gather.gatherParams(node, 15, 1).perSwing > R.Gather.gatherParams(node, 1, 1).perSwing);
  assert.ok(R.Gather.gatherParams(node, 1, 2).perSwing > R.Gather.gatherParams(node, 1, 1).perSwing);
});

test('ライフの経験値でレベルが上がる', () => {
  const life = { lv: 1, exp: 0 };
  const ups = R.Life.addExp(life, R.Life.expToNext(1) + 1);
  assert.strictEqual(ups, 1);
  assert.strictEqual(life.lv, 2);
});

test('ゲーム状態：新規作成・出発・全滅で素材を失う・セーブの復元', () => {
  const G = R.Game;
  G.newState();
  assert.strictEqual(G.state.party.length, 3);
  const members = G.currentMembers();
  assert.ok(members.every(m => m.gear.weapon && m.gear.head && m.gear.body && m.gear.accessory));
  const before = JSON.stringify(G.state.materials);
  const run = G.startRun('cave');
  run.bag = { iron_ore: 3 };
  const data = run.serialize();
  const restored = R.DungeonRun.restore(JSON.parse(JSON.stringify(data)), { lives: G.state.life });
  assert.strictEqual(restored.hp, run.hp);
  assert.deepStrictEqual(restored.plan, run.plan);
  const c = run.createCombat();
  c.party.hp = 0; c._checkEnd();
  run.finishCombat(c);
  const res = G.endRun();
  assert.strictEqual(res.cleared, false);
  assert.strictEqual(JSON.stringify(G.state.materials), before);
});

test('ダンジョンのシミュレーションが動く', () => {
  const r = R.Sim.runDungeons({ members: R.Sim.presetMembers('starter'), n: 5, seed: 1 });
  assert.strictEqual(r.n, 5);
  assert.ok(r.clearRate >= 0 && r.clearRate <= 1);
});
