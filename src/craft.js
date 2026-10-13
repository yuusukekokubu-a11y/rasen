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

  // ===== 品質ミニゲーム「設計図はめ込み」 =====
  const P = () => C().puzzle;

  function parseShape(rows) {
    const cells = [];
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); }));
    return cells;
  }
  // ピースの形（回転 rot=0〜3）。左上が(0,0)になるようにそろえる
  const shapeCache = {};
  function pieceCells(pieceId, rot) {
    const key = pieceId + ':' + (((rot || 0) % 4 + 4) % 4);
    if (!shapeCache[key]) shapeCache[key] = rotatedCells(pieceId, rot);
    return shapeCache[key];
  }
  function rotatedCells(pieceId, rot) {
    let cells = parseShape(P().pieces[pieceId].cells);
    for (let i = 0; i < ((rot || 0) % 4 + 4) % 4; i++) cells = cells.map(([r, c]) => [c, -r]);
    const minR = Math.min(...cells.map(x => x[0])), minC = Math.min(...cells.map(x => x[1]));
    return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }

  // 生産Lvと難易度から、手持ちの数・無料で捨てられる回数を決める
  function puzzleParams(lv, difficulty) {
    const diff = lv - difficulty;
    // Lv差が少しマイナスなだけでは減らない（切り捨てでなく0に向かって丸める）
    const f = (o) => Math.max(o.min || 0, Math.min(o.max, o.base + Math.trunc(diff / o.perLv)));
    return { hand: f(P().hand), freeDiscards: f(P().freeDiscards), diff };
  }

  function blueprintFor(kind, slot, rank) {
    const key = kind === 'item' ? 'item' : slot;
    const bp = P().blueprints[key];
    return bp[(rank || 1) >= 3 ? 'large' : 'small'];
  }

  // bp: { rows, best, fine }（data/crafting.js の設計図）
  function puzzleStart(bp, params, rng) {
    const shape = bp.rows.map(r => [...r]);
    const h = shape.length, w = Math.max(...shape.map(r => r.length));
    const cells = [];
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push({ need: shape[r][c] === '#', filled: false });
    const total = cells.filter(x => x.need).length;
    const st = {
      w, h, cells, total, filledCount: 0, turns: 0, rot: 0, sel: 0,
      freeDiscards: params.freeDiscards, hand: [], done: false, thresholds: { best: bp.best, fine: bp.fine }
    };
    const weights = Object.fromEntries(Object.entries(P().pieces).map(([k, v]) => [k, v.weight]));
    st.draw = () => rng.weighted(weights);
    // 手持ちのどれも置けないときは、置けるピースの中から引き直す（詰まり防止）
    st.drawFitting = () => {
      const ok = {};
      for (const [k, w] of Object.entries(weights)) if (fitsAnywhere(st, k)) ok[k] = w;
      return Object.keys(ok).length ? rng.weighted(ok) : st.draw();
    };
    for (let i = 0; i < params.hand; i++) st.hand.push(st.draw());
    ensureFit(st, 0);
    return st;
  }
  function puzzleSelect(st, i) { if (i >= 0 && i < st.hand.length) { st.sel = i; st.rot = 0; } }

  // (r,c) にピースの左上のブロックが来るように置けるか。置けるならマスの番号の配列を返す
  function placement(st, r, c, rot, sel) {
    const piece = st.hand[sel === undefined ? st.sel : sel];
    const cells = pieceCells(piece, rot === undefined ? st.rot : rot);
    const [r0, c0] = cells[0];
    const out = [];
    for (const [dr, dc] of cells) {
      const rr = r + dr - r0, cc = c + dc - c0;
      if (rr < 0 || cc < 0 || rr >= st.h || cc >= st.w) return null;
      const i = rr * st.w + cc;
      if (!st.cells[i].need || st.cells[i].filled) return null;
      out.push(i);
    }
    return out;
  }
  function fitsAnywhere(st, pieceId) {
    for (let rot = 0; rot < 4; rot++) {
      const shape = pieceCells(pieceId, rot);
      for (let r = 0; r < st.h; r++) for (let c = 0; c < st.w; c++) {
        if (shape.every(([dr, dc]) => {
          const rr = r + dr, cc = c + dc;
          if (rr >= st.h || cc >= st.w) return false;
          const cell = st.cells[rr * st.w + cc];
          return cell.need && !cell.filled;
        })) return true;
      }
    }
    return false;
  }
  function ensureFit(st, slot) {
    if (st.filledCount >= st.total) return;
    if (!st.hand.some(p => fitsAnywhere(st, p))) st.hand[slot] = st.drawFitting();
  }
  // 使った（捨てた）ピースを補充する
  function refill(st) {
    st.hand[st.sel] = st.draw();
    st.rot = 0;
    ensureFit(st, st.sel);
  }
  function puzzlePlace(st, r, c) {
    if (st.done) return false;
    const idx = placement(st, r, c);
    if (!idx) return false;
    for (const i of idx) st.cells[i].filled = true;
    st.filledCount += idx.length;
    st.turns++;
    if (st.filledCount >= st.total) st.done = true;
    refill(st);
    return true;
  }
  function puzzleRotate(st) { st.rot = (st.rot + 1) % 4; }
  function puzzleDiscard(st) {
    if (st.done) return;
    if (st.freeDiscards > 0) st.freeDiscards--; else st.turns++;
    refill(st);
  }
  function puzzleQuality(st) {
    if (st.turns <= st.thresholds.best) return 'best';
    if (st.turns <= st.thresholds.fine) return 'fine';
    return 'normal';
  }
  function canPlaceAnywhere(st, sel) {
    for (let rot = 0; rot < 4; rot++) for (let r = 0; r < st.h; r++) for (let c = 0; c < st.w; c++) if (placement(st, r, c, rot, sel)) return true;
    return false;
  }

  // 自動操作（テスト・調整用）：大きく、埋まったマスや外枠に多く接する置き方を選ぶ。どれも置けなければ小さいピースを捨てる
  function puzzleAutoStep(st) {
    let best = null;
    st.hand.forEach((_, sel) => {
      for (let rot = 0; rot < 4; rot++) for (let r = 0; r < st.h; r++) for (let c = 0; c < st.w; c++) {
        const idx = placement(st, r, c, rot, sel);
        if (!idx) continue;
        const set = new Set(idx);
        let score = idx.length * 10;
        for (const i of idx) {
          const rr = Math.floor(i / st.w), cc = i % st.w;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = rr + dr, nc = cc + dc;
            if (nr < 0 || nc < 0 || nr >= st.h || nc >= st.w) { score++; continue; }
            const j = nr * st.w + nc;
            if (set.has(j)) continue;
            if (!st.cells[j].need || st.cells[j].filled) score++;
          }
        }
        if (!best || score > best.score) best = { r, c, rot, sel, score };
      }
    });
    if (!best) {
      // 一番大きいピースを捨てる
      let big = 0;
      st.hand.forEach((p, i) => { if (pieceCells(p, 0).length > pieceCells(st.hand[big], 0).length) big = i; });
      st.sel = big;
      puzzleDiscard(st);
      return;
    }
    st.sel = best.sel;
    st.rot = best.rot;
    puzzlePlace(st, best.r, best.c);
  }

  // ===== パワー解禁（細工Lv） =====
  function unlockedPowerCount(jewelerLv) {
    return R.DATA.config.life.powerUnlockLvs.filter(lv => jewelerLv >= lv).length;
  }
  function unlockedPowers(job, jewelerLv) {
    return R.DATA.jobs[job].powers.slice(0, Math.max(1, unlockedPowerCount(jewelerLv)));
  }
  // アクセサリーに付くパワーをランダムに決める。先に職業を等しい確率で選び、その職業の解禁済みパワーから1つ
  //   付いたパワーの職業だけが、そのアクセサリーを装備できる（R.Gear.canEquip）
  function rollAccessoryPower(jewelerLv, rng) {
    const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled && R.DATA.jobs[j].powers.length);
    return rng.pick(unlockedPowers(rng.pick(jobs), jewelerLv));
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
  //   opts: { lv, quality, power（アクセのみ。省略するとランダム）, rng }
  function makeEquipment(baseId, opts) {
    const base = R.DATA.equipment.bases[baseId];
    const rng = opts.rng || R.createRng();
    const pool = Object.keys(R.DATA.cards).filter(id => R.DATA.cards[id].pool === base.type);
    const randomCard = rng.pick(pool);
    const isAcc = base.slot === 'accessory';
    const power = isAcc ? (opts.power || rollAccessoryPower(opts.lv || 1, rng)) : undefined;
    const enchantTarget = isAcc ? power : base.fixedCard;
    const item = {
      base: baseId, quality: opts.quality || 'normal', randomCard,
      slots: rollSlots(base, enchantTarget, opts.lv, rng)
    };
    if (isAcc) item.power = power;
    return item;
  }

  // 生産の固有スキル：Lv差で決まる（天井の役割）
  function craftSkills(lv, difficulty) {
    const sk = C().skills;
    const diff = lv - difficulty;
    return { cardChoice: diff >= sk.cardChoice, slotChoice: diff >= sk.slotChoice };
  }
  // 完成した装備の「もう1つの候補」を作る（スキルが発動しているぶんだけ）
  //   cards: [今のランダムカード, 別のカード] / slots: [今のランダム枠, 別の組]
  function equipmentChoices(item, lv, skills, rng) {
    rng = rng || R.createRng();
    const base = R.DATA.equipment.bases[item.base];
    const out = {};
    if (skills.cardChoice) {
      const pool = Object.keys(R.DATA.cards).filter(id => R.DATA.cards[id].pool === base.type && id !== item.randomCard);
      if (pool.length) out.cards = [item.randomCard, rng.pick(pool)];
    }
    if (skills.slotChoice) {
      const target = base.slot === 'accessory' ? item.power : base.fixedCard;
      out.slots = [item.slots, rollSlots(base, target, lv, rng)];
    }
    return out;
  }

  function expFor(recipe, quality) {
    const e = C().exp;
    if (recipe.kind === 'tool') return e.tool + recipe.difficulty;
    return Math.round((e.base + e.perDifficulty * recipe.difficulty) * (e.quality[quality] || 1));
  }

  R.Craft = {
    recipesFor, pieceCells, puzzleParams, blueprintFor, puzzleStart, puzzleSelect, placement, puzzlePlace, puzzleRotate, puzzleDiscard, puzzleQuality, canPlaceAnywhere, puzzleAutoStep,
    unlockedPowerCount, unlockedPowers, rollAccessoryPower, rollGrade, gradeChances, enchantCandidates, rollSlots, makeEquipment, craftSkills, equipmentChoices, expFor
  };
})(globalThis.RASEN = globalThis.RASEN || {});
