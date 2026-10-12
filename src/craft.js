// 生産：レシピ・品質ミニゲームの計算・ランダム枠の抽選
(function (R) {
  const C = () => R.DATA.crafting;

  // その生産ライフで作れるもの
  function recipesFor(life) {
    const L = C().lives[life];
    const out = [];
    for (const [id, b] of Object.entries(R.DATA.equipment.bases)) {
      if (L.types.includes(b.type)) out.push({ kind: 'equip', id, name: b.name, mats: b.mats, difficulty: b.difficulty, base: b });
    }
    if (L.tools) {
      for (const [id, t] of Object.entries(R.DATA.equipment.tools)) {
        if (t.craft === life) out.push({ kind: 'tool', id, name: t.name, mats: t.mats, difficulty: t.difficulty, tool: t });
      }
    }
    if (L.items && R.DATA.items) {
      for (const [id, it] of Object.entries(R.DATA.items)) {
        out.push({ kind: 'item', id, name: it.name, mats: it.mats, difficulty: it.difficulty, item: it });
      }
    }
    return out.sort((a, b) => a.difficulty - b.difficulty);
  }

  // ===== 品質ミニゲーム =====
  function gameParams(lv, difficulty) {
    const g = C().game;
    const diff = lv - difficulty;
    const lvMult = Math.max(g.lvMultMin, Math.min(g.lvMultMax, 1 + diff * g.lvDiffRate));
    const widen = diff * g.widthPerLv;
    return {
      perHit: (100 / g.baseHits) * lvMult,
      goodWidth: Math.max(8, Math.min(70, g.goodWidth + widen)),
      greatWidth: Math.max(3, Math.min(25, g.greatWidth + widen / 3)),
      lvMult
    };
  }
  function progressOf(hits, params) {
    const zm = C().game.zoneMult;
    return hits.reduce((p, h) => p + params.perHit * (zm[h] || 0), 0);
  }
  // 終わるまでにかかった回数 → 品質
  function qualityFromHits(n) {
    const q = C().game.qualityHits;
    if (n <= q.best) return 'best';
    if (n <= q.fine) return 'fine';
    return 'normal';
  }
  // 当たり方の列から、ゲージが埋まるまでの回数と品質を出す（シミュレーター・テスト用）
  function resolveHits(hits, params) {
    const zm = C().game.zoneMult;
    let p = 0;
    let n = 0;
    for (const h of hits) {
      n++;
      p += params.perHit * (zm[h] || 0);
      if (p >= 100) break;
    }
    return { count: n, done: p >= 100, quality: qualityFromHits(n) };
  }

  // ===== パワー解禁（細工Lv） =====
  function unlockedPowerCount(jewelerLv) {
    return R.DATA.config.life.powerUnlockLvs.filter(lv => jewelerLv >= lv).length;
  }
  function unlockedPowers(job, jewelerLv) {
    return R.DATA.jobs[job].powers.slice(0, Math.max(1, unlockedPowerCount(jewelerLv)));
  }

  // ===== ランダム枠 =====
  function rollGrade(lv, difficulty, rng) {
    const diff = lv - difficulty;
    const w = {};
    C().gradeWeights.forEach((g, i) => { w[i] = Math.max(g.min, g.base + g.perLv * diff); });
    return Number(rng.weighted(w));
  }
  // 良い枠が出る確率の目安（画面表示用）
  function gradeChances(lv, difficulty) {
    const diff = lv - difficulty;
    const ws = C().gradeWeights.map(g => Math.max(g.min, g.base + g.perLv * diff));
    const total = ws.reduce((a, b) => a + b, 0);
    return ws.map(w => w / total);
  }

  // そのカードに付けられる付与効果（すでに付いている物と重複・衝突しないもの）
  function enchantCandidates(cardDef, existing) {
    const list = R.DATA.enchants.list;
    return Object.keys(list).filter(id =>
      R.Cards.canApplyEnchant(id, cardDef) &&
      !existing.includes(id) &&
      !existing.some(e => R.Cards.enchantsConflict(e, id)));
  }

  function rollSlots(base, enchantTarget, lv, rng) {
    const slots = [];
    const E = R.DATA.enchants;
    const targetDef = enchantTarget ? R.Cards.getCardDef(enchantTarget) : null;
    for (let i = 0; i < 2; i++) {
      const grade = rollGrade(lv, base.difficulty, rng);
      const existing = slots.filter(s => s.kind === 'enchant').map(s => s.id);
      const cands = targetDef ? enchantCandidates(targetDef, existing) : [];
      if (cands.length && rng.chance(E.enchantChance)) {
        const rw = C().enchantRarityWeights[grade];
        const w = {};
        for (const id of cands) w[id] = rw[E.list[id].rarity] || 1;
        const id = rng.weighted(w);
        const slot = { kind: 'enchant', id, grade };
        if (id === 'element') slot.element = rng.pick(Object.keys(E.elements));
        slots.push(slot);
      } else {
        const stat = rng.pick(C().statChoices);
        const value = Math.max(1, Math.round(R.DATA.equipment.statRolls[stat][base.rank - 1] * R.DATA.equipment.gradeMult[grade]));
        slots.push({ kind: 'stat', stat, value, grade });
      }
    }
    return slots;
  }

  // 装備を1つ作る（ミニゲームの結果の品質を受け取る）
  //   opts: { lv, quality, power（アクセのみ）, rng }
  function makeEquipment(baseId, opts) {
    const base = R.DATA.equipment.bases[baseId];
    const rng = opts.rng || R.createRng();
    const pool = Object.keys(R.DATA.cards).filter(id => R.DATA.cards[id].pool === base.type);
    const randomCard = rng.pick(pool);
    const isAcc = base.slot === 'accessory';
    const enchantTarget = isAcc ? opts.power : base.fixedCard;
    const item = {
      base: baseId, quality: opts.quality || 'normal', randomCard,
      slots: rollSlots(base, enchantTarget, opts.lv, rng)
    };
    if (isAcc) item.power = opts.power;
    return item;
  }

  function expFor(recipe, quality) {
    const e = C().exp;
    if (recipe.kind === 'tool') return e.tool + recipe.difficulty;
    return Math.round((e.base + e.perDifficulty * recipe.difficulty) * (e.quality[quality] || 1));
  }

  R.Craft = {
    recipesFor, gameParams, progressOf, qualityFromHits, resolveHits,
    unlockedPowerCount, unlockedPowers, rollGrade, gradeChances, enchantCandidates, rollSlots, makeEquipment, expFor
  };
})(globalThis.RASEN = globalThis.RASEN || {});
