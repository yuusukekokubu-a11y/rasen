// ダンジョン
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
      name: '岩窟の洞',
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
          { hardness: 3,  common: { copper_ore: 1 },               rare: { quartz: 1 } },
          { hardness: 6,  common: { copper_ore: 1, iron_ore: 2 },  rare: { quartz: 1 } },
          { hardness: 10, common: { iron_ore: 2, mithril_ore: 1 }, rare: { quartz: 1, mithril_ore: 1 } },
          { hardness: 13, common: { iron_ore: 1, mithril_ore: 2 }, rare: { star_shard: 1 } }
        ],
        logging: [
          { hardness: 3,  common: { oak: 1 },                    rare: { maple: 1 } },
          { hardness: 6,  common: { oak: 1, maple: 2 },          rare: { glowcap: 1 } },
          { hardness: 10, common: { maple: 2, ancient_wood: 1 }, rare: { ancient_wood: 1 } },
          { hardness: 13, common: { maple: 1, ancient_wood: 2 }, rare: { star_shard: 1 } }
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
    swingsPerLv: 0.25,       // 採掘Lv（伐採Lv）−硬さ 1につき増える回数
    swingsPerTool: 2,        // 道具の強さが1上がるごとに増える回数
    minSwings: 3, maxSwings: 10,
    hintsPerLv: 0.2,         // Lv−硬さ 1につき、最初から開いている外れマスの数
    maxHints: 4,
    perVein: 1,              // 鉱脈1つで手に入る数
    allFoundBonus: 1,        // 全部見つけたとき、余った回数1回ごとにおまけ
    failYield: 1,            // 1つも見つからなかったときの拾い物
    exp: 8                   // もらえる経験値（1つも見つからなければ半分）
  };
})(globalThis.RASEN = globalThis.RASEN || {});
