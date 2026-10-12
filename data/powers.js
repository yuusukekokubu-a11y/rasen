// パワー（使うと戦闘終了まで続く効果）
//
//   onPlay    : 使った瞬間に一度だけ発動する効果
//   turnStart : 毎ターン開始時（カードを引いた後）に発動する効果
//   turnEnd   : 毎ターン終了時に発動する効果
//   cardPlayed: { filter, effects } カードを使うたびに発動。filter で条件を絞る
//               filter: { tag:'magic', type:'attack', owner:'self', minCost:2 }
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
      turnStart: [{ t: 'buff', stat: 'atk', v: 1, who: 'party' }, { t: 'buff', stat: 'mag', v: 1, who: 'party' }] }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
