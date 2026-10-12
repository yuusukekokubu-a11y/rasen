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

  R.UI = R.UI || {};
  Object.assign(R.UI, { h, clear, bar, modal });
})(globalThis.RASEN = globalThis.RASEN || {});
