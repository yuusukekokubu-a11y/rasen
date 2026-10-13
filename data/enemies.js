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
//   soul    : ボスの魂（超級・地獄級・ボスラッシュ・塔の深い階で、確率で手に入る）
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
      name: '岩窟の主', hp: [240, 240], boss: true, soul: 'golem_soul',
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
      name: '森の古樹', hp: [380, 380], boss: true, soul: 'elder_soul',
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
      name: '沼の女王', hp: [400, 400], boss: true, soul: 'queen_soul',
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
      name: '星喰いの竜', hp: [470, 470], boss: true, soul: 'dragon_soul',
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
    },
    // ===== 灼熱の火山（氷が有効・炎に強い） =====
    salamander: {
      name: '火蜥蜴', hp: [92, 100],
      moves: {
        bite:  { name: '噛みつき', dmg: 19 },
        flame: { name: '火炎', dmg: 9, hits: 2 },
        bask:  { name: '日向ぼっこ', block: 16, str: 2 }
      },
      pattern: { type: 'cycle', seq: ['bite', 'flame', 'bask'] },
      elementMult: { ice: 1.5, fire: 0.5 },
      drops: { fire_scale: 1 }
    },
    magma_slime: {
      name: '溶岩スライム', hp: [104, 112],
      moves: {
        tackle: { name: '体当たり', dmg: 17 },
        erupt:  { name: '噴出', dmg: 11, debuff: { s: 'weak', v: 1 } },
        harden: { name: '冷え固まる', block: 22 }
      },
      pattern: { type: 'random', weights: { tackle: 3, erupt: 2, harden: 1 }, maxRepeat: 2 },
      elementMult: { ice: 1.5, fire: 0.5 },
      drops: { magma_core: 1 }
    },
    fire_imp: {
      name: '火の小鬼', hp: [52, 58],
      moves: {
        jab:  { name: '小突き', dmg: 7, hits: 2 },
        hex:  { name: 'いたずら', dmg: 6, debuff: { s: 'vulnerable', v: 2 } },
        cheer:{ name: 'はやし立てる', allyBlock: 10 }
      },
      pattern: { type: 'random', weights: { jab: 3, hex: 2, cheer: 1 }, maxRepeat: 1 },
      elementMult: { ice: 1.5, fire: 0.5 },
      drops: { imp_horn: 1 }
    },
    lava_golem: {
      name: '溶岩巨人', hp: [146, 156],
      moves: {
        punch: { name: '溶岩の拳', dmg: 25 },
        guard: { name: '岩の守り', block: 24, str: 2 },
        quake: { name: '地揺れ', dmg: 9, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['punch', 'quake', 'guard'] },
      elementMult: { ice: 1.5, fire: 0.5, thunder: 0.75 },
      drops: { magma_core: 1, star_steel: 1 }
    },
    flame_lord: {
      name: '炎帝イフリート', hp: [640, 640], boss: true, soul: 'flame_soul',
      moves: {
        ignite:  { name: '点火', str: 3, block: 20 },
        inferno: { name: '業火', dmg: 13, hits: 2 },
        fist:    { name: '灼熱の拳', dmg: 32 },
        rain:    { name: '火の雨', dmg: 7, hits: 4 },
        brand:   { name: '烙印', dmg: 12, debuff: { s: 'vulnerable', v: 2 } }
      },
      pattern: { type: 'cycle', opening: 'ignite', seq: ['inferno', 'fist', 'brand', 'rain', 'ignite', 'fist'] },
      elementMult: { ice: 1.5, fire: 0.5 },
      drops: { flame_heart: 1, star_steel: 2 }
    },

    // ===== 氷晶の洞（炎が有効・氷に強い） =====
    ice_wolf: {
      name: '氷狼', hp: [88, 96],
      moves: {
        fang:  { name: '氷の牙', dmg: 20 },
        howl:  { name: '凍える遠吠え', str: 3, block: 10 },
        rend:  { name: '噛み裂き', dmg: 10, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['fang', 'rend', 'howl'] },
      elementMult: { fire: 1.5, ice: 0.5 },
      drops: { ice_fang: 1 }
    },
    frost_fairy: {
      name: '氷の妖精', hp: [54, 60],
      moves: {
        shards: { name: '氷のつぶて', dmg: 6, hits: 3 },
        chill:  { name: '冷気', dmg: 6, debuff: { s: 'weak', v: 2 } },
        shield: { name: '氷の盾', allyBlock: 12 }
      },
      pattern: { type: 'random', weights: { shards: 3, chill: 2, shield: 2 }, maxRepeat: 1 },
      elementMult: { fire: 1.5, ice: 0.5 },
      drops: { frost_crystal: 1 }
    },
    yeti: {
      name: '雪男', hp: [136, 146],
      moves: {
        smash: { name: '叩きつけ', dmg: 27 },
        roar:  { name: '雄たけび', str: 4, debuff: { s: 'vulnerable', v: 1 } },
        maul:  { name: '殴打', dmg: 12, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['maul', 'smash', 'roar', 'smash'] },
      elementMult: { fire: 1.5, ice: 0.5 },
      drops: { yeti_fur: 1 }
    },
    crystal_golem: {
      name: '水晶兵', hp: [112, 120],
      moves: {
        guard: { name: '結晶化', block: 28 },
        beam:  { name: '屈折光線', dmg: 21 },
        burst: { name: '破片散弾', dmg: 8, hits: 3 }
      },
      pattern: { type: 'cycle', seq: ['beam', 'guard', 'burst'] },
      elementMult: { fire: 1.25, thunder: 1.5, ice: 0.5 },
      drops: { frost_crystal: 1, moon_silk: 1 }
    },
    ice_queen: {
      name: '氷晶の女王', hp: [620, 620], boss: true, soul: 'ice_soul',
      moves: {
        veil:     { name: '氷のとばり', block: 30, debuff: { s: 'weak', v: 2 } },
        lance:    { name: '氷槍', dmg: 30 },
        blizzard: { name: '吹雪', dmg: 8, hits: 3, debuff: { s: 'vulnerable', v: 1 } },
        mirror:   { name: '氷鏡', str: 3, heal: 30 },
        shatter:  { name: '砕氷', dmg: 14, hits: 2 }
      },
      pattern: { type: 'cycle', opening: 'veil', seq: ['lance', 'blizzard', 'shatter', 'mirror', 'lance', 'veil'] },
      elementMult: { fire: 1.5, ice: 0.5 },
      drops: { ice_heart: 1, moon_silk: 2 }
    },

    // ===== 天空の庭（雷と氷が有効） =====
    harpy: {
      name: 'ハーピー', hp: [96, 104],
      moves: {
        talon: { name: '爪', dmg: 11, hits: 2 },
        gust:  { name: '突風', dmg: 9, debuff: { s: 'weak', v: 2 } },
        soar:  { name: '舞い上がる', block: 18 }
      },
      pattern: { type: 'random', weights: { talon: 3, gust: 2, soar: 1 }, maxRepeat: 2 },
      elementMult: { thunder: 1.5, ice: 1.25 },
      drops: { harpy_feather: 1 }
    },
    griffin: {
      name: 'グリフォン', hp: [150, 162],
      moves: {
        dive:  { name: '急降下', dmg: 30 },
        wing:  { name: '翼打ち', dmg: 10, hits: 3 },
        screech: { name: '威嚇', str: 3, block: 14 }
      },
      pattern: { type: 'cycle', seq: ['wing', 'dive', 'screech'] },
      elementMult: { thunder: 1.5 },
      drops: { griffin_claw: 1 }
    },
    cloud_spirit: {
      name: '雲の精', hp: [84, 92],
      moves: {
        mist:  { name: '霧雲', allyBlock: 16 },
        zap:   { name: '小さな雷', dmg: 15 },
        drizzle: { name: '冷たい雨', dmg: 6, hits: 2, debuff: { s: 'vulnerable', v: 1 } }
      },
      pattern: { type: 'random', weights: { mist: 2, zap: 3, drizzle: 2 }, maxRepeat: 1 },
      elementMult: { fire: 1.5, thunder: 0.5 },
      drops: { cloud_silk: 1 }
    },
    sky_knight: {
      name: '天空騎士', hp: [160, 172],
      moves: {
        lance: { name: '天槍', dmg: 32 },
        guard: { name: '大盾', block: 28 },
        rally: { name: '鼓舞', str: 3, allyBlock: 12 }
      },
      pattern: { type: 'cycle', seq: ['lance', 'guard', 'rally', 'lance'] },
      elementMult: { thunder: 1.25, ice: 1.25 },
      drops: { orichalcum: 1 }
    },
    storm_dragon: {
      name: '嵐の竜王', hp: [860, 860], boss: true, soul: 'storm_soul',
      moves: {
        roar:    { name: '雷鳴', str: 4, debuff: { s: 'vulnerable', v: 2 } },
        lightning: { name: '落雷', dmg: 36 },
        gale:    { name: '暴風', dmg: 10, hits: 4 },
        coil:    { name: '嵐をまとう', block: 40, heal: 30 },
        tail:    { name: '尾の薙ぎ払い', dmg: 18, hits: 2, debuff: { s: 'weak', v: 1 } }
      },
      pattern: { type: 'cycle', opening: 'roar', seq: ['gale', 'lightning', 'tail', 'coil', 'lightning', 'gale'] },
      elementMult: { ice: 1.25, thunder: 0.75 },
      drops: { storm_horn: 1, sun_stone: 2 }
    },

    // ===== 深淵の城（炎と雷が有効） =====
    shadow_soldier: {
      name: '影の兵', hp: [123, 133],
      moves: {
        slash: { name: '影斬り', dmg: 26 },
        fade:  { name: '影にまぎれる', block: 24 },
        twin:  { name: '二連斬', dmg: 13, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['slash', 'twin', 'fade'] },
      elementMult: { fire: 1.25, thunder: 1.25 },
      drops: { shadow_cloth: 1 }
    },
    vampire: {
      name: '吸血鬼', hp: [145, 155],
      moves: {
        drain: { name: '吸血', dmg: 20, heal: 15 },
        bats:  { name: '蝙蝠の群れ', dmg: 8, hits: 3 },
        charm: { name: '魅了', dmg: 8, debuff: { s: 'weak', v: 2 } }
      },
      pattern: { type: 'random', weights: { drain: 3, bats: 2, charm: 1 }, maxRepeat: 1 },
      elementMult: { fire: 1.5, ice: 0.75 },
      drops: { blood_gem: 1 }
    },
    dark_mage: {
      name: '闇の魔導士', hp: [103, 111],
      moves: {
        curse: { name: '呪詛', dmg: 9, debuff: { s: 'vulnerable', v: 2 } },
        bolt:  { name: '闇の雷', dmg: 28 },
        ward:  { name: '闇の結界', allyBlock: 18 }
      },
      pattern: { type: 'cycle', seq: ['curse', 'bolt', 'ward'] },
      elementMult: { thunder: 1.5, fire: 1.25 },
      drops: { dark_bone: 1 }
    },
    death_knight: {
      name: '死の騎士', hp: [195, 208],
      moves: {
        cleave: { name: '死の剣', dmg: 35 },
        guard:  { name: '黒鉄の構え', block: 30, str: 3 },
        reap:   { name: '刈り取り', dmg: 14, hits: 2, debuff: { s: 'weak', v: 1 } }
      },
      pattern: { type: 'cycle', seq: ['reap', 'cleave', 'guard'] },
      elementMult: { fire: 1.25, thunder: 1.25 },
      drops: { dark_bone: 1, adamant: 1 }
    },
    abyss_lord: {
      name: '深淵の王', hp: [1031, 1031], boss: true, soul: 'abyss_soul',
      moves: {
        dark:    { name: '闇の帳', block: 40, debuff: { s: 'weak', v: 2 } },
        smite:   { name: '深淵の一撃', dmg: 41 },
        storm:   { name: '闇の嵐', dmg: 11, hits: 4 },
        devour:  { name: '魂喰い', str: 5, heal: 40 },
        curse:   { name: '滅びの呪い', dmg: 15, hits: 2, debuff: { s: 'vulnerable', v: 2 } }
      },
      pattern: { type: 'cycle', opening: 'dark', seq: ['storm', 'smite', 'curse', 'devour', 'smite', 'storm', 'dark'] },
      elementMult: { fire: 1.25, thunder: 1.25 },
      drops: { abyss_heart: 1, blood_gem: 2 }
    },

    // ===== スペシャルダンジョンの敵（強さはダンジョンの段ごとの倍率で上がる。素材は段ごとの「おまけ」で出る） =====
    ore_beetle: {
      name: '鉱石甲虫', hp: [40, 46],
      moves: {
        bite:   { name: '大あご', dmg: 10 },
        harden: { name: '甲羅にこもる', block: 14 },
        ram:    { name: '体当たり', dmg: 6, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['bite', 'ram', 'harden'] },
      elementMult: { thunder: 1.25, fire: 0.75 },
      drops: {}
    },
    ore_king: {
      name: '甲虫王', hp: [230, 230], boss: true,
      moves: {
        horn:  { name: '角の一撃', dmg: 18 },
        shell: { name: '金の甲羅', block: 30, str: 2 },
        quake: { name: '地響き', dmg: 8, hits: 2 },
        dust:  { name: '金粉', dmg: 6, debuff: { s: 'weak', v: 2 } }
      },
      pattern: { type: 'cycle', opening: 'shell', seq: ['horn', 'quake', 'dust', 'horn', 'shell'] },
      elementMult: { thunder: 1.25, fire: 0.75 },
      drops: {}
    },
    wood_sprite: {
      name: '木霊', hp: [34, 38],
      moves: {
        leaf:  { name: '葉の刃', dmg: 5, hits: 2 },
        bloom: { name: '花の守り', allyBlock: 9 },
        sap:   { name: '樹液', heal: 8, dmg: 6 }
      },
      pattern: { type: 'random', weights: { leaf: 3, bloom: 2, sap: 1 }, maxRepeat: 1 },
      elementMult: { fire: 1.5 },
      drops: {}
    },
    forest_guardian: {
      name: '森の番人', hp: [240, 240], boss: true,
      moves: {
        branch: { name: '大枝', dmg: 20 },
        roots:  { name: '根しばり', dmg: 8, debuff: { s: 'weak', v: 2 } },
        bark:   { name: '樹皮の鎧', block: 28 },
        grow:   { name: '芽吹き', str: 3, heal: 20 }
      },
      pattern: { type: 'cycle', opening: 'bark', seq: ['branch', 'roots', 'grow', 'branch', 'bark'] },
      elementMult: { fire: 1.5, ice: 0.75 },
      drops: {}
    },
    silk_moth: {
      name: '絹蛾', hp: [36, 40],
      moves: {
        dust:    { name: '鱗粉', dmg: 6, debuff: { s: 'weak', v: 1 } },
        flutter: { name: 'はばたき', dmg: 4, hits: 3 }
      },
      pattern: { type: 'random', weights: { dust: 2, flutter: 3 }, maxRepeat: 2 },
      elementMult: { fire: 1.5, thunder: 1.25 },
      drops: {}
    },
    moth_queen: {
      name: '蛾の女王', hp: [220, 220], boss: true,
      moves: {
        scales: { name: '毒の鱗粉', dmg: 7, hits: 3 },
        cocoon: { name: '繭ごもり', block: 26, heal: 15 },
        sting:  { name: '毒針', dmg: 10, debuff: { s: 'vulnerable', v: 2 } },
        gale:   { name: '羽ばたき', dmg: 16 }
      },
      pattern: { type: 'cycle', opening: 'cocoon', seq: ['scales', 'sting', 'gale', 'cocoon'] },
      elementMult: { fire: 1.5, thunder: 1.25 },
      drops: {}
    },
    gold_slime: {
      name: '黄金スライム', hp: [30, 30],
      moves: {
        harden: { name: '金色に光る', block: 22 },
        tackle: { name: '体当たり', dmg: 7 }
      },
      pattern: { type: 'cycle', seq: ['harden', 'tackle'] },
      elementMult: { thunder: 1.5, fire: 0.5, ice: 0.5 },
      drops: {}
    },
    mimic: {
      name: 'ミミック', hp: [50, 56],
      moves: {
        chomp: { name: 'かみつき', dmg: 15 },
        lure:  { name: 'おびき寄せ', block: 10, debuff: { s: 'vulnerable', v: 1 }, dmg: 4 },
        gnash: { name: '歯ぎしり', dmg: 7, hits: 2 }
      },
      pattern: { type: 'cycle', seq: ['lure', 'chomp', 'gnash'] },
      elementMult: { fire: 1.25, thunder: 1.25 },
      drops: {}
    },
    mimic_king: {
      name: '大ミミック', hp: [250, 250], boss: true,
      moves: {
        devour: { name: '丸のみ', dmg: 24 },
        coins:  { name: '金貨の雨', dmg: 5, hits: 4 },
        lid:    { name: 'ふたを閉じる', block: 30, str: 2 },
        greed:  { name: '強欲', dmg: 10, debuff: { s: 'weak', v: 2 } }
      },
      pattern: { type: 'cycle', opening: 'lid', seq: ['devour', 'coins', 'greed', 'devour', 'lid'] },
      elementMult: { fire: 1.25, thunder: 1.25 },
      drops: {}
    },
    chimera: {
      name: 'キメラ', hp: [260, 260], boss: true,
      moves: {
        flame: { name: '火炎の息', dmg: 9, hits: 2 },
        bite:  { name: '獅子の牙', dmg: 22 },
        roar:  { name: '三つの咆哮', str: 3, debuff: { s: 'vulnerable', v: 1 } },
        tail:  { name: '蛇の尾', dmg: 12, debuff: { s: 'weak', v: 1 } }
      },
      pattern: { type: 'cycle', opening: 'roar', seq: ['bite', 'flame', 'tail', 'roar', 'bite'] },
      elementMult: { ice: 1.25 },
      drops: {}
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
    boss_dragon:      { name: '【ボス】星喰いの竜', enemies: ['star_dragon'], boss: true },
    // 灼熱の火山
    salamander_single: { name: '火蜥蜴', enemies: ['salamander'] },
    imp_trio:          { name: '火の小鬼×3', enemies: ['fire_imp', 'fire_imp', 'fire_imp'] },
    magma_pair:        { name: '溶岩スライム×2', enemies: ['magma_slime', 'magma_slime'] },
    salamander_imp:    { name: '火蜥蜴＋火の小鬼', enemies: ['salamander', 'fire_imp'] },
    golem_imp:         { name: '溶岩巨人＋火の小鬼', enemies: ['lava_golem', 'fire_imp'] },
    salamander_pair:   { name: '火蜥蜴×2', enemies: ['salamander', 'salamander'] },
    lava_golem_single: { name: '溶岩巨人', enemies: ['lava_golem'] },
    boss_flame:        { name: '【ボス】炎帝イフリート', enemies: ['flame_lord'], boss: true },
    // 氷晶の洞
    ice_wolf_single:   { name: '氷狼', enemies: ['ice_wolf'] },
    fairy_trio:        { name: '氷の妖精×3', enemies: ['frost_fairy', 'frost_fairy', 'frost_fairy'] },
    ice_wolf_fairy:    { name: '氷狼＋氷の妖精', enemies: ['ice_wolf', 'frost_fairy'] },
    yeti_single:       { name: '雪男', enemies: ['yeti'] },
    crystal_fairy:     { name: '水晶兵＋氷の妖精', enemies: ['crystal_golem', 'frost_fairy'] },
    ice_wolf_pair:     { name: '氷狼×2', enemies: ['ice_wolf', 'ice_wolf'] },
    yeti_crystal:      { name: '雪男＋水晶兵', enemies: ['yeti', 'crystal_golem'] },
    boss_ice:          { name: '【ボス】氷晶の女王', enemies: ['ice_queen'], boss: true },
    // 天空の庭
    harpy_pair:        { name: 'ハーピー×2', enemies: ['harpy', 'harpy'] },
    griffin_single:    { name: 'グリフォン', enemies: ['griffin'] },
    cloud_harpy:       { name: '雲の精＋ハーピー', enemies: ['cloud_spirit', 'harpy'] },
    knight_cloud:      { name: '天空騎士＋雲の精', enemies: ['sky_knight', 'cloud_spirit'] },
    harpy_trio:        { name: 'ハーピー×3', enemies: ['harpy', 'harpy', 'harpy'] },
    griffin_harpy:     { name: 'グリフォン＋ハーピー', enemies: ['griffin', 'harpy'] },
    knight_pair:       { name: '天空騎士×2', enemies: ['sky_knight', 'sky_knight'] },
    boss_storm:        { name: '【ボス】嵐の竜王', enemies: ['storm_dragon'], boss: true },
    // 深淵の城
    shadow_pair:       { name: '影の兵×2', enemies: ['shadow_soldier', 'shadow_soldier'] },
    vampire_single:    { name: '吸血鬼', enemies: ['vampire'] },
    mage_shadow:       { name: '闇の魔導士＋影の兵', enemies: ['dark_mage', 'shadow_soldier'] },
    vampire_mage:      { name: '吸血鬼＋闇の魔導士', enemies: ['vampire', 'dark_mage'] },
    knight_single:     { name: '死の騎士', enemies: ['death_knight'] },
    knight_mage:       { name: '死の騎士＋闇の魔導士', enemies: ['death_knight', 'dark_mage'] },
    shadow_trio:       { name: '影の兵×3', enemies: ['shadow_soldier', 'shadow_soldier', 'shadow_soldier'] },
    boss_abyss:        { name: '【ボス】深淵の王', enemies: ['abyss_lord'], boss: true },
    // スペシャルダンジョン
    beetle_pair:       { name: '鉱石甲虫×2', enemies: ['ore_beetle', 'ore_beetle'] },
    beetle_trio:       { name: '鉱石甲虫×3', enemies: ['ore_beetle', 'ore_beetle', 'ore_beetle'] },
    beetle_doll:       { name: '鉱石甲虫＋岩人形', enemies: ['ore_beetle', 'rock_doll'] },
    boss_ore:          { name: '【ボス】甲虫王', enemies: ['ore_king'], boss: true },
    sprite_trio:       { name: '木霊×3', enemies: ['wood_sprite', 'wood_sprite', 'wood_sprite'] },
    sprite_treant:     { name: '木霊＋トレント', enemies: ['wood_sprite', 'treant'] },
    sprite_pair:       { name: '木霊×2', enemies: ['wood_sprite', 'wood_sprite'] },
    boss_guardian:     { name: '【ボス】森の番人', enemies: ['forest_guardian'], boss: true },
    moth_trio:         { name: '絹蛾×3', enemies: ['silk_moth', 'silk_moth', 'silk_moth'] },
    moth_spider:       { name: '絹蛾＋大蜘蛛', enemies: ['silk_moth', 'spider'] },
    moth_pair:         { name: '絹蛾×2', enemies: ['silk_moth', 'silk_moth'] },
    boss_moth:         { name: '【ボス】蛾の女王', enemies: ['moth_queen'], boss: true },
    gold_pair:         { name: '黄金スライム×2', enemies: ['gold_slime', 'gold_slime'] },
    mimic_single:      { name: 'ミミック', enemies: ['mimic'] },
    mimic_gold:        { name: 'ミミック＋黄金スライム', enemies: ['mimic', 'gold_slime'] },
    mimic_pair:        { name: 'ミミック×2', enemies: ['mimic', 'mimic'] },
    boss_mimic:        { name: '【ボス】大ミミック', enemies: ['mimic_king'], boss: true },
    boss_chimera:      { name: '【ボス】キメラ', enemies: ['chimera'], boss: true },
    // 強化版（螺旋の塔の深い階）
    s_wolf_pair:       { name: '強・魔狼×2', enemies: ['wolf_s', 'wolf_s'] },
    s_spider_wolf:     { name: '強・大蜘蛛＋強・魔狼', enemies: ['spider_s', 'wolf_s'] },
    s_gargoyle_phantom:{ name: '強・ガーゴイル＋強・亡霊騎士', enemies: ['gargoyle_s', 'phantom_s'] },
    s_salamander_pair: { name: '強・火蜥蜴×2', enemies: ['salamander_s', 'salamander_s'] },
    s_yeti_single:     { name: '強・雪男', enemies: ['yeti_s'] },
    s_griffin_single:  { name: '強・グリフォン', enemies: ['griffin_s'] },
    s_vampire_single:  { name: '強・吸血鬼', enemies: ['vampire_s'] },
    x_wolf_pair:       { name: '極・魔狼×2', enemies: ['wolf_x', 'wolf_x'] },
    x_knight_phantom:  { name: '極・死の騎士＋極・亡霊騎士', enemies: ['death_knight_x', 'phantom_x'] },
    x_vampire_mage:    { name: '極・吸血鬼＋極・闇の魔導士', enemies: ['vampire_x', 'dark_mage_x'] },
    x_sky_knight_pair: { name: '極・天空騎士×2', enemies: ['sky_knight_x', 'sky_knight_x'] },
    x_golem_single:    { name: '極・溶岩巨人', enemies: ['lava_golem_x'] }
  };

  // 強化版の敵：もとの敵の姿と行動を使い回し、数値だけ上げる（名前は「強・魔狼」のように頭に付く）
  //   hp : HP（と回復）の倍率   dmg : 攻撃・ブロック・攻撃力アップの倍率
  //   rim / eye : 影絵の縁の光と目の色（data/silhouettes.js で使う）
  R.DATA.enemyVariants = {
    wolf_s:         { base: 'wolf',         rank: '強', hp: 2.35, dmg: 1.8, rim: '#ff3a5a', eye: '#ffffff' },
    spider_s:       { base: 'spider',       rank: '強', hp: 2.95, dmg: 2.15, rim: '#c84aff', eye: '#ffe07a' },
    gargoyle_s:     { base: 'gargoyle',     rank: '強', hp: 1.8, dmg: 1.5, rim: '#ff7a3a', eye: '#fff27a' },
    phantom_s:      { base: 'phantom',      rank: '強', hp: 1.8, dmg: 1.5, rim: '#ff5a8a', eye: '#ffffff' },
    salamander_s:   { base: 'salamander',   rank: '強', hp: 1.45, dmg: 1.25, rim: '#5ad8ff', eye: '#ffffff' },
    yeti_s:         { base: 'yeti',         rank: '強', hp: 1.8, dmg: 1.45, rim: '#ff8a5a', eye: '#ff3a2a' },
    griffin_s:      { base: 'griffin',      rank: '強', hp: 1.6, dmg: 1.35, rim: '#7affc8', eye: '#ffffff' },
    vampire_s:      { base: 'vampire',      rank: '強', hp: 2.35, dmg: 1.8, rim: '#ffd04a', eye: '#ff2a3a' },
    wolf_x:         { base: 'wolf',         rank: '極', hp: 2.5, dmg: 1.9, rim: '#ffe07a', eye: '#ff2a2a' },
    phantom_x:      { base: 'phantom',      rank: '極', hp: 1.95, dmg: 1.55, rim: '#ff3a3a', eye: '#ffe07a' },
    death_knight_x: { base: 'death_knight', rank: '極', hp: 1.55, dmg: 1.35, rim: '#ffa82a', eye: '#ffffff' },
    vampire_x:      { base: 'vampire',      rank: '極', hp: 2.55, dmg: 1.95, rim: '#e8e0ff', eye: '#ff2a3a' },
    dark_mage_x:    { base: 'dark_mage',    rank: '極', hp: 1.3, dmg: 1.2, rim: '#5aff8a', eye: '#ffffff' },
    sky_knight_x:   { base: 'sky_knight',   rank: '極', hp: 1.85, dmg: 1.5, rim: '#ff5aff', eye: '#ffffff' },
    lava_golem_x:   { base: 'lava_golem',   rank: '極', hp: 2.2, dmg: 1.7, rim: '#ffffff', eye: '#ff3a2a' }
  };
  for (const [id, v] of Object.entries(R.DATA.enemyVariants)) {
    const b = R.DATA.enemies[v.base];
    const up = (n, k) => Math.round(n * k);
    const moves = {};
    for (const [mk, m] of Object.entries(b.moves)) {
      const c = Object.assign({}, m);
      for (const key of ['dmg', 'block', 'str', 'allyBlock']) if (c[key]) c[key] = up(c[key], v.dmg);
      if (c.heal) c.heal = up(c.heal, v.hp);
      moves[mk] = c;
    }
    R.DATA.enemies[id] = Object.assign({}, b, {
      name: `${v.rank}・${b.name}`, hp: b.hp.map(n => up(n, v.hp)), moves, variantOf: v.base, soul: undefined
    });
  }
})(globalThis.RASEN = globalThis.RASEN || {});
