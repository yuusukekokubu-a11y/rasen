// 付与効果（ランダム枠に出る。その装備の固定カード、アクセならパワーカードに付く）
// 原本スプレッドシート「付与効果」タブの18種
//
//   appliesTo : どのカードに付けられるか
//               'any'     … どれでも
//               'nonPower'… パワー以外
//               'potency' … ダメージ・ブロック・回復のどれかを持つカード（威力が意味を持つもの）
//               'attack'  … ダメージを持つカード
//               'costly'  … コスト1以上のカード
//   rarity    : 1=よく出る 2=ふつう 3=出にくい（生産Lvが高いほど出にくい物が出やすい）
//   mult      : 威力（ダメージ・ブロック・回復の量）への倍率
(function (R) {
  R.DATA = R.DATA || {};
  R.DATA.enchants = {
    list: {
      innate:      { name: '初手確定',       rarity: 2, appliesTo: 'any',      desc: '戦闘開始時に必ず手札に来る' },
      retain:      { name: '保留',           rarity: 1, appliesTo: 'nonPower', desc: 'ターン終了時に捨てられず手札に残る' },
      onDraw:      { name: '引いたとき発動', rarity: 1, appliesTo: 'any',      desc: '手札に来たときブロック3', effects: [{ t: 'block', v: 3, scale: 'none' }] },
      costReduce:  { name: 'コスト軽減',     rarity: 3, appliesTo: 'costly',   desc: 'コスト-1' },
      lightweight: { name: '軽量化',         rarity: 2, appliesTo: 'costly',   desc: 'コスト0になるが威力×0.5', mult: 0.5, requires: 'potency' },
      exhaustBoost:{ name: '廃棄＋威力上昇', rarity: 2, appliesTo: 'potency',  desc: '使うと廃棄、威力×1.6', mult: 1.6 },
      lastWords:   { name: '置き土産',       rarity: 1, appliesTo: 'nonPower', desc: '廃棄されたとき1枚引く' },
      onDiscard:   { name: '捨て札発動',     rarity: 1, appliesTo: 'nonPower', desc: 'カードの効果で捨てられたとき、威力×0.5で効果発動' },
      link:        { name: '連携',           rarity: 1, appliesTo: 'potency',  desc: '直前に別キャラのカードを使っていれば威力×1.3', mult: 1.3 },
      chain:       { name: '同職連打',       rarity: 1, appliesTo: 'potency',  desc: '直前に同じキャラのカードを使っていれば威力×1.3', mult: 1.3 },
      multi:       { name: '連撃',           rarity: 2, appliesTo: 'attack',   desc: '効果が2回発動するが、1回あたりの威力×0.6', mult: 0.6 },
      element:     { name: '属性',           rarity: 2, appliesTo: 'attack',   desc: '炎・氷・雷のどれかが付き、状態異常1を与える' },
      desperate:   { name: '背水',           rarity: 1, appliesTo: 'potency',  desc: 'パーティHPが半分以下なら威力×1.4', mult: 1.4 },
      steadfast:   { name: '堅守',           rarity: 1, appliesTo: 'potency',  desc: 'ブロックが残っていれば威力×1.3', mult: 1.3 },
      training:    { name: '鍛錬',           rarity: 1, appliesTo: 'potency',  desc: '使うたびこの戦闘中の威力+15%', step: 0.15 },
      resonance:   { name: '共鳴',           rarity: 1, appliesTo: 'potency',  desc: 'パワーを使用済みなら威力×1.3', mult: 1.3 },
      drawOne:     { name: 'ドロー付き',     rarity: 2, appliesTo: 'nonPower', desc: '使うと1枚引く' },
      foresight:   { name: '予見',           rarity: 2, appliesTo: 'nonPower', desc: '使うと山札の上3枚を見て並べ替える' }
    },
    // 同時に付かない組み合わせ（危険な組み合わせ・意味のない組み合わせ）
    conflicts: [
      ['costReduce', 'drawOne'],
      ['lightweight', 'drawOne'],
      ['costReduce', 'lightweight'],
      ['lightweight', 'multi'],
      ['exhaustBoost', 'training'],
      ['exhaustBoost', 'retain'],
      ['link', 'chain']
    ],
    // 付与効果の「属性」で付く属性と状態異常
    elements: {
      fire:    { name: '炎', status: 'burn' },
      ice:     { name: '氷', status: 'freeze' },
      thunder: { name: '雷', status: 'shock' }
    },
    // ランダム枠1つが「付与効果」になる確率（残りは「ステータス上昇」）
    enchantChance: 0.5
  };
})(globalThis.RASEN = globalThis.RASEN || {});
