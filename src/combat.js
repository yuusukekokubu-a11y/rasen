// 戦闘エンジン（画面に依存しない。シミュレーターとゲーム画面の両方で使う）
//
// 使い方：
//   const c = new RASEN.Combat({ party: RASEN.Gear.buildParty(members), encounter: ['slime','slime'], rng });
//   c.start();
//   c.playCard(iid, targetIndex);   // 手札のカードを使う
//   c.pending → 選択待ち（捨てる・廃棄・並べ替え）があれば c.resolveChoice([...iid]) で答える
//   c.endTurn();
//   c.result → null（戦闘中）/ 'win' / 'lose' / 'timeout'
(function (R) {
  const STATUS_KEYS = ['weak', 'vulnerable', 'burn', 'freeze', 'shock'];

  class Combat {
    constructor(opts) {
      this.cfg = R.DATA.config.combat;
      this.rng = opts.rng || R.createRng();
      this.scale = Object.assign({ hp: 1, dmg: 1 }, opts.scale || {});
      this.log = [];
      this.result = null;
      this.pending = null;
      this.queue = [];
      this.turn = 0;
      this.energy = 0;
      this.nextIid = 1;

      // パーティ
      const p = opts.party;
      this.chars = p.chars.map(c => ({
        index: c.index, job: c.job, name: c.name,
        stats: Object.assign({}, c.stats),
        bonus: { atk: 0, def: 0, mag: 0 }
      }));
      this.party = {
        maxHp: p.maxHp,
        hp: opts.hp !== undefined ? Math.min(opts.hp, p.maxHp) : p.maxHp,
        block: 0,
        weak: 0,
        vulnerable: 0,
        freshVulnerable: false,
        ward: 0             // 結界：ターンをまたいで残る盾。ブロックの後にダメージを防ぐ
      };

      // デッキ
      this.allCards = [];
      for (const c of p.chars) {
        for (const spec of c.cards) {
          this.allCards.push({
            iid: this.nextIid++, cardId: spec.cardId, owner: c.index,
            upgraded: !!spec.upgraded, enchants: (spec.enchants || []).slice(), training: 0
          });
        }
      }
      this.draw = [];      // 末尾が山札の一番上
      this.hand = [];
      this.discard = [];
      this.exhaust = [];
      this.usedPowers = [];
      this.powers = [];    // 発動中のパワー { id, owner, sourceIid }

      // 持ち込みアイテム { id, quality }
      this.items = (opts.items || []).map(it => Object.assign({}, it));
      this.usedItems = [];

      // 敵
      const encounter = opts.encounter || [];
      this.enemies = encounter.map((id, i) => this._makeEnemy(id, i));

      // 記録（シミュレーター用）
      this.counters = {
        damageTaken: 0, damageDealt: 0, cardsPlayed: 0,
        discardedThisTurn: 0, cardsPlayedThisTurn: 0, exhaustedThisCombat: 0, powersPlayed: 0,
        lastPlayedOwner: null
      };
    }

    // ===== 準備 =====
    _makeEnemy(id, index) {
      const def = R.DATA.enemies[id];
      if (!def) throw new Error('不明な敵: ' + id);
      const hp = Math.round(this.rng.int(def.hp[0], def.hp[1]) * this.scale.hp);
      return {
        index, id, def, name: def.name, boss: !!def.boss,
        hp, maxHp: hp, block: 0, str: 0, alive: true,
        st: { weak: 0, vulnerable: 0, burn: 0, freeze: 0, shock: 0 },
        elementMult: def.elementMult || {},
        intent: null, history: [], cycleIndex: 0
      };
    }

    cardDef(inst) { return R.Cards.getCardDef(inst.cardId, inst.upgraded); }
    cardCost(inst) { return R.Cards.cardCost(this.cardDef(inst), inst.enchants); }
    hasEnchant(inst, id) { return inst.enchants.some(e => e.id === id); }
    statOf(owner, stat) {
      if (owner === null || owner === undefined || !stat || stat === 'none') return 0;
      const c = this.chars[owner];
      return (c.stats[stat] || 0) + (c.bonus[stat] || 0);
    }
    // 表示用：キャラの現在のステータス（装備＋戦闘中の上昇）
    currentStats(owner) {
      return { atk: this.statOf(owner, 'atk'), def: this.statOf(owner, 'def'), mag: this.statOf(owner, 'mag') };
    }
    aliveEnemies() { return this.enemies.filter(e => e.alive); }
    _firstAlive() { const e = this.enemies.find(x => x.alive); return e ? e.index : -1; }
    _validTarget(idx) {
      if (idx !== undefined && idx !== null && this.enemies[idx] && this.enemies[idx].alive) return idx;
      return this._firstAlive();
    }
    _log(msg) { this.log.push(msg); if (this.log.length > 300) this.log.shift(); }

    start() {
      this.draw = this.rng.shuffle(this.allCards.slice());
      // 初手確定のカードを山札の一番上へ
      const innate = this.draw.filter(c => this.hasEnchant(c, 'innate'));
      if (innate.length) {
        this.draw = this.draw.filter(c => !this.hasEnchant(c, 'innate')).concat(innate);
      }
      for (const e of this.enemies) this._chooseIntent(e);
      this._log(`戦闘開始！ ${this.enemies.map(e => e.name).join('・')}が現れた`);
      this._startPlayerTurn();
      return this;
    }

    // ===== ターン進行 =====
    _startPlayerTurn() {
      this.turn++;
      if (this.turn > this.cfg.maxTurns) { this._finish('timeout'); return; }
      this.party.block = 0;
      // 結界は少しずつ弱まる（パワー「不朽の結界」があれば弱まらない）
      const keep = this.powers.some(p => R.DATA.powers[p.id].wardNoDecay) ? 1 : this.cfg.wardKeep;
      this.party.ward = Math.floor(this.party.ward * keep);
      this.energy = this.cfg.energyPerTurn;
      this.counters.discardedThisTurn = 0;
      this.counters.cardsPlayedThisTurn = 0;
      this.counters.lastPlayedOwner = null;
      this._log(`―― ターン${this.turn} ――`);
      this.queue.push(() => this._drawCards(this.cfg.handSize));
      for (const pw of this.powers) {
        const pd = R.DATA.powers[pw.id];
        if (pd.turnStart) for (const e of pd.turnStart) this.queue.push(() => this._applyEffect(e, { owner: pw.owner, mult: 1 }));
      }
      this._run();
    }

    endTurn() {
      if (this.result) return { ok: false, error: '戦闘は終了しています' };
      if (this.pending || this.queue.length) return { ok: false, error: '選択を先に済ませてください' };
      // パワー：ターン終了時
      for (const pw of this.powers) {
        const pd = R.DATA.powers[pw.id];
        if (pd.turnEnd) for (const e of pd.turnEnd) this._applyEffect(e, { owner: pw.owner, mult: 1 });
      }
      // 手札を捨てる（保留は残す）
      const keep = [];
      for (const c of this.hand) {
        if (this.hasEnchant(c, 'retain')) keep.push(c);
        else this.discard.push(c);
      }
      this.hand = keep;
      // パーティの脱力は「プレイヤーのターン数」で減る
      if (this.party.weak > 0) this.party.weak--;
      this._enemyPhase();
      if (!this.result) this._startPlayerTurn();
      return { ok: true };
    }

    _enemyPhase() {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        // 燃焼：ブロック無視のダメージ
        if (e.st.burn > 0) {
          const d = e.st.burn;
          e.hp -= d;
          this.counters.damageDealt += d;
          this._log(`${e.name}は燃焼で${d}ダメージ`);
          e.st.burn--;
          if (e.hp <= 0) { this._killEnemy(e); continue; }
        }
        e.block = 0;
        this._enemyAct(e);
        if (this.party.hp <= 0) break;
      }
      this._checkEnd();
      if (this.result) return;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        for (const k of ['weak', 'vulnerable', 'freeze', 'shock']) if (e.st[k] > 0) e.st[k]--;
        this._chooseIntent(e);
      }
      // パーティの弱体は「敵の行動回数」で減る（この敵フェイズで付いた分は減らさない）
      if (this.party.freshVulnerable) this.party.freshVulnerable = false;
      else if (this.party.vulnerable > 0) this.party.vulnerable--;
    }

    _chooseIntent(e) {
      const pat = e.def.pattern;
      let moveId;
      if (pat.opening && e.history.length === 0) {
        moveId = pat.opening;
      } else if (pat.type === 'cycle') {
        moveId = pat.seq[e.cycleIndex % pat.seq.length];
        e.cycleIndex++;
      } else {
        const weights = Object.assign({}, pat.weights);
        const max = pat.maxRepeat || 99;
        const last = e.history.slice(-max);
        if (last.length === max && last.every(m => m === last[0])) delete weights[last[0]];
        moveId = this.rng.weighted(weights);
      }
      e.intent = moveId;
      e.history.push(moveId);
    }

    // 敵の攻撃1回あたりの予定ダメージ（脱力・凍結・弱体を反映）
    enemyHitDamage(e, move) {
      let d = move.dmg * this.scale.dmg + e.str;
      if (e.st.weak > 0) d *= this.cfg.weakMult;
      if (e.st.freeze > 0) d *= this.cfg.freezeMult;
      if (this.party.vulnerable > 0) d *= this.cfg.vulnerableMult;
      return Math.max(0, Math.floor(d));
    }

    // 画面表示用の行動予告
    intentInfo(e) {
      const mv = e.def.moves[e.intent];
      if (!mv) return null;
      const parts = [];
      const kinds = [];
      if (mv.dmg) {
        const per = this.enemyHitDamage(e, mv);
        const hits = mv.hits || 1;
        parts.push(hits > 1 ? `攻撃 ${per}×${hits}` : `攻撃 ${per}`);
        kinds.push('attack');
      }
      if (mv.block) { parts.push(`防御 ${Math.round(mv.block * this.scale.dmg)}`); kinds.push('defend'); }
      if (mv.allyBlock) { parts.push(`味方防御 ${mv.allyBlock}`); kinds.push('defend'); }
      if (mv.str) { parts.push(`強化 +${mv.str}`); kinds.push('buff'); }
      if (mv.heal) { parts.push(`回復 ${mv.heal}`); kinds.push('buff'); }
      if (mv.debuff) { parts.push(`${R.Cards.STATUS_NAMES[mv.debuff.s]}${mv.debuff.v}`); kinds.push('debuff'); }
      const total = mv.dmg ? this.enemyHitDamage(e, mv) * (mv.hits || 1) : 0;
      return { name: mv.name, text: parts.join('・'), kinds, totalDamage: total };
    }

    // 敵の攻撃予定の合計（AIやUIで使う）
    incomingDamage() {
      let sum = 0;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const mv = e.def.moves[e.intent];
        if (mv && mv.dmg) sum += this.enemyHitDamage(e, mv) * (mv.hits || 1);
        // 燃焼で倒れる敵の分は数えない
      }
      return sum;
    }

    _enemyAct(e) {
      const mv = e.def.moves[e.intent];
      if (!mv) return;
      if (mv.dmg) {
        const hits = mv.hits || 1;
        let total = 0;
        for (let i = 0; i < hits; i++) {
          let d = this.enemyHitDamage(e, mv);
          // ブロック → 結界 の順にダメージを防ぐ
          const blocked = Math.min(this.party.block, d);
          this.party.block -= blocked;
          d -= blocked;
          const warded = Math.min(this.party.ward, d);
          this.party.ward -= warded;
          d -= warded;
          this.party.hp -= d;
          this.counters.damageTaken += d;
          total += d;
          // 画面の演出用：1発ずつの記録（hitLog が用意されているときだけ）
          if (this.hitLog) this.hitLog.push({ enemy: e.index, dmg: d, guarded: blocked + warded, hp: Math.max(0, this.party.hp) });
        }
        this._log(`${e.name}の${mv.name}！ ${total}ダメージ`);
      } else {
        this._log(`${e.name}の${mv.name}`);
      }
      if (mv.debuff) {
        this.party[mv.debuff.s] += mv.debuff.v;
        if (mv.debuff.s === 'vulnerable') this.party.freshVulnerable = true;
      }
      if (mv.block) e.block += Math.round(mv.block * this.scale.dmg);
      if (mv.allyBlock) for (const o of this.enemies) if (o.alive) o.block += mv.allyBlock;
      if (mv.str) e.str += mv.str;
      if (mv.heal) e.hp = Math.min(e.maxHp, e.hp + mv.heal);
      if (this.party.hp <= 0) { this.party.hp = 0; this._finish('lose'); }
    }

    // ===== カードを使う =====
    canPlay(inst) {
      if (this.result || this.pending || this.queue.length) return false;
      return this.cardCost(inst) <= this.energy;
    }

    playCard(iid, targetIndex) {
      if (this.result) return { ok: false, error: '戦闘は終了しています' };
      if (this.pending || this.queue.length) return { ok: false, error: '選択を先に済ませてください' };
      const idx = this.hand.findIndex(c => c.iid === iid);
      if (idx < 0) return { ok: false, error: '手札にないカードです' };
      const inst = this.hand[idx];
      const def = this.cardDef(inst);
      const cost = this.cardCost(inst);
      if (cost > this.energy) return { ok: false, error: 'エネルギーが足りません' };

      this.energy -= cost;
      this.hand.splice(idx, 1);
      const target = this._validTarget(targetIndex);
      const ctx = this._playContext(inst, target);
      this._log(`${this.chars[inst.owner].name}：${def.displayName}`);

      const reps = this.hasEnchant(inst, 'multi') ? 2 : 1;
      for (let r = 0; r < reps; r++) {
        for (const e of def.effects) this.queue.push(() => this._applyEffect(e, ctx));
      }
      this.queue.push(() => this._finishPlay(inst, def));
      this._run();
      return { ok: true };
    }

    // 付与効果の条件を見て、このカードの威力倍率などを決める
    _playContext(inst, target) {
      let mult = 1;
      const last = this.counters.lastPlayedOwner;
      let element = null;
      for (const en of inst.enchants) {
        const d = R.DATA.enchants.list[en.id];
        switch (en.id) {
          case 'link': if (last !== null && last !== inst.owner) mult *= d.mult; break;
          case 'chain': if (last !== null && last === inst.owner) mult *= d.mult; break;
          case 'desperate': if (this.party.hp <= this.party.maxHp / 2) mult *= d.mult; break;
          case 'steadfast': if (this.party.block > 0) mult *= d.mult; break;
          case 'resonance': if (this.counters.powersPlayed > 0) mult *= d.mult; break;
          case 'lightweight': case 'exhaustBoost': case 'multi': mult *= d.mult; break;
          case 'training': mult *= 1 + d.step * inst.training; break;
          case 'element': element = en.element || 'fire'; break;
        }
      }
      return { owner: inst.owner, target, mult, enchElement: element, sourceIid: inst.iid };
    }

    _finishPlay(inst, def) {
      if (def.type === 'power') {
        this.usedPowers.push(inst);
      } else if (def.exhaust || this.hasEnchant(inst, 'exhaustBoost')) {
        this._exhaustCard(inst);
      } else {
        this.discard.push(inst);
      }
      inst.training++;
      this.counters.cardsPlayed++;
      this.counters.cardsPlayedThisTurn++;
      this.counters.lastPlayedOwner = inst.owner;
      if (this.hasEnchant(inst, 'drawOne')) this.queue.push(() => this._drawCards(1));
      if (this.hasEnchant(inst, 'foresight')) this.queue.push(() => this._applyEffect({ t: 'scry', v: 3 }, { owner: inst.owner, mult: 1 }));
      // パワー：カードを使うたび
      for (const pw of this.powers) {
        if (pw.sourceIid === inst.iid) continue;
        const pd = R.DATA.powers[pw.id];
        if (!pd.cardPlayed) continue;
        const f = pd.cardPlayed.filter || {};
        if (f.tag && !(def.tags || []).includes(f.tag)) continue;
        if (f.type && def.type !== f.type) continue;
        if (f.owner === 'self' && inst.owner !== pw.owner) continue;
        if (f.minCost && def.cost < f.minCost) continue;
        for (const e of pd.cardPlayed.effects) this.queue.push(() => this._applyEffect(e, { owner: pw.owner, mult: 1 }));
      }
    }

    // ===== 効果の処理 =====
    _run() {
      while (this.queue.length && !this.pending && !this.result) {
        const fn = this.queue.shift();
        fn();
        this._checkEnd();
      }
      if (this.result) this.queue = [];
    }

    _checkEnd() {
      if (this.result) return;
      if (this.party.hp <= 0) { this.party.hp = 0; this._finish('lose'); return; }
      if (this.enemies.every(e => !e.alive)) this._finish('win');
    }

    _finish(result) {
      this.result = result;
      this.pending = null;
      this.queue = [];
      const msg = { win: '勝利！', lose: '全滅してしまった…', timeout: 'ターン数の上限に達した' }[result];
      this._log(msg);
    }

    _dmgBase(e, owner) {
      const scale = e.scale || 'atk';
      let base = e.v + this.statOf(owner, scale);
      if (e.plusPer) {
        const what = e.plusPer.what;
        const n = what === 'block' ? this.party.block : what === 'ward' ? this.party.ward : (this.counters[what] || 0);
        base += n * e.plusPer.v;
      }
      return base;
    }

    // 敵1体に与える予定のダメージ（ブロック前）
    _dmgToEnemy(raw, enemy, element) {
      let d = raw;
      if (enemy.st.vulnerable > 0) d *= this.cfg.vulnerableMult;
      if (enemy.st.shock > 0) d *= this.cfg.shockMult;
      if (element && enemy.elementMult[element]) d *= enemy.elementMult[element];
      return Math.max(0, Math.floor(d));
    }

    _hitEnemy(enemy, raw, element) {
      if (!enemy.alive) return 0;
      let d = this._dmgToEnemy(raw, enemy, element);
      const blocked = Math.min(enemy.block, d);
      enemy.block -= blocked;
      d -= blocked;
      enemy.hp -= d;
      this.counters.damageDealt += d;
      if (enemy.hp <= 0) this._killEnemy(enemy);
      return d;
    }

    _killEnemy(enemy) {
      enemy.hp = 0;
      enemy.alive = false;
      this._log(`${enemy.name}を倒した！`);
    }

    _applyEffect(e, ctx) {
      if (this.result) return;
      const mult = ctx.mult === undefined ? 1 : ctx.mult;
      switch (e.t) {
        case 'dmg': {
          const element = e.element || ctx.enchElement || null;
          let raw = this._dmgBase(e, ctx.owner) * mult;
          if (this.party.weak > 0) raw *= this.cfg.weakMult;
          const hits = e.hits || 1;
          const hitTargets = new Set();
          let total = 0;
          for (let h = 0; h < hits; h++) {
            let targets;
            if (e.target === 'all') targets = this.aliveEnemies();
            else if (e.target === 'random') { const a = this.aliveEnemies(); targets = a.length ? [this.rng.pick(a)] : []; }
            else { const t = this._validTarget(ctx.target); targets = t >= 0 ? [this.enemies[t]] : []; }
            for (const t of targets) { total += this._hitEnemy(t, raw, element); hitTargets.add(t); }
          }
          if (total > 0) this._log(`　${total}ダメージ`);
          // 付与効果「属性」：状態異常を1与える
          if (ctx.enchElement) {
            const st = R.DATA.enchants.elements[ctx.enchElement].status;
            for (const t of hitTargets) if (t.alive) t.st[st] += 1;
          }
          break;
        }
        case 'ward': {
          const rate = e.magRate === undefined ? 1 : e.magRate;
          const amount = Math.max(0, Math.floor((e.v + Math.floor(this.statOf(ctx.owner, e.scale || 'mag') * rate)) * mult));
          this.party.ward += amount;
          break;
        }
        case 'block': {
          const scale = e.scale || 'def';
          const amount = Math.max(0, Math.floor((e.v + this.statOf(ctx.owner, scale)) * mult));
          this.party.block += amount;
          break;
        }
        case 'heal': {
          const magRate = e.magRate === undefined ? 1 : e.magRate;
          const amount = Math.max(0, Math.floor((e.v + Math.floor(this.statOf(ctx.owner, 'mag') * magRate)) * mult));
          const before = this.party.hp;
          this.party.hp = Math.min(this.party.maxHp, this.party.hp + amount);
          this._log(`　HPが${this.party.hp - before}回復`);
          break;
        }
        case 'draw': this._drawCards(e.v); break;
        case 'energy': this.energy += e.v; break;
        case 'status': {
          const targets = e.target === 'all' ? this.aliveEnemies()
            : (() => { const t = this._validTarget(ctx.target); return t >= 0 ? [this.enemies[t]] : []; })();
          for (const t of targets) t.st[e.s] += e.v;
          break;
        }
        case 'buff': {
          const who = (e.who === 'party' || ctx.owner === null || ctx.owner === undefined) ? this.chars : [this.chars[ctx.owner]];
          for (const c of who) c.bonus[e.stat] = (c.bonus[e.stat] || 0) + e.v;
          break;
        }
        case 'discard': this._askHandChoice('discard', e.v, ctx); break;
        case 'exhaustChoice': this._askHandChoice('exhaust', e.v, ctx); break;
        case 'scry': this._askScry(e.v); break;
        case 'power': {
          const pd = R.DATA.powers[e.id];
          this.powers.push({ id: e.id, owner: ctx.owner, sourceIid: ctx.sourceIid });
          this.counters.powersPlayed++;
          this._log(`　パワー「${pd.name}」発動`);
          if (pd.onPlay) {
            // 先に処理する
            const fns = pd.onPlay.map(pe => () => this._applyEffect(pe, { owner: ctx.owner, mult: 1 }));
            this.queue.unshift(...fns);
          }
          break;
        }
      }
    }

    _drawCards(n) {
      for (let i = 0; i < n; i++) {
        if (this.draw.length === 0) {
          if (this.discard.length === 0) break;
          this.draw = this.rng.shuffle(this.discard);
          this.discard = [];
          this._log('　捨て札を山札に戻した');
        }
        const c = this.draw.pop();
        if (this.hand.length >= this.cfg.maxHand) {
          this.discard.push(c);
          continue;
        }
        this.hand.push(c);
        if (this.hasEnchant(c, 'onDraw')) {
          for (const e of R.DATA.enchants.list.onDraw.effects) this._applyEffect(e, { owner: c.owner, mult: 1 });
        }
      }
    }

    _discardFromHand(inst) {
      const i = this.hand.indexOf(inst);
      if (i < 0) return;
      this.hand.splice(i, 1);
      this.discard.push(inst);
      this.counters.discardedThisTurn++;
      if (this.hasEnchant(inst, 'onDiscard')) {
        const def = this.cardDef(inst);
        const ctx = { owner: inst.owner, target: this._randomAliveIndex(), mult: 0.5, enchElement: null, sourceIid: inst.iid };
        const fns = def.effects.filter(e => e.t !== 'discard' && e.t !== 'exhaustChoice' && e.t !== 'scry')
          .map(e => () => this._applyEffect(e, ctx));
        this.queue.unshift(...fns);
        this._log(`　${def.displayName}の捨て札発動`);
      }
      this._triggerPowers('cardDiscarded');
    }

    // パワー：捨てたとき・廃棄したとき
    _triggerPowers(hook) {
      for (const pw of this.powers) {
        const pd = R.DATA.powers[pw.id];
        if (pd[hook]) for (const e of pd[hook]) this.queue.push(() => this._applyEffect(e, { owner: pw.owner, mult: 1 }));
      }
    }

    _exhaustCard(inst) {
      const i = this.hand.indexOf(inst);
      if (i >= 0) this.hand.splice(i, 1);
      this.exhaust.push(inst);
      this.counters.exhaustedThisCombat++;
      if (this.hasEnchant(inst, 'lastWords')) this.queue.unshift(() => this._drawCards(1));
      this._triggerPowers('cardExhausted');
    }

    _randomAliveIndex() {
      const a = this.aliveEnemies();
      return a.length ? this.rng.pick(a).index : -1;
    }

    // ===== 選択待ち =====
    _askHandChoice(kind, count, ctx) {
      const n = Math.min(count, this.hand.length);
      if (n <= 0) return;
      const options = this.hand.map(c => c.iid);
      const act = (iids) => {
        for (const iid of iids) {
          const inst = this.hand.find(c => c.iid === iid);
          if (!inst) continue;
          if (kind === 'discard') this._discardFromHand(inst);
          else this._exhaustCard(inst);
        }
      };
      if (options.length <= n) { act(options); return; }
      this.pending = {
        kind, count: n, options,
        prompt: kind === 'discard' ? `捨てるカードを${n}枚選んでください` : `廃棄するカードを${n}枚選んでください`,
        resolve: (sel) => {
          const uniq = [...new Set(sel)].filter(id => options.includes(id));
          if (uniq.length !== n) return `ちょうど${n}枚選んでください`;
          act(uniq);
          return null;
        }
      };
    }

    _askScry(count) {
      if (this.draw.length === 0 && this.discard.length > 0) {
        this.draw = this.rng.shuffle(this.discard);
        this.discard = [];
      }
      const n = Math.min(count, this.draw.length);
      if (n <= 1) return;
      const top = this.draw.slice(-n).reverse(); // 先頭が一番上
      const options = top.map(c => c.iid);
      this.pending = {
        kind: 'scry', count: n, options,
        prompt: `山札の上${n}枚を、上に置きたい順に並べてください`,
        resolve: (sel) => {
          const uniq = [...new Set(sel)].filter(id => options.includes(id));
          if (uniq.length !== n) return `${n}枚すべての順番を決めてください`;
          const rest = this.draw.slice(0, this.draw.length - n);
          const ordered = uniq.map(id => top.find(c => c.iid === id));
          this.draw = rest.concat(ordered.reverse());
          return null;
        }
      };
    }

    resolveChoice(selection) {
      if (!this.pending) return { ok: false, error: '選択待ちではありません' };
      const err = this.pending.resolve(selection || []);
      if (err) return { ok: false, error: err };
      this.pending = null;
      this._run();
      return { ok: true };
    }

    // ===== 持ち込みアイテム =====
    useItem(index, targetIndex) {
      if (this.result) return { ok: false, error: '戦闘は終了しています' };
      if (this.pending || this.queue.length) return { ok: false, error: '選択を先に済ませてください' };
      const it = this.items[index];
      if (!it) return { ok: false, error: 'アイテムがありません' };
      const def = R.DATA.items[it.id];
      const mult = R.DATA.config.quality[it.quality || 'normal'].mult;
      this.items.splice(index, 1);
      this.usedItems.push(it);
      this._log(`アイテム：${def.name}`);
      const ctx = { owner: null, target: this._validTarget(targetIndex), mult, enchElement: null };
      for (const e of def.effects) this.queue.push(() => this._applyEffect(e, ctx));
      this._run();
      return { ok: true };
    }

    // ===== 予測（AIと画面表示用。状態は変えない） =====
    previewCard(inst, targetIndex) {
      const def = this.cardDef(inst);
      const target = this._validTarget(targetIndex);
      const ctx = this._playContext(inst, target);
      const reps = this.hasEnchant(inst, 'multi') ? 2 : 1;
      const out = { damage: 0, perEnemy: this.enemies.map(() => 0), block: 0, heal: 0, draw: 0, energy: 0, kills: 0 };
      for (let r = 0; r < reps; r++) {
        for (const e of def.effects) {
          if (e.t === 'dmg') {
            const element = e.element || ctx.enchElement;
            let raw = this._dmgBase(e, ctx.owner) * ctx.mult;
            if (this.party.weak > 0) raw *= this.cfg.weakMult;
            const hits = e.hits || 1;
            let targets;
            if (e.target === 'all') targets = this.aliveEnemies();
            else if (e.target === 'random') targets = this.aliveEnemies().slice(0, 1);
            else targets = target >= 0 ? [this.enemies[target]] : [];
            for (const t of targets) out.perEnemy[t.index] += this._dmgToEnemy(raw, t, element) * hits;
          } else if (e.t === 'block') {
            out.block += Math.floor((e.v + this.statOf(ctx.owner, e.scale || 'def')) * ctx.mult);
          } else if (e.t === 'ward') {
            out.ward = (out.ward || 0) + Math.floor((e.v + this.statOf(ctx.owner, e.scale || 'mag')) * ctx.mult);
          } else if (e.t === 'heal') {
            out.heal += Math.floor((e.v + this.statOf(ctx.owner, 'mag')) * ctx.mult);
          } else if (e.t === 'draw') out.draw += e.v;
          else if (e.t === 'energy') out.energy += e.v;
        }
      }
      if (this.hasEnchant(inst, 'drawOne')) out.draw += 1;
      for (const en of this.enemies) {
        if (!en.alive) continue;
        const d = out.perEnemy[en.index];
        out.damage += Math.min(d, en.hp + en.block);
        if (d >= en.hp + en.block) out.kills++;
      }
      return out;
    }
  }

  Combat.STATUS_KEYS = STATUS_KEYS;
  R.Combat = Combat;
})(globalThis.RASEN = globalThis.RASEN || {});
