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
      h('div', null, `パーティHP ${party.maxHp}`),
      h('div', { class: 'chars' }, party.chars.map(c => h('div', { class: 'char owner-' + c.index },
        h('div', { class: 'char-name' }, c.name),
        h('div', { class: 'char-stats' }, `HP${c.stats.hp} 攻${c.stats.atk} 防${c.stats.def} 魔${c.stats.mag}`)))));
  }

  // ===== 出発準備 =====
  function departScreen(el) {
    const s = G().state;
    if (G().run) { R.UI.show(runScreen); return; }
    const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);

    function render() {
      clear(el);
      el.appendChild(R.UI.header('ダンジョンへ出発', () => R.UI.show(R.UI.homeScreen)));
      el.appendChild(h('h2', null, 'パーティ（3人）'));
      el.appendChild(h('div', { class: 'job-picker' }, jobs.map(j => h('label', { class: 'job-option' },
        h('input', { type: 'checkbox', checked: s.party.includes(j), onchange: (ev) => {
          if (ev.target.checked) { if (s.party.length < 3) s.party.push(j); }
          else s.party = s.party.filter(x => x !== j);
          G().save();
          render();
        } }),
        `${R.DATA.jobs[j].name}（${R.DATA.jobs[j].desc}）`))));
      if (s.party.length === 3) el.appendChild(partySummary(G().currentMembers()));

      // 持ち込みアイテム
      const slots = R.DATA.config.combat.itemSlots;
      if (R.DATA.items) {
        el.appendChild(h('h2', null, `持ち込みアイテム（${s.bring.length}/${slots}）`));
        if (!s.consumables.length) el.appendChild(h('div', { class: 'muted' }, '持ち込みアイテムがありません（細工で作れます）'));
        el.appendChild(h('div', { class: 'job-picker' }, s.consumables.map(c => {
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
      for (const [id, d] of Object.entries(R.DATA.dungeons)) {
        el.appendChild(h('div', { class: 'panel' },
          h('div', null, h('b', null, d.name), `　（4階層・4階にボス／クリア ${s.clears[id] || 0}回）`),
          h('div', { class: 'muted' }, '全滅すると、集めた素材と持ち込みアイテムをすべて失います。途中で帰ることはできません。'),
          h('button', { class: 'primary', disabled: s.party.length !== 3, onclick: () => { G().startRun(id); R.UI.show(runScreen); } },
            s.party.length === 3 ? '出発する' : 'パーティを3人選んでください')));
      }
    }
    render();
  }

  // ===== 進行中 =====
  function runScreen(el) {
    const run = G().run;
    if (!run) { R.UI.show(departScreen); return; }
    clear(el);
    el.appendChild(R.UI.header(`${run.def.name}`));

    // 進み具合
    const prog = h('div', { class: 'panel' },
      h('div', { class: 'row' },
        h('span', null, run.phase === 'cleared' || run.phase === 'wiped' ? '' : `${run.floor + 1}階　${run.index + 1} / ${run.plan[run.floor].length} 戦目`),
        h('span', { class: 'muted' }, `（勝利 ${run.battlesWon} / 全${run.totalBattles()}戦）`)),
      h('div', null, 'パーティHP'), bar(run.hp, run.maxHp, 'hp'),
      h('div', null, '集めた素材：' + matText(run.bag)),
      run.items.length ? h('div', null, '持ち込み：' + run.items.map(i => R.DATA.items[i.id].name).join('、')) : null);
    el.appendChild(prog);
    const area = h('div');
    el.appendChild(area);

    if (run.phase === 'battle') {
      const enc = R.DATA.encounters[run.currentEncounterId()];
      area.appendChild(h('div', { class: 'panel' },
        h('div', null, `次の戦闘：${enc.name}`),
        h('button', { class: 'primary', onclick: () => startBattle(area) }, '戦う')));
    } else if (run.phase === 'reward') {
      area.appendChild(h('h2', null, '報酬を1つ選んでください'));
      const desc = {
        mining: `採掘ミニゲーム（採掘Lv${G().state.life.mining.lv}／岩の硬さ${run.def.gather.mining[run.floor].hardness}）`,
        logging: `伐採ミニゲーム（伐採Lv${G().state.life.logging.lv}／木の硬さ${run.def.gather.logging[run.floor].hardness}）`,
        gathering: '素材をいくつか拾う',
        treasure: '宝箱を開ける',
        rest: `HPを${Math.round(run.def.rewards.restHealRatio * 100)}%回復`
      };
      area.appendChild(h('div', { class: 'menu' }, run.rewardOptions.map(k =>
        h('button', { class: 'menu-item', onclick: () => chooseReward(area, k) },
          h('div', { class: 'menu-label' }, R.Dungeon.REWARD_NAMES[k]),
          h('div', { class: 'menu-desc' }, desc[k])))));
    } else if (run.phase === 'gather') {
      startGather(area);
    } else {
      // クリア・全滅
      const cleared = run.phase === 'cleared';
      const res = G().endRun();
      area.appendChild(h('div', { class: 'panel' },
        h('div', { class: 'result ' + (cleared ? 'result-win' : 'result-lose') }, cleared ? 'ダンジョンクリア！' : '全滅してしまった…'),
        cleared ? h('div', null, '持ち帰った素材：' + matText(res.bag)) : h('div', null, '失った素材：' + matText(res.lost)),
        h('button', { class: 'primary', onclick: () => R.UI.show(R.UI.homeScreen) }, '拠点へ戻る')));
    }
  }

  function startBattle(area) {
    const run = G().run;
    const combat = run.createCombat();
    clear(area);
    R.UI.mountCombat(area, combat, {
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

  function startGather(area) {
    const run = G().run;
    const gn = run.gatherNode;
    const hits = [];
    let progress = 0;
    const zm = R.DATA.gatherGame.zoneMult;
    const box = h('div');
    area.appendChild(box);
    R.UI.mountTimingGame(box, {
      title: `${R.Dungeon.REWARD_NAMES[gn.kind]}（硬さ${gn.node.hardness}・${R.Life.LIVES[gn.life]}Lv${run.lives[gn.life].lv}）`,
      goodWidth: gn.params.goodWidth, greatWidth: gn.params.greatWidth, swings: gn.params.swings,
      actionLabel: gn.kind === 'mining' ? 'ツルハシを振る' : 'オノを振る',
      onHit: (kind) => {
        hits.push(kind);
        progress = Math.min(100, progress + gn.params.perSwing * zm[kind]);
        return { progress, done: progress >= 100, text: progress >= 100 ? '壊れた！' : '' };
      },
      onDone: () => {
        const res = run.finishGather(hits);
        G().saveRun();
        const lines = [
          h('div', null, res.broken ? `${gn.kind === 'mining' ? '岩' : '木'}を壊した！（${res.left}回残し）` : '壊しきれなかった…'),
          h('div', null, '手に入れた素材：' + matText(res.bag)),
          res.levelUps ? h('div', { class: 'good' }, `${R.Life.LIVES[res.life]}Lvが上がった！（Lv${run.lives[res.life].lv}）`) : null
        ];
        R.UI.modal(h('div', null, lines), [{ label: 'OK', primary: true, onClick: () => R.UI.show(runScreen) }]);
      }
    });
  }

  R.UI.extraMenu = R.UI.extraMenu || [];
  R.UI.extraMenu.push({ label: 'ダンジョンへ出発', desc: 'パーティと持ち込みを決めて出発', fn: () => R.UI.show(G().run ? runScreen : departScreen), order: 10 });
  Object.assign(R.UI, { departScreen, runScreen, matText, partySummary });
})(globalThis.RASEN = globalThis.RASEN || {});
