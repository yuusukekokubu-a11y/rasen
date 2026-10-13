// 敵の絵（影絵）：data/silhouettes.js の形を、SVG（図形で描く絵）で描く
//   ・体は暗いグラデーション、外側の縁だけが光る（光る線を先に描き、体で上から覆う）
//   ・目は光がにじむ。まわりに縁と同じ色の火の粉が舞う
//   ・同じ形でも、縁の光と目の色を変えると別の敵になる（強・〇〇 などの使い回し）
//   文字列のHTMLは使わず、部品を1つずつ作って組み立てる
(function (R) {
  const NS = 'http://www.w3.org/2000/svg';
  let seq = 0;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v));
    if (parent) parent.appendChild(e);
    return e;
  }
  // 敵ごとに同じ並びになる乱数（火の粉の位置用）
  function seeded(str) {
    let s = [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  // 敵の絵を作る。絵のない敵は null（そのときはドット絵を使う）
  //   size：横幅と高さの大きい方（px）
  function enemyArt(id, size, opts) {
    opts = opts || {};
    const art = R.DATA.enemyArt && R.DATA.enemyArt[id];
    const sh = art && R.DATA.silhouettes[art.shape];
    if (!sh) return null;
    const pal = Object.assign({ body: '#07060a', body2: '#1a1622', fur: art.rim }, art);
    const u = 's' + (++seq);
    const [, , vw, vh] = sh.vb.split(' ').map(Number);
    const k = size / Math.max(vw, vh);
    const svg = el('svg', { viewBox: sh.vb, width: Math.round(vw * k), height: Math.round(vh * k), class: 'enemy-art' + (opts.extraClass ? ' ' + opts.extraClass : ''), 'aria-hidden': 'true' });
    svg.style.overflow = 'visible';

    const defs = el('defs', {}, svg);
    const bg = el('linearGradient', { id: 'b' + u, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': pal.body2 }, bg);
    el('stop', { offset: 1, 'stop-color': pal.body }, bg);
    // 縁の光：右上（光の来る側）ほど明るい
    const rg = el('linearGradient', { id: 'r' + u, x1: 1, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': pal.rim, 'stop-opacity': 1 }, rg);
    el('stop', { offset: 0.6, 'stop-color': pal.rim, 'stop-opacity': 0.45 }, rg);
    el('stop', { offset: 1, 'stop-color': pal.rim, 'stop-opacity': 0.15 }, rg);
    const halo = el('filter', { id: 'g' + u, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: sh.glow || 4 }, halo);
    const bloom = el('filter', { id: 'e' + u, x: '-300%', y: '-300%', width: '700%', height: '700%' }, defs);
    el('feGaussianBlur', { stdDeviation: 3 }, bloom);

    const strong = art.aura || 1;
    // にじむ光（いちばん後ろ）
    const hg = el('g', { filter: `url(#g${u})`, opacity: Math.min(1, 0.75 * strong) }, svg);
    for (const d of sh.body) el('path', { d, fill: 'none', stroke: pal.rim, 'stroke-width': 6 * strong, 'stroke-opacity': 0.5, 'stroke-linejoin': 'round' }, hg);
    // くっきりした縁の光（体で上から覆うので外側だけが残る）
    const rimG = el('g', {}, svg);
    for (const d of sh.body) el('path', { d, fill: 'none', stroke: `url(#r${u})`, 'stroke-width': 3.6, 'stroke-linejoin': 'round' }, rimG);
    // 体
    const g = el('g', {}, svg);
    for (const d of sh.body) el('path', { d, fill: `url(#b${u})` }, g);
    // 毛並み・模様（うっすら）
    for (const d of sh.fur || []) el('path', { d, fill: 'none', stroke: pal.fur, 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.4 }, g);
    // 牙・爪など（明るい色の小さな形）
    for (const d of sh.bright || []) el('path', { d, fill: pal.bright || '#d8d0c0' }, g);
    // 光る模様（目と同じ色でうっすら光る）
    for (const d of sh.glyph || []) {
      el('path', { d, fill: 'none', stroke: pal.eye, 'stroke-width': 3, opacity: 0.5, filter: `url(#e${u})` }, svg);
      el('path', { d, fill: 'none', stroke: pal.eye, 'stroke-width': 1.2, opacity: 0.9 }, svg);
    }
    // 目
    for (const [x, y, r] of sh.eyes || []) {
      el('ellipse', { cx: x, cy: y, rx: r * 1.9, ry: r * 1.2, fill: pal.eye, opacity: 0.85, filter: `url(#e${u})` }, svg);
      el('ellipse', { cx: x, cy: y, rx: r * 0.95, ry: r * 0.5, fill: pal.eye }, svg);
      el('ellipse', { cx: x + r * 0.2, cy: y - r * 0.1, rx: r * 0.35, ry: r * 0.2, fill: '#fff8e8' }, svg);
    }
    // 火の粉（ゆっくり舞い上がる。動きを減らす設定では止まる）
    if (opts.embers !== false) {
      const rnd = seeded(id);
      const n = art.embers || (strong > 1.2 ? 14 : 8);
      for (let i = 0; i < n; i++) {
        const x = vw * (0.1 + rnd() * 0.8), y = vh * (0.15 + rnd() * 0.75), r = 0.8 + rnd() * 1.6;
        const e = el('g', { class: 'ember' }, svg);
        e.style.animationDelay = `${-Math.round(rnd() * 4000)}ms`;
        e.style.animationDuration = `${3000 + Math.round(rnd() * 2500)}ms`;
        el('circle', { cx: x, cy: y, r: r * 2.4, fill: pal.rim, opacity: 0.25, filter: `url(#e${u})` }, e);
        el('circle', { cx: x, cy: y, r: r * 0.7, fill: pal.rim, opacity: 0.9 }, e);
      }
    }
    return svg;
  }

  // 敵の姿：影絵があれば影絵、なければドット絵
  function enemyFigure(id, size, opts) {
    return enemyArt(id, size, opts) || R.UI.sprite(id, size, opts);
  }

  R.UI = R.UI || {};
  Object.assign(R.UI, { enemyArt, enemyFigure });
})(globalThis.RASEN = globalThis.RASEN || {});
