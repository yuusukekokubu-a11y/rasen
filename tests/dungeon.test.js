// ダンジョン・採集・セーブのテスト
const test = require('node:test');
const assert = require('node:assert');
const R = require('../tools/load.js').loadGame();

function newRun(seed) {
  return new R.DungeonRun({ dungeonId: 'cave', members: R.Sim.presetMembers('starter'), rng: R.createRng(seed || 1) });
}
function winCombat(c) { for (const e of c.enemies) { e.hp = 0; e.alive = false; } c._checkEnd(); }

test('4階層・1階につき1戦・4階はボスだけ（全4戦）', () => {
  for (let s = 0; s < 20; s++) {
    const run = newRun(s);
    assert.strictEqual(run.plan.length, 4);
    for (let f = 0; f < 3; f++) assert.strictEqual(run.plan[f].length, 1);
    assert.strictEqual(run.plan[3].length, 1);
    assert.ok(R.DATA.encounters[run.plan[3][0]].boss);
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
  const normalOnly = (r) => Object.assign(r, { newlyUnlocked: r.newlyUnlocked.filter(id => !R.DATA.dungeons[id].special) });
  const clear = (id) => { const run = G.startRun(id); run.phase = 'cleared'; return normalOnly(G.endRun()); };
  const r1 = clear('cave');
  assert.deepStrictEqual(r1.newlyUnlocked.sort(), ['forest', 'marsh']);
  const r2 = clear('forest');
  assert.deepStrictEqual(r2.newlyUnlocked, []);
  assert.ok(!G.isUnlocked('ruins'));
  const r3 = clear('marsh');
  assert.deepStrictEqual(r3.newlyUnlocked, ['ruins']);
  const r4 = clear('ruins');
  assert.deepStrictEqual(r4.newlyUnlocked.sort(), ['glacier', 'volcano']);
  clear('volcano');
  assert.ok(!G.isUnlocked('skygarden'));
  assert.deepStrictEqual(clear('glacier').newlyUnlocked, ['skygarden']);
  assert.deepStrictEqual(clear('skygarden').newlyUnlocked, ['abyss']);
  assert.ok(!G.allCleared());
  const r8 = clear('abyss');
  assert.ok(r8.allClearedNow && G.allCleared());
});

test('すべてのダンジョンのデータが正しい（敵・素材・解禁条件）', () => {
  for (const [id, d] of Object.entries(R.DATA.dungeons)) {
    for (const r of d.requires || []) assert.ok(R.DATA.dungeons[r], `${id} の解禁条件 ${r}`);
    if (d.stages) {
      // スペシャル：5段それぞれに4階・採集の表・おまけ素材
      assert.strictEqual(d.stages.length, R.DATA.difficulty.max, id);
      for (const st of d.stages) {
        assert.strictEqual(st.floors.length, 4, id);
        for (const f of st.floors) {
          for (const e of Object.keys(f.encounters)) assert.ok(R.DATA.encounters[e], `${id} の ${e}`);
          if (f.boss) assert.ok(R.DATA.encounters[f.boss].boss, `${id} のボス ${f.boss}`);
        }
        for (const k of ['mining', 'logging', 'gathering', 'treasure']) {
          const t = st.gather[k];
          for (const m of Object.keys(t.common || t.table).concat(Object.keys(t.rare || {}))) assert.ok(R.DATA.materials[m], `${id} の素材 ${m}`);
        }
        for (const m of Object.keys(st.extra.table)) assert.ok(R.DATA.materials[m], `${id} のおまけ ${m}`);
      }
      for (let lv = 1; lv <= R.DATA.difficulty.max; lv++) {
        const run = new R.DungeonRun({ dungeonId: id, difficulty: lv, members: R.Sim.presetMembers('starter'), rng: R.createRng(lv) });
        assert.strictEqual(run.plan.length, 4, id);
        assert.ok(R.DATA.encounters[run.plan[3][run.plan[3].length - 1]].boss, id);
        const bag = {}; run._highDrop(bag);
        assert.ok(Object.keys(bag).length >= 1, `${id} のおまけ素材`);
      }
      continue;
    }
    const floors = d.endless ? d.endless.tiers : d.floors;
    if (!d.endless) assert.strictEqual(d.floors.length, 4, id);
    else for (const b of d.endless.bosses) assert.ok(R.DATA.encounters[b].boss, `${id} のボス ${b}`);
    for (const f of floors) {
      for (const e of Object.keys(f.encounters)) assert.ok(R.DATA.encounters[e], `${id} の ${e}`);
      if (f.boss) assert.ok(R.DATA.encounters[f.boss].boss, `${id} のボス`);
    }
    for (const k of ['mining', 'logging', 'gathering', 'treasure']) {
      assert.strictEqual(d.gather[k].length, 4, `${id} ${k}`);
      for (const t of d.gather[k]) for (const m of Object.keys(t.common || t.table).concat(Object.keys(t.rare || {}))) assert.ok(R.DATA.materials[m], `${id} の素材 ${m}`);
    }
    const run = new R.DungeonRun({ dungeonId: id, members: R.Sim.presetMembers('starter'), rng: R.createRng(1) });
    if (!d.endless) assert.ok(run.plan.every(f => f.length === 1), id);
  }
  for (const e of Object.values(R.DATA.enemies)) for (const m of Object.keys(e.drops || {})) assert.ok(R.DATA.materials[m], `${e.name} の ${m}`);
});

test('ステージ：前の段をクリアすると次の段が開く（ダンジョンごと）・敵が強くなり上位素材が出る', () => {
  const G = R.Game;
  G.newState();
  const clear = (id, d) => { const run = G.startRun(id, d); run.phase = 'cleared'; return G.endRun(); };
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), 1, '最初は初級だけ');
  assert.throws(() => G.startRun('cave', 2));
  clear('cave');
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), 2, '初級クリアで中級が開く');
  assert.strictEqual(G.maxUnlockedDifficulty('forest'), 1, 'ほかのダンジョンは初級から');
  assert.throws(() => G.startRun('cave', 3));
  clear('cave', 2);
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), 3);
  for (let d = 3; d <= R.DATA.difficulty.max; d++) clear('cave', d);
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), R.DATA.difficulty.max, '上限で止まる');
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
  // 上位素材は「そのダンジョンの1つ上のランク」まで（洞窟の中級でランク4素材は出ない）
  const r2 = new R.DungeonRun({ dungeonId: 'cave', difficulty: 2, members: R.Sim.presetMembers('starter'), rng: R.createRng(2) });
  const bag2 = {}; for (let i = 0; i < 300; i++) r2._highDrop(bag2);
  for (const m of Object.keys(bag2)) assert.ok(R.DATA.materials[m].rank <= 2, m);
});

