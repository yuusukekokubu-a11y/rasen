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
//     { t:'block', v:5, scale:'def'|'mag'|'none' }   ブロック（ダメージを防ぐ盾。自分のターン開始時に消える）。既定は防御力が乗る
//     { t:'ward', v:6 }                               結界（ターンをまたいで残る盾。毎ターン半分に減る）。既定は魔力が乗る
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
      effects: [{ t: 'dmg', v: 7, scale: 'mag', element: 'fire' }, { t: 'status', s: 'burn', v: 2 }],
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
      effects: [{ t: 'dmg', v: 4, scale: 'mag' }], upgrade: { effects: [{ t: 'dmg', v: 6, scale: 'mag' }] } },
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
      effects: [{ t: 'buff', stat: 'atk', v: 2, who: 'party' }, { t: 'buff', stat: 'mag', v: 2, who: 'party' }],
      upgrade: { effects: [{ t: 'buff', stat: 'atk', v: 3, who: 'party' }, { t: 'buff', stat: 'mag', v: 3, who: 'party' }] } },
    star_beam:      { name: '星光', pool: 'starboard', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 9, scale: 'mag' }], upgrade: { effects: [{ t: 'dmg', v: 12, scale: 'mag' }] } },
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

    // ===== 短剣（盗賊） =====
    dagger_stab:    { name: '刺突', pool: 'dagger', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 7 }], upgrade: { effects: [{ t: 'dmg', v: 10 }] } },
    dagger_prepare: { name: '下準備', pool: 'dagger', type: 'skill', cost: 0,
      effects: [{ t: 'draw', v: 2 }, { t: 'discard', v: 1 }], upgrade: { effects: [{ t: 'draw', v: 3 }, { t: 'discard', v: 1 }] } },
    dagger_flurry:  { name: '乱れ斬り', pool: 'dagger', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 3, plusPer: { what: 'discardedThisTurn', v: 3 } }],
      upgrade: { effects: [{ t: 'dmg', v: 4, plusPer: { what: 'discardedThisTurn', v: 4 } }] } },
    dagger_toss:    { name: '投げナイフ', pool: 'dagger', type: 'attack', cost: 0,
      effects: [{ t: 'dmg', v: 3 }], upgrade: { effects: [{ t: 'dmg', v: 5 }] } },
    dagger_shadow:  { name: '影討ち', pool: 'dagger', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 6 }, { t: 'draw', v: 1 }, { t: 'discard', v: 1 }],
      upgrade: { effects: [{ t: 'dmg', v: 8 }, { t: 'draw', v: 1 }, { t: 'discard', v: 1 }] } },
    dagger_venom:   { name: '毒刃', pool: 'dagger', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 4 }, { t: 'status', s: 'weak', v: 1 }, { t: 'status', s: 'vulnerable', v: 1 }],
      upgrade: { effects: [{ t: 'dmg', v: 6 }, { t: 'status', s: 'weak', v: 2 }, { t: 'status', s: 'vulnerable', v: 2 }] } },
    dagger_reflex:  { name: '身のこなし', pool: 'dagger', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 5 }, { t: 'draw', v: 1 }, { t: 'discard', v: 1 }],
      upgrade: { effects: [{ t: 'block', v: 8 }, { t: 'draw', v: 1 }, { t: 'discard', v: 1 }] } },

    // ===== 軽装（盗賊・弓使いの頭・胴） =====
    light_dodge:    { name: '回避', pool: 'light', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 6 }], upgrade: { effects: [{ t: 'block', v: 9 }] } },
    light_step:     { name: '軽業', pool: 'light', type: 'skill', cost: 0,
      effects: [{ t: 'block', v: 3 }], upgrade: { effects: [{ t: 'block', v: 5 }] } },
    light_scout:    { name: '偵察', pool: 'light', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 3 }, { t: 'scry', v: 3 }], upgrade: { effects: [{ t: 'block', v: 5 }, { t: 'scry', v: 3 }] } },
    light_evade:    { name: '見切り', pool: 'light', type: 'skill', cost: 2,
      effects: [{ t: 'block', v: 12 }], upgrade: { effects: [{ t: 'block', v: 16 }] } },
    light_rush:     { name: '駆け抜け', pool: 'light', type: 'skill', cost: 1,
      effects: [{ t: 'draw', v: 2 }, { t: 'discard', v: 1 }], upgrade: { effects: [{ t: 'draw', v: 3 }, { t: 'discard', v: 1 }] } },

    // ===== 弓（弓使い） =====
    bow_shot:       { name: '射撃', pool: 'bow', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 3, hits: 2 }], upgrade: { effects: [{ t: 'dmg', v: 4, hits: 2 }] } },
    bow_rain:       { name: '矢の雨', pool: 'bow', type: 'attack', cost: 2,
      effects: [{ t: 'dmg', v: 2, hits: 3, target: 'all' }], upgrade: { effects: [{ t: 'dmg', v: 3, hits: 3, target: 'all' }] } },
    bow_quick:      { name: '速射', pool: 'bow', type: 'attack', cost: 0,
      effects: [{ t: 'dmg', v: 1, hits: 2 }], upgrade: { effects: [{ t: 'dmg', v: 2, hits: 2 }] } },
    bow_aim:        { name: '狙い撃ち', pool: 'bow', type: 'attack', cost: 2,
      effects: [{ t: 'dmg', v: 13 }, { t: 'status', s: 'vulnerable', v: 1 }],
      upgrade: { effects: [{ t: 'dmg', v: 17 }, { t: 'status', s: 'vulnerable', v: 2 }] } },
    bow_volley:     { name: '連射', pool: 'bow', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 1, hits: 4, target: 'random' }], upgrade: { effects: [{ t: 'dmg', v: 2, hits: 4, target: 'random' }] } },
    bow_focus:      { name: '集中射撃', pool: 'bow', type: 'skill', cost: 1,
      effects: [{ t: 'buff', stat: 'atk', v: 2, who: 'self' }], upgrade: { effects: [{ t: 'buff', stat: 'atk', v: 3, who: 'self' }] } },
    bow_pin:        { name: '足止め', pool: 'bow', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 4 }, { t: 'status', s: 'weak', v: 2 }], upgrade: { effects: [{ t: 'dmg', v: 6 }, { t: 'status', s: 'weak', v: 2 }] } },

    // ===== 錫杖（僧侶：結界役） =====
    scep_prayer:    { name: '守りの祈り', pool: 'scepter', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'ward', v: 4 }, { t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'ward', v: 6 }, { t: 'draw', v: 1 }] } },
    scep_ward:      { name: '結界', pool: 'scepter', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'ward', v: 6 }], upgrade: { effects: [{ t: 'ward', v: 9 }] } },
    scep_smite:     { name: '聖撃', pool: 'scepter', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 6, scale: 'mag' }], upgrade: { effects: [{ t: 'dmg', v: 9, scale: 'mag' }] } },
    scep_purge:     { name: '浄化', pool: 'scepter', type: 'skill', cost: 0,
      effects: [{ t: 'exhaustChoice', v: 1 }, { t: 'draw', v: 2 }], upgrade: { effects: [{ t: 'exhaustChoice', v: 1 }, { t: 'draw', v: 3 }] } },
    scep_offering:  { name: '献身', pool: 'scepter', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'exhaustChoice', v: 1 }, { t: 'ward', v: 8 }],
      upgrade: { effects: [{ t: 'exhaustChoice', v: 1 }, { t: 'ward', v: 11 }] } },
    scep_reflect:   { name: '聖光反射', pool: 'scepter', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 0, scale: 'none', plusPer: { what: 'ward', v: 1 } }], upgrade: { cost: 0 } },
    scep_judgement: { name: '裁き', pool: 'scepter', type: 'attack', cost: 2, tags: ['magic'],
      effects: [{ t: 'dmg', v: 6, scale: 'mag', plusPer: { what: 'exhaustedThisCombat', v: 3 } }],
      upgrade: { effects: [{ t: 'dmg', v: 8, scale: 'mag', plusPer: { what: 'exhaustedThisCombat', v: 4 } }] } },
    scep_sanctuary: { name: '聖域', pool: 'scepter', type: 'skill', cost: 2, tags: ['magic'], exhaust: true,
      effects: [{ t: 'ward', v: 16 }], upgrade: { effects: [{ t: 'ward', v: 22 }] } },
    scep_lightray:  { name: '光の矢', pool: 'scepter', type: 'attack', cost: 0, tags: ['magic'], exhaust: true,
      effects: [{ t: 'dmg', v: 5, scale: 'mag' }], upgrade: { effects: [{ t: 'dmg', v: 8, scale: 'mag' }] } },

    // ===== 追加カード（ボリューム1）：各装備種を10枚前後に =====
    // 剣
    sword_lunge:    { name: '突き', pool: 'sword', type: 'attack', cost: 0,
      effects: [{ t: 'dmg', v: 4 }], upgrade: { effects: [{ t: 'dmg', v: 6 }] } },
    sword_rally:    { name: '鼓舞の剣', pool: 'sword', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 5 }, { t: 'buff', stat: 'atk', v: 1, who: 'party' }],
      upgrade: { effects: [{ t: 'dmg', v: 7 }, { t: 'buff', stat: 'atk', v: 1, who: 'party' }] } },
    sword_finisher: { name: '決め手', pool: 'sword', type: 'attack', cost: 2,
      effects: [{ t: 'dmg', v: 5, plusPer: { what: 'cardsPlayedThisTurn', v: 3 } }],
      upgrade: { effects: [{ t: 'dmg', v: 7, plusPer: { what: 'cardsPlayedThisTurn', v: 4 } }] } },
    // 重装
    heavy_fortress: { name: '要塞', pool: 'heavy', type: 'skill', cost: 3,
      effects: [{ t: 'block', v: 22 }], upgrade: { effects: [{ t: 'block', v: 28 }] } },
    heavy_roar:     { name: '威圧', pool: 'heavy', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 3 }, { t: 'status', s: 'weak', v: 1, target: 'all' }],
      upgrade: { effects: [{ t: 'block', v: 4 }, { t: 'status', s: 'weak', v: 2, target: 'all' }] } },
    heavy_charge:   { name: '突進', pool: 'heavy', type: 'attack', cost: 2,
      effects: [{ t: 'block', v: 6 }, { t: 'dmg', v: 0, scale: 'none', plusPer: { what: 'block', v: 1 } }],
      upgrade: { effects: [{ t: 'block', v: 9 }, { t: 'dmg', v: 0, scale: 'none', plusPer: { what: 'block', v: 1 } }] } },
    heavy_brace:    { name: '構え直し', pool: 'heavy', type: 'skill', cost: 0, exhaust: true,
      effects: [{ t: 'block', v: 4 }, { t: 'draw', v: 1 }], upgrade: { exhaust: false } },
    // 杖
    staff_spark:    { name: '電光', pool: 'staff', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 5, scale: 'mag', element: 'thunder' }, { t: 'status', s: 'shock', v: 1 }],
      upgrade: { effects: [{ t: 'dmg', v: 7, scale: 'mag', element: 'thunder' }, { t: 'status', s: 'shock', v: 2 }] } },
    staff_flamewall:{ name: '炎の壁', pool: 'staff', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'block', v: 4, scale: 'mag' }, { t: 'status', s: 'burn', v: 1, target: 'all' }],
      upgrade: { effects: [{ t: 'block', v: 6, scale: 'mag' }, { t: 'status', s: 'burn', v: 2, target: 'all' }] } },
    staff_chain:    { name: '連鎖魔法', pool: 'staff', type: 'attack', cost: 2, tags: ['magic'],
      effects: [{ t: 'dmg', v: 3, scale: 'mag', hits: 3, target: 'random' }],
      upgrade: { effects: [{ t: 'dmg', v: 4, scale: 'mag', hits: 3, target: 'random' }] } },
    // ローブ
    robe_calm:      { name: '静心', pool: 'robe', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 4 }, { t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'block', v: 6 }, { t: 'draw', v: 1 }] } },
    robe_aura:      { name: '魔力の衣', pool: 'robe', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'buff', stat: 'mag', v: 1, who: 'self' }, { t: 'block', v: 3, scale: 'mag' }],
      upgrade: { effects: [{ t: 'buff', stat: 'mag', v: 2, who: 'self' }, { t: 'block', v: 3, scale: 'mag' }] } },
    robe_shroud:    { name: '霧の衣', pool: 'robe', type: 'skill', cost: 2,
      effects: [{ t: 'block', v: 14 }], upgrade: { effects: [{ t: 'block', v: 18 }] } },
    robe_recall:    { name: '回想', pool: 'robe', type: 'skill', cost: 1,
      effects: [{ t: 'scry', v: 3 }, { t: 'block', v: 3 }], upgrade: { effects: [{ t: 'scry', v: 4 }, { t: 'block', v: 5 }] } },
    robe_restore:   { name: '再生', pool: 'robe', type: 'skill', cost: 2, tags: ['magic'], exhaust: true,
      effects: [{ t: 'heal', v: 6 }], upgrade: { effects: [{ t: 'heal', v: 9 }] } },
    // 星盤
    star_nova:      { name: '新星', pool: 'starboard', type: 'attack', cost: 2, tags: ['magic'],
      effects: [{ t: 'dmg', v: 6, scale: 'mag', target: 'all' }], upgrade: { effects: [{ t: 'dmg', v: 9, scale: 'mag', target: 'all' }] } },
    star_guide:     { name: '導きの星', pool: 'starboard', type: 'skill', cost: 1, exhaust: true,
      effects: [{ t: 'energy', v: 1 }, { t: 'draw', v: 2 }], upgrade: { exhaust: false } },
    star_lines:     { name: '星座線', pool: 'starboard', type: 'attack', cost: 1, tags: ['magic'],
      effects: [{ t: 'dmg', v: 2, scale: 'mag', hits: 3, target: 'random' }],
      upgrade: { effects: [{ t: 'dmg', v: 3, scale: 'mag', hits: 3, target: 'random' }] } },
    // アクセサリー
    acc_bandage:    { name: '包帯', pool: 'accessory', type: 'skill', cost: 1, exhaust: true,
      effects: [{ t: 'heal', v: 4 }], upgrade: { effects: [{ t: 'heal', v: 6 }] } },
    acc_whistle:    { name: '合図の笛', pool: 'accessory', type: 'skill', cost: 1, exhaust: true,
      effects: [{ t: 'buff', stat: 'atk', v: 1, who: 'party' }], upgrade: { effects: [{ t: 'buff', stat: 'atk', v: 2, who: 'party' }] } },
    acc_flash:      { name: '閃光玉', pool: 'accessory', type: 'skill', cost: 1, exhaust: true,
      effects: [{ t: 'status', s: 'weak', v: 1, target: 'all' }], upgrade: { effects: [{ t: 'status', s: 'weak', v: 2, target: 'all' }] } },
    acc_kick:       { name: '蹴り', pool: 'accessory', type: 'attack', cost: 0,
      effects: [{ t: 'dmg', v: 3 }], upgrade: { effects: [{ t: 'dmg', v: 5 }] } },
    acc_guard:      { name: '身構え', pool: 'accessory', type: 'skill', cost: 0,
      effects: [{ t: 'block', v: 3 }], upgrade: { effects: [{ t: 'block', v: 5 }] } },
    // 短剣
    dagger_backstab:{ name: '背刺し', pool: 'dagger', type: 'attack', cost: 0, exhaust: true,
      effects: [{ t: 'dmg', v: 9 }], upgrade: { effects: [{ t: 'dmg', v: 13 }] } },
    dagger_juggle:  { name: '曲芸', pool: 'dagger', type: 'skill', cost: 1,
      effects: [{ t: 'draw', v: 3 }, { t: 'discard', v: 2 }], upgrade: { effects: [{ t: 'draw', v: 4 }, { t: 'discard', v: 2 }] } },
    dagger_expose:  { name: '弱点看破', pool: 'dagger', type: 'skill', cost: 1,
      effects: [{ t: 'status', s: 'vulnerable', v: 2 }, { t: 'draw', v: 1 }],
      upgrade: { effects: [{ t: 'status', s: 'vulnerable', v: 3 }, { t: 'draw', v: 1 }] } },
    // 軽装
    light_shadowstep:{ name: '影歩き', pool: 'light', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 4 }, { t: 'draw', v: 1 }], upgrade: { effects: [{ t: 'block', v: 6 }, { t: 'draw', v: 1 }] } },
    light_vanish:   { name: '雲隠れ', pool: 'light', type: 'skill', cost: 2,
      effects: [{ t: 'block', v: 9 }, { t: 'draw', v: 2 }, { t: 'discard', v: 1 }],
      upgrade: { effects: [{ t: 'block', v: 12 }, { t: 'draw', v: 2 }, { t: 'discard', v: 1 }] } },
    light_tumble:   { name: '転がり', pool: 'light', type: 'skill', cost: 0,
      effects: [{ t: 'block', v: 2 }, { t: 'draw', v: 1 }, { t: 'discard', v: 1 }],
      upgrade: { effects: [{ t: 'block', v: 4 }, { t: 'draw', v: 1 }, { t: 'discard', v: 1 }] } },
    light_tailwind: { name: '追い風', pool: 'light', type: 'skill', cost: 1,
      effects: [{ t: 'buff', stat: 'atk', v: 1, who: 'party' }, { t: 'block', v: 2 }],
      upgrade: { effects: [{ t: 'buff', stat: 'atk', v: 2, who: 'party' }, { t: 'block', v: 2 }] } },
    light_camo:     { name: '迷彩', pool: 'light', type: 'skill', cost: 1,
      effects: [{ t: 'block', v: 5 }, { t: 'status', s: 'weak', v: 1 }], upgrade: { effects: [{ t: 'block', v: 7 }, { t: 'status', s: 'weak', v: 1 }] } },
    // 弓
    bow_pierce:     { name: '貫通矢', pool: 'bow', type: 'attack', cost: 2,
      effects: [{ t: 'dmg', v: 7, target: 'all' }], upgrade: { effects: [{ t: 'dmg', v: 10, target: 'all' }] } },
    bow_triple:     { name: '三連射', pool: 'bow', type: 'attack', cost: 1,
      effects: [{ t: 'dmg', v: 2, hits: 3 }], upgrade: { effects: [{ t: 'dmg', v: 3, hits: 3 }] } },
    bow_nock:       { name: '矢番え', pool: 'bow', type: 'skill', cost: 0, exhaust: true,
      effects: [{ t: 'draw', v: 1 }, { t: 'buff', stat: 'atk', v: 1, who: 'self' }], upgrade: { exhaust: false } },
    // 錫杖
    scep_blessing:  { name: '祝福', pool: 'scepter', type: 'skill', cost: 1, tags: ['magic'],
      effects: [{ t: 'heal', v: 2 }, { t: 'ward', v: 3 }], upgrade: { effects: [{ t: 'heal', v: 3 }, { t: 'ward', v: 5 }] } },

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
    pw_as_zodiac:   { name: '星座の加護', pool: 'power_astrologer', type: 'power', cost: 3, effects: [{ t: 'power', id: 'as_zodiac' }] },

    pw_th_shadow:   { name: '影走り', pool: 'power_thief', type: 'power', cost: 1, effects: [{ t: 'power', id: 'th_shadow' }] },
    pw_th_nimble:   { name: '身軽', pool: 'power_thief', type: 'power', cost: 1, effects: [{ t: 'power', id: 'th_nimble' }] },
    pw_th_mist:     { name: '霧隠れ', pool: 'power_thief', type: 'power', cost: 1, effects: [{ t: 'power', id: 'th_mist' }] },
    pw_th_vital:    { name: '急所狙い', pool: 'power_thief', type: 'power', cost: 1, effects: [{ t: 'power', id: 'th_vital' }] },

    pw_ar_stance:   { name: '速射の構え', pool: 'power_archer', type: 'power', cost: 2, effects: [{ t: 'power', id: 'ar_stance' }] },
    pw_ar_quiver:   { name: '矢筒', pool: 'power_archer', type: 'power', cost: 1, effects: [{ t: 'power', id: 'ar_quiver' }] },
    pw_ar_eagle:    { name: '鷹の目', pool: 'power_archer', type: 'power', cost: 2, effects: [{ t: 'power', id: 'ar_eagle' }] },
    pw_ar_hunter:   { name: '狩人の心得', pool: 'power_archer', type: 'power', cost: 1, effects: [{ t: 'power', id: 'ar_hunter' }] },

    pw_pr_ward:     { name: '加護', pool: 'power_priest', type: 'power', cost: 1, effects: [{ t: 'power', id: 'pr_ward' }] },
    pw_pr_ascetic:  { name: '苦行', pool: 'power_priest', type: 'power', cost: 1, effects: [{ t: 'power', id: 'pr_ascetic' }] },
    pw_pr_grace:    { name: '不朽の結界', pool: 'power_priest', type: 'power', cost: 2, effects: [{ t: 'power', id: 'pr_grace' }] },
    pw_pr_faith:    { name: '信仰', pool: 'power_priest', type: 'power', cost: 1, effects: [{ t: 'power', id: 'pr_faith' }] },
    pw_sw_counter:  { name: '反撃の心得', pool: 'power_swordsman', type: 'power', cost: 1, effects: [{ t: 'power', id: 'sw_counter' }] },
    pw_sw_iron:     { name: '鉄の意志', pool: 'power_swordsman', type: 'power', cost: 1, effects: [{ t: 'power', id: 'sw_iron' }] },
    pw_mg_frost:    { name: '氷結の陣', pool: 'power_mage', type: 'power', cost: 2, effects: [{ t: 'power', id: 'mg_frost' }] },
    pw_mg_torrent:  { name: '魔力の奔流', pool: 'power_mage', type: 'power', cost: 1, effects: [{ t: 'power', id: 'mg_torrent' }] },
    pw_as_foresee:  { name: '予知', pool: 'power_astrologer', type: 'power', cost: 1, effects: [{ t: 'power', id: 'as_foresee' }] },
    pw_as_meteor:   { name: '流星群', pool: 'power_astrologer', type: 'power', cost: 2, effects: [{ t: 'power', id: 'as_meteor' }] },
    pw_th_ambush:   { name: '奇襲', pool: 'power_thief', type: 'power', cost: 0, effects: [{ t: 'power', id: 'th_ambush' }] },
    pw_th_tricks:   { name: '投げ技', pool: 'power_thief', type: 'power', cost: 1, effects: [{ t: 'power', id: 'th_tricks' }] },
    pw_ar_barrage:  { name: '一斉射撃', pool: 'power_archer', type: 'power', cost: 2, effects: [{ t: 'power', id: 'ar_barrage' }] },
    pw_ar_trueshot: { name: '必中', pool: 'power_archer', type: 'power', cost: 1, effects: [{ t: 'power', id: 'ar_trueshot' }] },
    pw_pr_spring:   { name: '聖なる泉', pool: 'power_priest', type: 'power', cost: 1, effects: [{ t: 'power', id: 'pr_spring' }] },
    pw_pr_wrath:    { name: '神罰', pool: 'power_priest', type: 'power', cost: 1, effects: [{ t: 'power', id: 'pr_wrath' }] }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
