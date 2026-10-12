// 戦闘ルールのテスト（node --test で実行）
const test = require('node:test');
const assert = require('node:assert');
const R = require('../tools/load.js').loadGame();

function starterParty() { return R.Gear.buildParty(R.DATA.loadouts.presets.starter.party); }
function newCombat(opts) {
  return new R.Combat(Object.assign({ party: starterParty(), encounter: ['slime'], rng: R.createRng(1) }, opts || {}));
}
// 手札を指定のカードに差し替える（テスト用）
function giveHand(c, specs) {
  c.hand = specs.map((s, i) => Object.assign({ iid: 1000 + i, owner: 0, upgraded: false, enchants: [], training: 0 }, s));
  return c.hand;
}

test('デッキは1人9枚×3人＝27枚', () => {
  const c = newCombat();
  assert.strictEqual(c.allCards.length, 27);
  for (let i = 0; i < 3; i++) assert.strictEqual(c.allCards.filter(x => x.owner === i).length, 9);
});

test('開始時：エネルギー4・手札6枚', () => {
  const c = newCombat().start();
  assert.strictEqual(c.energy, 4);
  assert.strictEqual(c.hand.length, 6);
  assert.strictEqual(c.draw.length, 21);
});

test('HPはパーティ合算', () => {
  const p = starterParty();
  assert.strictEqual(p.maxHp, p.chars.reduce((a, ch) => a + ch.stats.hp, 0));
});

test('ステータスは持ち主のカードにだけ乗る', () => {
  const c = newCombat().start();
  c.enemies[0].hp = 999; c.enemies[0].maxHp = 999;
  const [card] = giveHand(c, [{ cardId: 'sword_slash', owner: 0 }]);
  const atk = c.statOf(0, 'atk');
  c.playCard(card.iid, 0);
  assert.strictEqual(999 - c.enemies[0].hp, 6 + atk);
  const [card2] = giveHand(c, [{ cardId: 'sword_slash', owner: 1 }]);
  const hp = c.enemies[0].hp;
  c.playCard(card2.iid, 0);
  assert.strictEqual(hp - c.enemies[0].hp, 6 + c.statOf(1, 'atk'));
});

test('エネルギーが足りないカードは使えない', () => {
  const c = newCombat().start();
  c.energy = 1;
  const [card] = giveHand(c, [{ cardId: 'sword_heavy' }]);
  const r = c.playCard(card.iid, 0);
  assert.strictEqual(r.ok, false);
});

test('ブロックが敵の攻撃を防ぎ、次のターン開始で消える', () => {
  const c = newCombat().start();
  const e = c.enemies[0];
  e.intent = 'tackle';
  c.hand = [];
  c.party.block = 5;
  const hp = c.party.hp;
  c.endTurn();
  assert.strictEqual(hp - c.party.hp, R.DATA.enemies.slime.moves.tackle.dmg - 5);
  assert.strictEqual(c.party.block, 0);
});

test('山札が尽きたら捨て札を混ぜ直す', () => {
  const c = newCombat().start();
  c.discard = c.draw.splice(0, c.draw.length);
  c._drawCards(2);
  assert.strictEqual(c.hand.length, 8);
  assert.ok(c.draw.length > 0);
});

test('パワー：使うと戦闘終了まで残り、毎ターン発動する', () => {
  const c = newCombat().start();
  c.enemies[0].hp = 999;
  const [card] = giveHand(c, [{ cardId: 'pw_sw_fighting', owner: 0 }]);
  const atk = c.statOf(0, 'atk');
  c.playCard(card.iid);
  assert.strictEqual(c.powers.length, 1);
  assert.ok(!c.discard.includes(card) && !c.hand.includes(card));
  c.endTurn();
  assert.strictEqual(c.statOf(0, 'atk'), atk + 1);
  c.endTurn();
  assert.strictEqual(c.statOf(0, 'atk'), atk + 2);
});

test('付与効果：初手確定は最初の手札に必ず来る', () => {
  for (let seed = 0; seed < 20; seed++) {
    const p = starterParty();
    p.chars[2].cards[8].enchants = [{ id: 'innate' }];
    const id = p.chars[2].cards[8].cardId;
    const c = new R.Combat({ party: p, encounter: ['slime'], rng: R.createRng(seed) }).start();
    assert.ok(c.hand.some(x => x.cardId === id && x.enchants.length), 'seed ' + seed);
  }
});

test('付与効果：保留はターン終了時に手札に残る', () => {
  const c = newCombat().start();
  c.enemies[0].hp = 999;
  giveHand(c, [{ cardId: 'heavy_defend', enchants: [{ id: 'retain' }] }, { cardId: 'heavy_defend' }]);
  c.endTurn();
  assert.ok(c.hand.some(x => x.iid === 1000));
  assert.ok(!c.hand.some(x => x.iid === 1001));
});

test('付与効果：連撃は2回発動・1回あたり0.6倍', () => {
  const c = newCombat().start();
  c.enemies[0].hp = 999; c.enemies[0].block = 0;
  const [card] = giveHand(c, [{ cardId: 'sword_slash', enchants: [{ id: 'multi' }] }]);
  const raw = 6 + c.statOf(0, 'atk');
  c.playCard(card.iid, 0);
  assert.strictEqual(999 - c.enemies[0].hp, 2 * Math.floor(raw * 0.6));
});

