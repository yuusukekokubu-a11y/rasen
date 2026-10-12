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
      el.appendChild(h('p', null, '初期装備で好きな敵と戦えます。パーティを3人選んでください。'));
      el.appendChild(h('div', { class: 'job-picker' }, jobs.map(j => h('label', { class: 'job-option' },
        h('input', { type: 'checkbox', checked: picked.includes(j), onchange: (ev) => {
          if (ev.target.checked) picked.push(j); else picked = picked.filter(x => x !== j);
          render();
        } }),
        `${R.DATA.jobs[j].name}（${R.DATA.jobs[j].desc}）`))));
      el.appendChild(h('div', null, '敵：',
        h('select', { onchange: (ev) => { encounter = ev.target.value; } },
          Object.entries(R.DATA.encounters).map(([id, enc]) => h('option', { value: id, selected: id === encounter }, enc.name)))));
      el.appendChild(h('button', { class: 'primary', disabled: picked.length !== 3, onclick: start }, picked.length === 3 ? '戦闘開始' : `あと${3 - picked.length}人選んでください`));
    }

    function start() {
      const members = picked.map(job => ({ job, gear: R.DATA.loadouts.starter[job] }));
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
    el.appendChild(header('拠点'));
    const menu = [
      { label: '練習戦闘', desc: '初期装備で敵と戦う', fn: () => show(practiceScreen) }
    ].concat(R.UI.extraMenu || []);
    el.appendChild(h('div', { class: 'menu' }, menu.map(m =>
      h('button', { class: 'menu-item', onclick: m.fn ? m.fn : () => show(m.screen) },
        h('div', { class: 'menu-label' }, m.label),
        h('div', { class: 'menu-desc' }, m.desc)))));
  }

  Object.assign(R.UI, { show, header, homeScreen, practiceScreen });

  window.addEventListener('DOMContentLoaded', () => {
    app.el = document.getElementById('app');
    show(homeScreen);
  });
})(globalThis.RASEN = globalThis.RASEN || {});
