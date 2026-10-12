// 自動対戦シミュレーター（バランス確認用）
// 決まった装備で同じ敵と何回も戦わせ、勝率や平均ターン数を出す
(function (R) {
  // members: [{job, gear}] ×3 / enemies: 敵IDの配列 / n: 回数 / seed: 乱数の種
  // startHpRatio: 開始時HPの割合（ダンジョン後半の想定などに）
  function runBattles(opts) {
    const n = opts.n || 100;
    const party = R.Gear.buildParty(opts.members);
    const rng = R.createRng(opts.seed === undefined ? 12345 : opts.seed);
    const res = { n, wins: 0, losses: 0, timeouts: 0, turns: 0, turnsWin: 0, hpLeft: 0, damageTaken: 0, damageDealt: 0, maxTurns: 0, minTurns: Infinity };
    for (let i = 0; i < n; i++) {
      const hp = Math.round(party.maxHp * (opts.startHpRatio || 1));
      const c = new R.Combat({ party, encounter: opts.enemies, rng: R.createRng(Math.floor(rng.next() * 2 ** 32)), hp, scale: opts.scale }).start();
      R.AI.playCombat(c);
      res.turns += c.turn;
      res.damageTaken += c.counters.damageTaken;
      res.damageDealt += c.counters.damageDealt;
      res.maxTurns = Math.max(res.maxTurns, c.turn);
      res.minTurns = Math.min(res.minTurns, c.turn);
      if (c.result === 'win') { res.wins++; res.turnsWin += c.turn; res.hpLeft += c.party.hp; }
      else if (c.result === 'lose') res.losses++;
      else res.timeouts++;
    }
    return {
      n,
      maxHp: party.maxHp,
      winRate: res.wins / n,
      wins: res.wins, losses: res.losses, timeouts: res.timeouts,
      avgTurns: res.turns / n,
      avgTurnsWin: res.wins ? res.turnsWin / res.wins : 0,
      minTurns: res.minTurns, maxTurns: res.maxTurns,
      avgHpLeft: res.wins ? res.hpLeft / res.wins : 0,
      avgDamageTaken: res.damageTaken / n,
      avgDamageDealt: res.damageDealt / n
    };
  }

  // プリセット名から members を取り出す
  function presetMembers(id) {
    const p = R.DATA.loadouts.presets[id];
    if (!p) throw new Error('不明なプリセット: ' + id);
    return p.party;
  }

  R.Sim = { runBattles, presetMembers };
})(globalThis.RASEN = globalThis.RASEN || {});
