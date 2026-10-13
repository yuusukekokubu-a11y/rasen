// 生産・装備のテスト
const test = require('node:test');
const assert = require('node:assert');
const R = require('../tools/load.js').loadGame();

test('設計図はめ込み：ピースで埋める・重ねたりはみ出したりできない・少ない手数ほど高品質', () => {
  const bp = { rows: ['##', '##'], best: 1, fine: 2 };
  const st = R.Craft.puzzleStart(bp, { hand: 2, freeDiscards: 1 }, R.createRng(1));
  assert.strictEqual(st.total, 4);
  st.hand = ['o4', 'duo']; st.sel = 0; st.rot = 0;
  assert.ok(!R.Craft.puzzlePlace(st, 0, 1), 'はみ出しは置けない');
  assert.ok(!R.Craft.puzzlePlace(st, 1, 0), 'はみ出しは置けない（下）');
  assert.ok(R.Craft.puzzlePlace(st, 0, 0));
  assert.ok(st.done);
  assert.strictEqual(st.turns, 1);
  assert.strictEqual(R.Craft.puzzleQuality(st), 'best');
  const st2 = R.Craft.puzzleStart(bp, { hand: 2, freeDiscards: 1 }, R.createRng(1));
  st2.hand = ['duo', 'duo']; st2.sel = 0;
  assert.ok(R.Craft.puzzlePlace(st2, 0, 0));
  st2.hand = ['duo', 'duo']; st2.sel = 0;
  assert.ok(!R.Craft.puzzlePlace(st2, 0, 0), '埋まったマスには置けない');
  R.Craft.puzzleDiscard(st2);
  assert.strictEqual(st2.turns, 1, '無料の捨ては手数に入らない');
  R.Craft.puzzleDiscard(st2);
  assert.strictEqual(st2.turns, 2);
});

test('設計図はめ込み：回転するとピースの向きが変わる', () => {
  assert.deepStrictEqual(R.Craft.pieceCells('i3', 0), [[0, 0], [0, 1], [0, 2]]);
  assert.deepStrictEqual(R.Craft.pieceCells('i3', 1), [[0, 0], [1, 0], [2, 0]]);
});

test('設計図はめ込み：手持ちのどれも置けないことはない（詰まらない）', () => {
  for (let seed = 0; seed < 100; seed++) {
    const bp = R.DATA.crafting.puzzle.blueprints.weapon.small;
    const st = R.Craft.puzzleStart(bp, R.Craft.puzzleParams(1, 1), R.createRng(seed));
    let g = 0;
    while (!st.done && g++ < 60) {
      assert.ok(st.hand.some((_, i) => R.Craft.canPlaceAnywhere(st, i)), 'seed ' + seed);
      R.Craft.puzzleAutoStep(st);
    }
    assert.ok(st.done);
  }
});

test('品質：最高は固定ステータス×1.2＋固定カードが強化版', () => {
  const normal = { base: 'iron_sword', quality: 'normal', slots: [] };
  const best = { base: 'iron_sword', quality: 'best', slots: [] };
  assert.strictEqual(R.Gear.fixedStats(best).atk, Math.round(R.Gear.fixedStats(normal).atk * 1.2));
  assert.strictEqual(R.Gear.itemCards(best)[0].upgraded, true);
  assert.strictEqual(R.Gear.itemCards(normal)[0].upgraded, false);
});

test('設計図はめ込み：押したマスにピースの左上のブロックが来る', () => {
  const bp = { rows: ['###', '###'], best: 2, fine: 3 };
  const st = R.Craft.puzzleStart(bp, { hand: 1, freeDiscards: 0 }, R.createRng(1));
  st.hand = ['s4']; st.sel = 0; st.rot = 0; // .## / ##.
  assert.deepStrictEqual(R.Craft.placement(st, 0, 1).sort((a, b) => a - b), [1, 2, 3, 4]);
});

test('生産Lvが少し足りないだけでは手持ちは減らない', () => {
  const base = R.Craft.puzzleParams(5, 5);
  assert.deepStrictEqual([R.Craft.puzzleParams(4, 5).hand, R.Craft.puzzleParams(3, 5).hand], [base.hand, base.hand]);
});

test('生産Lvが高いと手持ちと無料の捨てが増える', () => {
  const lo = R.Craft.puzzleParams(1, 10), mid = R.Craft.puzzleParams(10, 10), hi = R.Craft.puzzleParams(20, 10);
  assert.ok(hi.hand > mid.hand && mid.hand > lo.hand);
  assert.ok(hi.freeDiscards > lo.freeDiscards);
});

test('すべての設計図とピースのデータが正しい', () => {
  const P = R.DATA.crafting.puzzle;
  for (const [k, sizes] of Object.entries(P.blueprints)) for (const [size, bp] of Object.entries(sizes)) {
    const cells = bp.rows.join('').split('').filter(c => c === '#').length;
    assert.ok(cells > 0 && bp.best < bp.fine, `${k} ${size}`);
    assert.ok(bp.best * 4 >= cells, `${k} ${size} は最高の手数で埋められる`);
  }
});

