// 画面の切り替え（拠点メニューなど）
(function (R) {
  const { h, clear } = R.UI;
  const app = { el: null, screen: null };

  function show(screenFn) {
    app.screen = screenFn;
    clear(app.el);
    screenFn(app.el);
    window.scrollTo(0, 0);
  }

  function header(title, back) {
    return h('div', { class: 'header' },
      back ? h('button', { class: 'small', onclick: back }, '← もどる') : null,
      h('h1', null, title));
  }

  // ===== 練習戦闘（フェーズ1：戦闘だけ動くもの） =====
  function practiceScreen(el) {
    const jobs = Object.keys(R.DATA.jobs).filter(j => R.DATA.jobs[j].enabled);
    let picked = jobs.slice(0, 3);
    let encounter = Object.keys(R.DATA.encounters)[0];

    function render() {
      clear(el);
      el.appendChild(header('練習戦闘', () => show(homeScreen)));
      el.appendChild(h('p', { class: 'muted' }, '記録は残りません'));
      el.appendChild(R.UI.jobPicker(jobs, picked, (j, on) => {
        if (on) picked.push(j); else picked = picked.filter(x => x !== j);
        render();
      }));
      el.appendChild(h('div', null, '敵：',
        h('select', { onchange: (ev) => { encounter = ev.target.value; } },
          Object.entries(R.DATA.encounters).map(([id, enc]) => h('option', { value: id, selected: id === encounter }, enc.name)))));
      el.appendChild(h('button', { class: 'primary', disabled: picked.length !== 3, onclick: start }, picked.length === 3 ? '戦闘開始' : `あと${3 - picked.length}人選んでください`));
    }

    function start() {
      // 装備中の装備で戦う（ゲームの状態がなければ初期装備）
      const members = picked.map(job => ({ job, gear: R.Game && R.Game.state ? R.Game.gearOf(job) : R.DATA.loadouts.starter[job] }));
      const party = R.Gear.buildParty(members);
      const combat = new R.Combat({ party, encounter: R.DATA.encounters[encounter].enemies }).start();
      clear(el);
      el.appendChild(header('練習戦闘', () => show(practiceScreen)));
      const area = h('div');
      el.appendChild(area);
      R.UI.mountCombat(area, combat, { onFinish: () => show(practiceScreen) });
    }
    render();
  }

  // ===== 拠点メニュー =====
  function homeScreen(el) {
    el.appendChild(h('div', { class: 'title' },
      h('div', { class: 'title-name' }, 'ラセン'),
      h('div', { class: 'title-sub' }, '拠点')));
    const menu = [
      { label: '練習戦闘', desc: '今の装備で好きな敵と戦う（記録なし）', icon: 'icon_practice', fn: () => show(practiceScreen), order: 80 },
      { label: '持ち物・ライフ', desc: '素材・道具・生産Lv', icon: 'icon_bag', fn: () => show(inventoryScreen), order: 70 }
    ].concat(R.UI.extraMenu || []).sort((x, y) => (x.order || 50) - (y.order || 50));
    if (R.Game.run) el.appendChild(h('div', { class: 'panel' }, `ダンジョン「${R.Game.run.def.name}」の途中です（${R.Game.run.whereText()}）。「ダンジョンへ出発」から続きを遊べます。`));
    el.appendChild(h('div', { class: 'menu' }, menu.map(m =>
      h('button', { class: 'menu-item', onclick: m.fn ? m.fn : () => show(m.screen) },
        m.icon ? R.UI.sprite(m.icon, 40) : null,
        h('div', { class: 'menu-text' },
          h('div', { class: 'menu-label' }, m.label),
          h('div', { class: 'menu-desc' }, m.desc))))));
  }

  // ===== 持ち物・ライフ =====
  function inventoryScreen(el) {
    const s = R.Game.state;
    el.appendChild(header('持ち物・ライフ', () => show(homeScreen)));
    el.appendChild(h('h2', null, 'ライフ（生産・採集のレベル）'));
    el.appendChild(h('table', null,
      h('tr', null, h('th', null, 'ライフ'), h('th', null, 'Lv'), h('th', null, '経験値')),
      Object.entries(R.Life.LIVES).map(([k, name]) => h('tr', null,
        h('td', null, name), h('td', null, String(s.life[k].lv)),
        h('td', null, `${s.life[k].exp} / ${R.Life.expToNext(s.life[k].lv)}`)))));
    el.appendChild(h('h2', null, '素材'));
    const mats = Object.entries(s.materials).filter(([, n]) => n > 0);
    el.appendChild(mats.length ? h('table', null,
      h('tr', null, h('th', null, '素材'), h('th', null, '種類'), h('th', null, '格'), h('th', null, '個数')),
      mats.map(([m, n]) => {
        const d = R.DATA.materials[m] || { name: m, kind: '?', rank: '?' };
        const kind = { ore: '鉱石', wood: '木材', plant: '採取物', monster: 'モンスター素材', gem: '宝石' }[d.kind] || d.kind;
        return h('tr', null, h('td', null, d.name), h('td', null, kind), h('td', null, String(d.rank)), h('td', null, String(n)));
      })) : h('div', { class: 'muted' }, 'なし'));
    el.appendChild(h('h2', null, '採集道具'));
    el.appendChild(h('div', null, s.tools.map(t => R.DATA.equipment.tools[t] ? R.DATA.equipment.tools[t].name : t).join('、') || 'なし'));
    el.appendChild(h('h2', null, '記録'));
    el.appendChild(h('div', null, `出発 ${s.runs}回／クリア ${Object.values(s.clears).reduce((a, b) => a + b, 0)}回`));
    el.appendChild(h('h2', null, 'テスト用'));
    el.appendChild(h('label', null,
      h('input', { type: 'checkbox', id: 'debug-toggle', checked: s.settings.debug, onchange: (e) => { s.settings.debug = e.target.checked; R.Game.save(); show(inventoryScreen); } }),
      ' テスト用の機能を表示'));
    if (s.settings.debug) {
      const act = (label, fn) => h('button', { class: 'small', onclick: () => { fn(); R.Game.save(); show(inventoryScreen); } }, label);
      el.appendChild(h('div', { class: 'row' },
        act('全ダンジョンをクリア済みにする', () => R.Game.debugClearAll()),
        act('素材を全種類+10', () => R.Game.debugAllMaterials(10)),
        act('生産・採集Lv+5', () => R.Game.debugLifeUp(5)),
        act('採集道具をすべて入手', () => R.Game.debugAllTools())));
    }
    el.appendChild(h('h2', null, 'セーブデータ'));
    el.appendChild(h('button', { class: 'danger', onclick: () => R.UI.modal(h('div', null, 'セーブデータを消去しますか？（元に戻せません）'), [
      { label: 'やめる' },
      { label: '消去する', onClick: () => { R.Game.reset(); R.Game.run = null; show(homeScreen); } }
    ]) }, 'セーブデータを消去'));
  }

  Object.assign(R.UI, { show, header, homeScreen, practiceScreen, inventoryScreen });

  window.addEventListener('DOMContentLoaded', () => {
    app.el = document.getElementById('app');
    R.Game.load();
    R.Game.restoreRun();
    R.Game.save();
    show(homeScreen);
  });
})(globalThis.RASEN = globalThis.RASEN || {});
