// ダンジョン画面（出発準備・進行・報酬選択・採集ミニゲーム）
(function (R) {
  const { h, clear, bar } = R.UI;
  const G = () => R.Game;

  function matText(bag) {
    const e = Object.entries(bag || {}).filter(([, n]) => n > 0);
    if (!e.length) return 'なし';
    return e.map(([m, n]) => `${R.DATA.materials[m] ? R.DATA.materials[m].name : m}×${n}`).join('、');
  }

  // パーティの簡単な表示（職業とステータス）
  function partySummary(members) {
    const party = R.Gear.buildParty(members);
    return h('div', { class: 'panel' },
      h('div', { class: 'party-hp' }, R.UI.sprite('ico_hp', 18), bar(party.maxHp, party.maxHp, 'hp')),
      h('div', { class: 'chars' }, party.chars.map(c => h('div', { class: 'char owner-' + c.index },
        R.UI.sprite(c.job, 32),
        h('div', { class: 'char-body' },
          h('div', { class: 'char-name' }, c.name),
          R.UI.statLine(c.stats, ['hp', 'atk', 'def', 'mag']))))));
  }

  // ===== 出発（パズドラ式）：①ダンジョン一覧 → ②ステージ一覧 → ③パーティを確認して出発 =====
  const stageName = (d) => R.DATA.difficulty.stageNames[d - 1] || `難易度${d}`;
  // ステージの中身（敵の強さ・上位素材の出やすさ）
  function stageInfo(d) {
    const D = R.DATA.difficulty;
    const lv = d - 1;
    return { hp: 1 + D.hpPerLevel * lv, high: Math.round(Math.min(D.highDropMax, D.highDropPerLevel * lv) * 100) };
  }

  // ダンジョンの顔になるドット絵（最後のボス）
  function dungeonSprite(d) {
    if (d.endless) return d.endless.bosses.length ? R.DATA.encounters[d.endless.bosses[d.endless.bosses.length - 1]].enemies[0] : 'icon_dungeon';
    const floors = d.stages ? d.stages[d.stages.length - 1].floors : d.floors;
    const last = floors[floors.length - 1];
    return last.boss ? R.DATA.encounters[last.boss].enemies[0] : 'icon_dungeon';
  }

  // ①ダンジョン一覧：開いているものだけを、新しく開いた順（下にあるほど先に開いたもの）に並べる
  let listTab = 'normal';
  function departScreen(el) {
    if (G().run) { R.UI.show(runScreen); return; }
    const s = G().state;
    function render() {
      clear(el);
      el.appendChild(R.UI.header('ダンジョン', () => R.UI.show(R.UI.homeScreen)));
      el.appendChild(h('div', { class: 'tabs' }, [['normal', 'ノーマル'], ['special', 'スペシャル']].map(([k, label]) =>
        h('button', { class: 'tab' + (listTab === k ? ' on' : ''), onclick: () => { listTab = k; render(); } }, label))));
      const ids = Object.keys(R.DATA.dungeons)
        .filter(id => { const d = R.DATA.dungeons[id]; return !!(d.endless || d.special) === (listTab === 'special') && G().isUnlocked(id); })
        .reverse();
      if (!ids.length) {
        el.appendChild(h('div', { class: 'panel dungeon-card locked' },
          R.UI.stage(listTab === 'special' ? 'mine' : 'cave', '', h('div', { class: 'locked-label' }, '？？？')),
          h('div', { class: 'dungeon-body muted' }, '岩窟の洞をクリアすると開く')));
        return;
      }
      for (const id of ids) {
        const d = R.DATA.dungeons[id];
        const cleared = (s.clears[id] || 0) > 0;
        const done = s.maxDifficulty[id] || 0;
        const progress = d.endless
          ? h('span', { class: 'dc-best' }, `最高 ${s.bestFloor[id] || 0}階`)
          : h('span', { class: 'dc-stars', 'aria-label': `${done}段クリア` },
            [...Array(R.DATA.difficulty.max).keys()].map(i => h('i', { class: i < done ? 'on' : '' })));
        el.appendChild(h('button', {
          class: 'panel dungeon-card pick', 'data-id': id,
          onclick: () => R.UI.show(d.endless ? (e2) => partyScreen(e2, id, 1) : (e2) => stageScreen(e2, id))
        },
          R.UI.stage(id, '',
            R.UI.enemyFigure(dungeonSprite(d), 64, { extraClass: 'boss', embers: false }),
            h('div', { class: 'dc-text' },
              h('div', { class: 'dungeon-name' }, d.name),
              h('div', { class: 'dungeon-meta' }, d.recommend)),
            !cleared && !d.endless ? h('span', { class: 'badge-new' }, 'NEW') : null),
          h('div', { class: 'dungeon-foot' }, progress, h('span', { class: 'dc-go' }, '▶'))));
      }
    }
    render();
  }

  // ②ステージ一覧：初級・中級…（前の段をクリアすると次が開く）
  function stageScreen(el, id) {
    const s = G().state;
    const d = R.DATA.dungeons[id];
    clear(el);
    el.appendChild(R.UI.header(d.name, () => R.UI.show(departScreen)));
    el.appendChild(R.UI.stage(id, 'stage-head', R.UI.enemyFigure(dungeonSprite(d), 84, { extraClass: 'boss' })));
    const max = G().maxUnlockedDifficulty(id);
    const done = s.maxDifficulty[id] || 0;
    for (let lv = max; lv >= 1; lv--) {
      const info = stageInfo(lv);
      const st = d.stages ? d.stages[lv - 1] : null;
      const rank = st ? st.rank : Math.min(R.DATA.equipment.rankStats.weapon.main.length, (d.rank || 1) + lv - 1);
      // スペシャルは「主に出る素材」を出す（敵の強さ・上位素材の確率は段の中身に含まれるので出さない）
      const mainMats = st ? Object.keys(st.extra.table).slice(0, 2).map(m => R.DATA.materials[m].name) : [];
      el.appendChild(h('button', { class: 'stage-row' + (lv <= done ? ' cleared' : ''), 'data-lv': lv, onclick: () => R.UI.show((e2) => partyScreen(e2, id, lv)) },
        h('span', { class: 'stage-name' }, stageName(lv)),
        h('span', { class: 'stage-chips' },
          h('span', { class: 'chip' }, `推奨R${rank}`),
          !st && lv > 1 ? h('span', { class: 'chip' }, `敵×${info.hp.toFixed(1)}`) : null,
          !st && lv > 1 ? h('span', { class: 'chip rare' }, `上位素材${info.high}%`) : null,
          mainMats.map(n => h('span', { class: 'chip rare' }, n))),
        lv <= done ? h('span', { class: 'stage-clear' }, 'CLEAR') : h('span', { class: 'badge-new' }, 'NEW')));
    }
  }

  // ③パーティを確認して出発
  function partyScreen(el, id, lv) {
    const s = G().state;
    const d = R.DATA.dungeons[id];
    const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);
    const back = () => R.UI.show(d.endless ? departScreen : (e2) => stageScreen(e2, id));
    // 仲間を選んでも画面全体は作り直さない。変わる所（能力の枠・出発ボタン）だけを書き換える
    clear(el);
    el.appendChild(R.UI.header(d.name, back, d.endless ? `最高 ${s.bestFloor[id] || 0}階` : stageName(lv)));
    el.appendChild(h('h2', null, 'パーティ（3人）'));
    const summarySlot = h('div', { class: 'summary-slot' });
    const goBtn = h('button', { class: 'primary', onclick: () => { G().startRun(id, lv); R.UI.show(runScreen); } });
    function refresh() {
      clear(summarySlot);
      summarySlot.appendChild(s.party.length === 3 ? partySummary(G().currentMembers())
        : h('div', { class: 'panel summary-wait' }, `あと${3 - s.party.length}人`));
      goBtn.disabled = s.party.length !== 3;
      goBtn.textContent = s.party.length === 3 ? '出発' : 'パーティを3人選んでください';
    }
    el.appendChild(R.UI.jobPicker(jobs, s.party, (j, on) => {
      if (on) { if (s.party.length >= 3) return false; s.party.push(j); }
      else s.party = s.party.filter(x => x !== j);
      G().save();
      refresh();
      return true;
    }));
    el.appendChild(summarySlot);

    // 持ち込みアイテム
    const slots = R.DATA.config.combat.itemSlots;
    if (R.DATA.items && s.consumables.length) {
      const title = h('h2', null, '');
      const setTitle = () => { title.textContent = `持ち込みアイテム（${s.bring.length}/${slots}）`; };
      setTitle();
      el.appendChild(title);
      const boxes = [];
      const syncBoxes = () => { for (const b of boxes) b.disabled = !b.checked && s.bring.length >= slots; };
      el.appendChild(h('div', { class: 'items-pick' }, s.consumables.map(c => {
        const it = R.DATA.items[c.id];
        const box = h('input', { type: 'checkbox', checked: s.bring.includes(c.uid), onchange: (ev) => {
          if (ev.target.checked) s.bring.push(c.uid); else s.bring = s.bring.filter(u => u !== c.uid);
          setTitle(); syncBoxes();
        } });
        boxes.push(box);
        return h('label', null, box, `${it.name}（${R.DATA.config.quality[c.quality || 'normal'].name}）：${it.desc}`);
      })));
      syncBoxes();
    }
    el.appendChild(h('div', { class: 'action-bar' },
      goBtn));
    refresh();
  }

  // 進行中の題名（例：岩窟の洞・中級）
  const runTitle = (run) => run.def.name + (run.endless ? '' : '・' + stageName(run.difficulty || 1));

  // ===== 進行中 =====
  function runScreen(el) {
    const run = G().run;
    if (!run) { R.UI.show(departScreen); return; }
    clear(el);
    el.appendChild(R.UI.header(runTitle(run), null, run.phase === 'battle' ? run.whereText() : null));

    // 進み具合：場所の絵の上に、階ごとの戦闘の印（◆＝戦闘、●＝ボス）とHP
    const ended = run.phase === 'cleared' || run.phase === 'wiped';
    const seg = run.endless ? run.def.endless.segment : run.plan.length;
    const first = run.endless ? run.floor - (run.floor % seg) : 0;
    const pips = h('div', { class: 'floor-pips' }, [...Array(seg).keys()].map(k => {
      const fi = first + k;
      const list = run.plan[fi] || [];
      return h('span', { class: 'floor-pip' }, `${fi + 1}F`, list.map((enc, bi) => {
        const done = fi < run.floor || (fi === run.floor && bi < run.index) || ended;
        const now = !ended && fi === run.floor && bi === run.index;
        return h('i', { class: (done ? 'done' : now ? 'now' : '') + (R.DATA.encounters[enc].boss ? ' boss' : '') });
      }));
    }));
    const prog = R.UI.stage(run.dungeonId, 'run-head',
      pips,
      h('div', { class: 'party-hp' }, R.UI.sprite('ico_hp', 18), bar(run.hp, run.maxHp, 'hp big')));
    el.appendChild(prog);
    if (Object.keys(run.bag).length || run.items.length || run.endless) el.appendChild(h('div', { class: 'panel' },
      Object.keys(run.bag).length ? h('div', null, h('b', null, '素材　'), matText(run.bag)) : null,
      run.items.length ? h('div', null, h('b', null, '持ち込み　'), run.items.map(i => R.DATA.items[i.id].name).join('、')) : null,
      run.endless ? h('div', { class: 'muted' }, `最高記録 ${G().state.bestFloor[run.dungeonId] || 0}階`) : null));
    const area = h('div');
    el.appendChild(area);

    if (run.phase === 'battle') {
      const enc = R.DATA.encounters[run.currentEncounterId()];
      area.appendChild(h('div', { class: 'panel next-battle' + (enc.boss ? ' boss' : '') },
        h('div', { class: 'next-foes' }, enc.enemies.map(e => R.UI.enemyFigure(e, enc.boss ? 80 : 60, { embers: false }))),
        h('div', { class: 'next-name' }, enc.boss ? `ボス：${enc.name}` : enc.name),
        h('button', { class: 'primary', onclick: () => startBattle(el) }, '戦う')));
    } else if (run.phase === 'checkpoint') {
      const nextBoss = run.floor + 1 + run.def.endless.segment;
      area.appendChild(h('div', { class: 'panel' },
        h('div', { class: 'result result-win' }, `${run.floor + 1}階のボスを倒した！`),
        h('div', { class: 'muted' }, `上位素材 ${Math.round(run.highDropChance() * 100)}%`),
        h('div', { class: 'row' },
          h('button', { class: 'primary', onclick: () => { run.checkpointChoice(false); G().saveRun(); R.UI.show(runScreen); } }, '帰還する'),
          h('button', { class: 'danger', onclick: () => { run.checkpointChoice(true); G().saveRun(); R.UI.show(runScreen); } }, `さらに潜る（次のボスは${nextBoss}階）`))));
    } else if (run.phase === 'reward') {
      area.appendChild(h('h2', null, '報酬'));
      const desc = {
        mining: `${R.Gather.gatherParams(run.gatherEntry('mining'), G().state.life.mining.lv, run.tools.pick).swings}回`,
        logging: `${R.Gather.gatherParams(run.gatherEntry('logging'), G().state.life.logging.lv, run.tools.axe).swings}回`,
        gathering: '',
        treasure: '',
        rest: `HPを${Math.round(run.def.rewards.restHealRatio * 100)}%回復`
      };
      area.appendChild(h('div', { class: 'menu' }, run.rewardOptions.map(k =>
        h('button', { class: 'menu-item', onclick: () => chooseReward(area, k) },
          R.UI.sprite({ mining: 'mat_ore', logging: 'mat_wood', gathering: 'mat_plant', treasure: 'mat_gem', rest: 'ico_hp' }[k] || 'icon_bag', 32),
          h('div', null, h('div', { class: 'menu-label' }, R.Dungeon.REWARD_NAMES[k]),
          desc[k] ? h('div', { class: 'menu-desc' }, desc[k]) : null)))));
    } else if (run.phase === 'gather') {
      startGather(area);
    } else {
      // クリア・全滅
      const cleared = run.phase === 'cleared';
      const prevMax = G().maxUnlockedDifficulty(run.dungeonId);
      const res = G().endRun();
      const nowMax = G().maxUnlockedDifficulty(run.dungeonId);
      area.appendChild(h('div', { class: 'panel' },
        h('div', { class: 'result ' + (cleared ? 'result-win' : 'result-lose') }, cleared ? (res.deepest ? '無事に帰還した！' : 'ダンジョンクリア！') : '全滅してしまった…'),
        res.deepest ? h('div', { class: res.newRecord ? 'good' : '' }, `到達：${res.deepest}階` + (res.newRecord ? '（最高記録を更新！）' : '')) : null,
        cleared ? h('div', null, '持ち帰った素材：' + matText(res.bag)) : h('div', null, '失った素材：' + matText(res.lost)),
        cleared && nowMax > prevMax ? h('div', { class: 'good' }, `「${stageName(nowMax)}」が開いた`) : null,
        cleared && res.newlyUnlocked.length ? h('div', { class: 'good' }, `新しいダンジョン：${res.newlyUnlocked.map(i => R.DATA.dungeons[i].name).join('・')}`) : null,
        h('div', { class: 'row' },
          h('button', { class: 'primary', onclick: () => R.UI.show(departScreen) }, 'ダンジョン一覧へ'),
          h('button', { onclick: () => R.UI.show(R.UI.homeScreen) }, '拠点へ'))));
    }
  }

  function startBattle(el) {
    const run = G().run;
    const combat = run.createCombat();
    // 戦闘中は場所だけを1行で出す（HPなどは戦闘画面にある）
    clear(el);
    el.appendChild(R.UI.header(runTitle(run), null, run.whereText()));
    const area = h('div');
    el.appendChild(area);
    window.scrollTo(0, 0);
    R.UI.mountCombat(area, combat, {
      scene: run.dungeonId,
      onFinish: () => {
        run.finishCombat(combat);
        G().saveRun();
        R.UI.show(runScreen, { top: true });
      }
    });
  }

  function chooseReward(area, kind) {
    const run = G().run;
    const r = run.chooseReward(kind);
    G().saveRun();
    if (!r.ok) return;
    if (kind === 'mining' || kind === 'logging') { R.UI.show(runScreen); return; }
    let text = '';
    if (kind === 'rest') text = `HPが${r.healed}回復した`;
    else text = `${R.Dungeon.REWARD_NAMES[kind]}：${matText(r.bag)}を手に入れた`;
    R.UI.modal(h('div', null, text), [{ label: 'OK', primary: true, onClick: () => R.UI.show(runScreen) }]);
  }

  // 採集ミニゲーム「鉱脈探し」
  function startGather(area) {
    const run = G().run;
    const gn = run.gatherNode;
    const board = gn.board;
    const G2 = R.DATA.gatherGame;
    const total = board.cells.filter(c => c.vein).length;
    const word = gn.kind === 'mining' ? { tool: 'ツルハシ', vein: '鉱脈', target: '岩' } : { tool: 'オノ', vein: '良い木目', target: '木' };

    // 1マス掘るたびに、画面全体ではなくこの盤面だけを描き直す（画面の切り替え演出やスクロールが起きないように）
    function draw(justOpened) {
      clear(area);
      const rareFound = board.found.filter(v => v === 'rare').length;
      area.appendChild(h('div', { class: 'panel gather' },
        h('div', { class: 'row' },
          h('b', null, R.Dungeon.REWARD_NAMES[gn.kind]),
          h('span', { class: 'energy', title: '残り回数' }, h('b', null, String(board.swingsLeft)), `/${board.swings}`),
          h('span', { class: 'vein-count' }, `◆ ${board.found.length}/${total}`),
          rareFound ? h('span', { class: 'good' }, `★${rareFound}`) : null),
        h('div', { class: 'vein-grid', style: { gridTemplateColumns: `repeat(${G2.size}, 1fr)` } }, board.cells.map((c, i) => {
          if (!c.open) {
            return h('button', { class: 'vein-cell closed', disabled: board.done, 'aria-label': `マス${i + 1}を掘る`, onclick: () => {
              const was = board.cells.map(x => x.open);
              run.gatherStrike(i);
              G().saveRun();
              draw(new Set(board.cells.map((x, k) => (x.open && !was[k] ? k : -1)).filter(k => k >= 0)));
            } }, '');
          }
          const just = justOpened && justOpened.has(i) ? ' just' : '';
          if (c.vein) return h('div', { class: 'vein-cell found' + (c.vein === 'rare' ? ' rare' : '') + just }, c.vein === 'rare' ? '★' : '◆');
          return h('div', { class: 'vein-cell empty hint-' + c.hint + just }, c.hint ? String(c.hint) : '');
        })),
        board.done ? h('button', { class: 'primary', onclick: () => {
          const res = run.finishGather();
          G().saveRun();
          const lines = [
            h('div', null, res.allFound ? `${word.vein}を全部見つけた！（${res.left}回残し・おまけ付き）` : res.found ? `${word.vein}を${res.found}つ見つけた` : `${word.vein}は見つからなかった…（拾い物だけ）`),
            h('div', null, '手に入れた素材：' + matText(res.bag)),
            res.levelUps ? h('div', { class: 'good' }, `${R.Life.LIVES[res.life]}Lvが上がった！（Lv${run.lives[res.life].lv}）`) : null
          ];
          R.UI.modal(h('div', null, lines), [{ label: 'OK', primary: true, onClick: () => R.UI.show(runScreen) }]);
        } }, '結果を見る') : null));
    }
    draw();
  }

  R.UI.extraMenu = R.UI.extraMenu || [];
  R.UI.extraMenu.push({ label: 'ダンジョン', icon: 'icon_dungeon', fn: () => R.UI.show(G().run ? runScreen : departScreen), order: 10 });
  Object.assign(R.UI, { departScreen, runScreen, matText, partySummary });
})(globalThis.RASEN = globalThis.RASEN || {});
