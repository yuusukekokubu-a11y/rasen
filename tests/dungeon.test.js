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
  if (run.phase === 'gather') run.finishGather();
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
    else if (run.phase === 'gather') run.finishGather();
  }
  assert.strictEqual(run.phase, 'cleared');
  assert.strictEqual(run.battlesWon, run.totalBattles());
});

test('鉱脈探し：マス目・数字の手がかり・振る回数', () => {
  const G = R.DATA.gatherGame;
  const node = R.DATA.dungeons.cave.gather.mining[0];
  const params = R.Gather.gatherParams(node, 1, 1);
  const board = R.Gather.newBoard(node, params, R.createRng(1));
  assert.strictEqual(board.cells.length, G.size * G.size);
  assert.strictEqual(board.cells.filter(c => c.vein).length, G.veins);
  assert.strictEqual(board.cells.filter(c => c.vein === 'rare').length, G.rareVeins);
  board.cells.forEach((c, i) => assert.strictEqual(c.hint, R.Gather.neighbors(i).filter(j => board.cells[j].vein).length));
  // 振ると回数が減り、使い切ると終わる
  let n = 0;
  while (!board.done) { const i = board.cells.findIndex(c => !c.open); R.Gather.strike(board, i); n++; }
  assert.ok(n <= params.swings);
});

test('鉱脈探し：たくさん見つけるほど量が増え、レア鉱脈でレア素材', () => {
  const node = R.DATA.dungeons.cave.gather.mining[0];
  const params = R.Gather.gatherParams(node, 1, 1);
  const count = (b) => Object.values(b).reduce((a, n) => a + n, 0);
  const good = R.Gather.newBoard(node, params, R.createRng(2));
  for (let i = 0; i < good.cells.length && !good.done; i++) if (good.cells[i].vein) R.Gather.strike(good, i);
  const bad = R.Gather.newBoard(node, params, R.createRng(2));
  for (let i = 0; i < bad.cells.length && !bad.done; i++) if (!bad.cells[i].vein && !bad.cells[i].open) R.Gather.strike(bad, i);
  const rg = R.Gather.boardResult(node, good, R.createRng(1));
  const rb = R.Gather.boardResult(node, bad, R.createRng(1));
  assert.ok(rg.allFound && rg.rares === 1);
  assert.strictEqual(rb.found, 0);
  assert.ok(count(rg.bag) > count(rb.bag));
  assert.ok(Object.keys(rg.bag).some(m => Object.keys(node.rare).includes(m)));
});

test('鉱脈探し：Lvと道具で振れる回数と手がかりが増える', () => {
  const node = R.DATA.dungeons.cave.gather.mining[2];
  assert.ok(R.Gather.gatherParams(node, 20, 1).swings > R.Gather.gatherParams(node, 1, 1).swings);
  assert.ok(R.Gather.gatherParams(node, 1, 2).swings > R.Gather.gatherParams(node, 1, 1).swings);
  assert.ok(R.Gather.gatherParams(node, 25, 1).hints > R.Gather.gatherParams(node, 1, 1).hints);
});

test('鉱脈探し：自動操作は数字の手がかりを使うので、でたらめより多く見つける', () => {
  const node = R.DATA.dungeons.cave.gather.mining[1];
  const params = R.Gather.gatherParams(node, 6, 1);
  let smart = 0, random = 0;
  for (let s = 0; s < 300; s++) {
    smart += R.Gather.autoPlay(node, params, R.createRng(s)).found.length;
    const rng = R.createRng(s);
    const b = R.Gather.newBoard(node, params, rng);
    while (!b.done) { const closed = b.cells.map((c, i) => i).filter(i => !b.cells[i].open); R.Gather.strike(b, rng.pick(closed)); }
    random += b.found.length;
  }
  assert.ok(smart > random, `${smart} > ${random}`);
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

test('複数ダンジョン：前のダンジョンをクリアすると次が開く（2つ同時に開き、両方クリアで先へ）', () => {
  const G = R.Game;
  G.newState();
  assert.deepStrictEqual(G.unlockedDungeons(), ['cave']);
  assert.throws(() => G.startRun('forest'));
  const clear = (id) => { const run = G.startRun(id); run.phase = 'cleared'; return G.endRun(); };
  const r1 = clear('cave');
  assert.deepStrictEqual(r1.newlyUnlocked.sort(), ['forest', 'marsh']);
  const r2 = clear('forest');
  assert.deepStrictEqual(r2.newlyUnlocked, []);
  assert.ok(!G.isUnlocked('ruins'));
  const r3 = clear('marsh');
  assert.deepStrictEqual(r3.newlyUnlocked, ['ruins']);
  assert.ok(!G.allCleared());
  const r4 = clear('ruins');
  assert.ok(r4.allClearedNow && G.allCleared());
});

test('すべてのダンジョンのデータが正しい（敵・素材・解禁条件）', () => {
  for (const [id, d] of Object.entries(R.DATA.dungeons)) {
    assert.strictEqual(d.floors.length, 4, id);
    for (const r of d.requires || []) assert.ok(R.DATA.dungeons[r], `${id} の解禁条件 ${r}`);
    for (const f of d.floors) {
      for (const e of Object.keys(f.encounters)) assert.ok(R.DATA.encounters[e], `${id} の ${e}`);
      if (f.boss) assert.ok(R.DATA.encounters[f.boss].boss, `${id} のボス`);
    }
    for (const k of ['mining', 'logging', 'gathering', 'treasure']) {
      assert.strictEqual(d.gather[k].length, 4, `${id} ${k}`);
      for (const t of d.gather[k]) for (const m of Object.keys(t.common || t.table).concat(Object.keys(t.rare || {}))) assert.ok(R.DATA.materials[m], `${id} の素材 ${m}`);
    }
    const run = new R.DungeonRun({ dungeonId: id, members: R.Sim.presetMembers('starter'), rng: R.createRng(1) });
    assert.ok(run.plan[3].length >= 2);
  }
  for (const e of Object.values(R.DATA.enemies)) for (const m of Object.keys(e.drops || {})) assert.ok(R.DATA.materials[m], `${e.name} の ${m}`);
});

test('難易度段階：全クリア後に開き、1つずつ上がる・敵が強くなり上位素材が出る', () => {
  const G = R.Game;
  G.newState();
  const clear = (id, d) => { const run = G.startRun(id, d); run.phase = 'cleared'; return G.endRun(); };
  clear('cave');
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), 1, '全クリア前は難易度1だけ');
  assert.throws(() => G.startRun('cave', 2));
  clear('forest'); clear('marsh'); clear('ruins');
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), 2);
  clear('cave', 2);
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), 3);
  assert.strictEqual(G.maxUnlockedDifficulty('forest'), 2);
  // 敵の強さ
  const r1 = new R.DungeonRun({ dungeonId: 'cave', difficulty: 1, members: R.Sim.presetMembers('starter'), rng: R.createRng(1) });
  const r3 = new R.DungeonRun({ dungeonId: 'cave', difficulty: 3, members: R.Sim.presetMembers('starter'), rng: R.createRng(1) });
  assert.ok(r3.currentScale().hp > r1.currentScale().hp && r3.currentScale().dmg > r1.currentScale().dmg);
  // 上位素材
  let high = 0;
  for (let i = 0; i < 200; i++) { const bag = {}; r3._highDrop(bag); high += Object.keys(bag).length; }
  assert.ok(high > 50);
  const bag1 = {}; for (let i = 0; i < 50; i++) r1._highDrop(bag1);
  assert.deepStrictEqual(bag1, {});
});
