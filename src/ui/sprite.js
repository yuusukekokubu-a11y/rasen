// ドット絵を描く（data/sprites.js のデータを canvas に1マスずつ塗る）
//   大きく表示するときは「精細化」してから描く：
//     1. Scale2x（ドット絵用の2倍拡大。斜めの線がなめらかになる）で 16×16 → 32×32
//     2. 上の縁を明るく・下の縁を暗く（立体感）
//     3. まわりに暗い縁取り（隣の色を暗くした色。黒一色よりやわらかい）
//   小さいアイコン（24px未満）や、最初から32×32で描いた絵は拡大しない
(function (R) {
  const cache = {};

  function hexToRgb(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  // t > 0 で明るく、t < 0 で暗く
  function shade(c, t) {
    const [r, g, b] = hexToRgb(c);
    if (t >= 0) return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
    return rgbToHex(r * (1 + t), g * (1 + t), b * (1 + t));
  }
  function outlineOf(c) {
    const [r, g, b] = hexToRgb(c);
    // 暗い紺に寄せる（真っ黒より絵になじむ）
    return rgbToHex(r * 0.22 + 10, g * 0.22 + 9, b * 0.22 + 16);
  }

  // 文字の並び → 色の2次元配列（透明は null）
  function toGrid(data) {
    return data.rows.map(row => [...row].map(ch => (ch === '.' ? null : data.pal[ch] || null)));
  }

  function scale2x(g) {
    const n = g.length, m = g[0].length;
    const at = (y, x) => (y < 0 || x < 0 || y >= n || x >= m ? null : g[y][x]);
    const out = [...Array(n * 2)].map(() => Array(m * 2).fill(null));
    for (let y = 0; y < n; y++) for (let x = 0; x < m; x++) {
      const P = g[y][x], A = at(y - 1, x), B = at(y, x + 1), C = at(y, x - 1), D = at(y + 1, x);
      out[y * 2][x * 2] = (C === A && C !== D && A !== B) ? A : P;
      out[y * 2][x * 2 + 1] = (A === B && A !== C && B !== D) ? B : P;
      out[y * 2 + 1][x * 2] = (D === C && D !== B && C !== A) ? C : P;
      out[y * 2 + 1][x * 2 + 1] = (B === D && B !== A && D !== C) ? D : P;
    }
    return out;
  }

  // 陰影と縁取り。縁取りのために上下左右に1マスずつ余白を足す
  function finish(g) {
    const n = g.length, m = g[0].length;
    const at = (y, x) => (y < 0 || x < 0 || y >= n || x >= m ? null : g[y][x]);
    const out = [...Array(n + 2)].map(() => Array(m + 2).fill(null));
    for (let y = -1; y <= n; y++) for (let x = -1; x <= m; x++) {
      const c = at(y, x);
      if (c) {
        let v = c;
        if (!at(y - 1, x)) v = shade(c, 0.22);
        else if (!at(y + 1, x)) v = shade(c, -0.25);
        else if (!at(y, x - 1)) v = shade(c, 0.08);
        out[y + 1][x + 1] = v;
      } else {
        const nb = at(y - 1, x) || at(y + 1, x) || at(y, x - 1) || at(y, x + 1);
        if (nb) out[y + 1][x + 1] = outlineOf(nb);
      }
    }
    return out;
  }

  function gridFor(id, data, fine) {
    const key = id + (fine ? ':f' : ':r');
    if (!cache[key]) {
      let g = toGrid(data);
      if (fine) {
        if (g.length <= 16) g = scale2x(g);
        g = finish(g);
      }
      cache[key] = g;
    }
    return cache[key];
  }

  // size：表示する大きさ(px)。opts.fine で精細化を強制（true/false）
  function sprite(id, size, opts) {
    opts = opts || {};
    const data = R.DATA.sprites && R.DATA.sprites[id];
    const c = document.createElement('canvas');
    c.className = 'sprite' + (opts.extraClass ? ' ' + opts.extraClass : '');
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.setAttribute('aria-hidden', 'true');
    if (!data) { c.width = c.height = 16; return c; }
    const fine = opts.fine !== undefined ? opts.fine : (size >= 24 && data.fine !== false);
    // 細かい版（32×32）しかない絵は大きいときだけ使い、小さいときは small を使う
    const useSmall = data.small && size < 40;
    const g = useSmall ? gridFor(id + ':small', data.small, fine) : gridFor(id, data, fine);
    c.width = g[0].length; c.height = g.length;
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    g.forEach((row, y) => row.forEach((color, x) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }));
    if (opts.flip) { c.style.transform = 'scaleX(-1)'; }
    return c;
  }

  R.UI = R.UI || {};
  R.UI.sprite = sprite;
  R.UI.spriteShade = shade;
})(globalThis.RASEN = globalThis.RASEN || {});
