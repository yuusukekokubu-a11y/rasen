// 生産の設定（数値は仮置き）
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.crafting = {
    // 生産ライフ → 作れる装備種
    lives: {
      smith:     { name: '鍛冶', types: ['sword', 'heavy', 'dagger'], tools: true },
      carpenter: { name: '大工', types: ['staff', 'starboard', 'bow', 'scepter'], tools: true },
      tailor:    { name: '裁縫', types: ['robe', 'light'] },
      jeweler:   { name: '細工', types: ['accessory'], items: true }
    },

    // ===== 品質ミニゲーム「鍛造」 =====
    // 毎回「強く叩く／丁寧に叩く／冷ます」から選ぶ。叩くと進み具合と一緒に熱がたまり、
    // 熱が限界を超える（過熱）と品質が1段下がる。少ない回数で仕上げるほど高品質
    game: {
      baseHits: 5,                  // 1回の基本の進み量 = 100 / baseHits × Lv補正
      lvDiffRate: 0.04,             // 生産Lvと難易度の差1につき、進む量が何%変わるか
      lvMultMin: 0.5, lvMultMax: 2.0,
      heatLvRate: 0.035,            // 生産Lvと難易度の差1につき、熱のたまり方が何%減るか
      heatMultMin: 0.5, heatMultMax: 1.5,
      // progress: 基本の進み量に対する倍率の範囲 / heat: たまる熱の範囲（マイナスは下がる）
      actions: {
        strong:  { name: '強く叩く',   desc: '大きく進むが熱が多くたまる', progress: [1.0, 1.8], heat: [22, 36] },
        careful: { name: '丁寧に叩く', desc: '少しだけ進む・熱は少し',     progress: [0.4, 0.7], heat: [5, 12] },
        cool:    { name: '冷ます',     desc: '進まないが熱が下がる',       progress: [0, 0],     heat: [-45, -35] }
      },
      heatLimit: 100,               // これを超えると過熱
      heatAfterOverheat: 60,        // 過熱したあとの熱
      // 何回以内に仕上げればどの品質か（過熱1回ごとに1段下がる）
      qualityHits: { best: 4, fine: 7 }
    },

    // ===== ランダム2枠 =====
    // 枠の良さ（grade 0=並 1=良 2=極）の出やすさ。生産Lvが難易度を上回るほど良い枠が出やすい
    //   重み = base + perLv × (生産Lv − 難易度)。下限 min
    gradeWeights: [
      { base: 60, perLv: -4, min: 10 },
      { base: 30, perLv: 0,  min: 20 },
      { base: 10, perLv: 3,  min: 2 }
    ],
    // 付与効果を選ぶときの「出にくさ（rarity）」ごとの重み。良い枠ほど出にくい付与効果が出やすい
    enchantRarityWeights: [
      { 1: 6, 2: 3, 3: 1 },   // 並
      { 1: 4, 2: 4, 3: 2 },   // 良
      { 1: 2, 2: 4, 3: 4 }    // 極
    ],
    // ステータス上昇で選ばれるステータス
    statChoices: ['hp', 'atk', 'def', 'mag'],

    // ===== 経験値 =====
    exp: { base: 14, perDifficulty: 2, quality: { normal: 1.0, fine: 1.2, best: 1.5 }, tool: 8 }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
