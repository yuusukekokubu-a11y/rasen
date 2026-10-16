// ダンジョン
//   requires : 開くために先にクリアが必要なダンジョン（すべてクリアで開く）
//   rank     : そのダンジョンの基準になる装備ランク（ステージの推奨ランクの目安）
//   recommend: 一覧に出す目安（推奨ランク・有効な属性）
//   floors   : 4階層。1階につき1戦（battles=[最少, 最多]）。4階はボスだけ
//              encounters は data/enemies.js の encounters の重み付き抽選
//              scale は敵のHP・攻撃力の倍率
//   rewards  : 戦闘後の報酬（ランダムに3つ提示されて1つ選ぶ）
//   gather   : 採掘・伐採・採取の中身（階ごと）
//     hardness : 岩や木の硬さ（採掘Lv・伐採Lvと拮抗）
//     common   : ふつうに手に入る素材の重み / rare : レア素材の重み
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.dungeons = {
    cave: {
      rank: 1,
      name: '岩窟の洞', requires: [],
      recommend: '推奨ランク1〜2・雷が有効',
      floors: [
        { battles: [1, 1], encounters: { slime_pair: 3, bat_trio: 2, wolf_single: 2 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [1, 1], encounters: { wolf_slime: 2, spider_bat: 2, wolf_single: 1 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [1, 1], encounters: { wolf_pair: 2, spider_pair: 2, spider_bat: 1 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.08, dmg: 1.13 }, boss: 'boss_golem' }
      ],
      rewards: {
        weights: { mining: 3, logging: 3, gathering: 3, treasure: 2, rest: 2 },
        restHealRatio: 0.35 // 休憩：最大HPの35%回復
      },
      gather: {
        mining: [
          { hardness: 1,  common: { copper_ore: 1 },               rare: { quartz: 1 } },
          { hardness: 4,  common: { copper_ore: 1, iron_ore: 2 },  rare: { quartz: 1 } },
          { hardness: 8,  common: { iron_ore: 2, mithril_ore: 1 }, rare: { quartz: 1, mithril_ore: 1 } },
          { hardness: 12, common: { iron_ore: 1, mithril_ore: 2 }, rare: { star_shard: 1 } }
        ],
        logging: [
          { hardness: 1,  common: { oak: 1 },                    rare: { maple: 1 } },
          { hardness: 4,  common: { oak: 1, maple: 2 },          rare: { glowcap: 1 } },
          { hardness: 8,  common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
          { hardness: 12, common: { maple: 1, ancient_wood: 2 }, rare: { star_shard: 1 } }
        ],
        // 採取（ミニゲームなし）：amount 個をランダムに拾う
        gathering: [
          { amount: [2, 3], table: { flax: 3, herb: 3, quartz: 1 } },
          { amount: [2, 3], table: { flax: 3, herb: 2, glowcap: 1, quartz: 1 } },
          { amount: [2, 4], table: { flax: 2, herb: 2, glowcap: 2, quartz: 1 } },
          { amount: [2, 4], table: { flax: 2, glowcap: 2, quartz: 1, star_shard: 1 } }
        ],
        // 宝箱：amount 個をランダムに
        treasure: [
          { amount: [2, 3], table: { copper_ore: 2, oak: 2, flax: 2, quartz: 2, iron_ore: 1 } },
          { amount: [2, 3], table: { iron_ore: 2, maple: 2, quartz: 2, spider_silk: 1, wolf_pelt: 1 } },
          { amount: [3, 4], table: { iron_ore: 2, maple: 2, mithril_ore: 1, ancient_wood: 1, quartz: 2 } },
          { amount: [3, 4], table: { mithril_ore: 2, ancient_wood: 2, star_shard: 1, quartz: 2 } }
        ]
      }
    },

    forest: {
      rank: 2,
      name: '囁きの森', requires: ['cave'],
      recommend: '推奨ランク2・炎が有効',
      floors: [
        { battles: [1, 1], encounters: { hornet_trio: 2, wolf_hornet: 2, treant_single: 2 }, scale: { hp: 1.2, dmg: 1.2 } },
        { battles: [1, 1], encounters: { treant_wolf: 2, spider_hornet: 2, wolf_hornet: 1 }, scale: { hp: 1.2, dmg: 1.2 } },
        { battles: [1, 1], encounters: { treant_pair: 2, spider_hornet: 2, treant_wolf: 1 }, scale: { hp: 1.25, dmg: 1.25 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.25, dmg: 1.25 }, boss: 'boss_elder' }
      ],
      rewards: { weights: { mining: 2, logging: 4, gathering: 3, treasure: 2, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 4,  common: { copper_ore: 1, iron_ore: 1 }, rare: { quartz: 1 } },
          { hardness: 6,  common: { iron_ore: 2 },                rare: { quartz: 1 } },
          { hardness: 8,  common: { iron_ore: 2, mithril_ore: 1 }, rare: { mithril_ore: 1 } },
          { hardness: 10, common: { iron_ore: 1, mithril_ore: 1 }, rare: { star_shard: 1 } }
        ],
        logging: [
          { hardness: 4,  common: { oak: 1, maple: 2 },          rare: { glowcap: 1 } },
          { hardness: 6,  common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
          { hardness: 8,  common: { maple: 1, ancient_wood: 2 }, rare: { treant_bark: 1 } },
          { hardness: 10, common: { ancient_wood: 2 },           rare: { star_shard: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { herb: 3, flax: 2, glowcap: 1 } },
          { amount: [2, 3], table: { herb: 2, glowcap: 2, flax: 1 } },
          { amount: [2, 4], table: { herb: 2, glowcap: 2, hornet_sting: 1 } },
          { amount: [2, 4], table: { glowcap: 2, herb: 1, star_shard: 1 } }
        ],
        treasure: [
          { amount: [2, 3], table: { maple: 2, iron_ore: 2, wolf_pelt: 1, quartz: 1 } },
          { amount: [2, 3], table: { maple: 2, ancient_wood: 1, spider_silk: 1, quartz: 2 } },
          { amount: [3, 4], table: { ancient_wood: 2, mithril_ore: 1, treant_bark: 1, quartz: 1 } },
          { amount: [3, 4], table: { ancient_wood: 2, mithril_ore: 1, star_shard: 1, elder_heart: 1 } }
        ]
      }
    },

    marsh: {
      rank: 2,
      name: '霧の沼', requires: ['cave'],
      recommend: '推奨ランク2・雷が有効',
      floors: [
        { battles: [1, 1], encounters: { toad_pair: 2, slime_toad: 2, wisp_trio: 1 }, scale: { hp: 1.23, dmg: 1.23 } },
        { battles: [1, 1], encounters: { toad_wisp: 2, wisp_trio: 2, slime_toad: 1 }, scale: { hp: 1.23, dmg: 1.23 } },
        { battles: [1, 1], encounters: { toad_trio: 2, toad_wisp: 2 }, scale: { hp: 1.29, dmg: 1.29 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.29, dmg: 1.29 }, boss: 'boss_queen' }
      ],
      rewards: { weights: { mining: 2, logging: 2, gathering: 4, treasure: 2, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 4,  common: { iron_ore: 1, copper_ore: 1 }, rare: { quartz: 1 } },
          { hardness: 6,  common: { iron_ore: 2 },                rare: { quartz: 1 } },
          { hardness: 8,  common: { iron_ore: 1, mithril_ore: 1 }, rare: { mithril_ore: 1 } },
          { hardness: 10, common: { mithril_ore: 2 },             rare: { star_shard: 1 } }
        ],
        logging: [
          { hardness: 4,  common: { oak: 1, maple: 1 },  rare: { glowcap: 1 } },
          { hardness: 6,  common: { maple: 2 },          rare: { glowcap: 1 } },
          { hardness: 8,  common: { maple: 1, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
          { hardness: 10, common: { ancient_wood: 2 },   rare: { star_shard: 1 } }
        ],
        gathering: [
          { amount: [2, 4], table: { herb: 2, flax: 2, glowcap: 2 } },
          { amount: [2, 4], table: { herb: 2, glowcap: 2, toad_skin: 1 } },
          { amount: [3, 4], table: { glowcap: 3, herb: 1, wisp_flame: 1 } },
          { amount: [3, 4], table: { glowcap: 2, wisp_flame: 1, star_shard: 1 } }
        ],
        treasure: [
          { amount: [2, 3], table: { iron_ore: 2, flax: 2, spider_silk: 1, quartz: 1 } },
          { amount: [2, 3], table: { iron_ore: 2, spider_silk: 2, quartz: 2 } },
          { amount: [3, 4], table: { mithril_ore: 1, spider_silk: 2, wisp_flame: 1, quartz: 1 } },
          { amount: [3, 4], table: { mithril_ore: 2, spider_silk: 1, star_shard: 1, queen_scale: 1 } }
        ]
      }
    },

    shore: {
      rank: 2,
      name: '潮騒の洞', requires: ['marsh'],
      recommend: '推奨ランク2〜3・雷が有効',
      floors: [
        { battles: [1, 1], encounters: { crab_single: 2, jelly_trio: 2, fishman_pair: 1 }, scale: { hp: 1.25, dmg: 1.25 } },
        { battles: [1, 1], encounters: { crab_jelly: 2, fishman_pair: 2, jelly_trio: 1 }, scale: { hp: 1.25, dmg: 1.25 } },
        { battles: [1, 1], encounters: { fishman_jelly: 2, crab_fishman: 2 }, scale: { hp: 1.32, dmg: 1.32 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.32, dmg: 1.32 }, boss: 'boss_kraken' }
      ],
      rewards: { weights: { mining: 3, logging: 2, gathering: 3, treasure: 3, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 4,  common: { iron_ore: 2 },                 rare: { sea_pearl: 1 } },
          { hardness: 6,  common: { iron_ore: 2, mithril_ore: 1 }, rare: { quartz: 1 } },
          { hardness: 8,  common: { mithril_ore: 2 },              rare: { sea_pearl: 1 } },
          { hardness: 10, common: { mithril_ore: 2, iron_ore: 1 }, rare: { star_shard: 1 } }
        ],
        logging: [
          { hardness: 4,  common: { maple: 2 },                    rare: { herb: 1 } },
          { hardness: 6,  common: { maple: 2, ancient_wood: 1 },   rare: { glowcap: 1 } },
          { hardness: 8,  common: { ancient_wood: 2 },             rare: { sea_pearl: 1 } },
          { hardness: 10, common: { ancient_wood: 2 },             rare: { star_shard: 1 } }
        ],
        gathering: [
          { amount: [2, 4], table: { herb: 2, flax: 2, jelly_gel: 1 } },
          { amount: [2, 4], table: { herb: 2, glowcap: 1, sea_pearl: 1 } },
          { amount: [3, 4], table: { glowcap: 2, jelly_gel: 1, sea_pearl: 1 } },
          { amount: [3, 4], table: { glowcap: 2, sea_pearl: 1, star_shard: 1 } }
        ],
        treasure: [
          { amount: [2, 3], table: { iron_ore: 2, spider_silk: 1, sea_pearl: 1, crab_shell: 1 } },
          { amount: [2, 3], table: { iron_ore: 1, mithril_ore: 1, fish_scale: 1, quartz: 2 } },
          { amount: [3, 4], table: { mithril_ore: 2, ancient_wood: 1, sea_pearl: 1, crab_shell: 1 } },
          { amount: [3, 4], table: { mithril_ore: 2, spider_silk: 1, star_shard: 1, kraken_ink: 1 } }
        ]
      }
    },

    ruins: {
      rank: 3,
      name: '星降る遺跡', requires: ['forest', 'marsh'],
      recommend: '推奨ランク3・雷が有効',
      floors: [
        { battles: [1, 1], encounters: { gargoyle_single: 2, doll_pair: 2, phantom_single: 2 }, scale: { hp: 0.99, dmg: 0.99 } },
        { battles: [1, 1], encounters: { gargoyle_phantom: 2, phantom_doll: 2, doll_pair: 1 }, scale: { hp: 0.99, dmg: 0.99 } },
        { battles: [1, 1], encounters: { gargoyle_pair: 2, gargoyle_phantom: 2, phantom_doll: 1 }, scale: { hp: 1.04, dmg: 1.04 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.04, dmg: 1.04 }, boss: 'boss_dragon' }
      ],
      rewards: { weights: { mining: 4, logging: 2, gathering: 2, treasure: 3, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 8,  common: { iron_ore: 1, mithril_ore: 1 }, rare: { star_shard: 1 } },
          { hardness: 10, common: { mithril_ore: 2 },              rare: { star_shard: 1 } },
          { hardness: 12, common: { mithril_ore: 2, quartz: 1 },   rare: { star_shard: 1 } },
          { hardness: 14, common: { mithril_ore: 2 },              rare: { gargoyle_stone: 1 } }
        ],
        logging: [
          { hardness: 8,  common: { ancient_wood: 1, maple: 1 }, rare: { ancient_wood: 1 } },
          { hardness: 10, common: { ancient_wood: 2 },           rare: { star_shard: 1 } },
          { hardness: 12, common: { ancient_wood: 2 },           rare: { star_shard: 1 } },
          { hardness: 14, common: { ancient_wood: 2 },           rare: { elder_heart: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { glowcap: 2, quartz: 2, herb: 1 } },
          { amount: [2, 3], table: { glowcap: 2, quartz: 2, star_shard: 1 } },
          { amount: [2, 4], table: { quartz: 2, star_shard: 1, phantom_cloth: 1 } },
          { amount: [2, 4], table: { quartz: 2, star_shard: 2, phantom_cloth: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { mithril_ore: 2, ancient_wood: 2, quartz: 2, star_shard: 1 } },
          { amount: [3, 4], table: { mithril_ore: 2, star_shard: 1, elder_heart: 1, queen_scale: 1 } },
          { amount: [3, 4], table: { mithril_ore: 2, star_shard: 2, gargoyle_stone: 1, phantom_cloth: 1 } },
          { amount: [3, 5], table: { star_shard: 2, elder_heart: 1, queen_scale: 1, dragon_scale: 1 } }
        ]
      }
    },

    // 無限階層（エンドコンテンツ）：4階ごとにボス。倒すたびに「帰還／さらに潜る」を選ぶ。毎回1階から
    volcano: {
      rank: 4,
      name: '灼熱の火山', requires: ['ruins'],
      recommend: '推奨ランク4・氷が有効',
      floors: [
        { battles: [1, 1], encounters: { salamander_single: 2, imp_trio: 2, magma_pair: 1 }, scale: { hp: 1.07, dmg: 1.07 } },
        { battles: [1, 1], encounters: { salamander_imp: 2, magma_pair: 2, lava_golem_single: 1 }, scale: { hp: 1.07, dmg: 1.07 } },
        { battles: [1, 1], encounters: { golem_imp: 2, salamander_pair: 2, salamander_imp: 1 }, scale: { hp: 1.12, dmg: 1.12 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.12, dmg: 1.12 }, boss: 'boss_flame' }
      ],
      rewards: { weights: { mining: 4, logging: 2, gathering: 2, treasure: 3, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 14, common: { mithril_ore: 2, star_steel: 1 }, rare: { star_shard: 1 } },
          { hardness: 16, common: { star_steel: 2 },                 rare: { star_shard: 1 } },
          { hardness: 18, common: { star_steel: 2, mithril_ore: 1 }, rare: { magma_core: 1 } },
          { hardness: 20, common: { star_steel: 2 },                 rare: { orichalcum: 1 } }
        ],
        logging: [
          { hardness: 14, common: { ancient_wood: 2, world_wood: 1 }, rare: { glowcap: 1 } },
          { hardness: 16, common: { world_wood: 2 },                  rare: { star_shard: 1 } },
          { hardness: 18, common: { world_wood: 2 },                  rare: { world_wood: 1 } },
          { hardness: 20, common: { world_wood: 2 },                  rare: { sky_wood: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { herb: 2, glowcap: 2, quartz: 1 } },
          { amount: [2, 3], table: { glowcap: 2, quartz: 2, moon_silk: 1 } },
          { amount: [2, 4], table: { glowcap: 1, moon_silk: 2, star_shard: 1 } },
          { amount: [2, 4], table: { moon_silk: 2, star_shard: 1, imp_horn: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { star_steel: 2, world_wood: 1, quartz: 2, fire_scale: 1 } },
          { amount: [3, 4], table: { star_steel: 2, moon_silk: 1, star_shard: 1, imp_horn: 1 } },
          { amount: [3, 4], table: { star_steel: 2, world_wood: 2, magma_core: 1, star_shard: 1 } },
          { amount: [3, 5], table: { star_steel: 2, world_wood: 1, moon_silk: 1, orichalcum: 1 } }
        ]
      }
    },

    glacier: {
      rank: 4,
      name: '氷晶の洞', requires: ['ruins'],
      recommend: '推奨ランク4・炎が有効',
      floors: [
        { battles: [1, 1], encounters: { ice_wolf_single: 2, fairy_trio: 2, ice_wolf_fairy: 1 }, scale: { hp: 1.27, dmg: 1.27 } },
        { battles: [1, 1], encounters: { ice_wolf_fairy: 2, yeti_single: 2, crystal_fairy: 1 }, scale: { hp: 1.27, dmg: 1.27 } },
        { battles: [1, 1], encounters: { crystal_fairy: 2, ice_wolf_pair: 2, yeti_single: 1 }, scale: { hp: 1.33, dmg: 1.33 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.33, dmg: 1.33 }, boss: 'boss_ice' }
      ],
      rewards: { weights: { mining: 3, logging: 2, gathering: 3, treasure: 3, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 14, common: { mithril_ore: 2, star_steel: 1 }, rare: { frost_crystal: 1 } },
          { hardness: 16, common: { star_steel: 2 },                 rare: { frost_crystal: 1 } },
          { hardness: 18, common: { star_steel: 2, quartz: 1 },      rare: { star_shard: 1 } },
          { hardness: 20, common: { star_steel: 2 },                 rare: { orichalcum: 1 } }
        ],
        logging: [
          { hardness: 14, common: { ancient_wood: 2, world_wood: 1 }, rare: { glowcap: 1 } },
          { hardness: 16, common: { world_wood: 2 },                  rare: { frost_crystal: 1 } },
          { hardness: 18, common: { world_wood: 2 },                  rare: { world_wood: 1 } },
          { hardness: 20, common: { world_wood: 2 },                  rare: { sky_wood: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { herb: 2, glowcap: 2, moon_silk: 1 } },
          { amount: [2, 3], table: { glowcap: 1, moon_silk: 2, quartz: 1 } },
          { amount: [2, 4], table: { moon_silk: 2, frost_crystal: 1, glowcap: 1 } },
          { amount: [2, 4], table: { moon_silk: 2, star_shard: 1, cloud_silk: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { star_steel: 1, moon_silk: 2, quartz: 2, ice_fang: 1 } },
          { amount: [3, 4], table: { moon_silk: 2, world_wood: 1, frost_crystal: 1, yeti_fur: 1 } },
          { amount: [3, 4], table: { moon_silk: 2, star_steel: 1, star_shard: 1, frost_crystal: 1 } },
          { amount: [3, 5], table: { moon_silk: 2, star_steel: 1, world_wood: 1, cloud_silk: 1 } }
        ]
      }
    },

    desert: {
      rank: 4,
      name: '砂塵の墓所', requires: ['ruins'],
      recommend: '推奨ランク4・炎が有効',
      floors: [
        { battles: [1, 1], encounters: { scorpion_single: 2, mummy_pair: 2, scorpion_mummy: 1 }, scale: { hp: 1.11, dmg: 1.11 } },
        { battles: [1, 1], encounters: { scorpion_mummy: 2, worm_single: 2, scorpion_pair: 1 }, scale: { hp: 1.11, dmg: 1.11 } },
        { battles: [1, 1], encounters: { worm_scorpion: 2, mummy_pair: 2, scorpion_pair: 1 }, scale: { hp: 1.16, dmg: 1.16 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.16, dmg: 1.16 }, boss: 'boss_pharaoh' }
      ],
      rewards: { weights: { mining: 4, logging: 2, gathering: 2, treasure: 3, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 14, common: { mithril_ore: 2, star_steel: 1 }, rare: { sand_gold: 1 } },
          { hardness: 16, common: { star_steel: 2 },                 rare: { sand_gold: 1 } },
          { hardness: 18, common: { star_steel: 2, mithril_ore: 1 }, rare: { star_shard: 1 } },
          { hardness: 20, common: { star_steel: 2 },                 rare: { orichalcum: 1 } }
        ],
        logging: [
          { hardness: 14, common: { ancient_wood: 2, world_wood: 1 }, rare: { herb: 1 } },
          { hardness: 16, common: { world_wood: 2 },                  rare: { sand_gold: 1 } },
          { hardness: 18, common: { world_wood: 2 },                  rare: { world_wood: 1 } },
          { hardness: 20, common: { world_wood: 2 },                  rare: { sky_wood: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { herb: 2, glowcap: 1, mummy_wrap: 1 } },
          { amount: [2, 3], table: { glowcap: 2, quartz: 1, moon_silk: 1 } },
          { amount: [2, 4], table: { moon_silk: 2, sand_gold: 1, star_shard: 1 } },
          { amount: [2, 4], table: { moon_silk: 2, sand_gold: 1, mummy_wrap: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { star_steel: 2, sand_gold: 2, quartz: 1, scorpion_tail: 1 } },
          { amount: [3, 4], table: { star_steel: 1, world_wood: 1, sand_gold: 1, mummy_wrap: 1 } },
          { amount: [3, 4], table: { star_steel: 2, moon_silk: 1, sand_gold: 1, worm_fang: 1 } },
          { amount: [3, 5], table: { star_steel: 2, sand_gold: 2, world_wood: 1, orichalcum: 1 } }
        ]
      }
    },

    skygarden: {
      rank: 5,
      name: '天空の庭', requires: ['volcano', 'glacier'],
      recommend: '推奨ランク4〜5・雷が有効',
      floors: [
        { battles: [1, 1], encounters: { harpy_pair: 2, griffin_single: 2, cloud_harpy: 1 }, scale: { hp: 1.14, dmg: 1.14 } },
        { battles: [1, 1], encounters: { cloud_harpy: 2, knight_cloud: 2, harpy_trio: 1 }, scale: { hp: 1.14, dmg: 1.14 } },
        { battles: [1, 1], encounters: { griffin_harpy: 2, knight_cloud: 2, harpy_trio: 1 }, scale: { hp: 1.2, dmg: 1.2 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.2, dmg: 1.2 }, boss: 'boss_storm' }
      ],
      rewards: { weights: { mining: 3, logging: 3, gathering: 3, treasure: 3, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
          { hardness: 20, common: { orichalcum: 2 },                rare: { sun_stone: 1 } },
          { hardness: 22, common: { orichalcum: 2, star_steel: 1 }, rare: { sun_stone: 1 } },
          { hardness: 24, common: { orichalcum: 2 },                rare: { adamant: 1 } }
        ],
        logging: [
          { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { harpy_feather: 1 } },
          { hardness: 20, common: { sky_wood: 2 },                rare: { sun_stone: 1 } },
          { hardness: 22, common: { sky_wood: 2, world_wood: 1 }, rare: { sky_wood: 1 } },
          { hardness: 24, common: { sky_wood: 2 },                rare: { ebony: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { glowcap: 2, moon_silk: 2, cloud_silk: 1 } },
          { amount: [2, 3], table: { moon_silk: 1, cloud_silk: 2, quartz: 1 } },
          { amount: [2, 4], table: { cloud_silk: 2, sun_stone: 1, glowcap: 1 } },
          { amount: [2, 4], table: { cloud_silk: 2, sun_stone: 1, void_silk: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { orichalcum: 1, sky_wood: 1, cloud_silk: 1, sun_stone: 1, harpy_feather: 1 } },
          { amount: [3, 4], table: { orichalcum: 2, sky_wood: 1, cloud_silk: 1, griffin_claw: 1 } },
          { amount: [3, 4], table: { orichalcum: 1, sky_wood: 2, cloud_silk: 2, sun_stone: 1 } },
          { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, adamant: 1 } }
        ]
      }
    },

    peak: {
      rank: 5,
      name: '雷鳴の峰', requires: ['volcano', 'glacier'],
      recommend: '推奨ランク5・氷が有効',
      floors: [
        { battles: [1, 1], encounters: { tbird_pair: 2, tgolem_single: 2, wyvern_single: 1 }, scale: { hp: 1.14, dmg: 1.14 } },
        { battles: [1, 1], encounters: { wyvern_tbird: 2, tgolem_single: 2, tbird_trio: 1 }, scale: { hp: 1.14, dmg: 1.14 } },
        { battles: [1, 1], encounters: { tgolem_tbird: 2, wyvern_tbird: 2, tbird_trio: 1 }, scale: { hp: 1.2, dmg: 1.2 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.2, dmg: 1.2 }, boss: 'boss_raiju' }
      ],
      rewards: { weights: { mining: 4, logging: 3, gathering: 2, treasure: 3, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { thunder_stone: 1 } },
          { hardness: 20, common: { orichalcum: 2 },                rare: { thunder_stone: 1 } },
          { hardness: 22, common: { orichalcum: 2, star_steel: 1 }, rare: { sun_stone: 1 } },
          { hardness: 24, common: { orichalcum: 2 },                rare: { adamant: 1 } }
        ],
        logging: [
          { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { thunder_feather: 1 } },
          { hardness: 20, common: { sky_wood: 2 },                rare: { thunder_stone: 1 } },
          { hardness: 22, common: { sky_wood: 2, world_wood: 1 }, rare: { sky_wood: 1 } },
          { hardness: 24, common: { sky_wood: 2 },                rare: { ebony: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { glowcap: 2, moon_silk: 2, cloud_silk: 1 } },
          { amount: [2, 3], table: { cloud_silk: 2, thunder_feather: 1, quartz: 1 } },
          { amount: [2, 4], table: { cloud_silk: 2, thunder_stone: 1, glowcap: 1 } },
          { amount: [2, 4], table: { cloud_silk: 2, sun_stone: 1, void_silk: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { orichalcum: 1, sky_wood: 1, thunder_stone: 1, thunder_feather: 1 } },
          { amount: [3, 4], table: { orichalcum: 2, sky_wood: 1, cloud_silk: 1, wyvern_scale: 1 } },
          { amount: [3, 4], table: { orichalcum: 1, sky_wood: 2, thunder_stone: 1, sun_stone: 1 } },
          { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, adamant: 1 } }
        ]
      }
    },

    abyss: {
      rank: 6,
      name: '深淵の城', requires: ['skygarden'],
      recommend: '推奨ランク5〜6・炎と雷が有効',
      floors: [
        { battles: [1, 1], encounters: { shadow_pair: 2, vampire_single: 2, mage_shadow: 1 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [1, 1], encounters: { mage_shadow: 2, vampire_mage: 2, knight_single: 1 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [1, 1], encounters: { knight_mage: 2, shadow_trio: 2, vampire_mage: 1 }, scale: { hp: 1.13, dmg: 1.13 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.13, dmg: 1.13 }, boss: 'boss_abyss' }
      ],
      rewards: { weights: { mining: 3, logging: 3, gathering: 2, treasure: 4, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 22, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
          { hardness: 24, common: { adamant: 2 },                rare: { blood_gem: 1 } },
          { hardness: 26, common: { adamant: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
          { hardness: 28, common: { adamant: 2 },                rare: { blood_gem: 1 } }
        ],
        logging: [
          { hardness: 22, common: { sky_wood: 2, ebony: 1 }, rare: { dark_bone: 1 } },
          { hardness: 24, common: { ebony: 2 },              rare: { blood_gem: 1 } },
          { hardness: 26, common: { ebony: 2, sky_wood: 1 }, rare: { ebony: 1 } },
          { hardness: 28, common: { ebony: 2 },              rare: { shadow_cloth: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { glowcap: 2, cloud_silk: 2, void_silk: 1 } },
          { amount: [2, 3], table: { cloud_silk: 1, void_silk: 2, quartz: 1 } },
          { amount: [2, 4], table: { void_silk: 2, blood_gem: 1, glowcap: 1 } },
          { amount: [2, 4], table: { void_silk: 2, blood_gem: 1, shadow_cloth: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { adamant: 1, ebony: 1, void_silk: 1, blood_gem: 1, shadow_cloth: 1 } },
          { amount: [3, 4], table: { adamant: 2, ebony: 1, void_silk: 1, dark_bone: 1 } },
          { amount: [3, 4], table: { adamant: 1, ebony: 2, void_silk: 2, blood_gem: 1 } },
          { amount: [3, 5], table: { adamant: 2, ebony: 2, void_silk: 2, blood_gem: 1 } }
        ]
      }
    },

    void: {
      rank: 6,
      name: '虚ろの回廊', requires: ['abyss'],
      recommend: '推奨ランク6・雷が有効',
      floors: [
        { battles: [1, 1], encounters: { eye_pair: 2, wraith_pair: 2, cknight_single: 1 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [1, 1], encounters: { wraith_eye: 2, cknight_single: 2, wraith_trio: 1 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [1, 1], encounters: { cknight_eye: 2, wraith_trio: 2, wraith_eye: 1 }, scale: { hp: 1.08, dmg: 1.08 } },
        { battles: [0, 0], encounters: {}, scale: { hp: 1.12, dmg: 1.12 }, boss: 'boss_chrono' }
      ],
      rewards: { weights: { mining: 3, logging: 3, gathering: 3, treasure: 4, rest: 2 }, restHealRatio: 0.35 },
      gather: {
        mining: [
          { hardness: 22, common: { orichalcum: 2, adamant: 1 }, rare: { clock_gear: 1 } },
          { hardness: 24, common: { adamant: 2 },                rare: { time_sand: 1 } },
          { hardness: 26, common: { adamant: 2, orichalcum: 1 }, rare: { clock_gear: 1 } },
          { hardness: 28, common: { adamant: 2 },                rare: { time_sand: 1 } }
        ],
        logging: [
          { hardness: 22, common: { sky_wood: 2, ebony: 1 }, rare: { wraith_ash: 1 } },
          { hardness: 24, common: { ebony: 2 },              rare: { time_sand: 1 } },
          { hardness: 26, common: { ebony: 2, sky_wood: 1 }, rare: { ebony: 1 } },
          { hardness: 28, common: { ebony: 2 },              rare: { time_sand: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { glowcap: 2, void_silk: 2, wraith_ash: 1 } },
          { amount: [2, 3], table: { void_silk: 2, time_sand: 1, quartz: 1 } },
          { amount: [2, 4], table: { void_silk: 2, time_sand: 1, void_lens: 1 } },
          { amount: [2, 4], table: { void_silk: 2, time_sand: 1, blood_gem: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { adamant: 1, ebony: 1, void_silk: 1, time_sand: 1, clock_gear: 1 } },
          { amount: [3, 4], table: { adamant: 2, ebony: 1, void_lens: 1, wraith_ash: 1 } },
          { amount: [3, 4], table: { adamant: 1, ebony: 2, void_silk: 2, time_sand: 1 } },
          { amount: [3, 5], table: { adamant: 2, ebony: 2, void_silk: 1, clock_gear: 1 } }
        ]
      }
    },

    spiral: {
      name: '螺旋の塔', requires: ['cave', 'forest', 'marsh', 'ruins', 'volcano', 'glacier', 'skygarden', 'abyss'],
      recommend: '4階ごとに帰還できる',
      endless: {
        segment: 4,              // 何階ごとにボス（＝帰還できる区切り）
        battles: [1, 1],         // 1階あたりの戦闘数（ボスの階はボスだけ）
        hpPerFloor: 0.08,        // 1階深くなるごとの敵HPの増え方
        dmgPerFloor: 0.06,       // 1階深くなるごとの敵の攻撃力の増え方
        // 何階から、どの敵の組み合わせが出るか
        tiers: [
          { from: 1,  encounters: { wolf_hornet: 1, treant_single: 1, toad_pair: 1, toad_wisp: 1, spider_hornet: 1, wolf_pair: 1 } },
          { from: 5,  encounters: { treant_pair: 1, toad_trio: 1, gargoyle_single: 1, doll_pair: 1, phantom_single: 1, treant_wolf: 1 } },
          { from: 9,  encounters: { gargoyle_phantom: 2, phantom_doll: 2, gargoyle_pair: 1, treant_pair: 1, toad_trio: 1 } },
          { from: 13, encounters: { salamander_imp: 2, golem_imp: 1, ice_wolf_fairy: 2, crystal_fairy: 1, yeti_single: 1 } },
          { from: 17, encounters: { griffin_harpy: 2, knight_cloud: 2, harpy_trio: 1, yeti_crystal: 1 } },
          { from: 21, encounters: { knight_mage: 2, vampire_mage: 2, shadow_trio: 1, knight_pair: 1 } },
          { from: 25, encounters: { s_wolf_pair: 2, s_spider_wolf: 2, s_gargoyle_phantom: 2, s_salamander_pair: 1, s_yeti_single: 1, s_griffin_single: 1, s_vampire_single: 1, knight_mage: 1 } },
          { from: 33, encounters: { x_wolf_pair: 1, x_knight_phantom: 2, x_vampire_mage: 2, x_sky_knight_pair: 1, x_golem_single: 1, s_gargoyle_phantom: 1 } }
        ],
        bosses: ['boss_golem', 'boss_elder', 'boss_queen', 'boss_dragon', 'boss_flame', 'boss_ice', 'boss_storm', 'boss_abyss'], // 4階・8階・12階…の順にくり返す
        highDropPerFloor: 0.05,  // 1階深くなるごとの上位素材の確率（上限 highDropMax）
        highDropMax: 0.9,
        soulFrom: 16, soulChance: 0.25,  // 16階より深いボスは魂を落とすことがある
        highDrops: { star_steel: 3, world_wood: 3, moon_silk: 3, orichalcum: 2, sky_wood: 2, cloud_silk: 2, adamant: 1, ebony: 1, void_silk: 1, star_shard: 2 }
      },
      rewards: { weights: { mining: 3, logging: 3, gathering: 2, treasure: 3, rest: 3 }, restHealRatio: 0.35 },
      // 採集の表は4階ごとにくり返す
      gather: {
        mining: [
          { hardness: 6,  common: { iron_ore: 2, mithril_ore: 1 },   rare: { quartz: 1 } },
          { hardness: 9,  common: { mithril_ore: 2 },                rare: { star_shard: 1 } },
          { hardness: 12, common: { mithril_ore: 2, quartz: 1 },     rare: { star_steel: 1 } },
          { hardness: 15, common: { mithril_ore: 1, star_steel: 1 }, rare: { star_steel: 1 } }
        ],
        logging: [
          { hardness: 6,  common: { maple: 2, ancient_wood: 1 },      rare: { glowcap: 1 } },
          { hardness: 9,  common: { ancient_wood: 2 },                rare: { star_shard: 1 } },
          { hardness: 12, common: { ancient_wood: 2 },                rare: { world_wood: 1 } },
          { hardness: 15, common: { ancient_wood: 1, world_wood: 1 }, rare: { world_wood: 1 } }
        ],
        gathering: [
          { amount: [2, 3], table: { glowcap: 2, herb: 2, quartz: 1 } },
          { amount: [2, 3], table: { glowcap: 2, quartz: 2, moon_silk: 1 } },
          { amount: [2, 4], table: { quartz: 2, moon_silk: 1, star_shard: 1 } },
          { amount: [2, 4], table: { moon_silk: 2, star_shard: 1, phantom_cloth: 1 } }
        ],
        treasure: [
          { amount: [3, 4], table: { mithril_ore: 2, ancient_wood: 2, spider_silk: 2, quartz: 1 } },
          { amount: [3, 4], table: { mithril_ore: 2, star_shard: 1, elder_heart: 1, queen_scale: 1 } },
          { amount: [3, 4], table: { star_steel: 1, world_wood: 1, moon_silk: 1, star_shard: 1 } },
          { amount: [3, 5], table: { star_steel: 2, world_wood: 2, moon_silk: 2, dragon_scale: 1 } }
        ]
      }
    },

    // ===== スペシャル：素材ダンジョンとボスラッシュ =====
    //   stages：初級〜地獄級（5段）。段ごとに敵・素材が丸ごと変わる（rank＝その段の推奨ランク）
    //   extra ：戦闘に勝つたびの「おまけ素材」（chance の確率で rolls 回）
    mine: {
      special: true, rank: 1, name: '鉱石の坑道', scene: 'mine', requires: ['cave'],
      recommend: '鉱石が集まる',
      rewards: { weights: { mining: 6, treasure: 2, rest: 2, logging: 1 }, restHealRatio: 0.35 },
      stages: [
        { // 初級
          rank: 1,
          floors: [
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.2, dmg: 1.2 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.2, dmg: 1.2 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.2, dmg: 1.2 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.2, dmg: 1.2 }, boss: 'boss_ore' }
          ],
          extra: { chance: 1, rolls: 2, table: { copper_ore: 3, iron_ore: 1, quartz: 1 } },
          gather: {
            mining: { hardness: 2, common: { copper_ore: 2, iron_ore: 1 }, rare: { quartz: 1 } },
            logging: { hardness: 2, common: { oak: 2, maple: 1 }, rare: { maple: 1 } },
            gathering: { amount: [2, 4], table: { flax: 2, spider_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { copper_ore: 2, oak: 2, flax: 1, quartz: 1, iron_ore: 1 } }
          }
        },
        { // 中級
          rank: 2,
          floors: [
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.67, dmg: 1.67 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.67, dmg: 1.67 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.67, dmg: 1.67 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.67, dmg: 1.67 }, boss: 'boss_ore' }
          ],
          extra: { chance: 1, rolls: 2, table: { iron_ore: 3, mithril_ore: 1, quartz: 1 } },
          gather: {
            mining: { hardness: 6, common: { iron_ore: 2, mithril_ore: 1 }, rare: { star_shard: 1 } },
            logging: { hardness: 6, common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
            gathering: { amount: [2, 4], table: { spider_silk: 2, moon_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { iron_ore: 2, maple: 2, spider_silk: 1, quartz: 1, mithril_ore: 1 } }
          }
        },
        { // 上級
          rank: 3,
          floors: [
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.89, dmg: 1.89 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.89, dmg: 1.89 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 1.89, dmg: 1.89 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.89, dmg: 1.89 }, boss: 'boss_ore' }
          ],
          extra: { chance: 1, rolls: 2, table: { mithril_ore: 3, star_steel: 1, star_shard: 1 } },
          gather: {
            mining: { hardness: 12, common: { mithril_ore: 2, star_steel: 1 }, rare: { frost_crystal: 1 } },
            logging: { hardness: 12, common: { ancient_wood: 2, world_wood: 1 }, rare: { world_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { mithril_ore: 2, ancient_wood: 2, moon_silk: 1, star_shard: 1, star_steel: 1 } }
          }
        },
        { // 超級
          rank: 4,
          floors: [
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 2.27, dmg: 2.27 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 2.27, dmg: 2.27 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 2.27, dmg: 2.27 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.27, dmg: 2.27 }, boss: 'boss_ore' }
          ],
          extra: { chance: 1, rolls: 2, table: { star_steel: 3, orichalcum: 1, frost_crystal: 1 } },
          gather: {
            mining: { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
            logging: { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { sky_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 2, cloud_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { star_steel: 2, world_wood: 2, moon_silk: 1, frost_crystal: 1, orichalcum: 1 } }
          }
        },
        { // 地獄級
          rank: 5,
          floors: [
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 2.9, dmg: 2.9 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 2.9, dmg: 2.9 } },
            { battles: [1, 1], encounters: { beetle_pair: 2, beetle_trio: 1 }, scale: { hp: 2.9, dmg: 2.9 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.9, dmg: 2.9 }, boss: 'boss_ore' }
          ],
          extra: { chance: 1, rolls: 2, table: { orichalcum: 3, adamant: 1, sun_stone: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        }
      ]
    },
    grove: {
      special: true, rank: 1, name: '精霊の樹海', scene: 'forest', requires: ['forest'],
      recommend: '木材が集まる',
      rewards: { weights: { logging: 6, treasure: 2, rest: 2, gathering: 1 }, restHealRatio: 0.35 },
      stages: [
        { // 初級
          rank: 1,
          floors: [
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 1.5, dmg: 1.5 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 1.5, dmg: 1.5 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 1.5, dmg: 1.5 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.5, dmg: 1.5 }, boss: 'boss_guardian' }
          ],
          extra: { chance: 1, rolls: 2, table: { oak: 3, maple: 1, herb: 1 } },
          gather: {
            mining: { hardness: 2, common: { copper_ore: 2, iron_ore: 1 }, rare: { quartz: 1 } },
            logging: { hardness: 2, common: { oak: 2, maple: 1 }, rare: { maple: 1 } },
            gathering: { amount: [2, 4], table: { flax: 2, spider_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { copper_ore: 2, oak: 2, flax: 1, quartz: 1, iron_ore: 1 } }
          }
        },
        { // 中級
          rank: 2,
          floors: [
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 1.9, dmg: 1.9 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 1.9, dmg: 1.9 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 1.9, dmg: 1.9 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.9, dmg: 1.9 }, boss: 'boss_guardian' }
          ],
          extra: { chance: 1, rolls: 2, table: { maple: 3, ancient_wood: 1, herb: 1 } },
          gather: {
            mining: { hardness: 6, common: { iron_ore: 2, mithril_ore: 1 }, rare: { star_shard: 1 } },
            logging: { hardness: 6, common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
            gathering: { amount: [2, 4], table: { spider_silk: 2, moon_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { iron_ore: 2, maple: 2, spider_silk: 1, quartz: 1, mithril_ore: 1 } }
          }
        },
        { // 上級
          rank: 3,
          floors: [
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 2.21, dmg: 2.21 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 2.21, dmg: 2.21 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 2.21, dmg: 2.21 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.21, dmg: 2.21 }, boss: 'boss_guardian' }
          ],
          extra: { chance: 1, rolls: 2, table: { ancient_wood: 3, world_wood: 1, glowcap: 1 } },
          gather: {
            mining: { hardness: 12, common: { mithril_ore: 2, star_steel: 1 }, rare: { frost_crystal: 1 } },
            logging: { hardness: 12, common: { ancient_wood: 2, world_wood: 1 }, rare: { world_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { mithril_ore: 2, ancient_wood: 2, moon_silk: 1, star_shard: 1, star_steel: 1 } }
          }
        },
        { // 超級
          rank: 4,
          floors: [
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 2.72, dmg: 2.72 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 2.72, dmg: 2.72 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 2.72, dmg: 2.72 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.72, dmg: 2.72 }, boss: 'boss_guardian' }
          ],
          extra: { chance: 1, rolls: 2, table: { world_wood: 3, sky_wood: 1, glowcap: 1 } },
          gather: {
            mining: { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
            logging: { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { sky_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 2, cloud_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { star_steel: 2, world_wood: 2, moon_silk: 1, frost_crystal: 1, orichalcum: 1 } }
          }
        },
        { // 地獄級
          rank: 5,
          floors: [
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 3.4, dmg: 3.4 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 3.4, dmg: 3.4 } },
            { battles: [1, 1], encounters: { sprite_trio: 2, sprite_pair: 1 }, scale: { hp: 3.4, dmg: 3.4 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 3.4, dmg: 3.4 }, boss: 'boss_guardian' }
          ],
          extra: { chance: 1, rolls: 2, table: { sky_wood: 3, ebony: 1, glowcap: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        }
      ]
    },
    cocoon: {
      special: true, rank: 1, name: '繭の洞', scene: 'cocoon', requires: ['marsh'],
      recommend: '布の素材が集まる',
      rewards: { weights: { gathering: 6, treasure: 2, rest: 2, mining: 1 }, restHealRatio: 0.35 },
      stages: [
        { // 初級
          rank: 1,
          floors: [
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.25, dmg: 1.25 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.25, dmg: 1.25 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.25, dmg: 1.25 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.25, dmg: 1.25 }, boss: 'boss_moth' }
          ],
          extra: { chance: 1, rolls: 2, table: { flax: 3, spider_silk: 1, herb: 1 } },
          gather: {
            mining: { hardness: 2, common: { copper_ore: 2, iron_ore: 1 }, rare: { quartz: 1 } },
            logging: { hardness: 2, common: { oak: 2, maple: 1 }, rare: { maple: 1 } },
            gathering: { amount: [2, 4], table: { flax: 2, spider_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { copper_ore: 2, oak: 2, flax: 1, quartz: 1, iron_ore: 1 } }
          }
        },
        { // 中級
          rank: 2,
          floors: [
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.64, dmg: 1.64 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.64, dmg: 1.64 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.64, dmg: 1.64 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.64, dmg: 1.64 }, boss: 'boss_moth' }
          ],
          extra: { chance: 1, rolls: 2, table: { spider_silk: 3, moon_silk: 1, herb: 1 } },
          gather: {
            mining: { hardness: 6, common: { iron_ore: 2, mithril_ore: 1 }, rare: { star_shard: 1 } },
            logging: { hardness: 6, common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
            gathering: { amount: [2, 4], table: { spider_silk: 2, moon_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { iron_ore: 2, maple: 2, spider_silk: 1, quartz: 1, mithril_ore: 1 } }
          }
        },
        { // 上級
          rank: 3,
          floors: [
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.9, dmg: 1.9 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.9, dmg: 1.9 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 1.9, dmg: 1.9 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.9, dmg: 1.9 }, boss: 'boss_moth' }
          ],
          extra: { chance: 1, rolls: 2, table: { moon_silk: 1, glowcap: 1 } },
          gather: {
            mining: { hardness: 12, common: { mithril_ore: 2, star_steel: 1 }, rare: { frost_crystal: 1 } },
            logging: { hardness: 12, common: { ancient_wood: 2, world_wood: 1 }, rare: { world_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { mithril_ore: 2, ancient_wood: 2, moon_silk: 1, star_shard: 1, star_steel: 1 } }
          }
        },
        { // 超級
          rank: 4,
          floors: [
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 2.25, dmg: 2.25 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 2.25, dmg: 2.25 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 2.25, dmg: 2.25 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.25, dmg: 2.25 }, boss: 'boss_moth' }
          ],
          extra: { chance: 1, rolls: 2, table: { moon_silk: 3, cloud_silk: 1, glowcap: 1 } },
          gather: {
            mining: { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
            logging: { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { sky_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 2, cloud_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { star_steel: 2, world_wood: 2, moon_silk: 1, frost_crystal: 1, orichalcum: 1 } }
          }
        },
        { // 地獄級
          rank: 5,
          floors: [
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 3, dmg: 3 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 3, dmg: 3 } },
            { battles: [1, 1], encounters: { moth_trio: 2, moth_pair: 1 }, scale: { hp: 3, dmg: 3 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 3, dmg: 3 }, boss: 'boss_moth' }
          ],
          extra: { chance: 1, rolls: 2, table: { cloud_silk: 3, void_silk: 1, glowcap: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        }
      ]
    },
    nest: {
      special: true, rank: 1, name: '魔物の巣', scene: 'marsh', requires: ['ruins'],
      recommend: '魔物の素材が集まる',
      rewards: { weights: { treasure: 3, rest: 3, gathering: 2, mining: 1, logging: 1 }, restHealRatio: 0.35 },
      stages: [
        { // 初級
          rank: 1,
          floors: [
            { battles: [1, 1], encounters: { slime_pair: 1, bat_trio: 1, wolf_slime: 1, spider_bat: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [1, 1], encounters: { slime_pair: 1, bat_trio: 1, wolf_slime: 1, spider_bat: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [1, 1], encounters: { slime_pair: 1, bat_trio: 1, wolf_slime: 1, spider_bat: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.03, dmg: 1.03 }, boss: 'boss_chimera' }
          ],
          extra: { chance: 1, rolls: 2, table: { slime_gel: 2, bat_wing: 2, wolf_pelt: 1 } },
          gather: {
            mining: { hardness: 2, common: { copper_ore: 2, iron_ore: 1 }, rare: { quartz: 1 } },
            logging: { hardness: 2, common: { oak: 2, maple: 1 }, rare: { maple: 1 } },
            gathering: { amount: [2, 4], table: { flax: 2, spider_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { copper_ore: 2, oak: 2, flax: 1, quartz: 1, iron_ore: 1 } }
          }
        },
        { // 中級
          rank: 2,
          floors: [
            { battles: [1, 1], encounters: { wolf_hornet: 1, treant_wolf: 1, toad_wisp: 1, spider_hornet: 1 }, scale: { hp: 1.1, dmg: 1.1 } },
            { battles: [1, 1], encounters: { wolf_hornet: 1, treant_wolf: 1, toad_wisp: 1, spider_hornet: 1 }, scale: { hp: 1.1, dmg: 1.1 } },
            { battles: [1, 1], encounters: { wolf_hornet: 1, treant_wolf: 1, toad_wisp: 1, spider_hornet: 1 }, scale: { hp: 1.1, dmg: 1.1 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.5, dmg: 1.5 }, boss: 'boss_chimera' }
          ],
          extra: { chance: 1, rolls: 2, table: { wolf_pelt: 1, spider_silk: 1, treant_bark: 1, hornet_sting: 1, toad_skin: 1, wisp_flame: 1 } },
          gather: {
            mining: { hardness: 6, common: { iron_ore: 2, mithril_ore: 1 }, rare: { star_shard: 1 } },
            logging: { hardness: 6, common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
            gathering: { amount: [2, 4], table: { spider_silk: 2, moon_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { iron_ore: 2, maple: 2, spider_silk: 1, quartz: 1, mithril_ore: 1 } }
          }
        },
        { // 上級
          rank: 3,
          floors: [
            { battles: [1, 1], encounters: { gargoyle_phantom: 1, phantom_doll: 1, gargoyle_pair: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [1, 1], encounters: { gargoyle_phantom: 1, phantom_doll: 1, gargoyle_pair: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [1, 1], encounters: { gargoyle_phantom: 1, phantom_doll: 1, gargoyle_pair: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.62, dmg: 1.62 }, boss: 'boss_chimera' }
          ],
          extra: { chance: 1, rolls: 2, table: { golem_core: 1, elder_heart: 1, queen_scale: 1, gargoyle_stone: 1, phantom_cloth: 1, dragon_scale: 1 } },
          gather: {
            mining: { hardness: 12, common: { mithril_ore: 2, star_steel: 1 }, rare: { frost_crystal: 1 } },
            logging: { hardness: 12, common: { ancient_wood: 2, world_wood: 1 }, rare: { world_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { mithril_ore: 2, ancient_wood: 2, moon_silk: 1, star_shard: 1, star_steel: 1 } }
          }
        },
        { // 超級
          rank: 4,
          floors: [
            { battles: [1, 1], encounters: { salamander_imp: 1, golem_imp: 1, ice_wolf_fairy: 1, crystal_fairy: 1 }, scale: { hp: 1.05, dmg: 1.05 } },
            { battles: [1, 1], encounters: { salamander_imp: 1, golem_imp: 1, ice_wolf_fairy: 1, crystal_fairy: 1 }, scale: { hp: 1.05, dmg: 1.05 } },
            { battles: [1, 1], encounters: { salamander_imp: 1, golem_imp: 1, ice_wolf_fairy: 1, crystal_fairy: 1 }, scale: { hp: 1.05, dmg: 1.05 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.05, dmg: 2.05 }, boss: 'boss_chimera' }
          ],
          extra: { chance: 1, rolls: 2, table: { fire_scale: 1, magma_core: 1, imp_horn: 1, ice_fang: 1, yeti_fur: 1, frost_crystal: 1 } },
          gather: {
            mining: { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
            logging: { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { sky_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 2, cloud_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { star_steel: 2, world_wood: 2, moon_silk: 1, frost_crystal: 1, orichalcum: 1 } }
          }
        },
        { // 地獄級
          rank: 5,
          floors: [
            { battles: [1, 1], encounters: { griffin_harpy: 1, knight_cloud: 1, vampire_mage: 1, knight_mage: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [1, 1], encounters: { griffin_harpy: 1, knight_cloud: 1, vampire_mage: 1, knight_mage: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [1, 1], encounters: { griffin_harpy: 1, knight_cloud: 1, vampire_mage: 1, knight_mage: 1 }, scale: { hp: 1, dmg: 1 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.65, dmg: 2.65 }, boss: 'boss_chimera' }
          ],
          extra: { chance: 1, rolls: 2, table: { harpy_feather: 1, griffin_claw: 1, shadow_cloth: 1, dark_bone: 1, blood_gem: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        }
      ]
    },
    vault: {
      special: true, rank: 1, name: '宝物庫', scene: 'vault', requires: ['volcano', 'glacier'],
      recommend: '宝石が集まる',
      rewards: { weights: { treasure: 6, mining: 2, rest: 2 }, restHealRatio: 0.35 },
      stages: [
        { // 初級
          rank: 1,
          floors: [
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.11, dmg: 1.11 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.11, dmg: 1.11 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.11, dmg: 1.11 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.11, dmg: 1.11 }, boss: 'boss_mimic' }
          ],
          extra: { chance: 1, rolls: 3, table: { quartz: 1, copper_ore: 1 } },
          gather: {
            mining: { hardness: 2, common: { copper_ore: 2, iron_ore: 1 }, rare: { quartz: 1 } },
            logging: { hardness: 2, common: { oak: 2, maple: 1 }, rare: { maple: 1 } },
            gathering: { amount: [2, 4], table: { flax: 2, spider_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { copper_ore: 2, oak: 2, flax: 1, quartz: 1, iron_ore: 1 } }
          }
        },
        { // 中級
          rank: 2,
          floors: [
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.54, dmg: 1.54 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.54, dmg: 1.54 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.54, dmg: 1.54 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.54, dmg: 1.54 }, boss: 'boss_mimic' }
          ],
          extra: { chance: 1, rolls: 3, table: { quartz: 2, star_shard: 1, iron_ore: 1 } },
          gather: {
            mining: { hardness: 6, common: { iron_ore: 2, mithril_ore: 1 }, rare: { star_shard: 1 } },
            logging: { hardness: 6, common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
            gathering: { amount: [2, 4], table: { spider_silk: 2, moon_silk: 1, herb: 2 } },
            treasure: { amount: [3, 5], table: { iron_ore: 2, maple: 2, spider_silk: 1, quartz: 1, mithril_ore: 1 } }
          }
        },
        { // 上級
          rank: 3,
          floors: [
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.73, dmg: 1.73 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.73, dmg: 1.73 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 1.73, dmg: 1.73 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.73, dmg: 1.73 }, boss: 'boss_mimic' }
          ],
          extra: { chance: 1, rolls: 3, table: { star_shard: 2, frost_crystal: 1, mithril_ore: 1 } },
          gather: {
            mining: { hardness: 12, common: { mithril_ore: 2, star_steel: 1 }, rare: { frost_crystal: 1 } },
            logging: { hardness: 12, common: { ancient_wood: 2, world_wood: 1 }, rare: { world_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { mithril_ore: 2, ancient_wood: 2, moon_silk: 1, star_shard: 1, star_steel: 1 } }
          }
        },
        { // 超級
          rank: 4,
          floors: [
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 2.09, dmg: 2.09 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 2.09, dmg: 2.09 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 2.09, dmg: 2.09 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.09, dmg: 2.09 }, boss: 'boss_mimic' }
          ],
          extra: { chance: 1, rolls: 3, table: { frost_crystal: 2, sun_stone: 1, star_steel: 1 } },
          gather: {
            mining: { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
            logging: { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { sky_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 2, cloud_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { star_steel: 2, world_wood: 2, moon_silk: 1, frost_crystal: 1, orichalcum: 1 } }
          }
        },
        { // 地獄級
          rank: 5,
          floors: [
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 2.71, dmg: 2.71 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 2.71, dmg: 2.71 } },
            { battles: [1, 1], encounters: { mimic_single: 1, mimic_gold: 2, gold_pair: 1, mimic_pair: 1 }, scale: { hp: 2.71, dmg: 2.71 } },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.71, dmg: 2.71 }, boss: 'boss_mimic' }
          ],
          extra: { chance: 1, rolls: 3, table: { sun_stone: 2, blood_gem: 1, orichalcum: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        }
      ]
    },
    bossrush: {
      special: true, rank: 3, name: 'ボスラッシュ', scene: 'arena', requires: ['abyss'],
      recommend: 'ボスだけが続く',
      rewards: { weights: { rest: 5, treasure: 3, gathering: 1 }, restHealRatio: 0.35 },
      stages: [
        { // 初級
          rank: 3, soulChance: 0.25,
          floors: [
            { battles: [0, 0], encounters: {}, scale: { hp: 1, dmg: 1 }, boss: 'boss_golem' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1, dmg: 1 }, boss: 'boss_elder' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1, dmg: 1 }, boss: 'boss_queen' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1, dmg: 1 }, boss: 'boss_dragon' }
          ],
          extra: { chance: 1, rolls: 1, table: { mithril_ore: 1, ancient_wood: 1, moon_silk: 1, star_shard: 1 } },
          gather: {
            mining: { hardness: 12, common: { mithril_ore: 2, star_steel: 1 }, rare: { frost_crystal: 1 } },
            logging: { hardness: 12, common: { ancient_wood: 2, world_wood: 1 }, rare: { world_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { mithril_ore: 2, ancient_wood: 2, moon_silk: 1, star_shard: 1, star_steel: 1 } }
          }
        },
        { // 中級
          rank: 4, soulChance: 0.35,
          floors: [
            { battles: [0, 0], encounters: {}, scale: { hp: 2.15, dmg: 2.15 }, boss: 'boss_ore' },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.15, dmg: 2.15 }, boss: 'boss_guardian' },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.15, dmg: 2.15 }, boss: 'boss_moth' },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.15, dmg: 2.15 }, boss: 'boss_mimic' }
          ],
          extra: { chance: 1, rolls: 1, table: { star_steel: 1, world_wood: 1, moon_silk: 1, frost_crystal: 1 } },
          gather: {
            mining: { hardness: 18, common: { star_steel: 2, orichalcum: 1 }, rare: { sun_stone: 1 } },
            logging: { hardness: 18, common: { world_wood: 2, sky_wood: 1 }, rare: { sky_wood: 1 } },
            gathering: { amount: [2, 4], table: { moon_silk: 2, cloud_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { star_steel: 2, world_wood: 2, moon_silk: 1, frost_crystal: 1, orichalcum: 1 } }
          }
        },
        { // 上級
          rank: 5, soulChance: 0.5,
          floors: [
            { battles: [0, 0], encounters: {}, scale: { hp: 0.73, dmg: 0.73 }, boss: 'boss_flame' },
            { battles: [0, 0], encounters: {}, scale: { hp: 0.73, dmg: 0.73 }, boss: 'boss_ice' },
            { battles: [0, 0], encounters: {}, scale: { hp: 2.92, dmg: 2.92 }, boss: 'boss_chimera' },
            { battles: [0, 0], encounters: {}, scale: { hp: 0.73, dmg: 0.73 }, boss: 'boss_storm' }
          ],
          extra: { chance: 1, rolls: 1, table: { orichalcum: 1, sky_wood: 1, cloud_silk: 1, sun_stone: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        },
        { // 超級
          rank: 6, soulChance: 0.75,
          floors: [
            { battles: [0, 0], encounters: {}, scale: { hp: 1.27, dmg: 1.27 }, boss: 'boss_storm' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.32, dmg: 1.32 }, boss: 'boss_flame' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.32, dmg: 1.32 }, boss: 'boss_ice' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.15, dmg: 1.15 }, boss: 'boss_abyss' }
          ],
          extra: { chance: 1, rolls: 1, table: { adamant: 1, ebony: 1, void_silk: 1, blood_gem: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        },
        { // 地獄級
          rank: 6, soulChance: 1.0,
          floors: [
            { battles: [0, 0], encounters: {}, scale: { hp: 1.4, dmg: 1.4 }, boss: 'boss_storm' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.45, dmg: 1.45 }, boss: 'boss_flame' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.45, dmg: 1.45 }, boss: 'boss_ice' },
            { battles: [0, 0], encounters: {}, scale: { hp: 1.27, dmg: 1.27 }, boss: 'boss_abyss' }
          ],
          extra: { chance: 1, rolls: 1, table: { adamant: 1, ebony: 1, void_silk: 1, blood_gem: 1 } },
          gather: {
            mining: { hardness: 24, common: { orichalcum: 2, adamant: 1 }, rare: { blood_gem: 1 } },
            logging: { hardness: 24, common: { sky_wood: 2, ebony: 1 }, rare: { ebony: 1 } },
            gathering: { amount: [2, 4], table: { cloud_silk: 2, void_silk: 1, glowcap: 2 } },
            treasure: { amount: [3, 5], table: { orichalcum: 2, sky_wood: 2, cloud_silk: 1, sun_stone: 1, adamant: 1 } }
          }
        }
      ]
    }
  };

  // ステージ（難易度段階）：初級＝難易度1。同じダンジョンの1つ前の段をクリアすると次が開く
  R.DATA.difficulty = {
    max: 5,
    stageNames: ['初級', '中級', '上級', '超級', '地獄級'],
    hpPerLevel: 0.3,           // 1段上がるごとの敵HPの増え方（中級で×1.3）
    dmgPerLevel: 0.2,          // 1段上がるごとの敵の攻撃力・ブロックの増え方
    // 上位素材：戦闘勝利・採集・宝箱のたびに、この確率で上位素材が1つ追加で出る
    highDropPerLevel: 0.3,     // 1段上がるごとの確率（中級で30%、上限90%）
    highDropMax: 0.9,
    // ボスの魂が出る確率（段ごと：初級・中級・上級・超級・地獄級）
    soulChance: [0, 0, 0, 0.2, 0.4],
    // ダンジョンごとの上位素材。そのダンジョンの1つ上のランクの素材が出る（超級からはさらに良い物も）
    //   from：この段以上で使う表
    highDrops: {
      cave: [
        { from: 2, table: { iron_ore: 3, maple: 2, wolf_pelt: 1, spider_silk: 1 } },
        { from: 4, table: { mithril_ore: 2, ancient_wood: 1, star_shard: 1, golem_core: 1 } }
      ],
      forest: [
        { from: 2, table: { ancient_wood: 3, mithril_ore: 1, star_shard: 1, treant_bark: 1 } },
        { from: 4, table: { ancient_wood: 2, elder_heart: 1, star_shard: 1, world_wood: 1 } }
      ],
      marsh: [
        { from: 2, table: { mithril_ore: 2, ancient_wood: 1, spider_silk: 2, toad_skin: 1 } },
        { from: 4, table: { mithril_ore: 2, queen_scale: 1, star_shard: 1, moon_silk: 1 } }
      ],
      ruins: [
        { from: 2, table: { star_steel: 2, world_wood: 2, moon_silk: 2, gargoyle_stone: 1, phantom_cloth: 1 } },
        { from: 4, table: { star_steel: 2, world_wood: 2, moon_silk: 2, dragon_scale: 1, orichalcum: 1 } }
      ],
      volcano: [
        { from: 2, table: { orichalcum: 2, sky_wood: 1, fire_scale: 1, magma_core: 1 } },
        { from: 4, table: { orichalcum: 2, sky_wood: 1, cloud_silk: 1, flame_heart: 1 } }
      ],
      glacier: [
        { from: 2, table: { cloud_silk: 2, orichalcum: 1, ice_fang: 1, frost_crystal: 1 } },
        { from: 4, table: { cloud_silk: 2, sky_wood: 1, orichalcum: 1, ice_heart: 1 } }
      ],
      skygarden: [
        { from: 2, table: { adamant: 2, ebony: 2, void_silk: 2, harpy_feather: 1 } },
        { from: 4, table: { adamant: 2, ebony: 2, void_silk: 2, storm_horn: 1 } }
      ],
      shore: [
        { from: 2, table: { mithril_ore: 2, ancient_wood: 1, sea_pearl: 2, kraken_ink: 1 } },
        { from: 4, table: { mithril_ore: 2, star_shard: 1, kraken_ink: 1, star_steel: 1 } }
      ],
      desert: [
        { from: 2, table: { orichalcum: 2, sky_wood: 1, sand_gold: 2, pharaoh_mask: 1 } },
        { from: 4, table: { orichalcum: 2, cloud_silk: 1, sand_gold: 1, pharaoh_mask: 1 } }
      ],
      peak: [
        { from: 2, table: { adamant: 2, ebony: 2, thunder_stone: 2, raiju_horn: 1 } },
        { from: 4, table: { adamant: 2, ebony: 2, void_silk: 2, raiju_horn: 1 } }
      ],
      void: [
        { from: 2, table: { adamant: 2, ebony: 2, time_sand: 2, chrono_heart: 1 } },
        { from: 4, table: { adamant: 2, ebony: 2, void_silk: 2, chrono_heart: 1 } }
      ],
      abyss: [
        { from: 2, table: { adamant: 2, ebony: 2, void_silk: 2, blood_gem: 1 } },
        { from: 4, table: { adamant: 2, ebony: 2, void_silk: 2, abyss_heart: 1 } }
      ]
    }
  };

  // 採集ミニゲーム「鉱脈探し」の設定
  // 4×4のマスに鉱脈が隠れている。1回振るごとに1マス掘る。
  // 外れのマスには「まわり8マスにある鉱脈の数」が出るので、それを手がかりに探す
  R.DATA.gatherGame = {
    size: 4,                 // マス目の大きさ（4なら4×4）
    veins: 4,                // 鉱脈の数（レア鉱脈を含む）
    rareVeins: 1,            // そのうちレア鉱脈の数（掘るとレア素材）
    baseSwings: 6,           // 振れる回数の基本
    swingsPerLv: 0.5,        // 採掘Lv（伐採Lv）−硬さ 1につき増える回数（2Lvで1回）
    swingsPerTool: 2,        // 道具の強さが1上がるごとに増える回数
    minSwings: 3, maxSwings: 10,
    hintsPerLv: 0.34,        // Lv−硬さ 1につき、最初から開いている外れマスの数（3Lvで1マス）
    maxHints: 5,
    perVein: 1,              // 鉱脈1つで手に入る数
    allFoundBonus: 1,        // 全部見つけたとき、余った回数1回ごとにおまけ
    failYield: 1,            // 1つも見つからなかったときの拾い物
    exp: 12,                 // もらえる経験値（1つも見つからなければ半分）
    expPerVein: 3            // 見つけた鉱脈1つごとの追加経験値
  };
})(globalThis.RASEN = globalThis.RASEN || {});
