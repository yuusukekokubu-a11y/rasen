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
      effects: [{ t: 'heal', v: 30 }] },
    star_bomb:   { name: '星屑爆弾',   desc: '敵全体に25ダメージ',        mats: { gargoyle_stone: 1, wisp_flame: 1 }, difficulty: 11,
      effects: [{ t: 'dmg', v: 25, scale: 'none', target: 'all' }] },
    ward_charm:  { name: '守りの護符', desc: 'ブロック25',               mats: { phantom_cloth: 1, quartz: 1 }, difficulty: 11,
      effects: [{ t: 'block', v: 25, scale: 'none' }] },
    dragon_tonic:{ name: '竜の秘薬',   desc: '味方全員の攻撃力・魔力+3（この戦闘中）', mats: { dragon_scale: 1, glowcap: 1 }, difficulty: 13,
      effects: [{ t: 'buff', stat: 'atk', v: 3, who: 'party' }, { t: 'buff', stat: 'mag', v: 3, who: 'party' }] },
    fire_bomb:   { name: '火炎瓶',     desc: '敵全体に20ダメージ・燃焼2', mats: { fire_scale: 1, herb: 1 }, difficulty: 15,
      effects: [{ t: 'dmg', v: 20, scale: 'none', target: 'all' }, { t: 'status', s: 'burn', v: 2, target: 'all' }] },
    frost_bomb:  { name: '氷結弾',     desc: '敵全体に18ダメージ・凍結1', mats: { frost_crystal: 1, quartz: 1 }, difficulty: 15,
      effects: [{ t: 'dmg', v: 18, scale: 'none', target: 'all' }, { t: 'status', s: 'freeze', v: 1, target: 'all' }] },
    great_elixir:{ name: '秘薬',       desc: 'HPを50回復',               mats: { glowcap: 2, cloud_silk: 1 }, difficulty: 20,
      effects: [{ t: 'heal', v: 50 }] },
    sun_charm:   { name: '陽光の護符', desc: 'ブロック40',               mats: { sun_stone: 1, cloud_silk: 1 }, difficulty: 21,
      effects: [{ t: 'block', v: 40, scale: 'none' }] },
    void_tonic:  { name: '深淵の秘薬', desc: '味方全員の攻撃力・魔力+5（この戦闘中）', mats: { blood_gem: 1, void_silk: 1 }, difficulty: 26,
      effects: [{ t: 'buff', stat: 'atk', v: 5, who: 'party' }, { t: 'buff', stat: 'mag', v: 5, who: 'party' }] }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