test('上位素材の表：全ダンジョンにあり、素材がデータにある', () => {
  for (const [id, d] of Object.entries(R.DATA.dungeons)) {
    if (d.endless || d.special) continue;
    const list = R.DATA.difficulty.highDrops[id];
    assert.ok(list && list.length && list[0].from === 2, id);
    for (const t of list) for (const m of Object.keys(t.table)) assert.ok(R.DATA.materials[m], `${id} の ${m}`);
  }
  assert.strictEqual(R.DATA.difficulty.stageNames.length, R.DATA.difficulty.max);
});

test('無限階層：4階ごとにボス→帰還か続行を選ぶ・深いほど強い・毎回1階から・到達階を記録', () => {
  const G = R.Game;
  G.newState();
  const clear = (id) => { const run = G.startRun(id); run.phase = 'cleared'; return G.endRun(); };
  assert.ok(!G.isUnlocked('spiral'));
  ['cave', 'forest', 'marsh', 'ruins', 'volcano', 'glacier', 'skygarden'].forEach(clear);
  assert.ok(!G.isUnlocked('spiral'));
  clear('abyss');
  assert.ok(G.isUnlocked('spiral'));
  assert.strictEqual(G.maxUnlockedDifficulty('spiral'), 1, '塔に難易度段階はない');
  const run = G.startRun('spiral');
  assert.strictEqual(run.plan.length, 4);
  assert.ok(run.floorDef(5).scale.hp > run.floorDef(0).scale.hp);
  const win = () => { const c = run.createCombat(); for (const e of c.enemies) { e.hp = 0; e.alive = false; } c._checkEnd(); return run.finishCombat(c); };
  let guard = 0;
  while (run.phase !== 'checkpoint' && guard++ < 50) {
    if (run.phase === 'battle') win();
    else if (run.phase === 'reward') run.chooseReward(run.rewardOptions.find(k => k !== 'mining' && k !== 'logging') || run.rewardOptions[0]);
    else if (run.phase === 'gather') run.finishGather();
  }
  assert.strictEqual(run.phase, 'checkpoint');
  assert.strictEqual(run.deepest, 4);
  run.checkpointChoice(true);
  assert.strictEqual(run.plan.length, 8);
  assert.strictEqual(run.floor, 4);
  assert.strictEqual(run.phase, 'battle');
  // 5階で全滅
  const c = run.createCombat(); c.party.hp = 0; c._checkEnd(); run.finishCombat(c);
  const res = G.endRun();
  assert.strictEqual(res.cleared, false);
  assert.strictEqual(res.deepest, 5);
  assert.strictEqual(G.state.bestFloor.spiral, 5);
  // 次はまた1階から
  const run2 = G.startRun('spiral');
  assert.strictEqual(run2.floor, 0);
});

