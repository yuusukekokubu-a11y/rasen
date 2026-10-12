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
    },

    // ===== 囁きの森 =====
    treant: {
      name: 'トレント', hp: [70, 78],
      moves: {
        branch: { name: '枝打ち', dmg: 13 },
        root:   { name: '根を張る', block: 14, heal: 6 },
        slam:   { name: '叩きつけ', dmg: 18 }
      },
      pattern: { type: 'cycle', seq: ['branch', 'root', 'slam'] },
      elementMult: { fire: 1.5, ice: 0.75 },
      drops: { treant_bark: 1 }
    },
    hornet: {
      name: '大スズメバチ', hp: [28, 32],
      moves: {
        sting: { name: '毒針', dmg: 4, hits: 3 },
        buzz:  { name: '羽音', dmg: 5, debuff: { s: 'weak', v: 1 } }
      },
      pattern: { type: 'random', weights: { sting: 3, buzz: 1 }, maxRepeat: 2 },
      elementMult: { ice: 1.25 },
      drops: { hornet_sting: 1 }
    },
    elder_tree: {
      name: '森の古樹', hp: [380, 380], boss: true,
      moves: {
        awaken: { name: '目覚め', str: 2, block: 20 },
        whip:   { name: '枝鞭', dmg: 8, hits: 3 },
        drain:  { name: '養分吸収', dmg: 14, heal: 15 },
        thorns: { name: '棘の壁', block: 30 },
        crush:  { name: '押し潰し', dmg: 30 },
        grow:   { name: '成長', str: 4 }
      },
      pattern: { type: 'cycle', opening: 'awaken', seq: ['whip', 'drain', 'thorns', 'crush', 'grow'] },
      elementMult: { fire: 1.5, ice: 0.75 },
      drops: { elder_heart: 1, ancient_wood: 1 }
    },

    // ===== 霧の沼 =====
    toad: {
      name: '毒ガエル', hp: [46, 52],
      moves: {
        tongue: { name: '舌打ち', dmg: 10 },
        poison: { name: '毒液', dmg: 6, debuff: { s: 'weak', v: 2 } },
        croak:  { name: '鳴き声', dmg: 4, debuff: { s: 'vulnerable', v: 2 } }
      },
      pattern: { type: 'random', weights: { tongue: 3, poison: 2, croak: 1 }, maxRepeat: 1 },
      elementMult: { thunder: 1.5, ice: 0.75 },
      drops: { toad_skin: 1 }
    },
    wisp: {
      name: '鬼火', hp: [30, 34],
      moves: {
        flare:   { name: '火の粉', dmg: 6, hits: 2 },
        haunt:   { name: 'まとわりつく', dmg: 4, debuff: { s: 'vulnerable', v: 1 } },
        flicker: { name: '揺らめく', block: 12 }
      },
      pattern: { type: 'random', weights: { flare: 3, haunt: 1, flicker: 1 }, maxRepeat: 2 },
      elementMult: { ice: 1.5, fire: 0.5 },
      drops: { wisp_flame: 1 }
    },
    marsh_queen: {
      name: '沼の女王', hp: [400, 400], boss: true,
      moves: {
        mist:  { name: '霧', block: 20, debuff: { s: 'weak', v: 2 } },
        lash:  { name: '尾の一撃', dmg: 24 },
        spit:  { name: '毒霧', dmg: 9, hits: 2, debuff: { s: 'vulnerable', v: 1 } },
        call:  { name: '呼び声', str: 3, block: 15 },
        bite:  { name: '噛みつき', dmg: 12, hits: 2 }
      },
      pattern: { type: 'cycle', opening: 'mist', seq: ['lash', 'spit', 'call', 'lash', 'bite'] },
      elementMult: { thunder: 1.5, ice: 0.75 },
      drops: { queen_scale: 1, glowcap: 2 }
    },

    // ===== 星降る遺跡 =====
    gargoyle: {
      name: 'ガーゴイル', hp: [80, 88],
      moves: {
        claw:   { name: '石爪', dmg: 16 },
        harden: { name: '石化', block: 22 },
        dive:   { name: '急降下', dmg: 10, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['claw', 'harden', 'dive'] },
      elementMult: { thunder: 1.5, ice: 0.75 },
      drops: { gargoyle_stone: 1 }
    },
    phantom: {
      name: '亡霊騎士', hp: [66, 72],
      moves: {
        slash: { name: '亡者の剣', dmg: 18 },
        curse: { name: '呪い', dmg: 6, debuff: { s: 'weak', v: 2 } },
        wail:  { name: '嘆き', dmg: 7, hits: 3 }
      },
      pattern: { type: 'random', weights: { slash: 3, curse: 1, wail: 2 }, maxRepeat: 1 },
      elementMult: { fire: 1.25, thunder: 1.25 },
      drops: { phantom_cloth: 1 }
    },
    rock_doll: {
      name: '岩人形', hp: [60, 66],
      moves: {
        punch: { name: '岩の拳', dmg: 15 },
        guard: { name: '身構え', block: 16, str: 2 }
      },
      pattern: { type: 'cycle', seq: ['punch', 'punch', 'guard'] },
      elementMult: { thunder: 1.5, fire: 0.75 },
      drops: { mithril_ore: 1 }
    },
    star_dragon: {
      name: '星喰いの竜', hp: [470, 470], boss: true,
      moves: {
        roar:   { name: '咆哮', str: 3, debuff: { s: 'vulnerable', v: 2 } },
        breath: { name: '星の息吹', dmg: 12, hits: 2 },
        claw:   { name: '竜の爪', dmg: 26 },
        wing:   { name: '羽ばたき', dmg: 8, hits: 4 },
        devour: { name: '星喰い', str: 4, heal: 20 }
      },
      pattern: { type: 'cycle', opening: 'roar', seq: ['breath', 'claw', 'wing', 'devour', 'claw'] },
      elementMult: { ice: 1.25 },
      drops: { dragon_scale: 1, star_shard: 2 }
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
    boss_golem:   { name: '【ボス】岩窟の主', enemies: ['golem'], boss: true },
    // 囁きの森
    treant_single:  { name: 'トレント', enemies: ['treant'] },
    hornet_trio:    { name: '大スズメバチ×3', enemies: ['hornet', 'hornet', 'hornet'] },
    wolf_hornet:    { name: '魔狼＋大スズメバチ', enemies: ['wolf', 'hornet'] },
    treant_wolf:    { name: 'トレント＋魔狼', enemies: ['treant', 'wolf'] },
    spider_hornet:  { name: '大蜘蛛＋大スズメバチ×2', enemies: ['spider', 'hornet', 'hornet'] },
    treant_pair:    { name: 'トレント×2', enemies: ['treant', 'treant'] },
    boss_elder:     { name: '【ボス】森の古樹', enemies: ['elder_tree'], boss: true },
    // 霧の沼
    toad_pair:      { name: '毒ガエル×2', enemies: ['toad', 'toad'] },
    wisp_trio:      { name: '鬼火×3', enemies: ['wisp', 'wisp', 'wisp'] },
    slime_toad:     { name: 'スライム＋毒ガエル', enemies: ['slime', 'toad'] },
    toad_wisp:      { name: '毒ガエル＋鬼火×2', enemies: ['toad', 'wisp', 'wisp'] },
    toad_trio:      { name: '毒ガエル×3', enemies: ['toad', 'toad', 'toad'] },
    boss_queen:     { name: '【ボス】沼の女王', enemies: ['marsh_queen'], boss: true },
    // 星降る遺跡
    gargoyle_single:  { name: 'ガーゴイル', enemies: ['gargoyle'] },
    doll_pair:        { name: '岩人形×2', enemies: ['rock_doll', 'rock_doll'] },
    phantom_single:   { name: '亡霊騎士', enemies: ['phantom'] },
    gargoyle_phantom: { name: 'ガーゴイル＋亡霊騎士', enemies: ['gargoyle', 'phantom'] },
    phantom_doll:     { name: '亡霊騎士＋岩人形', enemies: ['phantom', 'rock_doll'] },
    gargoyle_pair:    { name: 'ガーゴイル×2', enemies: ['gargoyle', 'gargoyle'] },
    boss_dragon:      { name: '【ボス】星喰いの竜', enemies: ['star_dragon'], boss: true }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
