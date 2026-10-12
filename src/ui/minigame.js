// タイミングのミニゲーム（採集・生産で共通）
// 左右に動く目印を、緑（ふつう）か金色（最高）の範囲で止める
(function (R) {
  const { h, clear } = R.UI;

  // opts: { title, goodWidth, greatWidth, swings, speed, actionLabel,
  //         onHit(hit, count) → { progress(0-100), done(bool), text }, onDone() }
  function mountTimingGame(container, opts) {
    let pos = 0;
    let dir = 1;
    let count = 0;
    let finished = false;
    let raf = null;
    let last = null;
    let zoneCenter = 50;
    let lastText = '';
    let progress = 0;
    const speed = opts.speed || 90; // 1秒あたりに動く%

    const cursor = h('div', { class: 'mg-cursor' });
    const good = h('div', { class: 'mg-zone' });
    const great = h('div', { class: 'mg-zone great' });
    const track = h('div', { class: 'mg-track' }, good, great, cursor);
    const progFill = h('div', { style: { width: '0%' } });
    const info = h('div', { class: 'muted' });
    const btn = h('button', { class: 'primary', onclick: hit }, opts.actionLabel || '振る');
    const msg = h('div');

    function placeZones() {
      const half = opts.goodWidth / 2;
      zoneCenter = half + Math.random() * (100 - opts.goodWidth);
      good.style.left = (zoneCenter - half) + '%';
      good.style.width = opts.goodWidth + '%';
      great.style.left = (zoneCenter - opts.greatWidth / 2) + '%';
      great.style.width = opts.greatWidth + '%';
    }

    function updateInfo() {
      info.textContent = opts.swings ? `残り ${opts.swings - count} 回` : `${count} 回目`;
      progFill.style.width = progress + '%';
      msg.textContent = lastText;
    }

    function tick(t) {
      if (finished) return;
      if (last !== null) {
        pos += dir * speed * (t - last) / 1000;
        if (pos >= 100) { pos = 100; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        cursor.style.left = `calc(${pos}% - 2px)`;
      }
      last = t;
      raf = requestAnimationFrame(tick);
    }

    function hit() {
      if (finished) return;
      const d = Math.abs(pos - zoneCenter);
      const kind = d <= opts.greatWidth / 2 ? 'great' : d <= opts.goodWidth / 2 ? 'good' : 'miss';
      count++;
      const r = opts.onHit(kind, count) || {};
      progress = r.progress !== undefined ? r.progress : progress;
      lastText = { great: '最高！', good: 'よし', miss: 'ミス…' }[kind] + (r.text ? '　' + r.text : '');
      if (r.done || (opts.swings && count >= opts.swings)) {
        finished = true;
        cancelAnimationFrame(raf);
        btn.disabled = true;
        updateInfo();
        if (opts.onDone) setTimeout(opts.onDone, 350);
        return;
      }
      placeZones();
      updateInfo();
    }

    function onKey(e) {
      if (e.code === 'Space' && document.body.contains(btn)) { e.preventDefault(); hit(); }
      else if (!document.body.contains(btn)) window.removeEventListener('keydown', onKey);
    }
    window.addEventListener('keydown', onKey);

    clear(container);
    container.appendChild(h('div', { class: 'panel minigame' },
      h('div', null, h('b', null, opts.title || '')),
      h('div', { class: 'muted' }, '目印が緑の範囲にあるときにボタン（またはスペースキー）。金色ならさらに良い'),
      track,
      h('div', { class: 'mg-progress' }, progFill),
      h('div', { class: 'row' }, btn, info),
      msg));
    placeZones();
    updateInfo();
    raf = requestAnimationFrame(tick);
    return { stop() { finished = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); } };
  }

  R.UI.mountTimingGame = mountTimingGame;
})(globalThis.RASEN = globalThis.RASEN || {});
