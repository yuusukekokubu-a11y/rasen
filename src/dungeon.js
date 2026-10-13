// ダンジョン1回分の進行（画面に依存しない）
//
//   phase: 'battle'（次は戦闘）/ 'reward'（報酬を選ぶ）/ 'gather'（採集ミニゲーム中）
//          'checkpoint'（無限階層：4階ごとのボスを倒して「帰還／続行」を選ぶ）
//          'cleared'（クリア・帰還）/ 'wiped'（全滅）
(function (R) {
  // 上位素材の表：難易度に応じて、from が難易度以下のうち一番高い段の表を使う
  function highDropTable(dungeonId, difficulty) {
    const list = R.DATA.difficulty.highDrops[dungeonId] || [];
    let table = null;
    for (const t of list) if (difficulty >= t.from) table = t.table;
    return table;
  }

  const REWARD_NAMES = { mining: '採掘', logging: '伐採', gathering: '採取', treasure: '宝箱', rest: '休憩' };

  class DungeonRun {
    // opts: { dungeonId, members, rng, lives, tools:{pick,axe}, items:[{id,quality,uid}] }
    constructor(opts, restored) {
      this.rng = opts.rng || R.createRng();
      this.lives = opts.lives || R.Life.newLives();
      this.tools = opts.tools || { pick: 1, axe: 1 };
      if (restored) { Object.assign(this, restored); return; }
      this.dungeonId = opts.dungeonId;
      this.difficulty = opts.difficulty || 1;
      this.members = JSON.parse(JSON.stringify(opts.members));
      const party = R.Gear.buildParty(this.members);
      this.maxHp = party.maxHp;
      this.hp = party.maxHp;
      this.items = (opts.items || []).map(x => Object.assign({}, x));
      this.bag = {};
      this.floor = 0;
      this.index = 0;
      this.battlesWon = 0;
      this.phase = 'battle';
      this.rewardOptions = null;
      this.gatherNode = null;
      this.history = [];
      this.deepest = 0;
      this.plan = [];
      if (this.endless) this._addSegment(); else this.plan = this._makePlan();
    }

    get def() { return R.DATA.dungeons[this.dungeonId]; }
    get endless() { return !!this.def.endless; }

    // 階の設定（無限階層では階数から作る）
    floorDef(i) {
      const d = this.def;
      if (!d.endless) return d.floors[i];
      const E = d.endless;
      const tier = E.tiers.filter(t => i + 1 >= t.from).pop();
      const isBossFloor = (i + 1) % E.segment === 0;
      return {
        battles: E.battles, encounters: tier.encounters,
        scale: { hp: 1 + E.hpPerFloor * i, dmg: 1 + E.dmgPerFloor * i },
        boss: isBossFloor ? E.bosses[Math.floor(i / E.segment) % E.bosses.length] : null
      };
    }
    // 採集の表（無限階層では4階ごとにくり返す）
    gatherEntry(kind) {
      const list = this.def.gather[kind];
      return list[this.endless ? this.floor % list.length : this.floor];
    }

    _floorPlan(f) {
      const n = this.rng.int(f.battles[0], f.battles[1]);
      const list = [];
      for (let i = 0; i < n; i++) list.push(this.rng.weighted(f.encounters));
      if (f.boss) list.push(f.boss);
      return list;
    }
    _makePlan() { return this.def.floors.map(f => this._floorPlan(f)); }
    // 無限階層：次の4階分を作る
    _addSegment() {
      const start = this.plan.length;
      for (let i = start; i < start + this.def.endless.segment; i++) this.plan.push(this._floorPlan(this.floorDef(i)));
    }

    // 敵の強さの倍率（階ごとの倍率 × 難易度の倍率）
    currentScale() {
      const f = this.floorDef(this.floor).scale;
      const D = R.DATA.difficulty;
      const lv = (this.difficulty || 1) - 1;
      return { hp: f.hp * (1 + D.hpPerLevel * lv), dmg: f.dmg * (1 + D.dmgPerLevel * lv) };
    }

    // 上位素材の出る確率（難易度2以上、無限階層は深いほど）
    highDropChance() {
      if (this.endless) {
        const E = this.def.endless;
        return Math.min(E.highDropMax, E.highDropPerFloor * (this.floor + 1));
      }
      const D = R.DATA.difficulty;
      return Math.min(D.highDropMax, D.highDropPerLevel * ((this.difficulty || 1) - 1));
    }
    _highDrop(bag) {
      const table = this.endless ? this.def.endless.highDrops : highDropTable(this.dungeonId, this.difficulty || 1);
      const p = this.highDropChance();
      if (p <= 0 || !table) return;
      if (this.rng.chance(p)) R.Gather.addMat(bag, this.rng.weighted(table), 1);
    }

    totalBattles() { return this.plan.reduce((a, f) => a + f.length, 0); }
    currentEncounterId() { return this.plan[this.floor][this.index]; }
    isBossNext() { return !!R.DATA.encounters[this.currentEncounterId()].boss; }
    whereText() { return `${this.floor + 1}階 ${this.index + 1}/${this.plan[this.floor].length}戦目`; }

    createCombat(rng) {
      if (this.phase !== 'battle') throw new Error('戦闘の順番ではありません');
      const party = R.Gear.buildParty(this.members);
      const enc = R.DATA.encounters[this.currentEncounterId()];
      this.deepest = Math.max(this.deepest || 0, this.floor + 1);
      return new R.Combat({
        party, hp: this.hp, encounter: enc.enemies, rng: rng || this.rng,
        scale: this.currentScale(), items: this.items
      }).start();
    }

    // 戦闘が終わったら呼ぶ
    finishCombat(combat) {
      this.hp = combat.party.hp;
      this.items = combat.items.map(x => Object.assign({}, x));
      if (combat.result !== 'win') {
        this.history.push({ where: this.whereText(), result: '全滅' });
        this.phase = 'wiped';
        this.lostBag = this.bag;
        this.bag = {};
        this.items = [];
        return { wiped: true };
      }
      const drops = {};
      for (const e of combat.enemies) {
        for (const [m, n] of Object.entries(e.def.drops || {})) R.Gather.addMat(drops, m, n);
      }
      this._highDrop(drops);
      for (const [m, n] of Object.entries(drops)) R.Gather.addMat(this.bag, m, n);
      this.battlesWon++;
      this.history.push({ where: this.whereText(), result: '勝利', drops });
      if (this.endless && this.isBossNext()) {
        this.phase = 'checkpoint';
        return { checkpoint: true, drops };
      }
      const wasBoss = this.isBossNext() && this.floor === this.plan.length - 1;
      if (wasBoss) {
        this.phase = 'cleared';
        return { cleared: true, drops };
      }
      this.phase = 'reward';
      this.rewardOptions = this._rollRewards();
      return { drops };
    }

    // 無限階層：4階ごとのボスを倒したあと、帰還するか続けるか
    checkpointChoice(goOn) {
      if (this.phase !== 'checkpoint') return { ok: false, error: '選べません' };
      if (!goOn) { this.phase = 'cleared'; return { ok: true, returned: true }; }
      this._addSegment();
      this._advance();
      return { ok: true };
    }

    _rollRewards() {
      const w = Object.assign({}, this.def.rewards.weights);
      const out = [];
      while (out.length < 3 && Object.keys(w).length) {
        const k = this.rng.weighted(w);
        out.push(k);
        delete w[k];
      }
      return out;
    }

    // 報酬を選ぶ。採掘・伐採はミニゲームへ（phase='gather'）、それ以外はその場で結果が出る
    chooseReward(kind) {
      if (this.phase !== 'reward' || !this.rewardOptions.includes(kind)) return { ok: false, error: '選べません' };
      if (kind === 'rest') {
        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * this.def.rewards.restHealRatio));
        this._advance();
        return { ok: true, kind, healed: this.hp - before };
      }
      if (kind === 'gathering' || kind === 'treasure') {
        const bag = R.Gather.rollTable(this.gatherEntry(kind), this.rng);
        this._highDrop(bag);
        for (const [m, n] of Object.entries(bag)) R.Gather.addMat(this.bag, m, n);
        this._advance();
        return { ok: true, kind, bag };
      }
      // 採掘・伐採
      const node = this.gatherEntry(kind);
      const life = kind === 'mining' ? 'mining' : 'logging';
      const tool = kind === 'mining' ? this.tools.pick : this.tools.axe;
      const params = R.Gather.gatherParams(node, this.lives[life].lv, tool);
      this.gatherNode = { kind, life, node, params, board: R.Gather.newBoard(node, params, this.rng) };
      this.phase = 'gather';
      return { ok: true, kind, gather: this.gatherNode };
    }

    // 鉱脈探し：1マス掘る
    gatherStrike(index) {
      if (this.phase !== 'gather') return null;
      return R.Gather.strike(this.gatherNode.board, index);
    }

    // 鉱脈探しを終える（振る回数を使い切るか、全部見つけたら終わり）
    finishGather() {
      if (this.phase !== 'gather') return { ok: false, error: '採集中ではありません' };
      const gn = this.gatherNode;
      gn.board.done = true;
      const res = R.Gather.boardResult(gn.node, gn.board, this.rng);
      if (res.found) this._highDrop(res.bag);
      for (const [m, n] of Object.entries(res.bag)) R.Gather.addMat(this.bag, m, n);
      const ups = R.Life.addExp(this.lives[gn.life], res.exp);
      this.gatherNode = null;
      this._advance();
      return Object.assign({ ok: true, levelUps: ups, life: gn.life }, res);
    }

    _advance() {
      this.rewardOptions = null;
      this.index++;
      if (this.index >= this.plan[this.floor].length) { this.floor++; this.index = 0; }
      this.phase = 'battle';
    }

    // セーブ用（乱数と経験値の参照は保存しない）
    serialize() {
      const o = {};
      for (const k of ['dungeonId', 'difficulty', 'members', 'maxHp', 'hp', 'items', 'bag', 'floor', 'index', 'battlesWon', 'phase', 'rewardOptions', 'gatherNode', 'history', 'plan', 'deepest']) {
        o[k] = JSON.parse(JSON.stringify(this[k] === undefined ? null : this[k]));
      }
      return o;
    }
    static restore(data, opts) { return new DungeonRun(opts, data); }
  }

  // ===== ダンジョンのシミュレーション =====
  function runDungeons(opts) {
    const n = opts.n || 100;
    const rng = R.createRng(opts.seed === undefined ? 12345 : opts.seed);
    let clears = 0, battles = 0, hpOnClear = 0, deepest = 0;
    const deathsAt = {};
    for (let i = 0; i < n; i++) {
      const run = new DungeonRun({
        dungeonId: opts.dungeonId || 'cave', difficulty: opts.difficulty || 1, members: opts.members,
        rng: R.createRng(Math.floor(rng.next() * 2 ** 32)),
        lives: opts.lives ? JSON.parse(JSON.stringify(opts.lives)) : R.Life.newLives(),
        tools: opts.tools || { pick: 1, axe: 1 }, items: opts.items
      });
      let guard = 0;
      while (run.phase !== 'cleared' && run.phase !== 'wiped' && guard++ < 400) {
        if (run.phase === 'checkpoint') {
          // 無限階層：HPが半分を切ったか、目標の階に着いたら帰る
          run.checkpointChoice(run.hp >= run.maxHp * 0.5 && run.deepest < (opts.targetFloor || 8));
          continue;
        }
        if (run.phase === 'battle') {
          const c = run.createCombat();
          R.AI.playCombat(c);
          run.finishCombat(c);
        } else if (run.phase === 'reward') {
          const o = run.rewardOptions;
          const pick = (run.hp < run.maxHp * 0.55 && o.includes('rest')) ? 'rest'
            : ['mining', 'logging', 'treasure', 'gathering', 'rest'].find(k => o.includes(k));
          run.chooseReward(pick);
        } else if (run.phase === 'gather') {
          const board = run.gatherNode.board;
          while (!board.done) run.gatherStrike(R.Gather.autoPick(board, run.rng));
          run.finishGather();
        }
      }
      battles += run.battlesWon;
      deepest += run.deepest;
      if (run.phase === 'cleared') { clears++; hpOnClear += run.hp; }
      else {
        const where = run.history.length ? run.history[run.history.length - 1].where.replace(/ .*/, '') + (run.isBossNext() ? '（ボス）' : '') : '?';
        deathsAt[where] = (deathsAt[where] || 0) + 1;
      }
    }
    return { n, clearRate: clears / n, avgBattles: battles / n, avgHpLeftOnClear: clears ? hpOnClear / clears : 0, avgDeepest: deepest / n, deathsAt };
  }

  R.DungeonRun = DungeonRun;
  R.Dungeon = { REWARD_NAMES };
  R.Sim = R.Sim || {};
  R.Sim.runDungeons = runDungeons;
})(globalThis.RASEN = globalThis.RASEN || {});
