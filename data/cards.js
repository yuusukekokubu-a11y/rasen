// カード一覧（数値はすべて仮置き）
//
// 書き方：
//   type   : 'attack'（攻撃）/ 'skill'（スキル）/ 'power'（パワー）
//   cost   : 消費エネルギー
//   pool   : どの装備種のカードか（sword=剣, heavy=重装, staff=杖, robe=ローブ, starboard=星盤, accessory=アクセ,
//            dagger=短剣, light=軽装, bow=弓, scepter=錫杖, power_<職業>=その職業のパワー）
//   tags   : 'magic'（魔法系。魔力が乗る目印）など
//   effects: 効果の配列。上から順に処理する
//     { t:'dmg', v:6, scale:'atk'|'mag'|'none', hits:1, target:'enemy'|'all'|'random', element:'fire'|'ice'|'thunder' }
//         ダメージ = v + 持ち主の攻撃力(atk) or 魔力(mag)。hits回くり返す
//         plusPer:{ what:'block'|'discardedThisTurn'|'exhaustedThisCombat'|'cardsPlayedThisTurn', v:1 } で追加ダメージ
//     { t:'block', v:5, scale:'def'|'mag'|'none' }   ブロック（ダメージを防ぐ盾）。既定は防御力が乗る
//     { t:'heal', v:4 }                               回復（魔力が乗る）
//     { t:'draw', v:1 } / { t:'energy', v:1 }
//     { t:'status', s:'weak'|'vulnerable'|'burn'|'freeze'|'shock', v:2, target:'enemy'|'all' }
//     { t:'buff', stat:'atk'|'def'|'mag', v:1, who:'self'|'party' }   戦闘終了までステータス上昇
//     { t:'discard', v:1 }       手札から選んで捨てる
//     { t:'exhaustChoice', v:1 } 手札から選んで廃棄（この戦闘中は戻ってこない）
//     { t:'scry', v:3 }          山札の上N枚を見て、並べ替える
//     { t:'power', id:'...' }    パワーを発動（data/powers.js）
//   exhaust: true  → 使うと廃棄
//   upgrade: 強化版（＋）で上書きする項目
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.cards = {
    // ===== 剣（剣士） =====
    sword_slash:    { name: '斬撃', pool: 'sword', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 6 }], upgrade: { effects: [{ t: 'dmg', v: 9 }] } },
    sword_parry:    { name: '受け流し斬り', pool: 'sword', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 5 }, { t: 'block', v: 4 }], upgrade: { effects: [{ t: 'dmg', v: 7 }, { t: 'block', v: 6 }] } },
    sword_heavy:    { name: '渾身の一撃', pool: 'sword', type: 'attack', cost: 2,
      effects: [{ t: 'dmg', v: 14 }], upgrade: { effects: [{ t: 'dmg', v: 19 }] } },
    sword_twin:     { name: '二段斬り', pool: 'sword', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 3, hits: 2 }], upgrade: { effects: [{ t: 'dmg', v: 5, hits: 2 }] } },
    sword_cleave:   { name: 'なぎ払い', pool: 'sword', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 5, target: 'all' }], upgrade: { effects: [{ t: 'dmg', v: 8, target: 'all' }] } },
    sword_breaker:  { name: '鎧砕き', pool: 'sword', type: 'attack', cost: 2,
      effects: [{ t: 'dmg', v: 8 }, { t: 'status', s: 'vulnerable', v: 2 }],
      upgrade: { effects: [{ t: 'dmg', v: 10 }, { t: 'status', s: 'vulnerable', v: 3 }] } },
    sword_spirit:   { name: '気合い', pool: 'sword', type: 'skill', cost: 1,
      effects: [{ t: 'buff', stat: 'atk', v: 2, who: 'self' }], upgrade: { effects: [{ t: 'buff', stat: 'atk', v: 3, who: 'self' }] } },

    // ===== 重装（剣士の頭・胴） =====
    heavy_defend:   { name: '防御', pool: 'heavy', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 5 }], upgrade: { effects: [{ t: 'block', v: 8 }] } },
    heavy_ironwall: { name: '鉄壁', pool: 'heavy', type: 'skill', cost: 2,
      effects: [{ t: 'block', v: 12 }], upgrade: { effects: [{ t: 'block', v: 16 }] } },
    heavy_bash:     { name: '盾打ち', pool: 'heavy', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 0, scale: 'none', plusPer: { what: 'block', v: 1 } }], upgrade: { cost: 0 } },
    heavy_taunt:    { name: '挑発', pool: 'heavy', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 6 }, { t: 'status', s: 'weak', v: 1 }],
      upgrade: { effects: [{ t: 'block', v: 8 }, { t: 'status', s: 'weak', v: 2 }] } },
    heavy_endure:   { name: '踏ん張り', pool: 'heavy', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 4 }, { t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'block', v: 6 }, { t: 'draw', v: 1 }] } },
    heavy_harden:   { name: '鎧の心得', pool: 'heavy', type: 'skill', cost: 1,
      effects: [{ t: 'buff', stat: 'def', v: 1, who: 'self' }, { t: 'block', v: 3 }],
      upgrade: { effects: [{ t: 'buff', stat: 'def', v: 2, who: 'self' }, { t: 'block', v: 3 }] } },

    // ===== 杖（魔法使い） =====
    staff_fire:     { name: '火球', pool: 'staff', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 6, scale: 'mag', element: 'fire' }, { t: 'status', s: 'burn', v: 2 }],
      upgrade: { effects: [{ t: 'dmg', v: 9, scale: 'mag', element: 'fire' }, { t: 'status', s: 'burn', v: 3 }] } },
    staff_ice:      { name: '氷槍', pool: 'staff', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 6, scale: 'mag', element: 'ice' }, { t: 'status', s: 'freeze', v: 1 }],
      upgrade: { effects: [{ t: 'dmg', v: 9, scale: 'mag', element: 'ice' }, { t: 'status', s: 'freeze', v: 2 }] } },
    staff_thunder:  { name: '雷撃', pool: 'staff', type: 'attack', cost: 2, tags: ['magic'],
      effects: [{ t: 'dmg', v: 6, scale: 'mag', element: 'thunder', target: 'all' }, { t: 'status', s: 'shock', v: 1, target: 'all' }],
      upgrade: { effects: [{ t: 'dmg', v: 8, scale: 'mag', element: 'thunder', target: 'all' }, { t: 'status', s: 'shock', v: 2, target: 'all' }] } },
    staff_meteor:   { name: '隕石', pool: 'staff', type: 'attack', cost: 3, tags: ['magic'],
      effects: [{ t: 'dmg', v: 24, scale: 'mag', element: 'fire' }], upgrade: { effects: [{ t: 'dmg', v: 32, scale: 'mag', element: 'fire' }] } },
    staff_bolt:     { name: '魔力弾', pool: 'staff', type: 'attack', cost: 0, tags: ['magic'],
      effects: [{ t: 'dmg', v: 3, scale: 'mag' }], upgrade: { effects: [{ t: 'dmg', v: 5, scale: 'mag' }] } },
    staff_focus:    { name: '集中', pool: 'staff', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'buff', stat: 'mag', v: 2, who: 'self' }], upgrade: { effects: [{ t: 'buff', stat: 'mag', v: 3, who: 'self' }] } },
    staff_blizzard: { name: '吹雪', pool: 'staff', type: 'attack', cost: 2, tags: ['magic'],
      effects: [{ t: 'dmg', v: 5, scale: 'mag', element: 'ice', target: 'all' }, { t: 'status', s: 'freeze', v: 1, target: 'all' }],
      upgrade: { effects: [{ t: 'dmg', v: 7, scale: 'mag', element: 'ice', target: 'all' }, { t: 'status', s: 'freeze', v: 2, target: 'all' }] } },

    // ===== ローブ（魔法使い・占星師・僧侶の頭・胴） =====
    robe_barrier:   { name: '魔法障壁', pool: 'robe', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'block', v: 4, scale: 'mag' }], upgrade: { effects: [{ t: 'block', v: 7, scale: 'mag' }] } },
    robe_ward:      { name: '守りの衣', pool: 'robe', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 6 }], upgrade: { effects: [{ t: 'block', v: 9 }] } },
    robe_meditate:  { name: '瞑想', pool: 'robe', type: 'skill', cost: 1,
      effects: [{ t: 'draw', v: 2 }], upgrade: { cost: 0 } },
    robe_mend:      { name: '癒しの光', pool: 'robe', type: 'skill', cost: 1, tags: ['magic'], exhaust: true,
      effects: [{ t: 'heal', v: 3 }], upgrade: { effects: [{ t: 'heal', v: 5 }] } },
    robe_insight:   { name: '閃き', pool: 'robe', type: 'skill', cost: 0, exhaust: true,
      effects: [{ t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'draw', v: 2 }] } },

    // ===== 星盤（占星師） =====
    star_read:      { name: '星読み', pool: 'starboard', type: 'skill', cost: 1,
      effects: [{ t: 'scry', v: 3 }, { t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'scry', v: 4 }, { t: 'draw', v: 2 }] } },
    star_blessing:  { name: '星の祝福', pool: 'starboard', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'buff', stat: 'atk', v: 1, who: 'party' }, { t: 'buff', stat: 'mag', v: 1, who: 'party' }],
      upgrade: { effects: [{ t: 'buff', stat: 'atk', v: 2, who: 'party' }, { t: 'buff', stat: 'mag', v: 2, who: 'party' }] } },
    star_beam:      { name: '星光', pool: 'starboard', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 6, scale: 'mag' }], upgrade: { effects: [{ t: 'dmg', v: 9, scale: 'mag' }] } },
    star_align:     { name: '星辰の導き', pool: 'starboard', type: 'skill', cost: 0, exhaust: true,
      effects: [{ t: 'draw', v: 2 }], upgrade: { exhaust: false } },
    star_oracle:    { name: '天啓', pool: 'starboard', type: 'skill', cost: 1, exhaust: true,
      effects: [{ t: 'energy', v: 2 }], upgrade: { cost: 0 } },
    star_comet:     { name: '彗星', pool: 'starboard', type: 'attack', cost: 2, tags: ['magic'],
      effects: [{ t: 'dmg', v: 5, scale: 'mag', hits: 2 }, { t: 'scry', v: 2 }],
      upgrade: { effects: [{ t: 'dmg', v: 7, scale: 'mag', hits: 2 }, { t: 'scry', v: 2 }] } },
    star_veil:      { name: '星の帳', pool: 'starboard', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 5, scale: 'mag' }, { t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'block', v: 7, scale: 'mag' }, { t: 'draw', v: 1 }] } },

    // ===== アクセサリー（全職業共通） =====
    acc_quick:      { name: '早業', pool: 'accessory', type: 'skill', cost: 0,
      effects: [{ t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'draw', v: 1 }, { t: 'block', v: 3, scale: 'none' }] } },
    acc_charm:      { name: 'お守り', pool: 'accessory', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 6 }], upgrade: { effects: [{ t: 'block', v: 9 }] } },
    acc_throw:      { name: '投擲', pool: 'accessory', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 7 }], upgrade: { effects: [{ t: 'dmg', v: 10 }] } },
    acc_spark:      { name: '火花', pool: 'accessory', type: 'attack', cost: 0, tags: ['magic'],
      effects: [{ t: 'dmg', v: 3, scale: 'mag', element: 'fire' }], upgrade: { effects: [{ t: 'dmg', v: 5, scale: 'mag', element: 'fire' }] } },
    acc_second:     { name: '集中力', pool: 'accessory', type: 'skill', cost: 1, exhaust: true,
      effects: [{ t: 'energy', v: 2 }], upgrade: { cost: 0 } },

    // ===== パワー（職業ごと） =====
    pw_sw_fighting: { name: '闘気', pool: 'power_swordsman', type: 'power', cost: 1, effects: [{ t: 'power', id: 'sw_fighting' }] },
    pw_sw_stance:   { name: '不動の構え', pool: 'power_swordsman', type: 'power', cost: 1, effects: [{ t: 'power', id: 'sw_stance' }] },
    pw_sw_might:    { name: '剛剣', pool: 'power_swordsman', type: 'power', cost: 1, effects: [{ t: 'power', id: 'sw_might' }] },
    pw_sw_vow:      { name: '守りの誓い', pool: 'power_swordsman', type: 'power', cost: 2, effects: [{ t: 'power', id: 'sw_vow' }] },

    pw_mg_cycle:    { name: '魔力循環', pool: 'power_mage', type: 'power', cost: 1, effects: [{ t: 'power', id: 'mg_cycle' }] },
    pw_mg_inferno:  { name: '業火の心得', pool: 'power_mage', type: 'power', cost: 2, effects: [{ t: 'power', id: 'mg_inferno' }] },
    pw_mg_amplify:  { name: '魔力増幅', pool: 'power_mage', type: 'power', cost: 1, effects: [{ t: 'power', id: 'mg_amplify' }] },
    pw_mg_quickcast:{ name: '詠唱短縮', pool: 'power_mage', type: 'power', cost: 1, effects: [{ t: 'power', id: 'mg_quickcast' }] },

    pw_as_stargaze: { name: '星見', pool: 'power_astrologer', type: 'power', cost: 1, effects: [{ t: 'power', id: 'as_stargaze' }] },
    pw_as_aegis:    { name: '星の守り', pool: 'power_astrologer', type: 'power', cost: 1, effects: [{ t: 'power', id: 'as_aegis' }] },
    pw_as_orbit:    { name: '星の巡り', pool: 'power_astrologer', type: 'power', cost: 2, effects: [{ t: 'power', id: 'as_orbit' }] },
    pw_as_zodiac:   { name: '星座の加護', pool: 'power_astrologer', type: 'power', cost: 3, effects: [{ t: 'power', id: 'as_zodiac' }] }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
