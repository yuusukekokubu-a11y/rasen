// 背景のドット絵（場所ごとの舞台）。低い解像度の canvas に図形を描いて、拡大して表示する
// 乱数の種を場所ごとに固定しているので、毎回同じ絵になる
(function (R) {
  const W = 128, H = 72;

  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  // 上から下へ色の帯を重ねる（ディザ風に境目を少し混ぜる）
  function bands(ctx, colors, y0, y1, r) {
    const n = colors.length, hh = (y1 - y0) / n;
    colors.forEach((c, i) => px(ctx, 0, y0 + i * hh, W, Math.ceil(hh) + 1, c));
    for (let i = 1; i < n; i++) {
      const y = Math.round(y0 + i * hh);
      for (let x = 0; x < W; x += 2) px(ctx, x + (Math.floor(y) % 2), y - 1, 1, 1, colors[i]);
    }
  }
  function stars(ctx, r, n, ymax, colors) {
    for (let i = 0; i < n; i++) px(ctx, r() * W, r() * ymax, 1, 1, colors[Math.floor(r() * colors.length)]);
  }
  // なだらかな山・丘の影
  function ridge(ctx, r, base, amp, color, step) {
    let y = base;
    for (let x = 0; x < W; x += step) {
      y += (r() - 0.5) * amp;
      y = Math.max(base - amp * 2, Math.min(base + amp, y));
      px(ctx, x, y, step, H - y, color);
    }
  }
  function glow(ctx, cx, cy, rad, color) {
    for (let rr = rad; rr > 0; rr -= 2) {
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const painters = {
    // 拠点：夜の野営地
    camp(ctx, r) {
      bands(ctx, ['#0b0f24', '#121838', '#1c2050', '#2a2458', '#3a2a5a'], 0, 46, r);
      stars(ctx, r, 70, 38, ['#ffffff', '#cfd8ff', '#ffe9a8']);
      px(ctx, 98, 8, 6, 6, '#f4e7c0'); px(ctx, 97, 9, 1, 4, '#f4e7c0'); px(ctx, 104, 9, 1, 4, '#f4e7c0'); px(ctx, 100, 9, 3, 2, '#ffffff');
      ridge(ctx, r, 40, 3, '#1b1a3c', 4);
      ridge(ctx, r, 48, 2, '#141530', 3);
      px(ctx, 0, 56, W, 16, '#141a1c');
      for (let x = 0; x < W; x += 3) px(ctx, x, 55 + (r() < 0.5 ? 0 : 1), 2, 1, '#1e2a24');
      // テント
      for (let i = 0; i < 12; i++) px(ctx, 22 + i, 56 - i, 24 - i * 2, 1, i % 3 === 0 ? '#6a3a2a' : '#7e4632');
      px(ctx, 32, 48, 4, 8, '#2a1610');
      // たき火
      glow(ctx, 70, 54, 22, '#ffb04a');
      px(ctx, 66, 57, 9, 2, '#5a3a22');
      px(ctx, 68, 52, 5, 5, '#ff8a2a'); px(ctx, 69, 50, 3, 3, '#ffc24a'); px(ctx, 70, 48, 1, 2, '#ffe9a8');
      // 木
      for (const [x, h] of [[8, 22], [112, 26], [120, 18]]) {
        px(ctx, x + 2, 56 - h / 3, 2, h / 3, '#1a1210');
        for (let i = 0; i < h * 0.7; i++) px(ctx, x - i / 4 + 3, 56 - h / 3 - i, Math.max(1, i / 2), 1, '#0f1a18');
      }
    },
    // 岩窟の洞
    cave(ctx, r) {
      bands(ctx, ['#16120f', '#1d1813', '#241d17', '#2a2219'], 0, 52, r);
      for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * 50; px(ctx, x, y, 2 + r() * 4, 1 + r() * 2, r() < 0.5 ? '#2e261d' : '#130f0c'); }
      for (let x = 0; x < W; x += 6 + Math.floor(r() * 6)) { const h = 3 + r() * 10; for (let i = 0; i < h; i++) px(ctx, x + i / 3, i, Math.max(1, 4 - i / 2), 1, '#0e0b09'); }
      glow(ctx, 18, 26, 16, '#ff9a3a'); glow(ctx, 110, 22, 16, '#ff9a3a');
      px(ctx, 17, 26, 2, 6, '#5a3a22'); px(ctx, 17, 23, 2, 3, '#ffb04a');
      px(ctx, 109, 22, 2, 6, '#5a3a22'); px(ctx, 109, 19, 2, 3, '#ffb04a');
      px(ctx, 0, 52, W, 20, '#2a2219');
      for (let i = 0; i < 40; i++) px(ctx, r() * W, 52 + r() * 20, 3, 1, '#352b20');
      px(ctx, 0, 52, W, 1, '#3e3226');
    },
    // 囁きの森
    forest(ctx, r) {
      bands(ctx, ['#0d1a16', '#12241c', '#173022', '#1d3a26'], 0, 54, r);
      for (let layer = 0; layer < 3; layer++) {
        const c = ['#0f2a1e', '#0b2018', '#081610'][layer];
        for (let x = -4; x < W; x += 10 + Math.floor(r() * 10)) {
          const w = 3 + layer * 2;
          px(ctx, x, 0, w, 56, c);
          for (let i = 0; i < 6; i++) px(ctx, x - 6 + r() * 6, r() * 30, 10 + r() * 8, 4 + r() * 4, c);
        }
      }
      for (let i = 0; i < 18; i++) px(ctx, r() * W, r() * 50, 1, 1, '#c8f08a');
      px(ctx, 0, 54, W, 18, '#14261a');
      for (let x = 0; x < W; x += 2) px(ctx, x, 53 - (r() < 0.4 ? 1 : 0), 1, 2, '#2a4a2a');
    },
    // 霧の沼
    marsh(ctx, r) {
      bands(ctx, ['#14201f', '#1a2a28', '#223430', '#2a3c36'], 0, 50, r);
      for (const x of [14, 44, 96, 118]) {
        px(ctx, x, 18, 2, 34, '#0e1614');
        px(ctx, x - 5, 26, 6, 1, '#0e1614'); px(ctx, x + 2, 22, 6, 1, '#0e1614');
      }
      px(ctx, 0, 50, W, 22, '#16302c');
      for (let i = 0; i < 40; i++) px(ctx, r() * W, 52 + r() * 18, 4 + r() * 8, 1, '#22423c');
      ctx.globalAlpha = 0.25;
      for (let y = 30; y < 60; y += 6) px(ctx, 0, y, W, 3, '#9ab8b0');
      ctx.globalAlpha = 1;
      for (let i = 0; i < 8; i++) { glow(ctx, r() * W, 20 + r() * 30, 5, '#7affc8'); }
    },
    // 星降る遺跡
    ruins(ctx, r) {
      bands(ctx, ['#0a0a1c', '#12122c', '#1c1a3c', '#26224a'], 0, 52, r);
      stars(ctx, r, 60, 44, ['#ffffff', '#ffe9a8', '#a8c8ff']);
      for (let i = 0; i < 3; i++) { const x = 20 + r() * 90, y = 4 + r() * 12; for (let k = 0; k < 6; k++) px(ctx, x - k, y + k / 2, 1, 1, k < 2 ? '#ffffff' : '#a8c8ff'); }
      for (const [x, h] of [[10, 34], [30, 22], [92, 28], [114, 40]]) {
        px(ctx, x, 54 - h, 8, h, '#3a3648'); px(ctx, x + 1, 54 - h, 2, h, '#4a4658'); px(ctx, x - 1, 54 - h, 10, 3, '#4a4658');
      }
      px(ctx, 0, 54, W, 18, '#24202e');
      for (let x = 0; x < W; x += 8) for (let y = 55; y < H; y += 5) px(ctx, x + (y % 10 ? 4 : 0), y, 1, 4, '#1a1722');
    },
    // 螺旋の塔
    spiral(ctx, r) {
      bands(ctx, ['#100820', '#1a0e30', '#261440', '#321a4c'], 0, 72, r);
      stars(ctx, r, 80, 60, ['#ffffff', '#e8c8ff', '#ffe9a8']);
      glow(ctx, 64, 20, 26, '#c8a0ff');
      // 塔
      px(ctx, 50, 6, 28, 66, '#1a1228'); px(ctx, 52, 6, 3, 66, '#2a2040'); px(ctx, 48, 4, 32, 3, '#2a2040');
      for (let y = 10; y < 70; y += 9) { px(ctx, 58, y, 3, 4, '#ffd27a'); px(ctx, 68, y + 4, 3, 4, '#ffd27a'); }
      // 塔に巻きつく螺旋の階段
      for (let i = 0; i < 60; i++) {
        const t = i / 60, a = t * Math.PI * 6, y = 70 - t * 66;
        const x = 64 + Math.cos(a) * 20;
        if (Math.sin(a) > -0.2) px(ctx, x - 2, y, 5, 1, Math.sin(a) > 0.5 ? '#8a72b8' : '#5a4a7a');
      }
      px(ctx, 0, 66, W, 6, '#140c20');
    },
    // 工房（生産）
    workshop(ctx, r) {
      for (let y = 0; y < 52; y += 6) { px(ctx, 0, y, W, 6, y % 12 ? '#2a1e16' : '#30221a'); px(ctx, 0, y, W, 1, '#1a120c'); }
      for (let x = 0; x < W; x += 24) px(ctx, x + (r() * 8), 0, 1, 52, '#1a120c');
      px(ctx, 8, 16, 40, 2, '#4a3624'); px(ctx, 80, 20, 40, 2, '#4a3624');
      for (let i = 0; i < 6; i++) px(ctx, 10 + i * 6, 10, 4, 6, ['#6a7a8a', '#8a6a40', '#5a8a6a'][i % 3]);
      for (let i = 0; i < 5; i++) px(ctx, 84 + i * 7, 13, 5, 7, ['#a85a4a', '#c9a24a', '#5a6aa8'][i % 3]);
      glow(ctx, 104, 50, 20, '#ff8a3a');
      px(ctx, 0, 52, W, 20, '#1e1610');
      px(ctx, 56, 44, 18, 4, '#4a4e58'); px(ctx, 60, 48, 10, 6, '#33363e'); px(ctx, 58, 54, 14, 2, '#2a2c34');
    }
  };

  // 場所の絵を canvas で返す（CSSで幅いっぱいに拡大）
  function backdrop(kind, extraClass) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.className = 'backdrop' + (extraClass ? ' ' + extraClass : '');
    c.setAttribute('aria-hidden', 'true');
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    const paint = painters[kind] || painters.cave;
    const seed = [...kind].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7);
    paint(ctx, rng(seed));
    return c;
  }

  R.UI = R.UI || {};
  R.UI.backdrop = backdrop;
  R.UI.BACKDROPS = Object.keys(painters);
})(globalThis.RASEN = globalThis.RASEN || {});
