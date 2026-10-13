// ドット絵を描く（data/sprites.js のデータを canvas に1マスずつ塗る）
(function (R) {
  const cache = {};

  // 1マス1ピクセルの小さな canvas を作り、CSSで拡大して表示する（image-rendering: pixelated）
  function sprite(id, size, opts) {
    opts = opts || {};
    const data = R.DATA.sprites && R.DATA.sprites[id];
    const c = document.createElement('canvas');
    c.className = 'sprite' + (opts.extraClass ? ' ' + opts.extraClass : '');
    c.width = 16; c.height = 16;
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.setAttribute('aria-hidden', 'true');
    if (!data) return c;
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    if (!cache[id]) cache[id] = data.rows.map(row => [...row].slice(0, 16));
    cache[id].forEach((row, y) => row.forEach((ch, x) => {
      const color = data.pal[ch];
      if (ch === '.' || !color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }));
    if (opts.flip) { c.style.transform = 'scaleX(-1)'; }
    return c;
  }

  R.UI = R.UI || {};
  R.UI.sprite = sprite;
})(globalThis.RASEN = globalThis.RASEN || {});
