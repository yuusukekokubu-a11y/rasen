// 装備データ
(function (R) {
  R.DATA = R.DATA || {};

  // 装備種：どの部位に付くか／武器の固定ステータス（攻撃力か魔力）／どの生産ライフで作るか
  // armorMod: 防具の種類ごとの補正（重装は防御寄り、ローブはHP寄り など）
  const types = {
    sword:     { name: '剣',   slots: ['weapon'], stat: 'atk', craft: 'smith' },
    staff:     { name: '杖',   slots: ['weapon'], stat: 'mag', craft: 'carpenter' },
    starboard: { name: '星盤', slots: ['weapon'], stat: 'mag', craft: 'carpenter' },
    dagger:    { name: '短剣', slots: ['weapon'], stat: 'atk', craft: 'smith' },
    bow:       { name: '弓',   slots: ['weapon'], stat: 'atk', craft: 'carpenter' },
    scepter:   { name: '錫杖', slots: ['weapon'], stat: 'mag', craft: 'carpenter' },
    heavy:     { name: '重装', slots: ['head', 'body'], craft: 'smith',  armorMod: { hp: 1.0, def: 1.5 } },
    robe:      { name: 'ローブ', slots: ['head', 'body'], craft: 'tailor', armorMod: { hp: 1.2, def: 0.7 } },
    light:     { name: '軽装', slots: ['head', 'body'], craft: 'tailor', armorMod: { hp: 1.1, def: 1.0 } },
    accessory: { name: 'アクセサリー', slots: ['accessory'], craft: 'jeweler' }
  };

  // ランク（素材の格）ごとの固定ステータス（index 0 = ランク1）
  const rankStats = {
    weapon:    { main: [3, 5, 8, 11, 14, 17] },
    head:      { hp: [5, 8, 12, 16, 20, 24], def: [1, 2, 3, 4, 5, 6] },
    body:      { hp: [8, 12, 18, 24, 30, 36], def: [2, 3, 4, 5, 6, 7] },
    accessory: {}
  };

  // ランダム枠「ステータス上昇」の値（ランクごと）。良い枠（grade）ほど倍率が上がる
  const statRolls = {
    atk: [1, 2, 3, 4, 5, 6],
    def: [1, 1, 2, 2, 3, 3],
    mag: [1, 2, 3, 4, 5, 6],
    hp:  [3, 5, 7, 9, 11, 13]
  };
  // grade（ランダム枠の良さ）：0=並 1=良 2=極
  const gradeMult = [1, 1.5, 2];

  // 部位の表示名
  const slotNames = { weapon: '武器', head: '頭', body: '胴', accessory: 'アクセ' };

  // 装備の元になる品（レシピ）
  //   fixedCard : 固定カード（最高品質なら強化版になる）
  //   mats      : 必要素材 { 素材ID: 個数 }
  //   difficulty: 生産の難易度（生産Lvと比べる）
  const bases = {
    // --- 剣（鍛冶） ---
    copper_sword:   { name: '銅の剣',       type: 'sword', slot: 'weapon', rank: 1, fixedCard: 'sword_slash',   mats: { copper_ore: 3 },                 difficulty: 1 },
    iron_sword:     { name: '鉄の剣',       type: 'sword', slot: 'weapon', rank: 2, fixedCard: 'sword_parry',   mats: { iron_ore: 3, wolf_pelt: 1 },     difficulty: 6 },
    mithril_sword:  { name: 'ミスリルの剣', type: 'sword', slot: 'weapon', rank: 3, fixedCard: 'sword_heavy',   mats: { mithril_ore: 3, elder_heart: 1 }, difficulty: 12 },
    // --- 重装（鍛冶） ---
    copper_helm:    { name: '銅の兜',       type: 'heavy', slot: 'head', rank: 1, fixedCard: 'heavy_defend',   mats: { copper_ore: 2 },                 difficulty: 1 },
    iron_helm:      { name: '鉄の兜',       type: 'heavy', slot: 'head', rank: 2, fixedCard: 'heavy_taunt',    mats: { iron_ore: 2, wolf_pelt: 1 },     difficulty: 5 },
    mithril_helm:   { name: 'ミスリルの兜', type: 'heavy', slot: 'head', rank: 3, fixedCard: 'heavy_endure',   mats: { mithril_ore: 2, golem_core: 1 }, difficulty: 11 },
    copper_armor:   { name: '銅の鎧',       type: 'heavy', slot: 'body', rank: 1, fixedCard: 'heavy_defend',   mats: { copper_ore: 4 },                 difficulty: 2 },
    iron_armor:     { name: '鉄の鎧',       type: 'heavy', slot: 'body', rank: 2, fixedCard: 'heavy_ironwall', mats: { iron_ore: 4, wolf_pelt: 2 },     difficulty: 7 },
    mithril_armor:  { name: 'ミスリルの鎧', type: 'heavy', slot: 'body', rank: 3, fixedCard: 'heavy_bash',     mats: { mithril_ore: 4, queen_scale: 1 }, difficulty: 13 },
    // --- 杖（大工） ---
    oak_staff:      { name: 'カシの杖',     type: 'staff', slot: 'weapon', rank: 1, fixedCard: 'staff_fire',    mats: { oak: 3 },                        difficulty: 1 },
    maple_staff:    { name: 'カエデの杖',   type: 'staff', slot: 'weapon', rank: 2, fixedCard: 'staff_ice',     mats: { maple: 3, bat_wing: 1 },         difficulty: 6 },
    ancient_staff:  { name: '古木の杖',     type: 'staff', slot: 'weapon', rank: 3, fixedCard: 'staff_thunder', mats: { ancient_wood: 3, wisp_flame: 2 }, difficulty: 12 },
    // --- 星盤（大工） ---
    oak_board:      { name: 'カシの星盤',   type: 'starboard', slot: 'weapon', rank: 1, fixedCard: 'star_beam', mats: { oak: 2, quartz: 1 },             difficulty: 2 },
    maple_board:    { name: 'カエデの星盤', type: 'starboard', slot: 'weapon', rank: 2, fixedCard: 'star_read', mats: { maple: 2, quartz: 1, bat_wing: 1 }, difficulty: 7 },
    ancient_board:  { name: '古木の星盤',   type: 'starboard', slot: 'weapon', rank: 3, fixedCard: 'star_veil', mats: { ancient_wood: 2, star_shard: 1 }, difficulty: 12 },
    // --- ローブ（裁縫） ---
    flax_hat:       { name: '麻の帽子',     type: 'robe', slot: 'head', rank: 1, fixedCard: 'robe_ward',     mats: { flax: 2 },                       difficulty: 1 },
    silk_hat:       { name: '絹の帽子',     type: 'robe', slot: 'head', rank: 2, fixedCard: 'robe_barrier',  mats: { spider_silk: 2, flax: 1 },        difficulty: 5 },
    star_hat:       { name: '星絹の帽子',   type: 'robe', slot: 'head', rank: 3, fixedCard: 'robe_meditate', mats: { spider_silk: 2, star_shard: 1 },  difficulty: 11 },
    flax_robe:      { name: '麻のローブ',   type: 'robe', slot: 'body', rank: 1, fixedCard: 'robe_ward',     mats: { flax: 3, slime_gel: 1 },          difficulty: 2 },
    silk_robe:      { name: '絹のローブ',   type: 'robe', slot: 'body', rank: 2, fixedCard: 'robe_barrier',  mats: { spider_silk: 3, flax: 1 },        difficulty: 7 },
    star_robe:      { name: '星絹のローブ', type: 'robe', slot: 'body', rank: 3, fixedCard: 'robe_mend',     mats: { spider_silk: 3, queen_scale: 1 }, difficulty: 13 },
    // --- 短剣（鍛冶） ---
    copper_dagger:  { name: '銅の短剣',       type: 'dagger', slot: 'weapon', rank: 1, fixedCard: 'dagger_stab',    mats: { copper_ore: 2, oak: 1 },          difficulty: 1 },
    iron_dagger:    { name: '鉄の短剣',       type: 'dagger', slot: 'weapon', rank: 2, fixedCard: 'dagger_shadow',  mats: { iron_ore: 2, bat_wing: 1 },       difficulty: 6 },
    mithril_dagger: { name: 'ミスリルの短剣', type: 'dagger', slot: 'weapon', rank: 3, fixedCard: 'dagger_flurry',  mats: { mithril_ore: 2, hornet_sting: 2 }, difficulty: 12 },
    // --- 弓（大工） ---
    oak_bow:        { name: 'カシの弓',       type: 'bow', slot: 'weapon', rank: 1, fixedCard: 'bow_shot',         mats: { oak: 3, flax: 1 },                difficulty: 1 },
    maple_bow:      { name: 'カエデの弓',     type: 'bow', slot: 'weapon', rank: 2, fixedCard: 'bow_aim',          mats: { maple: 3, spider_silk: 1 },       difficulty: 6 },
    ancient_bow:    { name: '古木の弓',       type: 'bow', slot: 'weapon', rank: 3, fixedCard: 'bow_rain',         mats: { ancient_wood: 3, elder_heart: 1 }, difficulty: 12 },
    // --- 錫杖（大工） ---
    oak_scepter:    { name: 'カシの錫杖',     type: 'scepter', slot: 'weapon', rank: 1, fixedCard: 'scep_smite',   mats: { oak: 2, quartz: 1 },              difficulty: 2 },
    maple_scepter:  { name: 'カエデの錫杖',   type: 'scepter', slot: 'weapon', rank: 2, fixedCard: 'scep_ward',    mats: { maple: 2, quartz: 1, glowcap: 1 }, difficulty: 7 },
    ancient_scepter:{ name: '古木の錫杖',     type: 'scepter', slot: 'weapon', rank: 3, fixedCard: 'scep_judgement', mats: { ancient_wood: 2, star_shard: 1 }, difficulty: 12 },
    // --- 軽装（裁縫） ---
    cloth_hood:     { name: '布の頭巾',       type: 'light', slot: 'head', rank: 1, fixedCard: 'light_dodge',  mats: { flax: 1, bat_wing: 1 },          difficulty: 1 },
    pelt_cap:       { name: '毛皮の帽子',     type: 'light', slot: 'head', rank: 2, fixedCard: 'light_scout',  mats: { wolf_pelt: 2 },                  difficulty: 5 },
    shadow_hood:    { name: '影の頭巾',       type: 'light', slot: 'head', rank: 3, fixedCard: 'light_rush',   mats: { spider_silk: 2, star_shard: 1 }, difficulty: 11 },
    cloth_tunic:    { name: '布の服',         type: 'light', slot: 'body', rank: 1, fixedCard: 'light_dodge',  mats: { flax: 2, slime_gel: 1 },         difficulty: 2 },
    pelt_coat:      { name: '毛皮の服',       type: 'light', slot: 'body', rank: 2, fixedCard: 'light_evade',  mats: { wolf_pelt: 2, flax: 1 },         difficulty: 7 },
    shadow_garb:    { name: '影の装束',       type: 'light', slot: 'body', rank: 3, fixedCard: 'light_step',   mats: { toad_skin: 2, spider_silk: 2 }, difficulty: 13 },
    // --- アクセサリー（細工） パワーは作るときに選ぶ ---
    copper_ring:    { name: '銅の指輪',     type: 'accessory', slot: 'accessory', rank: 1, fixedCard: 'acc_charm', mats: { copper_ore: 1, quartz: 1 },  difficulty: 2 },
    silver_neck:    { name: '水晶の首飾り', type: 'accessory', slot: 'accessory', rank: 2, fixedCard: 'acc_throw', mats: { iron_ore: 1, quartz: 2 },    difficulty: 6 },
    star_charm:     { name: '星のお守り',   type: 'accessory', slot: 'accessory', rank: 3, fixedCard: 'acc_quick', mats: { star_shard: 1, quartz: 2 },  difficulty: 11 }
  };

  // --- ランク4（難易度2以上のダンジョンで出る上位素材で作る） ---
  Object.assign(bases, {
    star_sword:    { name: '星鋼の剣',     type: 'sword',     slot: 'weapon', rank: 4, fixedCard: 'sword_breaker',  mats: { star_steel: 3, dragon_scale: 1 },    difficulty: 17 },
    star_dagger:   { name: '星鋼の短剣',   type: 'dagger',    slot: 'weapon', rank: 4, fixedCard: 'dagger_venom',   mats: { star_steel: 2, phantom_cloth: 1 },   difficulty: 17 },
    star_helm:     { name: '星鋼の兜',     type: 'heavy',     slot: 'head',   rank: 4, fixedCard: 'heavy_harden',   mats: { star_steel: 2, gargoyle_stone: 1 },  difficulty: 16 },
    star_armor:    { name: '星鋼の鎧',     type: 'heavy',     slot: 'body',   rank: 4, fixedCard: 'heavy_ironwall', mats: { star_steel: 4, gargoyle_stone: 1 },  difficulty: 18 },
    world_staff:   { name: '世界樹の杖',   type: 'staff',     slot: 'weapon', rank: 4, fixedCard: 'staff_blizzard', mats: { world_wood: 3, dragon_scale: 1 },    difficulty: 17 },
    world_board:   { name: '世界樹の星盤', type: 'starboard', slot: 'weapon', rank: 4, fixedCard: 'star_comet',     mats: { world_wood: 2, star_shard: 2 },      difficulty: 17 },
    world_bow:     { name: '世界樹の弓',   type: 'bow',       slot: 'weapon', rank: 4, fixedCard: 'bow_pin',        mats: { world_wood: 3, phantom_cloth: 1 },   difficulty: 17 },
    world_scepter: { name: '世界樹の錫杖', type: 'scepter',   slot: 'weapon', rank: 4, fixedCard: 'scep_offering',  mats: { world_wood: 2, gargoyle_stone: 1 },  difficulty: 17 },
    moon_hat:      { name: '月光の帽子',   type: 'robe',      slot: 'head',   rank: 4, fixedCard: 'robe_insight',   mats: { moon_silk: 2, phantom_cloth: 1 },    difficulty: 16 },
    moon_robe:     { name: '月光のローブ', type: 'robe',      slot: 'body',   rank: 4, fixedCard: 'robe_ward',      mats: { moon_silk: 3, phantom_cloth: 1 },    difficulty: 18 },
    moon_hood:     { name: '月光の頭巾',   type: 'light',     slot: 'head',   rank: 4, fixedCard: 'light_scout',    mats: { moon_silk: 2, dragon_scale: 1 },     difficulty: 16 },
    moon_garb:     { name: '月光の装束',   type: 'light',     slot: 'body',   rank: 4, fixedCard: 'light_evade',    mats: { moon_silk: 3, dragon_scale: 1 },     difficulty: 18 },
    dragon_amulet: { name: '竜玉の首飾り', type: 'accessory', slot: 'accessory', rank: 4, fixedCard: 'acc_second', mats: { dragon_scale: 1, star_steel: 1, quartz: 2 }, difficulty: 16 }
  });

  // --- ランク5（灼熱の火山・氷晶の洞・天空の庭の素材で作る） ---
  Object.assign(bases, {
    ori_sword:     { name: 'オリハルコンの剣',   type: 'sword',     slot: 'weapon', rank: 5, fixedCard: 'sword_finisher',   mats: { orichalcum: 3, griffin_claw: 1 },               difficulty: 22 },
    ori_dagger:    { name: 'オリハルコンの短剣', type: 'dagger',    slot: 'weapon', rank: 5, fixedCard: 'dagger_backstab',  mats: { orichalcum: 2, harpy_feather: 1, imp_horn: 1 }, difficulty: 22 },
    ori_helm:      { name: 'オリハルコンの兜',   type: 'heavy',     slot: 'head',   rank: 5, fixedCard: 'heavy_roar',       mats: { orichalcum: 2, yeti_fur: 1 },                   difficulty: 21 },
    ori_armor:     { name: 'オリハルコンの鎧',   type: 'heavy',     slot: 'body',   rank: 5, fixedCard: 'heavy_charge',     mats: { orichalcum: 4, magma_core: 1 },                 difficulty: 23 },
    sky_staff:     { name: '天空樹の杖',         type: 'staff',     slot: 'weapon', rank: 5, fixedCard: 'staff_spark',      mats: { sky_wood: 3, flame_heart: 1 },                  difficulty: 22 },
    sky_board:     { name: '天空樹の星盤',       type: 'starboard', slot: 'weapon', rank: 5, fixedCard: 'star_nova',        mats: { sky_wood: 2, sun_stone: 1, frost_crystal: 1 },  difficulty: 22 },
    sky_bow:       { name: '天空樹の弓',         type: 'bow',       slot: 'weapon', rank: 5, fixedCard: 'bow_pierce',       mats: { sky_wood: 3, harpy_feather: 1 },                difficulty: 22 },
    sky_scepter:   { name: '天空樹の錫杖',       type: 'scepter',   slot: 'weapon', rank: 5, fixedCard: 'scep_sanctuary',   mats: { sky_wood: 2, ice_heart: 1 },                    difficulty: 22 },
    cloud_hat:     { name: '雲絹の帽子',         type: 'robe',      slot: 'head',   rank: 5, fixedCard: 'robe_calm',        mats: { cloud_silk: 2, frost_crystal: 1 },              difficulty: 21 },
    cloud_robe:    { name: '雲絹のローブ',       type: 'robe',      slot: 'body',   rank: 5, fixedCard: 'robe_shroud',      mats: { cloud_silk: 3, fire_scale: 1 },                 difficulty: 23 },
    cloud_hood:    { name: '雲絹の頭巾',         type: 'light',     slot: 'head',   rank: 5, fixedCard: 'light_shadowstep', mats: { cloud_silk: 2, ice_fang: 1 },                   difficulty: 21 },
    cloud_garb:    { name: '雲絹の装束',         type: 'light',     slot: 'body',   rank: 5, fixedCard: 'light_vanish',     mats: { cloud_silk: 3, harpy_feather: 1 },              difficulty: 23 },
    sun_ring:      { name: '陽光の指輪',         type: 'accessory', slot: 'accessory', rank: 5, fixedCard: 'acc_guard',    mats: { sun_stone: 1, orichalcum: 1, quartz: 2 },       difficulty: 21 }
  });

  // --- ランク6（深淵の城の素材で作る） ---
  Object.assign(bases, {
    ada_sword:     { name: 'アダマントの剣',     type: 'sword',     slot: 'weapon', rank: 6, fixedCard: 'sword_rally',      mats: { adamant: 3, storm_horn: 1 },                    difficulty: 27 },
    ada_dagger:    { name: 'アダマントの短剣',   type: 'dagger',    slot: 'weapon', rank: 6, fixedCard: 'dagger_juggle',    mats: { adamant: 2, shadow_cloth: 1 },                  difficulty: 27 },
    ada_helm:      { name: 'アダマントの兜',     type: 'heavy',     slot: 'head',   rank: 6, fixedCard: 'heavy_fortress',   mats: { adamant: 2, dark_bone: 1 },                     difficulty: 26 },
    ada_armor:     { name: 'アダマントの鎧',     type: 'heavy',     slot: 'body',   rank: 6, fixedCard: 'heavy_ironwall',   mats: { adamant: 4, dark_bone: 1 },                     difficulty: 28 },
    ebony_staff:   { name: '黒檀の杖',           type: 'staff',     slot: 'weapon', rank: 6, fixedCard: 'staff_chain',      mats: { ebony: 3, blood_gem: 1 },                       difficulty: 27 },
    ebony_board:   { name: '黒檀の星盤',         type: 'starboard', slot: 'weapon', rank: 6, fixedCard: 'star_lines',       mats: { ebony: 2, blood_gem: 1, sun_stone: 1 },         difficulty: 27 },
    ebony_bow:     { name: '黒檀の弓',           type: 'bow',       slot: 'weapon', rank: 6, fixedCard: 'bow_triple',       mats: { ebony: 3, storm_horn: 1 },                      difficulty: 27 },
    ebony_scepter: { name: '黒檀の錫杖',         type: 'scepter',   slot: 'weapon', rank: 6, fixedCard: 'scep_blessing',    mats: { ebony: 2, abyss_heart: 1 },                     difficulty: 27 },
    void_hat:      { name: '虚無の帽子',         type: 'robe',      slot: 'head',   rank: 6, fixedCard: 'robe_aura',        mats: { void_silk: 2, shadow_cloth: 1 },                difficulty: 26 },
    void_robe:     { name: '虚無のローブ',       type: 'robe',      slot: 'body',   rank: 6, fixedCard: 'robe_restore',     mats: { void_silk: 3, dark_bone: 1 },                   difficulty: 28 },
    void_hood:     { name: '虚無の頭巾',         type: 'light',     slot: 'head',   rank: 6, fixedCard: 'light_camo',       mats: { void_silk: 2, shadow_cloth: 1 },                difficulty: 26 },
    void_garb:     { name: '虚無の装束',         type: 'light',     slot: 'body',   rank: 6, fixedCard: 'light_tailwind',   mats: { void_silk: 3, blood_gem: 1 },                   difficulty: 28 },
    abyss_crown:   { name: '深淵の冠',           type: 'accessory', slot: 'accessory', rank: 6, fixedCard: 'acc_whistle',  mats: { abyss_heart: 1, adamant: 1, blood_gem: 1 },     difficulty: 26 }
  });

  // 採集道具（良い道具ほど採集ミニゲームが楽になる）
  const tools = {
    copper_pick:  { name: '銅のツルハシ',     kind: 'pick', power: 1.0, craft: 'smith',     mats: { copper_ore: 2, oak: 1 },        difficulty: 1 },
    iron_pick:    { name: '鉄のツルハシ',     kind: 'pick', power: 1.5, craft: 'smith',     mats: { iron_ore: 2, maple: 1 },        difficulty: 6 },
    mithril_pick: { name: 'ミスリルのツルハシ', kind: 'pick', power: 2.0, craft: 'smith',   mats: { mithril_ore: 2, ancient_wood: 1 }, difficulty: 12 },
    copper_axe:   { name: '銅のオノ',         kind: 'axe',  power: 1.0, craft: 'carpenter', mats: { oak: 2, copper_ore: 1 },        difficulty: 1 },
    iron_axe:     { name: '鉄のオノ',         kind: 'axe',  power: 1.5, craft: 'carpenter', mats: { maple: 2, iron_ore: 1 },        difficulty: 6 },
    mithril_axe:  { name: 'ミスリルのオノ',   kind: 'axe',  power: 2.0, craft: 'carpenter', mats: { ancient_wood: 2, mithril_ore: 1 }, difficulty: 12 },
    star_pick:    { name: '星鋼のツルハシ',   kind: 'pick', power: 2.5, craft: 'smith',     mats: { star_steel: 2, world_wood: 1 },    difficulty: 16 },
    star_axe:     { name: '星鋼のオノ',       kind: 'axe',  power: 2.5, craft: 'carpenter', mats: { world_wood: 2, star_steel: 1 },    difficulty: 16 },
    ori_pick:     { name: 'オリハルコンのツルハシ', kind: 'pick', power: 3.0, craft: 'smith', mats: { orichalcum: 2, sky_wood: 1 },  difficulty: 21 },
    ori_axe:      { name: 'オリハルコンのオノ', kind: 'axe',  power: 3.0, craft: 'carpenter', mats: { sky_wood: 2, orichalcum: 1 },  difficulty: 21 },
    ada_pick:     { name: 'アダマントのツルハシ', kind: 'pick', power: 3.5, craft: 'smith',   mats: { adamant: 2, ebony: 1 },        difficulty: 26 },
    ada_axe:      { name: 'アダマントのオノ', kind: 'axe',  power: 3.5, craft: 'carpenter',   mats: { ebony: 2, adamant: 1 },        difficulty: 26 }
  };

  R.DATA.equipment = { types, rankStats, statRolls, gradeMult, slotNames, bases, tools };
})(globalThis.RASEN = globalThis.RASEN || {});