test('テスト用機能：全クリア済み・素材・Lv', () => {
  const G = R.Game;
  G.newState();
  G.debugClearAll();
  assert.ok(G.allCleared() && G.isUnlocked('spiral'));
  assert.strictEqual(G.maxUnlockedDifficulty('cave'), 2);
  G.debugAllMaterials(3);
  assert.ok(Object.keys(R.DATA.materials).every(m => G.state.materials[m] >= 3));
  G.debugLifeUp(5);
  assert.strictEqual(G.state.life.smith.lv, 6);
});

test('スペシャル：ノーマルのクリアで開き、段ごとに敵と素材が変わる（敵の倍率は段の値だけ）', () => {
  const G = R.Game;
  G.newState();
  assert.ok(!G.isUnlocked('mine'));
  const run0 = G.startRun('cave'); run0.phase = 'cleared'; G.endRun();
  assert.ok(G.isUnlocked('mine'));
  assert.strictEqual(G.maxUnlockedDifficulty('mine'), 1);
  const r1 = new R.DungeonRun({ dungeonId: 'mine', difficulty: 1, members: R.Sim.presetMembers('starter'), rng: R.createRng(1) });
  const r5 = new R.DungeonRun({ dungeonId: 'mine', difficulty: 5, members: R.Sim.presetMembers('starter'), rng: R.createRng(1) });
  assert.deepStrictEqual(r5.currentScale(), R.DATA.dungeons.mine.stages[4].floors[0].scale);
  assert.ok(r5.currentScale().hp > r1.currentScale().hp);
  assert.notDeepStrictEqual(r1.gatherEntry('mining'), r5.gatherEntry('mining'));
  assert.ok(!G.allCleared(), 'スペシャルは全クリアの条件に入らない');
});

test('ボスの魂：超級・地獄級とボスラッシュで出る（初級では出ない）', () => {
  const members = R.Sim.presetMembers('starter');
  const r1 = new R.DungeonRun({ dungeonId: 'cave', difficulty: 1, members, rng: R.createRng(1) });
  const r5 = new R.DungeonRun({ dungeonId: 'cave', difficulty: 5, members, rng: R.createRng(1) });
  const br = new R.DungeonRun({ dungeonId: 'bossrush', difficulty: 5, members, rng: R.createRng(1) });
  assert.strictEqual(r1.soulChance(), 0);
  assert.ok(r5.soulChance() > 0);
  assert.strictEqual(br.soulChance(), 1);
  // 地獄級の岩窟の主を倒すと、何回かに1回は魂が出る
  let souls = 0;
  for (let i = 0; i < 40; i++) {
    const run = new R.DungeonRun({ dungeonId: 'cave', difficulty: 5, members, rng: R.createRng(100 + i) });
    run.floor = 3; run.index = 0;
    const c = run.createCombat();
    for (const e of c.enemies) { e.hp = 0; e.alive = false; }
    c._checkEnd();
    run.finishCombat(c);
    souls += run.bag.golem_soul || 0;
  }
  assert.ok(souls > 5 && souls < 35, `魂 ${souls}`);
});
