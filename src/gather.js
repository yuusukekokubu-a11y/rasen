// 採集（採掘・伐採・採取・宝箱）
// 採掘・伐採のミニゲーム「鉱脈探し」の計算はここにまとめてあり、画面からでもシミュレーターからでも同じ計算を使う
(function (R) {
  function addMat(bag, id, n) { bag[id] = (bag[id] || 0) + n; }

  // 採掘・伐採の条件（振れる回数・最初から開いているマスの数）
  function gatherParams(node, lv, toolPower) {
    const G = R.DATA.gatherGame;
    const diff = lv - node.hardness;
    const swings = Math.max(G.minSwings, Math.min(G.maxSwings,
      Math.round(G.baseSwings + diff * G.swingsPerLv + ((toolPower || 1) - 1) * G.swingsPerTool)));
    const hints = Math.max(0, Math.min(G.maxHints, Math.floor(diff * G.hintsPerLv)));
    return { swings, hints };
  }

  // マス目を作る
  function newBoard(node, params, rng) {
    const G = R.DATA.gatherGame;
    const n = G.size * G.size;
    const cells = [];
    for (let i = 0; i < n; i++) cells.push({ vein: null, open: false, hint: 0 });
    const order = rng.shuffle([...Array(n).keys()]);
    order.slice(0, G.veins).forEach((idx, k) => { cells[idx].vein = k < G.rareVeins ? 'rare' : 'common'; });
    for (let i = 0; i < n; i++) cells[i].hint = neighbors(i).filter(j => cells[j].vein).length;
    // Lvが高ければ、外れマスがいくつか最初から開いている
    const empties = rng.shuffle(cells.map((c, i) => i).filter(i => !cells[i].vein));
    for (const i of empties.slice(0, params.hints)) cells[i].open = true;
    return { cells, swingsLeft: params.swings, swings: params.swings, found: [], done: false };
  }

  function neighbors(i) {
    const S = R.DATA.gatherGame.size;
    const x = i % S, y = Math.floor(i / S);
    const out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < S && ny < S) out.push(ny * S + nx);
    }
    return out;
  }

  // 1マス掘る。掘れたら結果（'common' / 'rare' / 'none'）を返す
  function strike(board, i) {
    const c = board.cells[i];
    if (board.done || !c || c.open) return null;
    c.open = true;
    board.swingsLeft--;
    if (c.vein) board.found.push(c.vein);
    const total = board.cells.filter(x => x.vein).length;
    if (board.swingsLeft <= 0 || board.found.length >= total) board.done = true;
    return c.vein || 'none';
  }

  // 終わったマス目から、手に入る素材を決める
  function boardResult(node, board, rng) {
    const G = R.DATA.gatherGame;
    const bag = {};
    const total = board.cells.filter(x => x.vein).length;
    let commons = board.found.filter(v => v === 'common').length * G.perVein;
    const rares = board.found.filter(v => v === 'rare').length;
    const allFound = board.found.length >= total;
    if (allFound) commons += board.swingsLeft * G.allFoundBonus;
    if (!board.found.length) commons = G.failYield;
    for (let i = 0; i < commons; i++) addMat(bag, rng.weighted(node.common), 1);
    for (let i = 0; i < rares; i++) addMat(bag, rng.weighted(node.rare), 1);
    return { bag, found: board.found.length, rares, allFound, left: board.swingsLeft, exp: board.found.length ? G.exp : Math.round(G.exp / 2) };
  }

  // 自動操作用：数字の手がかりから、鉱脈がありそうなマスを選ぶ
  function autoPick(board, rng) {
    const closed = board.cells.map((c, i) => i).filter(i => !board.cells[i].open);
    const score = (i) => {
      let s = 0;
      for (const j of neighbors(i)) {
        const c = board.cells[j];
        if (!c.open || c.vein) continue;
        if (c.hint === 0) return -100; // 隣が0なら、ここには絶対にない
        s += c.hint;
      }
      return s + rng.next() * 0.5;
    };
    let best = closed[0], bestS = -Infinity;
    for (const i of closed) { const s = score(i); if (s > bestS) { bestS = s; best = i; } }
    return best;
  }

  function autoPlay(node, params, rng) {
    const board = newBoard(node, params, rng);
    while (!board.done) strike(board, autoPick(board, rng));
    return board;
  }

  // 採取・宝箱（ミニゲームなし）
  function rollTable(entry, rng) {
    const bag = {};
    const n = rng.int(entry.amount[0], entry.amount[1]);
    for (let i = 0; i < n; i++) addMat(bag, rng.weighted(entry.table), 1);
    return bag;
  }

  R.Gather = { gatherParams, newBoard, neighbors, strike, boardResult, autoPick, autoPlay, rollTable, addMat };
})(globalThis.RASEN = globalThis.RASEN || {});
