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

  // ===== 出発準備 =====
  // 難易度の説明（敵の強さ・上位素材の出やすさ）
  function difficultyText(d) {
    const D = R.DATA.difficulty;
    if (d <= 1) return '難易度1（通常）';
    const lv = d - 1;
    return `難易度${d}：敵HP×${(1 + D.hpPerLevel * lv).toFixed(2)}・攻撃×${(1 + D.dmgPerLevel * lv).toFixed(2)}・上位素材${Math.round(Math.min(D.highDropMax, D.highDropPerLevel * lv) * 100)}%`;
  }

  // ダンジョンの顔になるドット絵（最後のボス）
  function dungeonSprite(d) {
    if (d.endless) return d.endless.bosses.length ? R.DATA.encounters[d.endless.bosses[d.endless.bosses.length - 1]].enemies[0] : 'icon_dungeon';
    const last = d.floors[d.floors.length - 1];
    return last.boss ? R.DATA.encounters[last.boss].enemies[0] : 'icon_dungeon';
  }

  function departScreen(el) {
    const s = G().state;
    const chosenDiff = {};
    if (G().run) { R.UI.show(runScreen); return; }
    const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);

    function render() {
      clear(el);
      el.appendChild(R.UI.header('ダンジョンへ出発', () => R.UI.show(R.UI.homeScreen)));
      el.appendChild(h('h2', null, 'パーティ（3人）'));
      el.appendChild(R.UI.jobPicker(jobs, s.party, (j, on) => {
        if (on) { if (s.party.length < 3) s.party.push(j); }
        else s.party = s.party.filter(x => x !== j);
        G().save();
        render();
      }));
      if (s.party.length === 3) el.appendChild(partySummary(G().currentMembers()));

      // 持ち込みアイテム
      const slots = R.DATA.config.combat.itemSlots;
      if (R.DATA.items) {
        el.appendChild(h('h2', null, `持ち込みアイテム（${s.bring.length}/${slots}）`));
        if (!s.consumables.length) el.appendChild(h('div', { class: 'muted' }, 'なし'));
        el.appendChild(h('div', { class: 'items-pick' }, s.consumables.map(c => {
          const d = R.DATA.items[c.id];
          const on = s.bring.includes(c.uid);
          return h('label', null,
            h('input', { type: 'checkbox', checked: on, disabled: !on && s.bring.length >= slots, onchange: (ev) => {
              if (ev.target.checked) s.bring.push(c.uid); else s.bring = s.bring.filter(u => u !== c.uid);
              render();
            } }),
            `${d.name}（${R.DATA.config.quality[c.quality || 'normal'].name}）：${d.desc}`);
        })));
      }

      el.appendChild(h('h2', null, 'ダンジョン'));
      el.appendChild(h('div', { class: 'muted' }, '全滅すると素材と持ち込みを失う'));
      for (const [id, d] of Object.entries(R.DATA.dungeons)) {
        const open = G().isUnlocked(id);
        const clears = s.clears[id] || 0;
        if (!open) {
          const need = (d.requires || []).filter(r => !(s.clears[r] > 0)).map(r => R.DATA.dungeons[r].name);
          el.appendChild(h('div', { class: 'panel dungeon-card locked' },
            R.UI.stage(id, '', h('div', { class: 'locked-label' }, '？？？')),
            h('div', { class: 'dungeon-body' }, h('div', { class: 'muted' }, `${need.join('と')}をクリアすると開く`))));
          continue;
        }
        const maxD = G().maxUnlockedDifficulty(id);
        if (!chosenDiff[id] || chosenDiff[id] > maxD) chosenDiff[id] = maxD > 1 ? (s.maxDifficulty[id] || 1) : 1;
        const best = s.maxDifficulty[id] || 0;
        const meta = [
          clears ? `${d.endless ? '帰還' : 'クリア'} ${clears}回` : (d.endless ? '' : '未クリア'),
          best > 1 ? `最高難易度${best}` : '',
          d.endless ? `最高到達 ${s.bestFloor[id] || 0}階` : ''
        ].filter(Boolean).join('・');
        el.appendChild(h('div', { class: 'panel dungeon-card' },
          R.UI.stage(id, '',
            R.UI.sprite(dungeonSprite(d), 64, { extraClass: 'boss' }),
            h('div', null,
              h('div', { class: 'dungeon-name' }, d.name),
              h('div', { class: 'dungeon-meta' }, [d.recommend, meta].filter(Boolean).join('　')))),
          h('div', { class: 'dungeon-body' },
            maxD > 1 ? h('div', { class: 'row' }, '難易度',
              h('select', { id: 'diff-' + id, onchange: (e) => { chosenDiff[id] = Number(e.target.value); render(); } },
                [...Array(maxD).keys()].map(i => h('option', { value: i + 1, selected: i + 1 === chosenDiff[id] }, String(i + 1)))),
              h('span', { class: 'muted' }, difficultyText(chosenDiff[id]))) : null,
            h('button', { class: 'primary', disabled: s.party.length !== 3, onclick: () => { G().startRun(id, chosenDiff[id]); R.UI.show(runScreen); } },
              s.party.length === 3 ? '出発する' : 'パーティを3人選んでください'))));
      }
    }
    render();
  }

  // ===== 進行中 =====
  function runScreen(el) {
    const run = G().run;
    if (!run) { R.UI.show(departScreen); return; }
    clear(el);
    el.appendChild(R.UI.header(`${run.def.name}${run.difficulty > 1 ? `（難易度${run.difficulty}）` : ''}`, null, run.phase === 'battle' ? run.whereText() : null));

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
    el.appendChild(h('div', { class: 'panel' },
      h('div', null, h('b', null, '素材　'), matText(run.bag)),
      run.items.length ? h('div', null, h('b', null, '持ち込み　'), run.items.map(i => R.DATA.items[i.id].name).join('、')) : null,
      run.endless ? h('div', { class: 'muted' }, `最高記録 ${G().state.bestFloor[run.dungeonId] || 0}階`) : null));
    const area = h('div');
    el.appendChild(area);

    if (run.phase === 'battle') {
      const enc = R.DATA.encounters[run.currentEncounterId()];
      area.appendChild(h('div', { class: 'panel next-battle' + (enc.boss ? ' boss' : '') },
        h('div', { class: 'next-foes' }, enc.enemies.map(e => R.UI.sprite(e, enc.boss ? 72 : 56))),
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
      area.appendChild(h('h2', null, '報酬を1つ選ぶ'));
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
      const res = G().endRun();
      area.appendChild(h('div', { class: 'panel' },
        h('div', { class: 'result ' + (cleared ? 'result-win' : 'result-lose') }, cleared ? (res.deepest ? '無事に帰還した！' : 'ダンジョンクリア！') : '全滅してしまった…'),
        res.deepest ? h('div', { class: res.newRecord ? 'good' : '' }, `到達：${res.deepest}階` + (res.newRecord ? '（最高記録を更新！）' : '')) : null,
        cleared ? h('div', null, '持ち帰った素材：' + matText(res.bag)) : h('div', null, '失った素材：' + matText(res.lost)),
        cleared && res.newlyUnlocked.length ? h('div', { class: 'good' }, `新しいダンジョンが開いた：${res.newlyUnlocked.map(i => R.DATA.dungeons[i].name).join('・')}`) : null,
        cleared && res.allClearedNow ? h('div', { class: 'good' }, 'すべてのダンジョンをクリアした！ 各ダンジョンで難易度2に挑めるようになった') : null,
        h('button', { class: 'primary', onclick: () => R.UI.show(R.UI.homeScreen) }, '拠点へ戻る')));
    }
  }

  function startBattle(el) {
    const run = G().run;
    const combat = run.createCombat();
    // 戦闘中は場所だけを1行で出す（HPなどは戦闘画面にある）
    clear(el);
    el.appendChild(R.UI.header(run.def.name + (run.difficulty > 1 ? `（難易度${run.difficulty}）` : ''), null, run.whereText()));
    const area = h('div');
    el.appendChild(area);
    R.UI.mountCombat(area, combat, {
      scene: run.dungeonId,
      onFinish: () => {
        run.finishCombat(combat);
        G().saveRun();
        R.UI.show(runScreen);
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
        h('div', null, h('b', null, `${R.Dungeon.REWARD_NAMES[gn.kind]}`),
          h('span', { class: 'muted' }, `（${word.target}の硬さ${gn.node.hardness}・${R.Life.LIVES[gn.life]}Lv${run.lives[gn.life].lv}）`)),
        (() => {
          const lv = run.lives[gn.life].lv;
          const diff = lv - gn.node.hardness;
          const base = R.Gather.gatherParams(gn.node, gn.node.hardness, 1);
          const noTool = R.Gather.gatherParams(gn.node, lv, 1);
          const lvSw = noTool.swings - base.swings;
          const toolSw = gn.params.swings - noTool.swings;
          const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n);
          return h('div', { class: 'lv-bonus ' + (diff > 0 ? 'good' : diff < 0 ? 'bad' : 'muted') },
            `Lv差${diff > 0 ? '+' : ''}${diff}：回数${sign(lvSw)}・開始マス${gn.params.hints}／道具：回数${sign(toolSw)}`);
        })(),
        h('div', { class: 'muted' }, `${word.vein}${total}つ（★${G2.rareVeins}）・数字＝まわりの${word.vein}の数`),
        h('div', { class: 'row' },
          h('span', { class: 'energy', title: '残り回数' }, h('b', null, String(board.swingsLeft)), `/${board.swings}`),
          h('span', null, `見つけた ${board.found.length} / ${total}`),
          rareFound ? h('span', { class: 'good' }, `★レア ${rareFound}`) : null),
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
  R.UI.extraMenu.push({ label: 'ダンジョンへ出発', desc: 'パーティを組んで出発', icon: 'icon_dungeon', fn: () => R.UI.show(G().run ? runScreen : departScreen), order: 10 });
  Object.assign(R.UI, { departScreen, runScreen, matText, partySummary });
})(globalThis.RASEN = globalThis.RASEN || {});
