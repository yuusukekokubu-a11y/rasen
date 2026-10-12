// 採集（採掘・伐採・採取・宝箱）
// ミニゲーム部分は「当たり方の列（great/good/miss）」を受け取って結果を出すだけにしてあり、
// 画面からでもシミュレーターからでも同じ計算を使える
(function (R) {
  function weightedPick(rng, table) { return rng.weighted(table); }
  function addMat(bag, id, n) { bag[id] = (bag[id] || 0) + n; }

  // 採掘・伐採のミニゲームの条件
  function gatherParams(node, lv, toolPower) {
    const G = R.DATA.gatherGame;
    const diff = lv - node.hardness;
    const lvMult = Math.max(G.lvMultMin, Math.min(G.lvMultMax, 1 + diff * G.lvDiffRate));
    const perSwing = (100 / G.swingsToBreak) * (toolPower || 1) * G.basePower * lvMult;
    const widen = diff * G.widthPerLv;
    return {
      swings: G.swings,
      perSwing,
      goodWidth: Math.max(8, Math.min(70, G.goodWidth + widen)),
      greatWidth: Math.max(3, Math.min(25, G.greatWidth + widen / 3)),
      lvMult
    };
  }

  // hits: ['great','good','miss', ...]（振った順）。壊れたらそれ以降は無視
  function resolveMinigame(node, params, hits, rng) {
    const G = R.DATA.gatherGame;
    let progress = 0;
    let used = 0;
    let greats = 0;
    for (const hit of hits.slice(0, params.swings)) {
      used++;
      if (hit === 'great') greats++;
      progress += params.perSwing * (G.zoneMult[hit] || 0);
      if (progress >= 100) break;
    }
    const broken = progress >= 100;
    const left = broken ? params.swings - used : 0;
    const bag = {};
    const count = broken ? G.baseYield + left : G.failYield;
    for (let i = 0; i < count; i++) addMat(bag, weightedPick(rng, node.common), 1);
    let rareChance = 0;
    if (broken) {
      rareChance = Math.min(0.95, G.rareBase + greats * G.rarePerGreat + left * G.rarePerLeft);
      if (rng.chance(rareChance)) addMat(bag, weightedPick(rng, node.rare), 1);
    }
    return { broken, used, greats, left, progress: Math.min(100, progress), bag, rareChance, exp: broken ? G.exp : Math.round(G.exp / 2) };
  }

  // 採取・宝箱（ミニゲームなし）
  function rollTable(entry, rng) {
    const bag = {};
    const n = rng.int(entry.amount[0], entry.amount[1]);
    for (let i = 0; i < n; i++) addMat(bag, weightedPick(rng, entry.table), 1);
    return bag;
  }

  // 自動操作用：腕前 skill（0〜1）で当たり方を決める
  function autoHits(params, skill, rng) {
    const out = [];
    for (let i = 0; i < params.swings; i++) {
      const r = rng.next();
      const pGreat = (params.greatWidth / 100) * (0.5 + skill);
      const pGood = (params.goodWidth / 100) * (0.5 + skill);
      out.push(r < pGreat ? 'great' : r < pGreat + pGood ? 'good' : 'miss');
    }
    return out;
  }

  R.Gather = { gatherParams, resolveMinigame, rollTable, autoHits, addMat };
})(globalThis.RASEN = globalThis.RASEN || {});
