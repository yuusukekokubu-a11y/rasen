// ダンジョン
//   requires : 開くために先にクリアが必要なダンジョン（すべてクリアで開く）
//   recommend: 出発画面に出す目安（推奨ランク・敵の傾向）
//   floors   : 4階層。battles=[最少, 最多] の戦闘数（最後の階はこの後にボス）
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
      name: '岩窟の洞', requires: [],
      recommend: 'ランク1〜2の装備向け。打たれ強い敵が多く、ボスは力を溜めて大技を撃つ',
      floors: [
        { battles: [2, 3], encounters: { slime_pair: 3, bat_trio: 2, wolf_single: 2 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { wolf_slime: 2, spider_bat: 2, wolf_single: 1 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { wolf_pair: 2, spider_pair: 2, spider_bat: 1 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [1, 2], encounters: { wolf_pair: 1, spider_pair: 1 }, scale: { hp: 1.0, dmg: 1.05 }, boss: 'boss_golem' }
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
      name: '囁きの森', requires: ['cave'],
      recommend: 'ランク2の装備向け。手数の多い虫と、回復する樹木。炎が弱点の敵が多い',
      floors: [
        { battles: [2, 3], encounters: { hornet_trio: 2, wolf_hornet: 2, treant_single: 2 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { treant_wolf: 2, spider_hornet: 2, wolf_hornet: 1 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { treant_pair: 2, spider_hornet: 2, treant_wolf: 1 }, scale: { hp: 1.05, dmg: 1.05 } },
        { battles: [1, 2], encounters: { treant_pair: 1, treant_wolf: 1 }, scale: { hp: 1.05, dmg: 1.05 }, boss: 'boss_elder' }
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
      name: '霧の沼', requires: ['cave'],
      recommend: 'ランク2の装備向け。脱力・弱体をばらまく敵が多い。雷が弱点の敵が多い',
      floors: [
        { battles: [2, 3], encounters: { toad_pair: 2, slime_toad: 2, wisp_trio: 1 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { toad_wisp: 2, wisp_trio: 2, slime_toad: 1 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { toad_trio: 2, toad_wisp: 2 }, scale: { hp: 1.05, dmg: 1.05 } },
        { battles: [1, 2], encounters: { toad_trio: 1, toad_wisp: 1 }, scale: { hp: 1.05, dmg: 1.05 }, boss: 'boss_queen' }
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

    ruins: {
      name: '星降る遺跡', requires: ['forest', 'marsh'],
      recommend: 'ランク3の装備向け。硬い石像と呪いを使う亡霊。最奥には星喰いの竜',
      floors: [
        { battles: [2, 3], encounters: { gargoyle_single: 2, doll_pair: 2, phantom_single: 2 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { gargoyle_phantom: 2, phantom_doll: 2, doll_pair: 1 }, scale: { hp: 1.0, dmg: 1.0 } },
        { battles: [2, 3], encounters: { gargoyle_pair: 2, gargoyle_phantom: 2, phantom_doll: 1 }, scale: { hp: 1.05, dmg: 1.05 } },
        { battles: [1, 2], encounters: { gargoyle_pair: 1, gargoyle_phantom: 1 }, scale: { hp: 1.05, dmg: 1.05 }, boss: 'boss_dragon' }
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
