// カード定義の読み出し・説明文の生成・付与効果の付けられる条件
(function (R) {
  const STATUS_NAMES = { weak: '脱力', vulnerable: '弱体', burn: '燃焼', freeze: '凍結', shock: '感電' };
  const STAT_NAMES = { atk: '攻撃力', def: '防御力', mag: '魔力', hp: 'HP' };
  const ELEMENT_NAMES = { fire: '炎', ice: '氷', thunder: '雷' };
  const TYPE_NAMES = { attack: '攻撃', skill: 'スキル', power: 'パワー' };

  // 強化版（＋）を反映したカード定義を返す
  function getCardDef(cardId, upgraded) {
    const base = R.DATA.cards[cardId];
    if (!base) throw new Error('不明なカード: ' + cardId);
    const def = Object.assign({ id: cardId, tags: [], exhaust: false }, base);
    if (upgraded && base.upgrade) Object.assign(def, base.upgrade);
    def.upgraded = !!upgraded;
    def.displayName = def.name + (upgraded ? '＋' : '');
    return def;
  }

  function hasEffect(def, t) { return def.effects.some(e => e.t === t); }
  function hasPotency(def) { return def.effects.some(e => e.t === 'dmg' || e.t === 'block' || e.t === 'heal'); }

  // 付与効果を付けられるカードか
  function canApplyEnchant(enchantId, def) {
    const en = R.DATA.enchants.list[enchantId];
    if (!en) return false;
    const ok = (cond) => {
      switch (cond) {
        case 'any': return true;
        case 'nonPower': return def.type !== 'power';
        case 'potency': return def.type !== 'power' && hasPotency(def);
        case 'attack': return def.type !== 'power' && hasEffect(def, 'dmg');
        case 'costly': return def.cost >= 1;
        default: return true;
      }
    };
    return ok(en.appliesTo) && (!en.requires || ok(en.requires));
  }

  function enchantsConflict(a, b) {
    return R.DATA.enchants.conflicts.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  }

  // 付与効果を考慮したコスト
  function cardCost(def, enchants) {
    let cost = def.cost;
    if (enchants && enchants.some(e => e.id === 'lightweight')) cost = 0;
    if (enchants && enchants.some(e => e.id === 'costReduce')) cost = Math.max(0, cost - 1);
    return cost;
  }

  // 効果1つの説明文。stats を渡すとステータス込みの数値を表示する
  function describeEffect(e, stats) {
    const statVal = (scale) => (stats && scale && scale !== 'none') ? (stats[scale] || 0) : 0;
    const num = (v, scale) => {
      if (!stats || !scale || scale === 'none') return String(v);
      return String(v + statVal(scale));
    };
    switch (e.t) {
      case 'dmg': {
        const scale = e.scale || 'atk';
        const tgt = e.target === 'all' ? '敵全体に' : e.target === 'random' ? 'ランダムな敵に' : '';
        const el = e.element ? ELEMENT_NAMES[e.element] + '属性の' : '';
        let s = `${tgt}${el}${num(e.v, scale)}ダメージ`;
        if (e.hits && e.hits > 1) s += `×${e.hits}回`;
        if (e.plusPer) {
          const what = { block: 'ブロック', discardedThisTurn: 'このターン捨てた枚数', exhaustedThisCombat: '廃棄した枚数', cardsPlayedThisTurn: 'このターン使った枚数' }[e.plusPer.what];
          s = `${tgt}${e.v > 0 ? num(e.v, scale) + '＋' : ''}${what}×${e.plusPer.v}のダメージ`;
        }
        if (!stats && scale !== 'none') s += `（${STAT_NAMES[scale]}が乗る）`;
        return s;
      }
      case 'block': {
        const scale = e.scale || 'def';
        let s = `ブロック${num(e.v, scale)}`;
        if (!stats && scale !== 'none') s += `（${STAT_NAMES[scale]}が乗る）`;
        return s;
      }
      case 'heal': return `HPを${num(e.v, 'mag')}回復` + (stats ? '' : '（魔力が乗る）');
      case 'draw': return `${e.v}枚引く`;
      case 'energy': return `エネルギー+${e.v}`;
      case 'status': return `${e.target === 'all' ? '敵全体に' : ''}${STATUS_NAMES[e.s]}${e.v}`;
      case 'buff': return `${e.who === 'party' ? '味方全員の' : 'このキャラの'}${STAT_NAMES[e.stat]}+${e.v}`;
      case 'discard': return `手札を${e.v}枚選んで捨てる`;
      case 'exhaustChoice': return `手札を${e.v}枚選んで廃棄`;
      case 'scry': return `山札の上${e.v}枚を見て並べ替える`;
      case 'power': {
        const p = R.DATA.powers[e.id];
        return p ? `【パワー】${p.desc}` : '';
      }
      default: return '';
    }
  }

  function describeCard(def, enchants, stats) {
    const parts = def.effects.map(e => describeEffect(e, stats)).filter(Boolean);
    let text = parts.join('。');
    const ench = (enchants || []).map(en => {
      const d = R.DATA.enchants.list[en.id];
      if (!d) return '';
      if (en.id === 'element' && en.element) return `［${d.name}:${ELEMENT_NAMES[en.element]}］`;
      return `［${d.name}］`;
    }).join('');
    if (def.exhaust) text += '。廃棄';
    return { text, enchantText: ench };
  }

  R.Cards = {
    STATUS_NAMES, STAT_NAMES, ELEMENT_NAMES, TYPE_NAMES,
    getCardDef, canApplyEnchant, enchantsConflict, cardCost, describeEffect, describeCard, hasPotency, hasEffect
  };
})(globalThis.RASEN = globalThis.RASEN || {});
