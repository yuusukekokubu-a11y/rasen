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
      recommend: '推奨ランク1〜2・雷が有効',
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
      recommend: '推奨ランク2・炎が有効',
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
      recommend: '推奨ランク2・雷が有効',
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
      recommend: '推奨ランク3・雷が有効',
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
    },

    // 無限階層（エンドコンテンツ）：4階ごとにボス。倒すたびに「帰還／さらに潜る」を選ぶ。毎回1階から
    spiral: {
      name: '螺旋の塔', requires: ['cave', 'forest', 'marsh', 'ruins'],
      recommend: '4階ごとに帰還できる',
      endless: {
        segment: 4,              // 何階ごとにボス（＝帰還できる区切り）
        battles: [1, 2],         // 1階あたりの通常の戦闘数（ボスの階はこの後にボス）
        hpPerFloor: 0.08,        // 1階深くなるごとの敵HPの増え方
        dmgPerFloor: 0.06,       // 1階深くなるごとの敵の攻撃力の増え方
        // 何階から、どの敵の組み合わせが出るか
        tiers: [
          { from: 1,  encounters: { wolf_hornet: 1, treant_single: 1, toad_pair: 1, toad_wisp: 1, spider_hornet: 1, wolf_pair: 1 } },
          { from: 5,  encounters: { treant_pair: 1, toad_trio: 1, gargoyle_single: 1, doll_pair: 1, phantom_single: 1, treant_wolf: 1 } },
          { from: 9,  encounters: { gargoyle_phantom: 2, phantom_doll: 2, gargoyle_pair: 1, treant_pair: 1, toad_trio: 1 } }
        ],
        bosses: ['boss_golem', 'boss_elder', 'boss_queen', 'boss_dragon'], // 4階・8階・12階・16階…の順にくり返す
        highDropPerFloor: 0.05,  // 1階深くなるごとの上位素材の確率（上限 highDropMax）
        highDropMax: 0.9,
        highDrops: { star_steel: 3, world_wood: 3, moon_silk: 3, dragon_scale: 1, gargoyle_stone: 1, phantom_cloth: 1, star_shard: 2 }
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
    }
  };

  // 難易度段階（すべてのダンジョンをクリアすると、各ダンジョンに難易度2・3…が開く）
  //   難易度Nは、同じダンジョンの難易度N−1をクリアすると開く
  R.DATA.difficulty = {
    max: 5,
    hpPerLevel: 0.35,          // 難易度が1上がるごとの敵HPの増え方（難易度2で×1.35）
    dmgPerLevel: 0.25,         // 難易度が1上がるごとの敵の攻撃力・ブロックの増え方
    // 上位素材：戦闘勝利・採集・宝箱のたびに、この確率で上位素材が1つ追加で出る
    highDropPerLevel: 0.3,     // 難易度が1上がるごとの確率（難易度2で30%、上限90%）
    highDropMax: 0.9,
    // ダンジョンごとの上位素材の出やすさ
    highDrops: {
      cave:   { star_steel: 3, world_wood: 1, moon_silk: 1 },
      forest: { world_wood: 3, star_steel: 1, moon_silk: 1 },
      marsh:  { moon_silk: 3, world_wood: 1, star_steel: 1 },
      ruins:  { star_steel: 2, world_wood: 2, moon_silk: 2, dragon_scale: 1, gargoyle_stone: 1, phantom_cloth: 1 }
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
