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

    // ===== 品質ミニゲーム「設計図はめ込み」 =====
    // 設計図（#のマス）を、手持ちのピースから選んで埋める。少ない手数で埋めるほど高品質。
    // 使ったピースは補充される。手数＝置いた回数＋捨てた回数（無料で捨てられる回数の分は数えない）
    puzzle: {
      // 部位ごとの設計図。small＝ランク1〜2、large＝ランク3以上
      //   best: この手数以内なら最高 / fine: この手数以内なら上質
      blueprints: {
        weapon: {
          small: { rows: ['...##', '..###', '.###.', '###..', '#....'], best: 4, fine: 5 },
          large: { rows: ['....##', '...###', '..###.', '.###..', '###...', '##....'], best: 5, fine: 7 }
        },
        head: {
          small: { rows: ['.###.', '#####', '##.##'], best: 4, fine: 5 },
          large: { rows: ['.####.', '######', '##..##', '##..##'], best: 6, fine: 7 }
        },
        body: {
          small: { rows: ['##.##', '#####', '.###.', '.###.'], best: 5, fine: 6 },
          large: { rows: ['##..##', '######', '.####.', '.####.'], best: 6, fine: 7 }
        },
        accessory: {
          small: { rows: ['.##.', '####', '.##.'], best: 2, fine: 3 },
          large: { rows: ['.##.', '####', '####', '.##.'], best: 4, fine: 5 }
        },
        item: {
          small: { rows: ['.#.', '###', '###'], best: 2, fine: 3 },
          large: { rows: ['.#.', '###', '###'], best: 2, fine: 3 }
        }
      },
      // ピースの形と出やすさ
      pieces: {
        mono: { cells: ['#'],          weight: 1 },
        duo:  { cells: ['##'],         weight: 3 },
        i3:   { cells: ['###'],        weight: 3 },
        l3:   { cells: ['#.', '##'],   weight: 3 },
        i4:   { cells: ['####'],       weight: 2 },
        l4:   { cells: ['#.', '#.', '##'], weight: 2 },
        t4:   { cells: ['###', '.#.'], weight: 2 },
        s4:   { cells: ['.##', '##.'], weight: 1 },
        o4:   { cells: ['##', '##'],   weight: 2 }
      },
      // 生産Lv − 難易度 による恩恵
      //   手持ちのピースの数 = base + (Lv差 ÷ perLv) （min〜max）
      hand: { base: 2, perLv: 3, min: 1, max: 4 },
      //   無料で捨てられる回数 = base + (Lv差 ÷ perLv) （0〜max）
      freeDiscards: { base: 1, perLv: 4, max: 4 }
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
    exp: { base: 14, perDifficulty: 2, quality: { normal: 1.0, fine: 1.2, best: 1.5 }, tool: 8 },

    // 生産の固有スキル（ガチャの簡易的な天井）：生産Lv − レシピの難易度 がこの値以上なら発動
    //   cardChoice：ランダムカードを2枚の候補から選ぶ / slotChoice：ランダム枠を2組の候補から選ぶ
    //   reforge   ：再鍛錬。完成後にランダム枠を1つだけ引き直せる（1回）
    skills: { cardChoice: 3, slotChoice: 6, reforge: 9 }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
