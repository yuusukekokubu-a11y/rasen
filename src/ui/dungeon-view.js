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
  // 難易度の説明（敵の強さ・上位素材の出やすさ）
  function difficultyText(d) {
    const D = R.DATA.difficulty;
    if (d <= 1) return '難易度1（通常）';
    const lv = d - 1;
    return `難易度${d}：敵HP×${(1 + D.hpPerLevel * lv).toFixed(2)}・攻撃×${(1 + D.dmgPerLevel * lv).toFixed(2)}・上位素材${Math.round(Math.min(D.highDropMax, D.highDropPerLevel * lv) * 100)}%`;
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
      el.appendChild(h('div', { class: 'muted' }, '全滅すると、集めた素材と持ち込みアイテムをすべて失います。途中で帰ることはできません。'));
      if (G().allCleared()) el.appendChild(h('div', { class: 'panel good' }, 'すべてのダンジョンをクリア済み：各ダンジョンで難易度を上げて挑めます。上の難易度ほど上位素材（ランク4装備の材料）が出やすくなります。'));
      for (const [id, d] of Object.entries(R.DATA.dungeons)) {
        const open = G().isUnlocked(id);
        const clears = s.clears[id] || 0;
        if (!open) {
          const need = (d.requires || []).filter(r => !(s.clears[r] > 0)).map(r => R.DATA.dungeons[r].name);
          el.appendChild(h('div', { class: 'panel dungeon locked' },
            h('div', null, h('b', null, '？？？'), h('span', { class: 'muted' }, `　${need.join('と')}をクリアすると開く`))));
          continue;
        }
        const maxD = G().maxUnlockedDifficulty(id);
        if (!chosenDiff[id] || chosenDiff[id] > maxD) chosenDiff[id] = maxD > 1 ? (s.maxDifficulty[id] || 1) : 1;
        const best = s.maxDifficulty[id] || 0;
        el.appendChild(h('div', { class: 'panel dungeon' },
          h('div', null, h('b', null, d.name),
            h('span', { class: clears ? 'good' : 'muted' }, clears ? `　クリア ${clears}回` : '　未クリア'),
            best > 1 ? h('span', { class: 'good' }, `・最高難易度${best}`) : null),
          d.recommend ? h('div', { class: 'muted' }, d.recommend) : null,
          maxD > 1 ? h('div', { class: 'row' }, '難易度：',
            h('select', { id: 'diff-' + id, onchange: (e) => { chosenDiff[id] = Number(e.target.value); render(); } },
              [...Array(maxD).keys()].map(i => h('option', { value: i + 1, selected: i + 1 === chosenDiff[id] }, String(i + 1)))),
            h('span', { class: 'muted' }, difficultyText(chosenDiff[id])),
            maxD < R.DATA.difficulty.max ? h('span', { class: 'muted' }, `（難易度${maxD}をクリアすると次が開く）`) : null) : null,
          h('button', { class: 'primary', disabled: s.party.length !== 3, onclick: () => { G().startRun(id, chosenDiff[id]); R.UI.show(runScreen); } },
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
    el.appendChild(R.UI.header(`${run.def.name}${run.difficulty > 1 ? `（難易度${run.difficulty}）` : ''}`));

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
        mining: `鉱脈探し（採掘Lv${G().state.life.mining.lv}／岩の硬さ${run.def.gather.mining[run.floor].hardness}／${R.Gather.gatherParams(run.def.gather.mining[run.floor], G().state.life.mining.lv, run.tools.pick).swings}回振れる）`,
        logging: `鉱脈探し（伐採Lv${G().state.life.logging.lv}／木の硬さ${run.def.gather.logging[run.floor].hardness}／${R.Gather.gatherParams(run.def.gather.logging[run.floor], G().state.life.logging.lv, run.tools.axe).swings}回振れる）`,
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
        cleared && res.newlyUnlocked.length ? h('div', { class: 'good' }, `新しいダンジョンが開いた：${res.newlyUnlocked.map(i => R.DATA.dungeons[i].name).join('・')}`) : null,
        cleared && res.allClearedNow ? h('div', { class: 'good' }, 'すべてのダンジョンをクリアした！ 各ダンジョンで難易度2に挑めるようになった') : null,
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

  // 採集ミニゲーム「鉱脈探し」
  function startGather(area) {
    const run = G().run;
    const gn = run.gatherNode;
    const board = gn.board;
    const G2 = R.DATA.gatherGame;
    const total = board.cells.filter(c => c.vein).length;
    const word = gn.kind === 'mining' ? { tool: 'ツルハシ', vein: '鉱脈', target: '岩' } : { tool: 'オノ', vein: '良い木目', target: '木' };
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
          `レベル差 ${diff > 0 ? '+' : ''}${diff}：振れる回数 ${sign(lvSw)}・最初から開いているマス ${gn.params.hints}` +
          `　／道具：振れる回数 ${sign(toolSw)}`);
      })(),
      h('div', { class: 'muted' }, `マスを選んで${word.tool}を振ります。${word.vein}が${total}つ（うち★レア${G2.rareVeins}つ）隠れています。外れのマスの数字は、まわり8マスにある${word.vein}の数です。`),
      h('div', { class: 'row' },
        h('span', { class: 'energy' }, `残り ${board.swingsLeft} / ${board.swings} 回`),
        h('span', null, `見つけた ${board.found.length} / ${total}`),
        rareFound ? h('span', { class: 'good' }, `★レア ${rareFound}`) : null),
      h('div', { class: 'vein-grid', style: { gridTemplateColumns: `repeat(${G2.size}, 1fr)` } }, board.cells.map((c, i) => {
        if (!c.open) {
          return h('button', { class: 'vein-cell closed', disabled: board.done, 'aria-label': `マス${i + 1}を掘る`, onclick: () => {
            run.gatherStrike(i);
            G().saveRun();
            R.UI.show(runScreen);
          } }, '');
        }
        if (c.vein) return h('div', { class: 'vein-cell found' + (c.vein === 'rare' ? ' rare' : '') }, c.vein === 'rare' ? '★' : '◆');
        return h('div', { class: 'vein-cell empty hint-' + c.hint }, c.hint ? String(c.hint) : '');
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

  R.UI.extraMenu = R.UI.extraMenu || [];
  R.UI.extraMenu.push({ label: 'ダンジョンへ出発', desc: 'パーティと持ち込みを決めて出発', fn: () => R.UI.show(G().run ? runScreen : departScreen), order: 10 });
  Object.assign(R.UI, { departScreen, runScreen, matText, partySummary });
})(globalThis.RASEN = globalThis.RASEN || {});
