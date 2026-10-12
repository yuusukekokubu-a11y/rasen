// 素材
//   kind : ore=鉱石 / wood=木材 / plant=採取物 / monster=モンスター素材 / gem=宝石
//   rank : 素材の格（装備のランクに対応）
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.materials = {
    copper_ore:   { name: '銅鉱石',       kind: 'ore',     rank: 1 },
    iron_ore:     { name: '鉄鉱石',       kind: 'ore',     rank: 2 },
    mithril_ore:  { name: 'ミスリル鉱石', kind: 'ore',     rank: 3 },
    quartz:       { name: '水晶',         kind: 'gem',     rank: 1 },
    star_shard:   { name: '星のかけら',   kind: 'gem',     rank: 3 },
    oak:          { name: 'カシ材',       kind: 'wood',    rank: 1 },
    maple:        { name: 'カエデ材',     kind: 'wood',    rank: 2 },
    ancient_wood: { name: '古木',         kind: 'wood',    rank: 3 },
    flax:         { name: '麻',           kind: 'plant',   rank: 1 },
    herb:         { name: '薬草',         kind: 'plant',   rank: 1 },
    glowcap:      { name: 'ヒカリダケ',   kind: 'plant',   rank: 2 },
    slime_gel:    { name: 'スライムゼリー', kind: 'monster', rank: 1 },
    bat_wing:     { name: 'コウモリの翼', kind: 'monster', rank: 1 },
    wolf_pelt:    { name: '魔狼の毛皮',   kind: 'monster', rank: 2 },
    spider_silk:  { name: '大蜘蛛の糸',   kind: 'monster', rank: 2 },
    golem_core:   { name: '岩窟の核',     kind: 'monster', rank: 3 }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
