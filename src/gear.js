// 装備：ステータス計算・装備から生まれるカード・パーティの組み立て
(function (R) {
  const SLOTS = ['weapon', 'head', 'body', 'accessory'];
  const STATS = ['hp', 'atk', 'def', 'mag'];

  function zeroStats() { return { hp: 0, atk: 0, def: 0, mag: 0 }; }
  function addStats(a, b) { for (const k of STATS) a[k] += (b[k] || 0); return a; }

  function getBase(item) {
    const b = R.DATA.equipment.bases[item.base];
    if (!b) throw new Error('不明な装備: ' + item.base);
    return b;
  }
  function qualityOf(item) { return R.DATA.config.quality[item.quality || 'normal']; }

  // 固定ステータス（ランク・部位・装備種で決まり、品質の倍率がかかる）
  function fixedStats(item) {
    const EQ = R.DATA.equipment;
    const base = getBase(item);
    const type = EQ.types[base.type];
    const table = EQ.rankStats[base.slot];
    const r = base.rank - 1;
    const q = qualityOf(item).mult;
    const s = zeroStats();
    if (base.slot === 'weapon') {
      s[type.stat] = table.main[r];
    } else if (base.slot === 'head' || base.slot === 'body') {
      const mod = type.armorMod || { hp: 1, def: 1 };
      s.hp = table.hp[r] * mod.hp;
      s.def = table.def[r] * mod.def;
    }
    for (const k of STATS) s[k] = Math.round(s[k] * q);
    return s;
  }

  // 装備1つのステータス合計（固定＋ランダム枠のステータス上昇）
  function itemStats(item) {
    const s = fixedStats(item);
    for (const slot of item.slots || []) {
      if (slot.kind === 'stat') s[slot.stat] += slot.value;
    }
    return s;
  }

  function itemEnchants(item) {
    return (item.slots || []).filter(s => s.kind === 'enchant').map(s => ({ id: s.id, element: s.element }));
  }

  // 装備から生まれるカード。付与効果は固定カード（アクセはパワーカード）に付く
  function itemCards(item) {
    const base = getBase(item);
    const best = qualityOf(item).upgradeFixedCard;
    const enchants = itemEnchants(item);
    const isAcc = base.slot === 'accessory';
    const cards = [];
    cards.push({ cardId: base.fixedCard, upgraded: best, enchants: isAcc ? [] : enchants, source: 'fixed' });
    if (item.randomCard) cards.push({ cardId: item.randomCard, upgraded: false, enchants: [], source: 'random' });
    if (isAcc && item.power) cards.push({ cardId: item.power, upgraded: false, enchants, source: 'power' });
    return cards;
  }

  function itemName(item) {
    const base = getBase(item);
    const q = item.quality && item.quality !== 'normal' ? `【${qualityOf(item).name}】` : '';
    return q + base.name;
  }

  // その職業が装備できるか
  function canEquip(job, item) {
    const J = R.DATA.jobs[job];
    const base = getBase(item);
    if (base.slot === 'weapon') return base.type === J.weapon;
    if (base.slot === 'head' || base.slot === 'body') return base.type === J.armor;
    if (base.slot === 'accessory') return !item.power || J.powers.includes(item.power);
    return false;
  }

  function charStats(job, gear) {
    const s = addStats(zeroStats(), R.DATA.config.baseChar);
    for (const slot of SLOTS) if (gear[slot]) addStats(s, itemStats(gear[slot]));
    return s;
  }

  function charCards(gear) {
    const out = [];
    for (const slot of SLOTS) if (gear[slot]) out.push(...itemCards(gear[slot]).map(c => Object.assign({ slot }, c)));
    return out;
  }

  // パーティ（[{job, gear}] ×3）を戦闘用に組み立てる
  function buildParty(members) {
    let maxHp = 0;
    const chars = members.map((m, i) => {
      const stats = charStats(m.job, m.gear);
      maxHp += stats.hp;
      return { index: i, job: m.job, name: R.DATA.jobs[m.job].name, stats, cards: charCards(m.gear) };
    });
    return { chars, maxHp };
  }

  R.Gear = { SLOTS, STATS, zeroStats, getBase, fixedStats, itemStats, itemEnchants, itemCards, itemName, canEquip, charStats, charCards, buildParty };
})(globalThis.RASEN = globalThis.RASEN || {});
