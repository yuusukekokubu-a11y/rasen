// 持ち込みアイテム（細工で作る）
//   戦闘中いつでも使える・エネルギー消費なし・使うとなくなる
//   品質（ふつう×1.0／上質×1.1／最高×1.2）がダメージ・ブロック・回復の量にかかる
//   効果の書き方は data/cards.js と同じ（ステータスは乗らない）
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.items = {
    potion:      { name: '回復薬',     desc: 'HPを15回復',               mats: { herb: 2 },                difficulty: 1,
      effects: [{ t: 'heal', v: 15 }] },
    smoke:       { name: '煙玉',       desc: 'ブロック12',               mats: { flax: 1, bat_wing: 1 },   difficulty: 2,
      effects: [{ t: 'block', v: 12, scale: 'none' }] },
    bomb:        { name: '爆弾',       desc: '敵全体に12ダメージ',        mats: { copper_ore: 1, slime_gel: 1 }, difficulty: 3,
      effects: [{ t: 'dmg', v: 12, scale: 'none', target: 'all' }] },
    insight_tea: { name: '閃きの茶',   desc: '2枚引き、エネルギー+1',     mats: { herb: 1, bat_wing: 1 },   difficulty: 3,
      effects: [{ t: 'draw', v: 2 }, { t: 'energy', v: 1 }] },
    power_tonic: { name: '力の薬',     desc: '味方全員の攻撃力+2（この戦闘中）', mats: { herb: 1, quartz: 1 }, difficulty: 4,
      effects: [{ t: 'buff', stat: 'atk', v: 2, who: 'party' }] },
    mind_tonic:  { name: '魔力の薬',   desc: '味方全員の魔力+2（この戦闘中）',   mats: { herb: 1, glowcap: 1 }, difficulty: 5,
      effects: [{ t: 'buff', stat: 'mag', v: 2, who: 'party' }] },
    elixir:      { name: '上回復薬',   desc: 'HPを30回復',               mats: { herb: 2, glowcap: 1 },    difficulty: 6,
      effects: [{ t: 'heal', v: 30 }] }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
