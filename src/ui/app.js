// 画面の切り替え（拠点メニューなど）
(function (R) {
  const { h, clear, bar } = R.UI;
  const app = { el: null, screen: null };

  function show(screenFn) {
    app.screen = screenFn;
    clear(app.el);
    // 画面が切り替わるときにふわっと出す
    app.el.classList.remove('screen-in');
    void app.el.offsetWidth;
    app.el.classList.add('screen-in');
    screenFn(app.el);
    window.scrollTo(0, 0);
  }

  // 画面の上のバー（もどるボタン＋題名）
  function header(title, back, sub) {
    return h('div', { class: 'topbar' },
      back ? h('button', { class: 'back-btn', 'aria-label': 'もどる', onclick: back }, '◀') : null,
      h('h1', null, title),
      sub ? h('span', { class: 'sub' }, sub) : null);
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
      const scene = Object.keys(R.DATA.dungeons).find(id => {
        const d = R.DATA.dungeons[id];
        const fl = d.endless ? d.endless.tiers.map(t => ({ encounters: t.encounters })) : d.floors;
        return fl.some(f => f.encounters[encounter] !== undefined || f.boss === encounter);
      }) || 'cave';
      R.UI.mountCombat(area, combat, { scene, onFinish: () => show(practiceScreen) });
    }
    render();
  }

  // ===== 拠点メニュー =====
  function homeScreen(el) {
    const party = R.Game.state.party;
    // 夜の野営地の絵の上に、題名とパーティ
    el.appendChild(R.UI.stage('camp', 'home-hero',
      h('div', { class: 'home-title' }, 'ラセン'),
      h('div', { class: 'home-sub' }, '拠点'),
      h('div', { class: 'home-party' }, party.map(j => R.UI.sprite(j, 56)))));
    const menu = [
      { label: '練習戦闘', desc: '記録なし', icon: 'icon_practice', fn: () => show(practiceScreen), order: 80 },
      { label: '持ち物', desc: '素材・道具・Lv', icon: 'icon_bag', fn: () => show(inventoryScreen), order: 70 }
    ].concat(R.UI.extraMenu || []).sort((x, y) => (x.order || 50) - (y.order || 50));
    const run = R.Game.run;
    el.appendChild(h('div', { class: 'menu' }, menu.map((m, i) => {
      const wide = i === 0;
      const label = wide && run ? '冒険の続き' : m.label;
      const desc = wide && run ? `${run.def.name}・${run.whereText()}` : m.desc;
      return h('button', { class: 'menu-item' + (wide ? ' wide primary' : ''), onclick: m.fn ? m.fn : () => show(m.screen) },
        m.icon ? R.UI.sprite(m.icon, wide ? 44 : 36) : null,
        h('div', { class: 'menu-text' },
          h('div', { class: 'menu-label' }, label),
          h('div', { class: 'menu-desc' }, desc)));
    })));
  }

  // ===== 持ち物・ライフ =====
  function inventoryScreen(el) {
    const s = R.Game.state;
    el.appendChild(header('持ち物・ライフ', () => show(homeScreen)));
    el.appendChild(h('h2', null, 'ライフ'));
    el.appendChild(h('div', { class: 'life-grid' }, Object.entries(R.Life.LIVES).map(([k, name]) => {
      const need = R.Life.expToNext(s.life[k].lv);
      return h('div', { class: 'life-tile' },
        h('div', { class: 'life-top' }, h('span', { class: 'life-name' }, name), h('span', { class: 'life-lv' }, `Lv${s.life[k].lv}`)),
        bar(s.life[k].exp, need, 'exp'));
    })));
    el.appendChild(h('h2', null, '素材'));
    const mats = Object.entries(s.materials).filter(([, n]) => n > 0);
    el.appendChild(mats.length ? h('div', { class: 'mat-grid' }, mats.map(([m, n]) => {
      const d = R.DATA.materials[m] || { name: m, kind: '?', rank: '?' };
      return h('div', { class: 'mat-tile', title: `ランク${d.rank}` },
        R.UI.sprite('mat_' + d.kind, 24),
        h('span', { class: 'mat-name' }, d.name),
        h('span', { class: 'mat-rank' }, `R${d.rank}`),
        h('span', { class: 'mat-n' }, `×${n}`));
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
