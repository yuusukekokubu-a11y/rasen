// パワー（使うと戦闘終了まで続く効果）
//
//   onPlay    : 使った瞬間に一度だけ発動する効果
//   turnStart : 毎ターン開始時（カードを引いた後）に発動する効果
//   turnEnd   : 毎ターン終了時に発動する効果
//   cardPlayed: { filter, effects } カードを使うたびに発動。filter で条件を絞る
//               filter: { tag:'magic', type:'attack', owner:'self', minCost:2 }
//   cardDiscarded : カードの効果で手札が捨てられるたびに発動する効果
//   cardExhausted : カードが廃棄されるたびに発動する効果
//   効果の書き方は data/cards.js と同じ。'self' はパワーカードの持ち主のキャラ
//
// jobs.js の powers 配列の順番が解禁順（先頭は最初から使える）
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.powers = {
    // 剣士
    sw_fighting: { name: '闘気', desc: '毎ターン開始時、このキャラの攻撃力+1',
      turnStart: [{ t: 'buff', stat: 'atk', v: 1, who: 'self' }] },
    sw_stance:   { name: '不動の構え', desc: '毎ターン終了時、ブロック4（防御力が乗る）',
      turnEnd: [{ t: 'block', v: 4 }] },
    sw_might:    { name: '剛剣', desc: 'このキャラの攻撃力+3',
      onPlay: [{ t: 'buff', stat: 'atk', v: 3, who: 'self' }] },
    sw_vow:      { name: '守りの誓い', desc: '毎ターン開始時、ブロック6（防御力が乗る）',
      turnStart: [{ t: 'block', v: 6 }] },

    // 魔法使い
    mg_cycle:    { name: '魔力循環', desc: '魔法カードを使うたび、ランダムな敵に3ダメージ',
      cardPlayed: { filter: { tag: 'magic' }, effects: [{ t: 'dmg', v: 3, scale: 'none', target: 'random' }] } },
    mg_inferno:  { name: '業火の心得', desc: '毎ターン開始時、敵全体に燃焼2',
      turnStart: [{ t: 'status', s: 'burn', v: 2, target: 'all' }] },
    mg_amplify:  { name: '魔力増幅', desc: 'このキャラの魔力+3',
      onPlay: [{ t: 'buff', stat: 'mag', v: 3, who: 'self' }] },
    mg_quickcast:{ name: '詠唱短縮', desc: 'コスト2以上のカードを使うたび、1枚引く',
      cardPlayed: { filter: { minCost: 2 }, effects: [{ t: 'draw', v: 1 }] } },

    // 占星師
    as_stargaze: { name: '星見', desc: '毎ターン開始時、1枚引く',
      turnStart: [{ t: 'draw', v: 1 }] },
    as_aegis:    { name: '星の守り', desc: '毎ターン終了時、ブロック3（魔力が乗る）',
      turnEnd: [{ t: 'block', v: 3, scale: 'mag' }] },
    as_orbit:    { name: '星の巡り', desc: '毎ターン開始時、エネルギー+1',
      turnStart: [{ t: 'energy', v: 1 }] },
    as_zodiac:   { name: '星座の加護', desc: '毎ターン開始時、味方全員の攻撃力と魔力+1',
      turnStart: [{ t: 'buff', stat: 'atk', v: 1, who: 'party' }, { t: 'buff', stat: 'mag', v: 1, who: 'party' }] },

    // 盗賊
    th_shadow:   { name: '影走り', desc: 'カードを捨てるたび、ランダムな敵に3ダメージ',
      cardDiscarded: [{ t: 'dmg', v: 3, scale: 'none', target: 'random' }] },
    th_nimble:   { name: '身軽', desc: '毎ターン開始時、1枚引いて1枚捨てる',
      turnStart: [{ t: 'draw', v: 1 }, { t: 'discard', v: 1 }] },
    th_mist:     { name: '霧隠れ', desc: 'カードを捨てるたび、ブロック2',
      cardDiscarded: [{ t: 'block', v: 2, scale: 'none' }] },
    th_vital:    { name: '急所狙い', desc: 'このキャラの攻撃力+3',
      onPlay: [{ t: 'buff', stat: 'atk', v: 3, who: 'self' }] },

    // 弓使い
    ar_stance:   { name: '速射の構え', desc: '毎ターン開始時、このキャラの攻撃力+1',
      turnStart: [{ t: 'buff', stat: 'atk', v: 1, who: 'self' }] },
    ar_quiver:   { name: '矢筒', desc: 'このキャラが攻撃カードを使うたび、ランダムな敵に2ダメージ',
      cardPlayed: { filter: { type: 'attack', owner: 'self' }, effects: [{ t: 'dmg', v: 2, scale: 'none', target: 'random' }] } },
    ar_eagle:    { name: '鷹の目', desc: '毎ターン開始時、敵全体に弱体1',
      turnStart: [{ t: 'status', s: 'vulnerable', v: 1, target: 'all' }] },
    ar_hunter:   { name: '狩人の心得', desc: 'このキャラの攻撃力+2',
      onPlay: [{ t: 'buff', stat: 'atk', v: 2, who: 'self' }] },

    // 僧侶
    pr_ward:     { name: '結界', desc: '毎ターン開始時、ブロック2（魔力が乗る）',
      turnStart: [{ t: 'block', v: 2, scale: 'mag' }] },
    pr_ascetic:  { name: '苦行', desc: 'カードが廃棄されるたび、ブロック4（魔力が乗る）',
      cardExhausted: [{ t: 'block', v: 4, scale: 'mag' }] },
    pr_grace:    { name: '恩寵', desc: '毎ターン終了時、HPを1回復（魔力の半分が乗る）',
      turnEnd: [{ t: 'heal', v: 1, magRate: 0.5 }] },
    pr_faith:    { name: '信仰', desc: 'このキャラの魔力+3',
      onPlay: [{ t: 'buff', stat: 'mag', v: 3, who: 'self' }] }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
