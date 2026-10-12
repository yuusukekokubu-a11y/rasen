// 自動操作（シミュレーター用の簡単な思考ルーチン）
// 毎回「いちばん得になりそうなカード」を選んで使う、欲張り方式
(function (R) {
  // カード1枚の価値をざっくり見積もる
  function scoreCard(c, inst, targetIndex) {
    const def = c.cardDef(inst);
    const pv = c.previewCard(inst, targetIndex);
    const incoming = c.incomingDamage();
    const needBlock = Math.max(0, incoming - c.party.block);
    const missing = c.party.maxHp - c.party.hp;
    let s = 0;

    if (def.type === 'power') s += Math.max(15, 45 - c.turn * 4);
    s += pv.damage + pv.kills * 12;
    s += Math.min(pv.block, needBlock) * 1.3 + Math.max(0, pv.block - needBlock) * 0.1;
    if (c.party.hp < c.party.maxHp * 0.7) s += Math.min(pv.heal, missing) * 1.2;
    s += pv.draw * 4 + pv.energy * 6;

    for (const e of def.effects) {
      if (e.t === 'buff') s += e.v * (e.who === 'party' ? 6 : 3);
      if (e.t === 'status') {
        const w = { vulnerable: 4, weak: incoming > 0 ? 3 : 1, burn: 1.5, freeze: 2.5, shock: 2 }[e.s] || 1;
        s += e.v * w * (e.target === 'all' ? Math.max(1, c.aliveEnemies().length) : 1);
      }
      if (e.t === 'scry') s += 1;
      if (e.t === 'discard' || e.t === 'exhaustChoice') s -= 1;
    }
    return s;
  }

  // 単体攻撃の狙い：倒せる敵がいればその中で一番HPの多い敵、いなければ一番HPの少ない敵
  function pickTarget(c, inst) {
    const alive = c.aliveEnemies();
    if (alive.length <= 1) return alive.length ? alive[0].index : -1;
    let best = null;
    let bestKey = -Infinity;
    for (const e of alive) {
      const pv = c.previewCard(inst, e.index);
      const killable = pv.perEnemy[e.index] >= e.hp + e.block;
      const key = killable ? 1000 + e.hp : -(e.hp + e.block);
      if (key > bestKey) { bestKey = key; best = e; }
    }
    return best.index;
  }

  function staticValue(c, inst) {
    const def = c.cardDef(inst);
    if (def.type === 'power') return 50;
    const pv = c.previewCard(inst, -1);
    return pv.damage + pv.block + pv.draw * 4 + pv.energy * 6 - c.cardCost(inst);
  }

  function resolvePending(c) {
    const p = c.pending;
    if (p.kind === 'scry') {
      const sorted = p.options.slice().sort((a, b) => {
        const ia = c.draw.find(x => x.iid === a);
        const ib = c.draw.find(x => x.iid === b);
        return staticValue(c, ib) - staticValue(c, ia);
      });
      return c.resolveChoice(sorted);
    }
    // 捨てる・廃棄：価値の低いもの（捨て札発動つきは優先して捨てる）から
    const ranked = p.options.slice().sort((a, b) => {
      const ia = c.hand.find(x => x.iid === a);
      const ib = c.hand.find(x => x.iid === b);
      const va = staticValue(c, ia) - (p.kind === 'discard' && c.hasEnchant(ia, 'onDiscard') ? 100 : 0) + (c.cardCost(ia) > c.energy ? -20 : 0);
      const vb = staticValue(c, ib) - (p.kind === 'discard' && c.hasEnchant(ib, 'onDiscard') ? 100 : 0) + (c.cardCost(ib) > c.energy ? -20 : 0);
      return va - vb;
    });
    return c.resolveChoice(ranked.slice(0, p.count));
  }

  // 1手だけ進める。何か行動したら true
  function step(c) {
    if (c.result) return false;
    if (c.pending) { resolvePending(c); return true; }
    let best = null;
    for (const inst of c.hand) {
      if (!c.canPlay(inst)) continue;
      const target = pickTarget(c, inst);
      const score = scoreCard(c, inst, target);
      const cost = c.cardCost(inst);
      const eff = score / (cost === 0 ? 0.5 : cost);
      if (score > 0.5 && (!best || eff > best.eff)) best = { inst, target, eff };
    }
    if (!best) return false;
    c.playCard(best.inst.iid, best.target);
    return true;
  }

  // 持ち込みアイテム：HPが減っていたら回復、ボス戦の最初のターンは強化・攻撃アイテムを使う
  function useItems(c) {
    for (let i = c.items.length - 1; i >= 0; i--) {
      if (c.result || c.pending) return;
      const def = R.DATA.items[c.items[i].id];
      if (!def) continue;
      const heals = def.effects.some(e => e.t === 'heal');
      const boss = c.enemies.some(e => e.boss && e.alive);
      if (heals ? c.party.hp < c.party.maxHp * 0.4 : (boss && c.turn === 1)) c.useItem(i, c._firstAlive());
    }
  }

  // 1ターン分を自動で進めて、ターン終了まで行う
  function playTurn(c) {
    let guard = 0;
    if (c.items && c.items.length) useItems(c);
    while (!c.result && guard++ < 60) {
      if (!step(c)) break;
    }
    if (!c.result) c.endTurn();
  }

  function playCombat(c) {
    let guard = 0;
    while (!c.result && guard++ < 500) playTurn(c);
    return c.result;
  }

  R.AI = { scoreCard, pickTarget, step, playTurn, playCombat };
})(globalThis.RASEN = globalThis.RASEN || {});
