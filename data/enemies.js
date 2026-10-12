// 敵データ（数値は仮置き）
//
//   hp      : [最小, 最大]
//   moves   : 行動。組み合わせ自由
//     dmg/hits : 攻撃（dmg × hits回）
//     block    : 自分にブロック
//     str      : 自分の攻撃力アップ（以降の攻撃1回ごとに加算）
//     debuff   : パーティに状態異常 { s:'weak'|'vulnerable', v:ターン数 }
//     heal     : 自分を回復
//     allyBlock: 味方全員にブロック
//   pattern : 行動の選び方
//     { type:'cycle', seq:[...] }                         順番にくり返す
//     { type:'random', weights:{...}, maxRepeat:2 }       重み付きランダム（同じ行動の連続回数に上限）
//     opening : 最初のターンだけ使う行動
//   elementMult: 属性ごとの被ダメージ倍率（1.5=弱点 0.5=耐性）
//   drops   : 倒すと確定で手に入る素材
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.enemies = {
    slime: {
      name: 'スライム', hp: [40, 46],
      moves: {
        tackle: { name: '体当たり', dmg: 11 },
        ooze:   { name: '粘液', dmg: 7, debuff: { s: 'weak', v: 1 } },
        harden: { name: '硬化', block: 10 }
      },
      pattern: { type: 'random', weights: { tackle: 3, ooze: 2, harden: 1 }, maxRepeat: 2 },
      elementMult: { fire: 1.5, ice: 0.75 },
      drops: { slime_gel: 1 }
    },
    bat: {
      name: '洞窟コウモリ', hp: [22, 26],
      moves: {
        bite:  { name: 'かみつき', dmg: 5, hits: 2 },
        screech: { name: '超音波', debuff: { s: 'vulnerable', v: 1 }, dmg: 4 }
      },
      pattern: { type: 'random', weights: { bite: 3, screech: 1 }, maxRepeat: 2 },
      elementMult: { thunder: 1.5 },
      drops: { bat_wing: 1 }
    },
    wolf: {
      name: '魔狼', hp: [56, 62],
      moves: {
        claw:  { name: '引っかき', dmg: 14 },
        howl:  { name: '遠吠え', str: 3, block: 8 },
        rend:  { name: '噛み裂き', dmg: 8, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['claw', 'rend', 'howl'] },
      elementMult: { fire: 1.25 },
      drops: { wolf_pelt: 1 }
    },
    spider: {
      name: '大蜘蛛', hp: [60, 66],
      moves: {
        web:   { name: '糸を吐く', dmg: 8, debuff: { s: 'weak', v: 2 } },
        fang:  { name: '毒牙', dmg: 16 },
        guard: { name: '巣ごもり', block: 14 }
      },
      pattern: { type: 'random', weights: { web: 2, fang: 3, guard: 1 }, maxRepeat: 1 },
      elementMult: { fire: 1.5, thunder: 0.75 },
      drops: { spider_silk: 1 }
    },
    golem: {
      name: '岩窟の主', hp: [240, 240], boss: true,
      moves: {
        smash:   { name: '岩砕き', dmg: 22 },
        quake:   { name: '地響き', dmg: 10, hits: 2, debuff: { s: 'vulnerable', v: 1 } },
        fortify: { name: '岩の鎧', block: 25, str: 3 },
        charge:  { name: '力を溜める', str: 5 }
      },
      pattern: { type: 'cycle', opening: 'fortify', seq: ['smash', 'quake', 'charge', 'smash', 'fortify'] },
      elementMult: { thunder: 1.5, fire: 0.75 },
      drops: { golem_core: 1, star_shard: 1 }
    }
  };

  // 戦闘の組み合わせ（シミュレーターとダンジョンで使う）
  R.DATA.encounters = {
    slime_pair:   { name: 'スライム×2', enemies: ['slime', 'slime'] },
    bat_trio:     { name: 'コウモリ×3', enemies: ['bat', 'bat', 'bat'] },
    wolf_single:  { name: '魔狼',       enemies: ['wolf'] },
    wolf_slime:   { name: '魔狼＋スライム', enemies: ['wolf', 'slime'] },
    spider_bat:   { name: '大蜘蛛＋コウモリ', enemies: ['spider', 'bat'] },
    wolf_pair:    { name: '魔狼×2',     enemies: ['wolf', 'wolf'] },
    spider_pair:  { name: '大蜘蛛×2',   enemies: ['spider', 'spider'] },
    boss_golem:   { name: '【ボス】岩窟の主', enemies: ['golem'], boss: true }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
