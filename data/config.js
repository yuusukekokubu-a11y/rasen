// ゲーム全体の基本数値（すべて仮置き。ここを書き換えれば調整できる）
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.config = {
    combat: {
      energyPerTurn: 4,     // 毎ターンのエネルギー
      handSize: 6,          // 毎ターン引く枚数
      maxHand: 10,          // 手札の上限（超えた分は捨て札へ）
      partySize: 3,
      maxTurns: 60,         // 無限ループ防止（シミュレーター用の打ち切りターン）
      weakMult: 0.75,       // 脱力：与ダメージ倍率
      vulnerableMult: 1.5,  // 弱体：被ダメージ倍率
      freezeMult: 0.7,      // 凍結：敵の攻撃ダメージ倍率（敵の行動が終わるたびに1減る）
      shockMult: 1.25,      // 感電：受けるダメージ倍率（敵の行動が終わるたびに1減る）
      itemSlots: 3,         // 持ち込みアイテム枠
      wardKeep: 0.4         // 結界：自分のターン開始時に残る割合（ブロックと違いターンをまたいで残る）
    },
    // キャラクターの素の能力（装備なしの状態）
    baseChar: { hp: 20, atk: 0, def: 0, mag: 0 },
    // 品質：固定ステータスへの倍率。最高品質は固定カードが強化版（＋）になる
    quality: {
      normal:  { name: 'ふつう', mult: 1.0, upgradeFixedCard: false },
      fine:    { name: '上質',   mult: 1.1, upgradeFixedCard: false },
      best:    { name: '最高',   mult: 1.2, upgradeFixedCard: true }
    },
    // 生産・採集レベル
    life: {
      maxLv: 30,
      // 次のLvまでの経験値 = base + perLv * 現在Lv
      expBase: 10,
      expPerLv: 6,
      // 細工Lvがこの値に達するごとに全職業のパワーが1つずつ解禁（初期は各職1つ）
      powerUnlockLvs: [1, 4, 8, 12, 16, 20, 24, 28]
    }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