test('付与効果：コスト軽減と軽量化', () => {
  const c = newCombat().start();
  const def = R.Cards.getCardDef('sword_heavy');
  assert.strictEqual(R.Cards.cardCost(def, [{ id: 'costReduce' }]), 1);
  assert.strictEqual(R.Cards.cardCost(def, [{ id: 'lightweight' }]), 0);
  assert.ok(c);
});

test('付与効果：連携は直前が別キャラなら威力アップ', () => {
  const c = newCombat().start();
  c.enemies[0].hp = 999;
  const [a, b] = giveHand(c, [{ cardId: 'heavy_defend', owner: 1 }, { cardId: 'sword_slash', owner: 0, enchants: [{ id: 'link' }] }]);
  c.playCard(a.iid);
  const hp = c.enemies[0].hp;
  c.playCard(b.iid, 0);
  assert.strictEqual(hp - c.enemies[0].hp, Math.floor((6 + c.statOf(0, 'atk')) * 1.3));
});

test('付与効果：廃棄＋威力上昇は廃棄される', () => {
  const c = newCombat().start();
  c.enemies[0].hp = 999;
  const [card] = giveHand(c, [{ cardId: 'sword_slash', enchants: [{ id: 'exhaustBoost' }] }]);
  c.playCard(card.iid, 0);
  assert.ok(c.exhaust.includes(card));
});

test('選択：捨てる → 捨て札発動', () => {
  const c = newCombat().start();
  c.enemies[0].hp = 999;
  // 「捨てる」カードを仮で作る
  R.DATA.cards.__test_discard = { name: 'テスト', pool: 'test', type: 'skill', cost: 0, effects: [{ t: 'discard', v: 1 }] };
  const [d, x, y] = giveHand(c, [{ cardId: '__test_discard' }, { cardId: 'sword_slash', enchants: [{ id: 'onDiscard' }] }, { cardId: 'heavy_defend' }]);
  c.playCard(d.iid);
  assert.ok(c.pending && c.pending.kind === 'discard');
  assert.strictEqual(c.resolveChoice([]).ok, false);
  assert.strictEqual(c.resolveChoice([x.iid]).ok, true);
  assert.ok(c.discard.includes(x));
  assert.ok(c.enemies[0].hp < 999, '捨て札発動でダメージ');
  assert.ok(c.hand.includes(y));
  delete R.DATA.cards.__test_discard;
});

test('選択：予見（並べ替え）で山札の順番が変わる', () => {
  const c = newCombat().start();
  const [card] = giveHand(c, [{ cardId: 'star_read', owner: 2 }]);
  c.playCard(card.iid);
  assert.ok(c.pending && c.pending.kind === 'scry');
  const opts = c.pending.options.slice();
  const order = opts.slice().reverse();
  assert.ok(c.resolveChoice(order).ok);
  // 星読みは並べ替えのあと1枚引く → 一番上に置いたカードが手札に来る
  assert.strictEqual(c.hand[c.hand.length - 1].iid, order[0]);
  assert.strictEqual(c.draw[c.draw.length - 1].iid, order[1]);
});

test('敵の行動予告が出る', () => {
  const c = newCombat({ encounter: ['golem'] }).start();
  const info = c.intentInfo(c.enemies[0]);
  assert.ok(info.text.length > 0);
  assert.strictEqual(c.enemies[0].intent, 'fortify'); // ボスの初手
});

test('全滅で負け・敵全滅で勝ち', () => {
  const c = newCombat().start();
  c.party.hp = 1; c.party.block = 0;
  c.enemies[0].intent = 'tackle';
  c.hand = [];
  c.endTurn();
  assert.strictEqual(c.result, 'lose');
  const c2 = newCombat().start();
  c2.enemies[0].hp = 1; c2.enemies[0].block = 0;
  const [card] = giveHand(c2, [{ cardId: 'sword_slash' }]);
  c2.playCard(card.iid, 0);
  assert.strictEqual(c2.result, 'win');
});

test('同じシードなら同じ結果（再現性）', () => {
  const run = () => { const c = newCombat({ encounter: ['wolf', 'slime'], rng: R.createRng(42) }).start(); R.AI.playCombat(c); return [c.result, c.turn, c.party.hp]; };
  assert.deepStrictEqual(run(), run());
});

test('自動操作で全組み合わせの戦闘が最後まで終わる', () => {
  for (const id of Object.keys(R.DATA.encounters)) {
    for (let s = 0; s < 5; s++) {
      const c = newCombat({ encounter: R.DATA.encounters[id].enemies, rng: R.createRng(s) }).start();
      R.AI.playCombat(c);
      assert.ok(['win', 'lose', 'timeout'].includes(c.result), id);
    }
  }
});

test('すべてのカードとパワーのデータが正しい', () => {
  for (const [id, card] of Object.entries(R.DATA.cards)) {
    assert.ok(['attack', 'skill', 'power'].includes(card.type), id);
    assert.ok(Array.isArray(card.effects), id);
    for (const e of card.effects) if (e.t === 'power') assert.ok(R.DATA.powers[e.id], id + ' のパワー ' + e.id);
  }
  for (const job of Object.values(R.DATA.jobs)) for (const p of job.powers) assert.ok(R.DATA.cards[p], p);
  for (const b of Object.values(R.DATA.equipment.bases)) assert.ok(R.DATA.cards[b.fixedCard], b.name);
});
