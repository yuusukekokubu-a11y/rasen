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

  // 採集ミニゲームの設定
  R.DATA.gatherGame = {
    swings: 6,               // 振れる回数
    swingsToBreak: 4,        // 道具1.0・レベル差なし・「ふつう」の当たりで何回で壊れるか
    basePower: 1.0,          // 1回あたりの基本の削り量（道具の強さ×これ）
    zoneMult: { great: 2.0, good: 1.0, miss: 0.4 }, // 当たり方ごとの削り量の倍率
    // 採掘Lv（伐採Lv）と硬さの差1につき削り量が何%変わるか
    lvDiffRate: 0.08,
    lvMultMin: 0.4, lvMultMax: 2.0,
    // 当たり判定の幅（%）。レベル差で広がる/狭まる
    goodWidth: 30, greatWidth: 8, widthPerLv: 1.5,
    // 結果：壊せたら baseYield 個＋余った回数ごとに +1。壊せなければ failYield 個
    baseYield: 2, failYield: 1,
    // レア素材の確率：rareBase ＋ 「最高」1回ごとに rarePerGreat ＋ 余った回数ごとに rarePerLeft
    rareBase: 0.05, rarePerGreat: 0.08, rarePerLeft: 0.05,
    exp: 8                   // もらえる経験値（壊せなければ半分）
  };
})(globalThis.RASEN = globalThis.RASEN || {});
