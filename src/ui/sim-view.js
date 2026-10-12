// シミュレーター画面
(function (R) {
  const { h, clear } = R.UI;

  function simScreen(el) {
    const sources = Object.entries(R.DATA.loadouts.presets).map(([id, p]) => ({ id, name: p.name, members: () => p.party }));
    if (R.Game && R.Game.state) {
      sources.unshift({ id: '__current', name: '現在のパーティ（装備中のもの）', members: () => R.Game.currentMembers() });
    }
    let source = sources[0].id;
    let enc = 'all';
    let n = 200;
    let hpRatio = 1;
    let dungeonId = Object.keys(R.DATA.dungeons)[0];
    let difficulty = 1;
    let results = null;

    function render() {
      clear(el);
      el.appendChild(R.UI.header('シミュレーター', () => R.UI.show(R.UI.homeScreen)));
      el.appendChild(h('p', { class: 'muted' }, '自動操作で何回も戦わせて、勝率や平均ターン数を出します。数値の調整は data/ フォルダのファイルで行い、ページを再読み込みしてください。'));
      el.appendChild(h('div', { class: 'panel' },
        h('div', { class: 'row' }, '装備：',
          h('select', { onchange: (e) => { source = e.target.value; } },
            sources.map(s => h('option', { value: s.id, selected: s.id === source }, s.name)))),
        h('div', { class: 'row' }, '敵：',
          h('select', { onchange: (e) => { enc = e.target.value; } },
            h('option', { value: 'all', selected: enc === 'all' }, 'すべて'),
            Object.entries(R.DATA.encounters).map(([id, e]) => h('option', { value: id, selected: id === enc }, e.name)))),
        h('div', { class: 'row' }, '回数：',
          h('input', { type: 'number', value: n, min: 1, max: 5000, onchange: (e) => { n = Math.max(1, Math.min(5000, Number(e.target.value) || 1)); } }),
          '開始HP（%）：',
          h('input', { type: 'number', value: Math.round(hpRatio * 100), min: 1, max: 100, onchange: (e) => { hpRatio = Math.max(0.01, Math.min(1, (Number(e.target.value) || 100) / 100)); } })),
        h('div', { class: 'row' },
          h('button', { class: 'primary', onclick: run }, '実行'),
          R.Sim.runDungeons ? h('select', { 'aria-label': 'ダンジョン', onchange: (e) => { dungeonId = e.target.value; } },
            Object.entries(R.DATA.dungeons).map(([id, d]) => h('option', { value: id, selected: id === dungeonId }, d.name))) : null,
          R.Sim.runDungeons ? h('select', { 'aria-label': '難易度', onchange: (e) => { difficulty = Number(e.target.value); } },
            [...Array(R.DATA.difficulty.max).keys()].map(i => h('option', { value: i + 1, selected: i + 1 === difficulty }, `難易度${i + 1}`))) : null,
          R.Sim.runDungeons ? h('button', { onclick: runDungeon }, 'ダンジョンを通しで実行') : null)));

      if (results) el.appendChild(results);
    }

    function members() { return sources.find(s => s.id === source).members(); }

    function run() {
      const ids = enc === 'all' ? Object.keys(R.DATA.encounters) : [enc];
      const rows = ids.map(id => {
        const r = R.Sim.runBattles({ members: members(), enemies: R.DATA.encounters[id].enemies, n, seed: Date.now() % 100000, startHpRatio: hpRatio });
        return h('tr', null,
          h('td', null, R.DATA.encounters[id].name),
          h('td', { class: r.winRate >= 0.9 ? 'good' : r.winRate < 0.5 ? 'bad' : '' }, (r.winRate * 100).toFixed(1) + '%'),
          h('td', null, r.avgTurns.toFixed(1)),
          h('td', null, `${r.minTurns}-${r.maxTurns}`),
          h('td', null, r.avgDamageTaken.toFixed(1)),
          h('td', null, `${r.avgHpLeft.toFixed(1)} / ${r.maxHp}`));
      });
      results = h('div', { class: 'panel' },
        h('div', null, `各${n}回`),
        h('table', null,
          h('tr', null, ['敵', '勝率', '平均ターン', '最短-最長', '平均被ダメージ', '勝利時の残りHP'].map(t => h('th', null, t))),
          rows));
      render();
    }

    function runDungeon() {
      const r = R.Sim.runDungeons({ members: members(), n, seed: Date.now() % 100000, dungeonId, difficulty });
      results = h('div', { class: 'panel' },
        h('div', null, `${R.DATA.dungeons[dungeonId].name}（難易度${difficulty}） ${n}回：クリア率 ${(r.clearRate * 100).toFixed(1)}%`),
        r.avgDeepest && R.DATA.dungeons[dungeonId].endless ? h('div', null, `平均到達 ${r.avgDeepest.toFixed(1)}階（自動操作はHPが半分を切ったら帰還、8階で帰還）`) : null,
        h('div', null, `平均到達戦闘数 ${r.avgBattles.toFixed(1)} ／ クリア時の平均HP ${r.avgHpLeftOnClear.toFixed(1)}`),
        h('table', null,
          h('tr', null, h('th', null, '全滅した場所'), h('th', null, '回数')),
          Object.entries(r.deathsAt).map(([k, v]) => h('tr', null, h('td', null, k), h('td', null, String(v))))));
      render();
    }

    render();
  }

  R.UI.extraMenu = R.UI.extraMenu || [];
  R.UI.extraMenu.push({ label: 'シミュレーター', desc: '自動対戦で勝率・平均ターン数を確認', screen: simScreen, order: 90 });
  R.UI.simScreen = simScreen;
})(globalThis.RASEN = globalThis.RASEN || {});
