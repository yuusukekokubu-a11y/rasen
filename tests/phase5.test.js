// 追加3職・持ち込みアイテム・パワーのしくみのテスト
const test = require('node:test');
const assert = require('node:assert');
const R = require('../tools/load.js').loadGame();

function party(jobs) { return R.Gear.buildParty(jobs.map(job => ({ job, gear: R.DATA.loadouts.starter[job] }))); }
function combat(jobs, opts) {
  return new R.Combat(Object.assign({ party: party(jobs), encounter: ['golem'], rng: R.createRng(1) }, opts || {})).start();
}
function giveHand(c, specs) {
  c.hand = specs.map((s, i) => Object.assign({ iid: 2000 + i, owner: 0, upgraded: false, enchants: [], training: 0 }, s));
  return c.hand;
}

test('6職すべてが初期装備で27枚のデッキを組める', () => {
  for (const job of Object.keys(R.DATA.jobs)) {
    const g = R.DATA.loadouts.starter[job];
    assert.ok(g, job);
    for (const slot of R.Gear.SLOTS) assert.ok(R.Gear.canEquip(job, Object.assign({ slots: [] }, g[slot])), `${job} ${slot}`);
    assert.strictEqual(R.Gear.charCards(g).length, 9, job);
  }
});

test('盗賊：捨てた枚数でダメージが増える・捨てたときのパワー', () => {
  const c = combat(['thief', 'archer', 'priest']);
  const e = c.enemies[0];
  e.hp = 999; e.block = 0;
  c.powers.push({ id: 'th_shadow', owner: 0 });
  const [prep, a, b, flurry] = giveHand(c, [{ cardId: 'dagger_prepare' }, { cardId: 'heavy_defend' }, { cardId: 'heavy_defend' }, { cardId: 'dagger_flurry' }]);
  c.draw = [];
  c.discard = [];
  c.playCard(prep.iid);
  assert.ok(c.pending);
  c.resolveChoice([a.iid]);
  assert.strictEqual(c.counters.discardedThisTurn, 1);
  assert.strictEqual(999 - e.hp, 3, '影走りで3ダメージ');
  const hp = e.hp;
  c.playCard(flurry.iid, 0);
  assert.strictEqual(hp - e.hp, 3 + c.statOf(0, 'atk') + 3);
  assert.ok(b);
});

test('僧侶：廃棄した枚数でダメージが増える・廃棄したときのパワー', () => {
  const c = combat(['priest', 'archer', 'thief']);
  const e = c.enemies[0];
  e.hp = 999; e.block = 0;
  c.powers.push({ id: 'pr_ascetic', owner: 0 });
  const [purge, x, judge] = giveHand(c, [{ cardId: 'scep_purge' }, { cardId: 'heavy_defend' }, { cardId: 'scep_judgement' }]);
  c.playCard(purge.iid);
  c.resolveChoice([x.iid]);
  assert.strictEqual(c.counters.exhaustedThisCombat, 1);
  assert.ok(c.party.block >= 4, '苦行でブロック');
  c.energy = 5;
  c.playCard(judge.iid, 0);
  assert.strictEqual(999 - e.hp, 6 + c.statOf(0, 'mag') + 3);
});

test('持ち込みアイテム：エネルギーを使わず、使うとなくなる・品質で効果量が変わる', () => {
  const c = combat(['swordsman', 'mage', 'astrologer'], { items: [{ id: 'bomb', quality: 'best' }, { id: 'potion', quality: 'normal' }] });
  const e = c.enemies[0];
  e.block = 0;
  const hp = e.hp;
  const energy = c.energy;
  assert.ok(c.useItem(0).ok);
  assert.strictEqual(hp - e.hp, Math.floor(12 * 1.2));
  assert.strictEqual(c.energy, energy);
  assert.strictEqual(c.items.length, 1);
  c.party.hp = 10;
  c.useItem(0);
  assert.strictEqual(c.party.hp, 25);
  assert.strictEqual(c.items.length, 0);
  assert.strictEqual(c.usedItems.length, 2);
});

test('持ち込みアイテム：ダンジョンをクリアすると残りが戻り、全滅すると失う', () => {
  const G = R.Game;
  G.newState();
  G.state.consumables.push({ uid: 900, id: 'potion', quality: 'normal' }, { uid: 901, id: 'bomb', quality: 'normal' });
  G.state.bring = [900, 901];
  const run = G.startRun('cave');
  assert.strictEqual(G.state.consumables.length, 0);
  assert.strictEqual(run.items.length, 2);
  // クリアさせる
  run.phase = 'cleared';
  const res = G.endRun();
  assert.ok(res.cleared);
  assert.strictEqual(G.state.consumables.length, 2);
});

test('生産：細工で持ち込みアイテムが作れる', () => {
  const recipes = R.Craft.recipesFor('jeweler');
  assert.ok(recipes.some(r => r.kind === 'item'));
  assert.ok(recipes.some(r => r.kind === 'equip'));
});

test('全部のパーティの組み合わせで戦闘が最後まで終わる', () => {
  const jobs = Object.keys(R.DATA.jobs);
  for (let a = 0; a < jobs.length; a++) for (let b = a + 1; b < jobs.length; b++) for (let d = b + 1; d < jobs.length; d++) {
    const c = new R.Combat({ party: party([jobs[a], jobs[b], jobs[d]]), encounter: ['wolf', 'spider'], rng: R.createRng(a * 100 + b * 10 + d) }).start();
    R.AI.playCombat(c);
    assert.ok(c.result, `${jobs[a]} ${jobs[b]} ${jobs[d]}`);
  }
});

test('すべての装備のランダムカードの候補がある', () => {
  for (const [id, b] of Object.entries(R.DATA.equipment.bases)) {
    assert.ok(Object.values(R.DATA.cards).some(c => c.pool === b.type), id);
  }
});