test('ランダム2枠：必ず2枠・付与効果は付けられるカードにだけ・危険な組み合わせは同時に付かない', () => {
  const rng = R.createRng(99);
  let enchantCount = 0;
  for (const baseId of Object.keys(R.DATA.equipment.bases)) {
    const base = R.DATA.equipment.bases[baseId];
    for (let i = 0; i < 60; i++) {
      const power = base.slot === 'accessory' ? 'pw_sw_fighting' : undefined;
      const it = R.Craft.makeEquipment(baseId, { lv: 10, quality: 'normal', power, rng });
      assert.strictEqual(it.slots.length, 2);
      const target = R.Cards.getCardDef(base.slot === 'accessory' ? power : base.fixedCard);
      const ens = it.slots.filter(s => s.kind === 'enchant').map(s => s.id);
      enchantCount += ens.length;
      for (const e of ens) assert.ok(R.Cards.canApplyEnchant(e, target), `${baseId} に ${e}`);
      if (ens.length === 2) {
        assert.notStrictEqual(ens[0], ens[1]);
        assert.ok(!R.Cards.enchantsConflict(ens[0], ens[1]), `${ens}`);
      }
      assert.strictEqual(R.DATA.cards[it.randomCard].pool, base.type);
    }
  }
  assert.ok(enchantCount > 0);
});

test('生産Lvが難易度を上回るほど良い枠が出やすい', () => {
  const low = R.Craft.gradeChances(1, 10);
  const high = R.Craft.gradeChances(20, 10);
  assert.ok(high[2] > low[2]);
  assert.ok(high[0] < low[0]);
});

test('ステータス上昇の値は枠の良さで上がる（ランクで決まる範囲内）', () => {
  const rolls = R.DATA.equipment.statRolls.atk;
  const gm = R.DATA.equipment.gradeMult;
  const rng = R.createRng(5);
  for (let i = 0; i < 200; i++) {
    const it = R.Craft.makeEquipment('iron_sword', { lv: 5, quality: 'normal', rng });
    for (const s of it.slots) if (s.kind === 'stat' && s.stat === 'atk') {
      assert.strictEqual(s.value, Math.max(1, Math.round(rolls[1] * gm[s.grade])));
    }
  }
});

test('パワー解禁：細工Lvが上がるごとに1つずつ', () => {
  const lvs = R.DATA.config.life.powerUnlockLvs;
  assert.strictEqual(R.Craft.unlockedPowers('swordsman', 1).length, 1);
  assert.strictEqual(R.Craft.unlockedPowers('swordsman', lvs[1]).length, 2);
  assert.strictEqual(R.Craft.unlockedPowers('mage', 99).length, R.DATA.jobs.mage.powers.length);
});

test('装備：職業に合わない物は装備できない・入れ替え', () => {
  const G = R.Game;
  G.newState();
  const staff = G.addItem({ base: 'oak_staff', quality: 'normal', slots: [] });
  assert.strictEqual(G.equip('swordsman', 'weapon', staff.uid).ok, false);
  assert.strictEqual(G.equip('mage', 'weapon', staff.uid).ok, true);
  const acc = G.addItem({ base: 'copper_ring', quality: 'normal', slots: [], power: 'pw_mg_cycle' });
  assert.strictEqual(G.equip('swordsman', 'accessory', acc.uid).ok, false);
  // 魔法使いと占星師のローブを入れ替え
  const mageHat = G.state.equipped.mage.head;
  const astroHat = G.state.equipped.astrologer.head;
  assert.strictEqual(G.equip('mage', 'head', astroHat).ok, true);
  assert.strictEqual(G.state.equipped.astrologer.head, mageHat);
});

test('付与効果の付いた装備：固定カードに付く（アクセはパワーカード）', () => {
  const sword = { base: 'iron_sword', randomCard: 'sword_twin', slots: [{ kind: 'enchant', id: 'link' }] };
  const cards = R.Gear.itemCards(sword);
  assert.deepStrictEqual(cards[0].enchants.map(e => e.id), ['link']);
  assert.deepStrictEqual(cards[1].enchants, []);
  const acc = { base: 'copper_ring', power: 'pw_sw_fighting', randomCard: 'acc_charm', slots: [{ kind: 'enchant', id: 'innate' }] };
  const ac = R.Gear.itemCards(acc);
  assert.strictEqual(ac.length, 3);
  assert.deepStrictEqual(ac[0].enchants, []);
  assert.deepStrictEqual(ac[2].enchants.map(e => e.id), ['innate']);
});

test('全レシピの素材がデータにある', () => {
  for (const b of Object.values(R.DATA.equipment.bases)) for (const m of Object.keys(b.mats)) assert.ok(R.DATA.materials[m], `${b.name} の ${m}`);
  for (const t of Object.values(R.DATA.equipment.tools)) for (const m of Object.keys(t.mats)) assert.ok(R.DATA.materials[m], `${t.name} の ${m}`);
});
