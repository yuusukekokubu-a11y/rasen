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

    // ===== 品質ミニゲーム =====
    // ゲージ100を埋める。1回の作業で進む量 = 100 / baseHits × Lv補正 × 当たり方の倍率
    game: {
      baseHits: 5,                  // レベル差なし・「ふつう」の当たりで何回で終わるか
      zoneMult: { great: 1.6, good: 1.0, miss: 0.4 },
      lvDiffRate: 0.06,             // 生産Lvと難易度の差1につき、進む量が何%変わるか
      lvMultMin: 0.5, lvMultMax: 2.0,
      goodWidth: 30, greatWidth: 8, widthPerLv: 1.2,
      // 何回以内に終わればどの品質か（早くクリアするほど高品質）
      qualityHits: { best: 4, fine: 6 }
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
    exp: { base: 10, perDifficulty: 2, quality: { normal: 1.0, fine: 1.2, best: 1.5 }, tool: 8 }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
