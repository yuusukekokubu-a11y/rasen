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
        run: null              // 進行中のダンジョン
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

    // 新しく増えた職業（データに後から足した職業）に初期装備を配る
    migrate() {
      const s = this.state;
      for (const job of Object.keys(R.DATA.jobs)) {
        if (R.DATA.jobs[job].enabled && !s.equipped[job]) this.giveStarter(job);
      }
      for (const k of Object.keys(R.Life.LIVES)) if (!s.life[k]) s.life[k] = { lv: 1, exp: 0 };
      if (!s.maxDifficulty) s.maxDifficulty = {};
      if (!s.bestFloor) s.bestFloor = {};
      for (const [id, n] of Object.entries(s.clears)) if (n > 0 && !s.maxDifficulty[id]) s.maxDifficulty[id] = 1;
      s.party = s.party.filter(j => R.DATA.jobs[j] && R.DATA.jobs[j].enabled);
    },

    load() {
      let data = null;
      try {
        const raw = globalThis.localStorage && localStorage.getItem(SAVE_KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) { data = null; }
      if (data && data.version === VERSION) {
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

    // ===== ダンジョンの解禁 =====
    // 先にクリアが必要なダンジョンをすべてクリアしていれば開いている
    isUnlocked(id) {
      const d = R.DATA.dungeons[id];
      return !!d && (d.requires || []).every(r => (this.state.clears[r] || 0) > 0);
    },
    unlockedDungeons() { return Object.keys(R.DATA.dungeons).filter(id => this.isUnlocked(id)); },
    // すべてのダンジョンをクリアしたか（やり込み要素の解禁条件）
    allCleared() { return Object.keys(R.DATA.dungeons).filter(id => !R.DATA.dungeons[id].endless).every(id => (this.state.clears[id] || 0) > 0); },

    // 難易度段階：すべてクリア後に開く。難易度Nは同じダンジョンの難易度N−1クリアで開く
    maxUnlockedDifficulty(id) {
      if (!this.isUnlocked(id)) return 0;
      if (!this.allCleared() || R.DATA.dungeons[id].endless) return 1;
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
