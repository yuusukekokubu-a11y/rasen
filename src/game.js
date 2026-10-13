// ゲーム全体の状態（所持品・装備・生産Lvなど）とセーブ
// セーブはブラウザの保存領域（localStorage）に入れる。使えない環境では保存せずに遊べる
(function (R) {
  const SAVE_KEY = 'rasen-save-v1';
  const VERSION = 1;

  const Game = {
    state: null,

    newState() {
      const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);
      const s = {
        version: VERSION,
        nextUid: 1,
        party: jobs.slice(0, 3),
        equipped: {},          // { 職業: { weapon: uid, head: uid, body: uid, accessory: uid } }
        items: [],             // 装備品
        materials: { copper_ore: 4, oak: 4, flax: 3, quartz: 1 },
        tools: ['copper_pick', 'copper_axe'],
        consumables: [],       // 持ち込みアイテム { uid, id, quality }
        bring: [],             // 持ち込むアイテムの uid（最大3）
        life: R.Life.newLives(),
        clears: {},            // { ダンジョンID: クリア回数 }
        maxDifficulty: {},     // { ダンジョンID: クリアした一番高い難易度 }
        bestFloor: {},         // { 無限階層のID: 到達した一番深い階 }
        runs: 0,
        run: null,             // 進行中のダンジョン
        settings: { debug: false } // テスト用の機能を表示するか
      };
      this.state = s;
      for (const job of jobs) this.giveStarter(job);
      return s;
    },

    giveStarter(job) {
      const s = this.state;
      const starter = R.DATA.loadouts.starter[job];
      if (!starter) return;
      s.equipped[job] = {};
      for (const slot of R.Gear.SLOTS) {
        if (!starter[slot]) continue;
        const it = this.addItem(Object.assign({ quality: 'normal', slots: [] }, JSON.parse(JSON.stringify(starter[slot]))));
        s.equipped[job][slot] = it.uid;
      }
    },

    // セーブデータの修復：ゲームを更新してデータ（装備・カード・素材・ダンジョンのID）が変わっても、
    // 読めなくなった所だけを直して続きから遊べるようにする。直した内容の一覧を返す（テスト・確認用）
    migrate() {
      const s = this.state;
      const D = R.DATA;
      const fixes = [];
      const fresh = (() => { const keep = this.state; const n = this.newState(); this.state = keep; return n; })();
      // 足りない項目を補う
      for (const k of Object.keys(fresh)) {
        if (k !== 'run' && (s[k] === undefined || s[k] === null)) { s[k] = fresh[k]; fixes.push(`項目 ${k} を補った`); }
      }
      for (const k of ['equipped', 'materials', 'life', 'clears', 'maxDifficulty', 'bestFloor', 'settings']) if (typeof s[k] !== 'object' || Array.isArray(s[k])) { s[k] = fresh[k]; fixes.push(`項目 ${k} を作り直した`); }
      for (const k of ['items', 'tools', 'consumables', 'bring', 'party']) if (!Array.isArray(s[k])) { s[k] = fresh[k]; fixes.push(`項目 ${k} を作り直した`); }

      // 装備品：元の品がなくなった物は捨てる。カード・付与効果・パワーがなくなっていたら付け直す
      const rng = R.createRng();
      s.items = s.items.filter(it => {
        const base = it && D.equipment.bases[it.base];
        if (!base) { fixes.push(`装備 ${it && it.base} を取り除いた`); return false; }
        if (!D.cards[it.randomCard]) {
          const pool = Object.keys(D.cards).filter(id => D.cards[id].pool === base.type);
          it.randomCard = pool.length ? rng.pick(pool) : base.fixedCard;
          fixes.push(`${base.name} のランダムカードを付け直した`);
        }
        if (!Array.isArray(it.slots)) it.slots = [];
        it.slots = it.slots.filter(sl => sl && (sl.kind === 'stat' ? D.equipment.statRolls[sl.stat] : D.enchants.list[sl.id]));
        if (!D.config.quality[it.quality]) it.quality = 'normal';
        if (base.slot === 'accessory' && (!it.power || !D.cards[it.power])) {
          it.power = R.Craft.rollAccessoryPower(1, rng);
          fixes.push(`${base.name} のパワーを付け直した`);
        }
        return true;
      });
      for (const it of s.items) if (typeof it.uid !== 'number') it.uid = undefined;
      s.nextUid = Math.max(s.nextUid || 1, ...s.items.map(it => (it.uid || 0) + 1));
      for (const it of s.items) if (it.uid === undefined) it.uid = s.nextUid++;
      const uids = new Set(s.items.map(it => it.uid));
      s.nextUid = Math.max(s.nextUid || 1, ...s.items.map(it => (it.uid || 0) + 1), ...s.consumables.map(c => (c.uid || 0) + 1));

      // 職業：新しく増えた職業に初期装備を配る。装備欄から、なくなった装備を外す
      for (const job of Object.keys(s.equipped)) if (!D.jobs[job]) { delete s.equipped[job]; fixes.push(`職業 ${job} を取り除いた`); }
      for (const job of Object.keys(D.jobs)) {
        if (D.jobs[job].enabled && !s.equipped[job]) this.giveStarter(job);
      }
      for (const eq of Object.values(s.equipped)) {
        for (const slot of Object.keys(eq)) if (!R.Gear.SLOTS.includes(slot) || !uids.has(eq[slot])) delete eq[slot];
      }
      s.party = s.party.filter((j, i, a) => D.jobs[j] && D.jobs[j].enabled && a.indexOf(j) === i);
      const jobs = Object.keys(D.jobs).filter(j => D.jobs[j].enabled);
      for (const j of jobs) if (s.party.length < 3 && !s.party.includes(j)) s.party.push(j);

      // 素材・道具・持ち込みアイテム
      for (const [m, n] of Object.entries(s.materials)) {
        if (!D.materials[m]) { delete s.materials[m]; fixes.push(`素材 ${m} を取り除いた`); continue; }
        if (typeof n !== 'number' || !(n >= 0)) s.materials[m] = 0;
      }
      s.tools = s.tools.filter(t => D.equipment.tools[t]);
      s.consumables = s.consumables.filter(c => c && D.items[c.id]);
      const cu = new Set(s.consumables.map(c => c.uid));
      s.bring = s.bring.filter((u, i, a) => cu.has(u) && a.indexOf(u) === i).slice(0, D.config.combat.itemSlots);

      // 生産・採集のLv
      for (const k of Object.keys(R.Life.LIVES)) {
        const l = s.life[k];
        if (!l || typeof l.lv !== 'number') s.life[k] = { lv: 1, exp: 0 };
        else l.lv = Math.max(1, Math.min(D.config.life.maxLv, l.lv));
      }

      // ダンジョンの記録：なくなったダンジョンは消し、段は上限におさめる
      for (const rec of ['clears', 'maxDifficulty', 'bestFloor']) {
        for (const id of Object.keys(s[rec])) if (!D.dungeons[id]) { delete s[rec][id]; fixes.push(`記録 ${id} を取り除いた`); }
      }
      for (const [id, n] of Object.entries(s.clears)) if (n > 0 && !s.maxDifficulty[id]) s.maxDifficulty[id] = 1;
      for (const id of Object.keys(s.maxDifficulty)) s.maxDifficulty[id] = Math.min(D.difficulty.max, s.maxDifficulty[id]);

      // 中断中のダンジョン：読めなければ、拾った素材を持ち物に戻して中断を取り消す
      if (s.run) {
        const r = s.run;
        const ok = r && D.dungeons[r.dungeonId] && Array.isArray(r.plan) && r.plan.every(f => Array.isArray(f) && f.every(e => D.encounters[e]))
          && (r.difficulty || 1) <= D.difficulty.max;
        if (!ok) {
          if (r && r.bag) for (const [m, n] of Object.entries(r.bag)) if (D.materials[m]) s.materials[m] = (s.materials[m] || 0) + n;
          s.run = null;
          fixes.push('中断中のダンジョンを取り消した（拾った素材は持ち物へ）');
        }
      }
      s.version = VERSION;
      return fixes;
    },

    load() {
      let data = null;
      let raw = null;
      try {
        raw = globalThis.localStorage && localStorage.getItem(SAVE_KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) { data = null; }
      if (data && typeof data === 'object') {
        // 直す前のセーブを予備として残す（万一の取り戻し用）
        try { if (raw && globalThis.localStorage) localStorage.setItem(SAVE_KEY + '-backup', raw); } catch (e) { /* 何もしない */ }
        this.state = data;
        try { this.migrate(); } catch (e) { this.newState(); }
      } else {
        this.newState();
      }
      return this.state;
    },

    save() {
      try {
        if (globalThis.localStorage) localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
        return true;
      } catch (e) { return false; }
    },

    reset() {
      try { if (globalThis.localStorage) localStorage.removeItem(SAVE_KEY); } catch (e) { /* 何もしない */ }
      this.newState();
      this.save();
    },

    addItem(item) {
      item.uid = this.state.nextUid++;
      this.state.items.push(item);
      return item;
    },
    itemByUid(uid) { return this.state.items.find(i => i.uid === uid) || null; },
    equippedBy(uid) {
      for (const [job, eq] of Object.entries(this.state.equipped)) {
        for (const [slot, u] of Object.entries(eq)) if (u === uid) return { job, slot };
      }
      return null;
    },

    gearOf(job) {
      const eq = this.state.equipped[job] || {};
      const gear = {};
      for (const slot of R.Gear.SLOTS) if (eq[slot]) gear[slot] = this.itemByUid(eq[slot]);
      return gear;
    },
    currentMembers() { return this.state.party.map(job => ({ job, gear: this.gearOf(job) })); },

    equip(job, slot, uid) {
      const item = this.itemByUid(uid);
      if (!item) return { ok: false, error: '装備が見つかりません' };
      const base = R.Gear.getBase(item);
      if (base.slot !== slot) return { ok: false, error: '部位が違います' };
      if (!R.Gear.canEquip(job, item)) return { ok: false, error: 'この職業は装備できません' };
      // 他のキャラが装備していたら、そのキャラの装備と入れ替える
      const other = this.equippedBy(uid);
      const mine = this.state.equipped[job][slot];
      if (other && other.job !== job) {
        const mineItem = this.itemByUid(mine);
        if (mineItem && R.Gear.canEquip(other.job, mineItem)) this.state.equipped[other.job][slot] = mine;
        else return { ok: false, error: `${R.DATA.jobs[other.job].name}が装備中です` };
      }
      this.state.equipped[job][slot] = uid;
      return { ok: true };
    },

    // 素材
    addMaterials(bag) { for (const [m, n] of Object.entries(bag)) this.state.materials[m] = (this.state.materials[m] || 0) + n; },
    hasMaterials(req) { return Object.entries(req).every(([m, n]) => (this.state.materials[m] || 0) >= n); },
    removeMaterials(req) {
      for (const [m, n] of Object.entries(req)) {
        this.state.materials[m] -= n;
        if (this.state.materials[m] <= 0) delete this.state.materials[m];
      }
    },

    // 採集道具：持っている中で一番強いもの
    toolPower(kind) {
      let best = 0;
      for (const id of this.state.tools) {
        const t = R.DATA.equipment.tools[id];
        if (t && t.kind === kind) best = Math.max(best, t.power);
      }
      return best || 0.5;
    },

    // ===== テスト用（後半の確認のため） =====
    debugClearAll() {
      for (const [id, d] of Object.entries(R.DATA.dungeons)) {
        if (d.endless) continue;
        this.state.clears[id] = Math.max(1, this.state.clears[id] || 0);
        this.state.maxDifficulty[id] = Math.max(1, this.state.maxDifficulty[id] || 0);
      }
    },
    debugAllMaterials(n) { for (const m of Object.keys(R.DATA.materials)) this.state.materials[m] = (this.state.materials[m] || 0) + n; },
    debugLifeUp(n) { for (const k of Object.keys(this.state.life)) this.state.life[k].lv = Math.min(R.DATA.config.life.maxLv, this.state.life[k].lv + n); },
    debugAllTools() { this.state.tools = Object.keys(R.DATA.equipment.tools); },

    // ===== ダンジョンの解禁 =====
    // 先にクリアが必要なダンジョンをすべてクリアしていれば開いている
    isUnlocked(id) {
      const d = R.DATA.dungeons[id];
      return !!d && (d.requires || []).every(r => (this.state.clears[r] || 0) > 0);
    },
    unlockedDungeons() { return Object.keys(R.DATA.dungeons).filter(id => this.isUnlocked(id)); },
    // すべてのダンジョンをクリアしたか（やり込み要素の解禁条件）
    allCleared() { return Object.keys(R.DATA.dungeons).filter(id => !R.DATA.dungeons[id].endless && !R.DATA.dungeons[id].special).every(id => (this.state.clears[id] || 0) > 0); },

    // ステージ（難易度段階：初級・中級…）：同じダンジョンの1つ前の段をクリアすると次が開く（パズドラ式）
    maxUnlockedDifficulty(id) {
      if (!this.isUnlocked(id)) return 0;
      if (R.DATA.dungeons[id].endless) return 1;
      return Math.min(R.DATA.difficulty.max, (this.state.maxDifficulty[id] || 0) + 1);
    },

    // ===== ダンジョン =====
    startRun(dungeonId, difficulty) {
      if (!this.isUnlocked(dungeonId)) throw new Error('まだ開いていないダンジョンです');
      difficulty = difficulty || 1;
      if (difficulty > this.maxUnlockedDifficulty(dungeonId)) throw new Error('まだ開いていない難易度です');
      const s = this.state;
      const bring = s.bring.map(uid => s.consumables.find(c => c.uid === uid)).filter(Boolean).slice(0, R.DATA.config.combat.itemSlots);
      // 持ち込んだアイテムは手元から消える（クリアすれば残りが戻る）
      s.consumables = s.consumables.filter(c => !bring.includes(c));
      s.bring = [];
      const run = new R.DungeonRun({
        dungeonId, difficulty, members: this.currentMembers(), lives: s.life,
        tools: { pick: this.toolPower('pick'), axe: this.toolPower('axe') }, items: bring
      });
      s.runs++;
      this.run = run;
      this.saveRun();
      return run;
    },
    saveRun() { this.state.run = this.run ? this.run.serialize() : null; this.save(); },
    restoreRun() {
      const s = this.state;
      if (!s.run) { this.run = null; return null; }
      try {
        this.run = R.DungeonRun.restore(s.run, { lives: s.life, tools: { pick: this.toolPower('pick'), axe: this.toolPower('axe') } });
      } catch (e) { this.run = null; s.run = null; }
      return this.run;
    },
    // クリア・全滅後の後片付け。持ち帰ったものを返す
    endRun() {
      const s = this.state;
      const run = this.run;
      let result = null;
      let newRecord = false;
      if (run.endless) {
        newRecord = (run.deepest || 0) > (s.bestFloor[run.dungeonId] || 0);
        s.bestFloor[run.dungeonId] = Math.max(s.bestFloor[run.dungeonId] || 0, run.deepest || 0);
      }
      if (run.phase === 'cleared') {
        const before = this.unlockedDungeons();
        const wasAll = this.allCleared();
        this.addMaterials(run.bag);
        for (const it of run.items) s.consumables.push(it);
        s.clears[run.dungeonId] = (s.clears[run.dungeonId] || 0) + 1;
        s.maxDifficulty[run.dungeonId] = Math.max(s.maxDifficulty[run.dungeonId] || 0, run.difficulty || 1);
        result = {
          cleared: true, bag: run.bag, items: run.items,
          newlyUnlocked: this.unlockedDungeons().filter(id => !before.includes(id)),
          allClearedNow: !wasAll && this.allCleared()
        };
      } else {
        result = { cleared: false, lost: run.lostBag || {} };
      }
      if (run.endless) Object.assign(result, { deepest: run.deepest, newRecord });
      this.run = null;
      s.run = null;
      this.save();
      return result;
    }
  };

  R.Game = Game;
})(globalThis.RASEN = globalThis.RASEN || {});
