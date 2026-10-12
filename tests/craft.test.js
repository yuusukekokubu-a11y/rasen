// 生産・装備のテスト
const test = require('node:test');
const assert = require('node:assert');
const R = require('../tools/load.js').loadGame();

test('品質：少ない回数で仕上げるほど高品質・過熱すると1段下がる', () => {
  const q = R.DATA.crafting.game.qualityHits;
  assert.strictEqual(R.Craft.qualityFromHits(q.best, 0), 'best');
  assert.strictEqual(R.Craft.qualityFromHits(q.best + 1, 0), 'fine');
  assert.strictEqual(R.Craft.qualityFromHits(q.fine + 1, 0), 'normal');
  assert.strictEqual(R.Craft.qualityFromHits(q.best, 1), 'fine');
  assert.strictEqual(R.Craft.qualityFromHits(q.best, 5), 'normal');
});

test('品質：最高は固定ステータス×1.2＋固定カードが強化版', () => {
  const normal = { base: 'iron_sword', quality: 'normal', slots: [] };
  const best = { base: 'iron_sword', quality: 'best', slots: [] };
  assert.strictEqual(R.Gear.fixedStats(best).atk, Math.round(R.Gear.fixedStats(normal).atk * 1.2));
  assert.strictEqual(R.Gear.itemCards(best)[0].upgraded, true);
  assert.strictEqual(R.Gear.itemCards(normal)[0].upgraded, false);
});

test('鍛造：強く叩くと大きく進み熱がたまる・冷ますと熱が下がる・限界を超えると過熱', () => {
  const g = R.DATA.crafting.game;
  const p = R.Craft.gameParams(1, 1);
  const rng = R.createRng(3);
  const st = R.Craft.forgeStart();
  const r1 = R.Craft.forgeAct(st, 'strong', p, rng);
  assert.ok(r1.gain >= Math.round(p.perHit * g.actions.strong.progress[0]) && r1.heat > 0);
  const heat = st.heat;
  R.Craft.forgeAct(st, 'cool', p, rng);
  assert.ok(st.heat < heat || st.heat === 0);
  const st2 = R.Craft.forgeStart();
  st2.heat = g.heatLimit;
  const r2 = R.Craft.forgeAct(st2, 'careful', p, rng);
  assert.ok(r2.overheated);
  assert.strictEqual(st2.overheats, 1);
  assert.strictEqual(st2.heat, g.heatAfterOverheat);
});

test('鍛造：いつかは必ず完成する', () => {
  const p = R.Craft.gameParams(1, 13);
  const rng = R.createRng(1);
  const st = R.Craft.forgeStart();
  for (let i = 0; i < 100 && !st.done; i++) R.Craft.forgeAct(st, 'careful', p, rng);
  assert.ok(st.done);
});

test('生産Lvが高いと進みやすく、熱がたまりにくい', () => {
  assert.ok(R.Craft.gameParams(15, 5).perHit > R.Craft.gameParams(1, 5).perHit);
  assert.ok(R.Craft.gameParams(15, 5).heatMult < R.Craft.gameParams(1, 5).heatMult);
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
