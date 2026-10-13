// 職業
//   weapon / armor : 装備できる武器種・防具種（data/equipment.js の type）
//   powers         : パワーカードの一覧。並び順が解禁順（先頭は最初から使える）
//   enabled        : false の職業はパーティ選択に出ない（未実装の職業）
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.jobs = {
    swordsman:  { name: '剣士',     weapon: 'sword',     armor: 'heavy', enabled: true,
      desc: '攻撃と防御の安定型',
      powers: ['pw_sw_fighting', 'pw_sw_stance', 'pw_sw_might', 'pw_sw_vow', 'pw_sw_counter', 'pw_sw_iron'] },
    mage:       { name: '魔法使い', weapon: 'staff',     armor: 'robe',  enabled: true,
      desc: '属性・高コスト高火力',
      powers: ['pw_mg_cycle', 'pw_mg_inferno', 'pw_mg_amplify', 'pw_mg_quickcast', 'pw_mg_frost', 'pw_mg_torrent'] },
    astrologer: { name: '占星師',   weapon: 'starboard', armor: 'robe',  enabled: true,
      desc: 'バフ（味方強化）・ドロー操作',
      powers: ['pw_as_stargaze', 'pw_as_aegis', 'pw_as_orbit', 'pw_as_zodiac', 'pw_as_foresee', 'pw_as_meteor'] },
    thief:      { name: '盗賊',     weapon: 'dagger',    armor: 'light', enabled: true,
      desc: '捨て軸（カードを捨てて得をする）',
      powers: ['pw_th_shadow', 'pw_th_nimble', 'pw_th_mist', 'pw_th_vital', 'pw_th_ambush', 'pw_th_tricks'] },
    archer:     { name: '弓使い',   weapon: 'bow',       armor: 'light', enabled: true,
      desc: '連続攻撃・手数',
      powers: ['pw_ar_stance', 'pw_ar_quiver', 'pw_ar_eagle', 'pw_ar_hunter', 'pw_ar_barrage', 'pw_ar_trueshot'] },
    priest:     { name: '僧侶',     weapon: 'scepter',   armor: 'robe',  enabled: true,
      desc: '結界（ターンをまたぐ盾）・廃棄軸',
      powers: ['pw_pr_ward', 'pw_pr_ascetic', 'pw_pr_grace', 'pw_pr_faith', 'pw_pr_spring', 'pw_pr_wrath'] }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
