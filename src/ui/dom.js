// 画面づくりの小さな道具
// 文字はすべて textContent で入れる（HTMLとして解釈させない＝安全）
(function (R) {
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'disabled' || k === 'checked' || k === 'selected') el[k] = !!v;
        else if (k === 'value') el.value = v;
        else el.setAttribute(k, v);
      }
    }
    appendChildren(el, children);
    return el;
  }
  function appendChildren(el, children) {
    for (const c of children) {
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) appendChildren(el, c);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  function bar(cur, max, cls) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    return h('div', { class: 'bar ' + (cls || '') },
      h('div', { class: 'bar-fill', style: { width: pct + '%' } }),
      h('span', { class: 'bar-text' }, `${cur} / ${max}`));
  }

  // 簡易の確認ダイアログ（window.confirm はブラウザによって止められることがあるので自前）
  function modal(content, buttons) {
    const overlay = h('div', { class: 'modal-overlay' });
    const close = () => overlay.remove();
    const box = h('div', { class: 'modal' }, content,
      h('div', { class: 'modal-buttons' }, buttons.map(b =>
        h('button', { class: b.primary ? 'primary' : '', onclick: () => { close(); if (b.onClick) b.onClick(); } }, b.label))));
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    return close;
  }

  // 職業を選ぶタイル（ドット絵＋名前＋説明）。picked は選ばれている職業の配列
  function jobPicker(jobs, picked, onToggle) {
    return h('div', { class: 'job-picker' }, jobs.map(j => h('label', { class: 'job-option' },
      h('input', { type: 'checkbox', checked: picked.includes(j), onchange: (ev) => onToggle(j, ev.target.checked) }),
      R.UI.sprite ? R.UI.sprite(j, 48) : null,
      h('span', { class: 'job-name' }, R.DATA.jobs[j].name),
      h('span', { class: 'job-desc' }, R.DATA.jobs[j].desc))));
  }

  // ステータスをアイコンで表示（HP・攻撃力・防御力・魔力）
  function statLine(st, keys) {
    const ico = { hp: 'ico_hp', atk: 'ico_atk', def: 'ico_def', mag: 'ico_mag' };
    const name = { hp: 'HP', atk: '攻撃力', def: '防御力', mag: '魔力' };
    return h('span', { class: 'stats' }, (keys || ['atk', 'def', 'mag']).map(k =>
      h('span', { class: 'stat', title: name[k] }, R.UI.sprite(ico[k], 13), String(st[k] || 0))));
  }

  // ドット絵の背景を敷いた枠（舞台）。中身は children
  function stage(kind, cls, ...children) {
    return h('div', { class: 'stage ' + (cls || '') }, R.UI.backdrop(kind), ...children);
  }

  R.UI = R.UI || {};
  Object.assign(R.UI, { h, clear, bar, modal, jobPicker, statLine, stage });
})(globalThis.RASEN = globalThis.RASEN || {});
