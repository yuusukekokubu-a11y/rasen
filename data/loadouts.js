// 決まった装備の組み合わせ（初期装備・シミュレーター用）
//
// 装備1つの書き方：
//   { base:'copper_sword', quality:'normal'|'fine'|'best', randomCard:'sword_twin',
//     slots:[ {kind:'stat', stat:'atk', value:2}, {kind:'enchant', id:'link'} ],
//     power:'pw_sw_fighting' }   ← power はアクセサリーのみ
(function (R) {
  R.DATA = R.DATA || {};

  // 職業ごとの初期装備（ランク1・ふつう品質・ランダム枠なし）
  const starter = {
    swordsman: {
      weapon:    { base: 'copper_sword', randomCard: 'sword_twin' },
      head:      { base: 'copper_helm',  randomCard: 'heavy_endure' },
      body:      { base: 'copper_armor', randomCard: 'heavy_bash' },
      accessory: { base: 'copper_ring',  randomCard: 'acc_throw', power: 'pw_sw_fighting' }
    },
    mage: {
      weapon:    { base: 'oak_staff',    randomCard: 'staff_bolt' },
      head:      { base: 'flax_hat',     randomCard: 'robe_meditate' },
      body:      { base: 'flax_robe',    randomCard: 'robe_barrier' },
      accessory: { base: 'copper_ring',  randomCard: 'acc_spark', power: 'pw_mg_cycle' }
    },
    astrologer: {
      weapon:    { base: 'oak_board',    randomCard: 'star_blessing' },
      head:      { base: 'flax_hat',     randomCard: 'robe_insight' },
      body:      { base: 'flax_robe',    randomCard: 'robe_ward' },
      accessory: { base: 'copper_ring',  randomCard: 'acc_spark', power: 'pw_as_stargaze' }
    },
    thief: {
      weapon:    { base: 'copper_dagger', randomCard: 'dagger_prepare' },
      head:      { base: 'cloth_hood',    randomCard: 'light_rush' },
      body:      { base: 'cloth_tunic',   randomCard: 'light_step' },
      accessory: { base: 'copper_ring',   randomCard: 'acc_throw', power: 'pw_th_shadow' }
    },
    archer: {
      weapon:    { base: 'oak_bow',       randomCard: 'bow_quick' },
      head:      { base: 'cloth_hood',    randomCard: 'light_step' },
      body:      { base: 'cloth_tunic',   randomCard: 'light_dodge' },
      accessory: { base: 'copper_ring',   randomCard: 'acc_charm', power: 'pw_ar_stance' }
    },
    priest: {
      weapon:    { base: 'oak_scepter',   randomCard: 'scep_purge' },
      head:      { base: 'flax_hat',      randomCard: 'robe_barrier' },
      body:      { base: 'flax_robe',     randomCard: 'robe_ward' },
      accessory: { base: 'copper_ring',   randomCard: 'acc_charm', power: 'pw_pr_ward' }
    }
  };

  // シミュレーター用のプリセット
  const presets = {
    starter: {
      name: '初期装備（剣士・魔法使い・占星師）',
      party: [
        { job: 'swordsman',  gear: starter.swordsman },
        { job: 'mage',       gear: starter.mage },
        { job: 'astrologer', gear: starter.astrologer }
      ]
    },
    starter_b: {
      name: '初期装備（盗賊・弓使い・僧侶）',
      party: [
        { job: 'thief',  gear: starter.thief },
        { job: 'archer', gear: starter.archer },
        { job: 'priest', gear: starter.priest }
      ]
    },
    starter_c: {
      name: '初期装備（剣士・弓使い・僧侶）',
      party: [
        { job: 'swordsman', gear: starter.swordsman },
        { job: 'archer',    gear: starter.archer },
        { job: 'priest',    gear: starter.priest }
      ]
    },
    rank2_plain: {
      name: 'ランク2・ふつう・付与なし',
      party: [
        { job: 'swordsman', gear: {
          weapon: { base: 'iron_sword', randomCard: 'sword_heavy' },
          head: { base: 'iron_helm', randomCard: 'heavy_defend' },
          body: { base: 'iron_armor', randomCard: 'heavy_harden' },
          accessory: { base: 'silver_neck', randomCard: 'acc_charm', power: 'pw_sw_fighting' } } },
        { job: 'mage', gear: {
          weapon: { base: 'maple_staff', randomCard: 'staff_fire' },
          head: { base: 'silk_hat', randomCard: 'robe_ward' },
          body: { base: 'silk_robe', randomCard: 'robe_meditate' },
          accessory: { base: 'silver_neck', randomCard: 'acc_spark', power: 'pw_mg_cycle' } } },
        { job: 'astrologer', gear: {
          weapon: { base: 'maple_board', randomCard: 'star_beam' },
          head: { base: 'silk_hat', randomCard: 'robe_insight' },
          body: { base: 'silk_robe', randomCard: 'robe_ward' },
          accessory: { base: 'silver_neck', randomCard: 'acc_quick', power: 'pw_as_stargaze' } } }
      ]
    },
    rank3_plain: {
      name: 'ランク3・ふつう・付与なし',
      party: [
        { job: 'swordsman', gear: {
          weapon: { base: 'mithril_sword', randomCard: 'sword_heavy' },
          head: { base: 'mithril_helm', randomCard: 'heavy_defend' },
          body: { base: 'mithril_armor', randomCard: 'heavy_harden' },
          accessory: { base: 'star_charm', randomCard: 'acc_charm', power: 'pw_sw_fighting' } } },
        { job: 'mage', gear: {
          weapon: { base: 'ancient_staff', randomCard: 'staff_fire' },
          head: { base: 'star_hat', randomCard: 'robe_ward' },
          body: { base: 'star_robe', randomCard: 'robe_barrier' },
          accessory: { base: 'star_charm', randomCard: 'acc_spark', power: 'pw_mg_cycle' } } },
        { job: 'astrologer', gear: {
          weapon: { base: 'ancient_board', randomCard: 'star_beam' },
          head: { base: 'star_hat', randomCard: 'robe_insight' },
          body: { base: 'star_robe', randomCard: 'robe_ward' },
          accessory: { base: 'star_charm', randomCard: 'acc_quick', power: 'pw_as_stargaze' } } }
      ]
    },
    rank4_plain: {
      name: 'ランク4・ふつう・付与なし',
      party: [
        { job: 'swordsman', gear: {
          weapon: { base: 'star_sword', randomCard: 'sword_heavy' },
          head: { base: 'star_helm', randomCard: 'heavy_defend' },
          body: { base: 'star_armor', randomCard: 'heavy_endure' },
          accessory: { base: 'dragon_amulet', randomCard: 'acc_charm', power: 'pw_sw_fighting' } } },
        { job: 'mage', gear: {
          weapon: { base: 'world_staff', randomCard: 'staff_fire' },
          head: { base: 'moon_hat', randomCard: 'robe_ward' },
          body: { base: 'moon_robe', randomCard: 'robe_barrier' },
          accessory: { base: 'dragon_amulet', randomCard: 'acc_spark', power: 'pw_mg_cycle' } } },
        { job: 'astrologer', gear: {
          weapon: { base: 'world_board', randomCard: 'star_beam' },
          head: { base: 'moon_hat', randomCard: 'robe_meditate' },
          body: { base: 'moon_robe', randomCard: 'robe_ward' },
          accessory: { base: 'dragon_amulet', randomCard: 'acc_quick', power: 'pw_as_stargaze' } } }
      ]
    },
    rank5_plain: {
      name: 'ランク5・ふつう・付与なし',
      party: [
        { job: 'swordsman', gear: {
          weapon: { base: 'ori_sword', randomCard: 'sword_heavy' },
          head: { base: 'ori_helm', randomCard: 'heavy_defend' },
          body: { base: 'ori_armor', randomCard: 'heavy_endure' },
          accessory: { base: 'sun_ring', randomCard: 'acc_charm', power: 'pw_sw_fighting' } } },
        { job: 'mage', gear: {
          weapon: { base: 'sky_staff', randomCard: 'staff_fire' },
          head: { base: 'cloud_hat', randomCard: 'robe_ward' },
          body: { base: 'cloud_robe', randomCard: 'robe_barrier' },
          accessory: { base: 'sun_ring', randomCard: 'acc_spark', power: 'pw_mg_cycle' } } },
        { job: 'astrologer', gear: {
          weapon: { base: 'sky_board', randomCard: 'star_beam' },
          head: { base: 'cloud_hat', randomCard: 'robe_meditate' },
          body: { base: 'cloud_robe', randomCard: 'robe_ward' },
          accessory: { base: 'sun_ring', randomCard: 'acc_quick', power: 'pw_as_stargaze' } } }
      ]
    },
    rank6_plain: {
      name: 'ランク6・ふつう・付与なし',
      party: [
        { job: 'swordsman', gear: {
          weapon: { base: 'ada_sword', randomCard: 'sword_heavy' },
          head: { base: 'ada_helm', randomCard: 'heavy_defend' },
          body: { base: 'ada_armor', randomCard: 'heavy_endure' },
          accessory: { base: 'abyss_crown', randomCard: 'acc_charm', power: 'pw_sw_fighting' } } },
        { job: 'mage', gear: {
          weapon: { base: 'ebony_staff', randomCard: 'staff_fire' },
          head: { base: 'void_hat', randomCard: 'robe_ward' },
          body: { base: 'void_robe', randomCard: 'robe_barrier' },
          accessory: { base: 'abyss_crown', randomCard: 'acc_spark', power: 'pw_mg_cycle' } } },
        { job: 'astrologer', gear: {
          weapon: { base: 'ebony_board', randomCard: 'star_beam' },
          head: { base: 'void_hat', randomCard: 'robe_meditate' },
          body: { base: 'void_robe', randomCard: 'robe_ward' },
          accessory: { base: 'abyss_crown', randomCard: 'acc_quick', power: 'pw_as_stargaze' } } }
      ]
    },
    rank2_enchanted: {
      name: 'ランク2・上質・付与あり（厳選済みの例）',
      party: [
        { job: 'swordsman', gear: {
          weapon: { base: 'iron_sword', quality: 'fine', randomCard: 'sword_heavy', slots: [{ kind: 'enchant', id: 'link' }, { kind: 'stat', stat: 'atk', value: 2 }] },
          head: { base: 'iron_helm', quality: 'fine', randomCard: 'heavy_defend', slots: [{ kind: 'stat', stat: 'hp', value: 5 }, { kind: 'stat', stat: 'def', value: 1 }] },
          body: { base: 'iron_armor', quality: 'fine', randomCard: 'heavy_harden', slots: [{ kind: 'enchant', id: 'steadfast' }, { kind: 'stat', stat: 'hp', value: 5 }] },
          accessory: { base: 'silver_neck', randomCard: 'acc_charm', power: 'pw_sw_fighting', slots: [{ kind: 'enchant', id: 'innate' }, { kind: 'stat', stat: 'atk', value: 2 }] } } },
        { job: 'mage', gear: {
          weapon: { base: 'maple_staff', quality: 'fine', randomCard: 'staff_fire', slots: [{ kind: 'enchant', id: 'multi' }, { kind: 'stat', stat: 'mag', value: 2 }] },
          head: { base: 'silk_hat', randomCard: 'robe_ward', slots: [{ kind: 'stat', stat: 'mag', value: 2 }, { kind: 'stat', stat: 'hp', value: 5 }] },
          body: { base: 'silk_robe', randomCard: 'robe_meditate', slots: [{ kind: 'enchant', id: 'drawOne' }, { kind: 'stat', stat: 'hp', value: 5 }] },
          accessory: { base: 'silver_neck', randomCard: 'acc_spark', power: 'pw_mg_cycle', slots: [{ kind: 'enchant', id: 'innate' }, { kind: 'stat', stat: 'mag', value: 2 }] } } },
        { job: 'astrologer', gear: {
          weapon: { base: 'maple_board', randomCard: 'star_beam', slots: [{ kind: 'enchant', id: 'retain' }, { kind: 'stat', stat: 'mag', value: 2 }] },
          head: { base: 'silk_hat', randomCard: 'robe_insight', slots: [{ kind: 'stat', stat: 'hp', value: 5 }, { kind: 'stat', stat: 'def', value: 1 }] },
          body: { base: 'silk_robe', randomCard: 'robe_ward', slots: [{ kind: 'stat', stat: 'hp', value: 5 }, { kind: 'stat', stat: 'mag', value: 2 }] },
          accessory: { base: 'silver_neck', randomCard: 'acc_quick', power: 'pw_as_stargaze', slots: [{ kind: 'enchant', id: 'innate' }, { kind: 'stat', stat: 'hp', value: 5 }] } } }
      ]
    }
  };

  R.DATA.loadouts = { starter, presets };
})(globalThis.RASEN = globalThis.RASEN || {});
