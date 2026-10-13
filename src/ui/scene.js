// 背景のドット絵（場所ごとの舞台）。256×144 の canvas にプログラムで描いて、拡大して表示する
//   ・乱数の種を場所ごとに固定しているので、毎回同じ絵になる
//   ・動かない部分は1回だけ描いて取っておき（base）、炎のゆらぎ・星のまたたきなど動く部分だけを毎コマ上に描く
//   ・動きは1秒に8コマ（ドット絵らしいカクカクした動き）。画面から外れた背景は自動で止まる
//   ・「動きを減らす」設定の端末では動かさない
(function (R) {
  const W = 256, H = 144;
  const FPS = 8;

  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // 4×4 のディザ（色の境目をまだらに混ぜる網目）のしきい値
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

  function hexToRgb(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // 描く道具（すべて 256×144 の座標）
  function tools(ctx) {
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const dot = (x, y, c) => rect(x, y, 1, 1, c);
    // 上から下へ、色の列をディザでなめらかにつなぐ
    const vgrad = (y0, y1, colors) => {
      const n = colors.length - 1;
      for (let y = y0; y < y1; y++) {
        const f = ((y - y0) / Math.max(1, y1 - y0 - 1)) * n;
        const i = Math.min(n - 1, Math.floor(f)), fr = f - i;
        rect(0, y, W, 1, colors[i]);
        ctx.fillStyle = colors[i + 1];
        for (let x = 0; x < W; x++) if (bayer(x, y) < fr) ctx.fillRect(x, y, 1, 1);
      }
    };
    // 丸い光（中心ほど濃い。輪を数段に分け、輪の境目だけディザで混ぜる）
    const glow = (cx, cy, r, color, power) => {
      ctx.fillStyle = color;
      const a = ctx.globalAlpha;
      for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(H, cy + r); y++) {
        for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(W, cx + r); x++) {
          const d = Math.hypot(x - cx, y - cy) / r;
          if (d >= 1) continue;
          const k = (1 - d) * (1 - d) * (power || 1);
          const level = Math.floor(k * 5 + bayer(x, y));
          if (level <= 0) continue;
          ctx.globalAlpha = a * Math.min(0.5, level * 0.09);
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.globalAlpha = a;
    };
    // 横に流れる、ふちのやわらかい帯（霧など）
    const haze = (x0, y0, w, h, color, alpha) => {
      ctx.fillStyle = color;
      const a = ctx.globalAlpha;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = Math.abs(x / w - 0.5) * 2, dy = Math.abs(y / h - 0.5) * 2;
        const k = (1 - dx * dx) * (1 - dy * dy);
        if (bayer(x0 + x, y0 + y) < k) { ctx.globalAlpha = a * alpha; ctx.fillRect(Math.round(x0 + x), Math.round(y0 + y), 1, 1); }
      }
      ctx.globalAlpha = a;
    };
    // 山・丘の稜線。上の縁を少し明るくする
    const ridge = (r, base, amp, color, step, edge) => {
      let y = base;
      for (let x = 0; x < W; x += step) {
        y += (r() - 0.5) * amp;
        y = Math.max(base - amp * 2, Math.min(base + amp, y));
        rect(x, y, step, H - y, color);
        if (edge) rect(x, y, step, 1, edge);
      }
    };
    // ざらざらした質感（ランダムな点）
    const speckle = (r, x0, y0, w, h, colors, n) => {
      for (let i = 0; i < n; i++) dot(x0 + r() * w, y0 + r() * h, colors[Math.floor(r() * colors.length)]);
    };
    return { rect, dot, vgrad, glow, haze, ridge, speckle };
  }

  // 炎（下が太く上が細い。毎コマ形が変わる）
  function flame(T, x, y, size, t) {
    const h = size * (0.85 + Math.random() * 0.35);
    for (let i = 0; i < h; i++) {
      const k = i / h;
      const w = Math.max(1, Math.round(size * 0.55 * (1 - k) + (Math.random() < 0.3 ? 1 : 0)));
      const sway = Math.round(Math.sin(t * 1.7 + i * 0.6) * k * 1.5);
      const c = k < 0.3 ? '#ff7a1a' : k < 0.65 ? '#ffb43a' : '#fff0b0';
      T.rect(x - w / 2 + sway, y - i, w, 1, c);
    }
    T.rect(x - 1, y - Math.round(h * 0.4), 2, Math.round(h * 0.35), '#fff6d8');
  }
  function torch(T, x, y, t) {
    T.rect(x - 1, y, 3, 12, '#4a2e1a'); T.rect(x - 2, y, 5, 2, '#6a4428'); T.rect(x - 1, y, 1, 12, '#5a3a22');
    flame(T, x + 0.5, y - 1, 7, t);
  }
  // 星を描く（またたき用に位置と明るさを返す）
  function starField(T, r, n, ymax, colors) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const s = { x: Math.floor(r() * W), y: Math.floor(r() * ymax), c: colors[Math.floor(r() * colors.length)], big: r() < 0.08, ph: Math.floor(r() * 16) };
      list.push(s);
      T.dot(s.x, s.y, s.c);
      if (s.big) { T.dot(s.x - 1, s.y, mix(s.c, '#000000', 0.5)); T.dot(s.x + 1, s.y, mix(s.c, '#000000', 0.5)); T.dot(s.x, s.y - 1, mix(s.c, '#000000', 0.5)); T.dot(s.x, s.y + 1, mix(s.c, '#000000', 0.5)); }
    }
    return list;
  }
  function twinkle(T, stars, t, sky) {
    for (const s of stars) {
      const p = (t + s.ph) % 16;
      if (p === 0) T.dot(s.x, s.y, sky);
      else if (p === 8 && s.big) { T.dot(s.x, s.y - 2, s.c); T.dot(s.x, s.y + 2, s.c); T.dot(s.x - 2, s.y, s.c); T.dot(s.x + 2, s.y, s.c); }
    }
  }
  // 針葉樹のシルエット
  function pine(T, x, base, h, c, edge) {
    T.rect(x - 1, base - h * 0.25, 2, h * 0.25, '#120c0a');
    for (let i = 0; i < h * 0.85; i++) {
      const k = i / (h * 0.85);
      const w = Math.max(1, Math.round((1 - k) * h * 0.32 + ((i % 5) < 2 ? 1 : 0)));
      T.rect(x - w, base - h * 0.2 - i, w * 2, 1, c);
      if (edge && i % 5 === 0) T.rect(x - w, base - h * 0.2 - i, 1, 1, edge);
    }
  }

  const painters = {
    // 拠点：夜の野営地
    camp: {
      base(T, r, s) {
        T.vgrad(0, 100, ['#080b1e', '#0d1230', '#151a44', '#22205a', '#3a2a5e', '#4a2e58']);
        s.stars = starField(T, r, 140, 80, ['#ffffff', '#cfd8ff', '#ffe9a8', '#9fb4ff']);
        // 月（クレーター付き）と月の光
        T.glow(204, 22, 26, '#c8d0ff', 0.6);
        for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if (x * x + y * y <= 49) T.dot(204 + x, 22 + y, x + y > 5 ? '#d8cfa8' : '#f6eccc');
        T.rect(201, 18, 2, 2, '#e0d6b0'); T.rect(206, 24, 3, 2, '#e0d6b0'); T.rect(205, 17, 1, 1, '#e0d6b0');
        // 遠い山（2段）
        T.ridge(r, 78, 5, '#1d1b42', 2, '#2a2856');
        T.ridge(r, 92, 4, '#16163a', 2, '#20204a');
        // 森のシルエット
        for (let x = -4; x < W + 8; x += 7 + Math.floor(r() * 6)) pine(T, x, 112, 18 + r() * 16, '#0e1426', '#18203a');
        // 地面と草
        T.vgrad(110, H, ['#16201c', '#121a16', '#0e1410']);
        for (let x = 0; x < W; x += 2) { const h = 1 + Math.floor(r() * 3); T.rect(x, 110 - h, 1, h, r() < 0.5 ? '#1e2e24' : '#26382a'); }
        T.speckle(r, 0, 114, W, 30, ['#1a261e', '#0c120e', '#202e22'], 260);
        // 小道
        for (let y = 118; y < H; y++) { const w = 10 + (y - 118) * 1.4; T.rect(140 - w / 2 + (y - 118) * 0.6, y, w, 1, y % 3 ? '#2a2620' : '#24201a'); }
        // テント（縞と影）
        for (let i = 0; i < 26; i++) {
          const w = 54 - i * 2, x = 30 + i;
          for (let k = 0; k < w; k++) T.dot(x + k, 112 - i, k < w / 2 ? (Math.floor((x + k) / 4) % 2 ? '#8a4c34' : '#7a4230') : (Math.floor((x + k) / 4) % 2 ? '#5e3424' : '#52301f'));
        }
        T.rect(54, 90, 6, 22, '#1c0e08'); T.rect(55, 92, 4, 20, '#2a160c');
        T.rect(56, 86, 2, 4, '#3a2418'); T.rect(56, 82, 1, 4, '#c8b080');
        // たき火の薪と石
        for (const [x, c] of [[128, '#4a4650'], [134, '#5a5660'], [146, '#4a4650'], [152, '#5a5660']]) T.rect(x, 112, 5, 3, c);
        T.rect(132, 110, 18, 2, '#5a3a22'); T.rect(134, 108, 14, 2, '#4a2e1a');
        // 丸太の椅子
        T.rect(94, 110, 18, 5, '#5a3a22'); T.rect(94, 110, 18, 1, '#7a5232'); T.rect(94, 110, 2, 5, '#8a6a48');
        T.rect(170, 112, 16, 4, '#5a3a22'); T.rect(170, 112, 16, 1, '#7a5232');
      },
      anim(T, t, s) {
        twinkle(T, s.stars, t, '#151a44');
        T.glow(141, 104, 34 + (t % 3), '#ffa040', 0.9);
        flame(T, 141, 108, 14, t);
        // 火の粉
        for (let i = 0; i < 4; i++) { const k = (t * 3 + i * 7) % 28; T.dot(138 + ((i * 5 + t) % 8), 96 - k, k < 14 ? '#ffd27a' : '#ff8a3a'); }
      }
    },
    // 岩窟の洞
    cave: {
      base(T, r, s) {
        T.vgrad(0, 104, ['#120e0b', '#1a1510', '#211a14', '#2a2119']);
        // 岩肌（ブロック状の質感）
        for (let i = 0; i < 160; i++) {
          const x = r() * W, y = r() * 100, w = 4 + r() * 12, h = 2 + r() * 5;
          T.rect(x, y, w, h, r() < 0.5 ? '#2c241b' : '#16110d');
          T.rect(x, y, w, 1, '#3a3024');
        }
        T.speckle(r, 0, 0, W, 104, ['#3e3226', '#0c0907', '#2a2018'], 500);
        // つらら石
        for (let x = 0; x < W; x += 8 + Math.floor(r() * 10)) {
          const h = 6 + r() * 20;
          for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round((1 - i / h) * 5)); T.rect(x - w / 2, i, w, 1, i % 4 ? '#0e0b09' : '#1a1410'); }
        }
        // 奥の暗い通路（ごつごつした穴。中ほど暗い）
        for (let y = 46; y < 104; y++) {
          const k = (y - 46) / 58, w = 22 + Math.sqrt(k) * 30 + (r() - 0.5) * 4;
          T.rect(128 - w / 2, y, w, 1, '#120d0a');
          T.rect(128 - w / 2 + 3, y, w - 6, 1, '#0a0708');
          T.rect(128 - w / 2 + 7, y, Math.max(0, w - 14), 1, '#050306');
        }
        // 床
        T.vgrad(104, H, ['#2e251b', '#261e16', '#1c1610']);
        T.rect(0, 104, W, 1, '#4a3c2c');
        for (let i = 0; i < 70; i++) { const x = r() * W, y = 106 + r() * 36; T.rect(x, y, 2 + r() * 4, 1 + r() * 2, '#3a2e22'); T.dot(x, y, '#4e3f2e'); }
        // 骨と宝石のかけら
        T.rect(60, 120, 8, 2, '#c8c0a8'); T.rect(59, 119, 2, 4, '#d8d0b8'); T.rect(67, 119, 2, 4, '#d8d0b8');
        for (const [x, y] of [[190, 108], [196, 112], [30, 114]]) { T.rect(x, y, 3, 3, '#5ac8e8'); T.dot(x, y, '#c8f4ff'); }
      },
      anim(T, t) {
        for (const [x, y] of [[36, 52], [220, 44]]) { T.glow(x, y - 4, 30 + (t % 2) * 2, '#ff9a3a', 0.9); torch(T, x, y, t + x); }
        // しずく
        const k = t % 24; if (k < 16) T.dot(84, 20 + k * 2, '#6a8aa8');
      }
    },
    // 囁きの森
    forest: {
      base(T, r, s) {
        T.vgrad(0, 108, ['#0a1814', '#0f221a', '#14301f', '#1b3c25']);
        // 奥から手前へ3層の木
        const layers = [['#123020', '#1a3e28', 10], ['#0d2418', '#153222', 7], ['#08180f', '#0e2216', 5]];
        layers.forEach(([c, hi, w], li) => {
          for (let x = -6; x < W; x += 18 + Math.floor(r() * 20)) {
            T.rect(x, 0, w, 112, c); T.rect(x, 0, 1, 112, hi);
            for (let i = 0; i < 9; i++) {
              const cx = x + w / 2 - 12 + r() * 24, cy = r() * 60, rw = 12 + r() * 16, rh = 6 + r() * 8;
              for (let y = 0; y < rh; y++) for (let xx = 0; xx < rw; xx++) {
                const dx = xx / rw - 0.5, dy = y / rh - 0.5;
                if (dx * dx + dy * dy < 0.25) T.dot(cx - rw / 2 + xx, cy + y, dy < -0.25 && bayer(xx, y) < 0.5 ? hi : c);
              }
            }
          }
          if (li === 0) T.speckle(r, 0, 0, W, 100, ['#1e4a2c'], 200);
        });
        // 木漏れ日の筋（斜めのうすい光）
        T.ctx.globalAlpha = 0.07;
        for (const x0 of [60, 140, 196]) for (let y = 0; y < 108; y++) T.rect(x0 + y * 0.45, y, 10 + y * 0.08, 1, '#b8f0a0');
        T.ctx.globalAlpha = 1;
        // 地面・草・きのこ
        T.vgrad(108, H, ['#16301c', '#112616', '#0c1c10']);
        for (let x = 0; x < W; x++) { const h = 1 + Math.floor(r() * 4); T.rect(x, 109 - h, 1, h, r() < 0.4 ? '#2a5230' : '#1e4024'); }
        T.speckle(r, 0, 112, W, 32, ['#1e3a22', '#0a160c', '#2a4a2a'], 300);
        for (const [x, y, c] of [[40, 118, '#c84a3a'], [44, 120, '#c84a3a'], [210, 116, '#d8a84a']]) { T.rect(x, y, 4, 2, c); T.dot(x + 1, y, '#ffe0c0'); T.rect(x + 1, y + 2, 2, 3, '#e8dcc0'); }
      },
      anim(T, t, s) {
        // ほたる
        for (let i = 0; i < 9; i++) {
          const x = (i * 37 + Math.sin((t + i * 5) * 0.3) * 10 + t * (i % 2 ? 0.6 : -0.4)) % W;
          const y = 40 + (i * 23) % 60 + Math.sin((t + i) * 0.5) * 4;
          if ((t + i * 3) % 12 < 9) { T.glow((x + W) % W, y, 5, '#c8f08a', 1); T.dot((x + W) % W, y, '#f0ffc0'); }
        }
      }
    },
    // 霧の沼
    marsh: {
      base(T, r, s) {
        T.vgrad(0, 100, ['#121c1c', '#182826', '#20322e', '#2a3c36', '#34463e']);
        // 遠くの木々の影
        T.ridge(r, 84, 3, '#1a2a28', 2, '#22342f');
        // 枯れ木（ねじれた幹と、先の細い枝）
        const branch = (x, y, dx, dy, len, w) => {
          for (let i = 0; i < len; i++) {
            const k = i / len;
            T.rect(x + dx * i + Math.sin(i * 0.7) * 0.8, y + dy * i, Math.max(1, Math.round(w * (1 - k))), Math.max(1, Math.round(w * (1 - k))), '#0b1311');
            if (i === Math.floor(len * 0.6) && len > 8) branch(x + dx * i, y + dy * i, dx * 0.4 + (dx > 0 ? 0.5 : -0.5), dy - 0.3, len * 0.45, Math.max(1, w * 0.5));
          }
        };
        for (const [x, h] of [[24, 70], [92, 52], [192, 64], [238, 76]]) {
          for (let i = 0; i < h; i++) { const w = 3 + (i < 8 ? (8 - i) * 0.6 : 0); T.rect(x + Math.sin(i * 0.12) * 2 - w / 2, 102 - i, w, 1, '#0b1311'); }
          const top = 102 - h, sx = x + Math.sin(h * 0.12) * 2;
          branch(sx, top + 14, -0.9, -0.5, 16, 2); branch(sx, top + 6, 0.9, -0.6, 14, 2); branch(sx, top + 26, 0.9, -0.3, 10, 2); branch(sx, top, -0.3, -1, 8, 2);
        }
        // 葦
        for (let x = 0; x < W; x += 3 + Math.floor(r() * 5)) { const h = 6 + r() * 12; T.rect(x, 100 - h, 1, h, '#1a2c24'); if (r() < 0.4) T.rect(x, 100 - h - 3, 1, 3, '#4a3a22'); }
        // 水面
        T.vgrad(100, H, ['#183430', '#14302c', '#0f2622']);
        for (let i = 0; i < 70; i++) T.rect(r() * W, 102 + r() * 40, 6 + r() * 16, 1, '#245048');
        // 蓮の葉
        for (const [x, y] of [[60, 120], [150, 130], [210, 112]]) { T.rect(x, y, 10, 3, '#2a5a3a'); T.rect(x + 1, y, 8, 1, '#3a7a4a'); T.rect(x + 4, y, 2, 2, '#14302c'); }
      },
      anim(T, t) {
        // 水面のきらめき
        for (let i = 0; i < 12; i++) { const x = (i * 41 + t * 2) % W, y = 104 + (i * 13) % 38; T.rect(x, y, 3, 1, '#4a8a7a'); }
        // 流れる霧
        for (let k = 0; k < 4; k++) {
          const y = 58 + k * 11, off = ((t * (k % 2 ? 1 : -1) * 1.5 + k * 50) % W + W) % W;
          for (let x = -W; x < W; x += 96) T.haze(x + off, y, 80, 8, '#b8d0c8', 0.22);
        }
        // 鬼火
        for (let i = 0; i < 4; i++) {
          const x = 40 + i * 58 + Math.sin((t + i * 4) * 0.4) * 6, y = 56 + Math.sin((t + i * 7) * 0.3) * 8 + (i % 2) * 14;
          T.glow(x, y, 9, '#7affc8', 1); T.rect(x - 1, y - 1, 2, 2, '#d8fff0');
        }
      }
    },
    // 星降る遺跡
    ruins: {
      base(T, r, s) {
        T.vgrad(0, 108, ['#07071a', '#0d0d26', '#151434', '#1f1c44', '#2a2452']);
        s.stars = starField(T, r, 160, 92, ['#ffffff', '#ffe9a8', '#a8c8ff']);
        // 天の川
        for (let i = 0; i < 260; i++) { const k = r(); const x = k * W, y = 70 - k * 60 + (r() - 0.5) * 18; T.dot(x, y, r() < 0.5 ? '#3a3a6a' : '#5a5a8a'); }
        // 柱（れんがの目地・ひび・苔）
        for (const [x, h, broken] of [[18, 70, 1], [58, 44, 1], [184, 58, 1], [226, 82, 0]]) {
          const top = 108 - h;
          T.rect(x, top, 18, h, '#3a3648'); T.rect(x + 2, top, 4, h, '#4e4a5e'); T.rect(x + 15, top, 3, h, '#2a2636');
          for (let y = top + 6; y < 108; y += 8) T.rect(x, y, 18, 1, '#2a2636');
          if (!broken) { T.rect(x - 3, top - 4, 24, 5, '#4e4a5e'); T.rect(x - 3, top - 4, 24, 1, '#6a6680'); }
          else for (let k = 0; k < 18; k += 3) T.rect(x + k, top - (k % 6 ? 2 : 0), 3, 2, '#3a3648');
          T.rect(x + 8, top + 10, 1, 9, '#1c1a26'); T.rect(x + 9, top + 18, 1, 6, '#1c1a26');
          T.speckle(r, x, 100, 18, 8, ['#3a6a4a', '#2a5a3a'], 14);
        }
        // 崩れたアーチ
        for (let a = 0; a < Math.PI; a += 0.04) { const x = 120 + Math.cos(a) * 30, y = 70 - Math.sin(a) * 26; if (a < 2.2) T.rect(x, y, 6, 6, a % 0.3 < 0.04 ? '#2a2636' : '#3a3648'); }
        T.rect(146, 70, 8, 38, '#3a3648'); T.rect(148, 70, 2, 38, '#4e4a5e');
        // 床石
        T.vgrad(108, H, ['#26222e', '#201c28', '#1a1722']);
        for (let y = 110; y < H; y += 7) for (let x = (y % 14 ? 0 : 8); x < W; x += 16) { T.rect(x, y, 1, 6, '#14121a'); T.rect(x, y + 6, 16, 1, '#14121a'); }
      },
      anim(T, t, s) {
        twinkle(T, s.stars, t, '#151434');
        // 流れ星（ときどき）
        const k = t % 40;
        if (k < 6) { const x = 200 - k * 12, y = 10 + k * 5; for (let i = 0; i < 10; i++) T.dot(x + i, y - i / 2, i < 3 ? '#ffffff' : '#8ab0ff'); }
      }
    },
    // 螺旋の塔
    spiral: {
      base(T, r, s) {
        T.vgrad(0, H, ['#0a0418', '#120826', '#1c0e36', '#281444', '#36204e']);
        s.stars = starField(T, r, 170, 130, ['#ffffff', '#e8c8ff', '#ffe9a8']);
        T.glow(128, 30, 60, '#c8a0ff', 0.5);
        // 浮かぶ岩
        for (const [x, y, w] of [[30, 90, 26], [210, 70, 22], [60, 40, 12]]) {
          for (let i = 0; i < 8; i++) T.rect(x + i, y + i, w - i * 2, 1, i ? '#241a34' : '#3a2e50');
        }
        // 塔
        T.rect(100, 10, 56, 134, '#1a1228'); T.rect(104, 10, 6, 134, '#2a2040'); T.rect(148, 10, 8, 134, '#120c1c');
        for (let y = 14; y < H; y += 10) T.rect(100, y, 56, 1, '#140e20');
        T.rect(96, 6, 64, 6, '#2a2040'); T.rect(96, 6, 64, 1, '#4a3a68');
        for (let k = 0; k < 64; k += 8) T.rect(96 + k, 2, 4, 4, '#2a2040');
        s.windows = [];
        for (let y = 20; y < 140; y += 18) { s.windows.push([116, y], [136, y + 9]); T.rect(116, y, 5, 7, '#3a2a18'); T.rect(136, y + 9, 5, 7, '#3a2a18'); }
        // 巻きつく螺旋の階段（奥は暗く、手前は明るく）
        for (let i = 0; i < 400; i++) {
          const t = i / 400, a = t * Math.PI * 6, y = 140 - t * 132;
          const x = 128 + Math.cos(a) * 40;
          const front = Math.sin(a);
          if (front > -0.15) T.rect(x - 4, y, 9, 2, front > 0.6 ? '#9a82c8' : front > 0.2 ? '#7a64a8' : '#4a3a6a');
        }
      },
      anim(T, t, s) {
        twinkle(T, s.stars, t, '#1c0e36');
        s.windows.forEach(([x, y], i) => T.rect(x, y, 5, 7, (t + i * 3) % 11 === 0 ? '#ffe8a8' : '#ffd27a'));
      }
    },
    // 灼熱の火山
    volcano: {
      base(T, r, s) {
        T.vgrad(0, 96, ['#1a0806', '#2a0c08', '#40140a', '#5a1e0c', '#7a2a10']);
        // 煙の雲
        for (let i = 0; i < 14; i++) T.haze(r() * W - 20, r() * 40, 60 + r() * 40, 10 + r() * 8, '#2a1410', 0.6);
        // 遠くの火山（頂上から溶岩）
        for (let y = 30; y < 100; y++) { const w = 20 + (y - 30) * 2.2; T.rect(170 - w / 2, y, w, 1, y % 4 ? '#2a120c' : '#24100a'); }
        for (let y = 30; y < 90; y++) { const x = 170 + Math.sin(y * 0.3) * 3 + (y - 30) * 0.3; T.rect(x, y, 2, 1, y % 3 ? '#ff6a1a' : '#ffb43a'); }
        T.glow(170, 30, 30, '#ff7a2a', 0.9);
        // 手前の岩場
        T.ridge(r, 100, 4, '#1a0c08', 2, '#3a1a10');
        T.vgrad(108, H, ['#24120c', '#1a0c08', '#120806']);
        for (let i = 0; i < 80; i++) { const x = r() * W, y = 110 + r() * 34; T.rect(x, y, 2 + r() * 5, 1 + r() * 2, '#2e180e'); }
        // 溶岩の川
        s.lava = [];
        for (let x = 0; x < W; x++) { const y = 124 + Math.round(Math.sin(x * 0.05) * 4); s.lava.push(y); T.rect(x, y, 1, 6, '#c83a10'); T.dot(x, y, '#ff7a1a'); }
      },
      anim(T, t, s) {
        // 溶岩の流れとゆらめき
        for (let x = 0; x < W; x++) if ((x + t * 2) % 9 < 3) T.rect(x, s.lava[x] + 1, 1, 2, (x + t) % 18 < 9 ? '#ffb43a' : '#ff8a2a');
        T.glow(128, 126, 70, '#ff6a1a', 0.5 + (t % 3) * 0.05);
        // 火の粉が舞い上がる
        for (let i = 0; i < 14; i++) { const k = (t * 2 + i * 11) % 120; T.dot((i * 37 + Math.sin((t + i) * 0.4) * 6 + W) % W, 130 - k, k < 60 ? '#ffd27a' : '#ff6a2a'); }
      }
    },
    // 氷晶の洞
    glacier: {
      base(T, r, s) {
        T.vgrad(0, 104, ['#0a1424', '#0e1e34', '#14284a', '#1a3458', '#20406a']);
        // 氷の壁（三角の結晶）
        for (let i = 0; i < 40; i++) {
          const x = r() * W, y = r() * 90, h = 8 + r() * 26, w = 3 + r() * 6;
          for (let k = 0; k < h; k++) { const ww = Math.max(1, Math.round(w * (1 - k / h))); T.rect(x - ww / 2, y + h - k, ww, 1, k % 3 ? '#2a5a8a' : '#3a6a9a'); }
          T.rect(x - 1, y + 2, 1, h - 4, '#6aa8d8');
        }
        // 天井の氷柱
        for (let x = 0; x < W; x += 6 + Math.floor(r() * 8)) {
          const h = 6 + r() * 22;
          for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round((1 - i / h) * 4)); T.rect(x - w / 2, i, w, 1, i % 4 ? '#8ac8f0' : '#bfe8ff'); }
        }
        // 大きな結晶
        s.crystals = [[40, 70, 14], [214, 64, 18], [120, 80, 10]];
        for (const [cx, cy, sz] of s.crystals) {
          for (let k = 0; k < sz * 2; k++) { const w = Math.round(sz * 0.6 * (1 - Math.abs(k - sz) / sz)); T.rect(cx - w, cy - sz + k, w * 2, 1, k < sz ? '#8ae0ff' : '#4aa8e0'); }
          T.rect(cx - 1, cy - sz + 2, 1, sz * 2 - 4, '#e8faff');
        }
        // 床（雪と氷）
        T.vgrad(104, H, ['#c8dcf0', '#a8c4e0', '#88a8cc']);
        for (let i = 0; i < 90; i++) T.rect(r() * W, 106 + r() * 38, 2 + r() * 6, 1, '#e8f4ff');
        T.rect(0, 104, W, 1, '#e8f8ff');
      },
      anim(T, t, s) {
        // 結晶のきらめき
        s.crystals.forEach(([cx, cy, sz], i) => { const k = (t + i * 5) % 14; if (k < 4) { T.glow(cx, cy, sz + 6, '#bff0ff', 0.6); T.dot(cx + 2, cy - sz / 2 + k * 2, '#ffffff'); } });
        // 舞う粉雪
        for (let i = 0; i < 24; i++) { const y = (t * 1.5 + i * 13) % 104; T.dot((i * 41 + Math.sin((t + i * 3) * 0.3) * 4 + W) % W, y, '#e8f8ff'); }
      }
    },
    // 天空の庭
    skygarden: {
      base(T, r, s) {
        T.vgrad(0, H, ['#3a7ac8', '#5a96d8', '#7ab0e4', '#a0c8ec', '#c8e0f4']);
        // 雲
        for (let i = 0; i < 10; i++) T.haze(r() * W - 30, 20 + r() * 70, 70 + r() * 50, 14 + r() * 10, '#ffffff', 0.9);
        // 浮島（草と土、下にたれる根）
        s.isles = [[50, 70, 46], [190, 56, 56], [128, 104, 90]];
        for (const [cx, cy, w] of s.isles) {
          T.rect(cx - w / 2, cy, w, 4, '#5ab04a'); T.rect(cx - w / 2, cy, w, 1, '#8ad86a');
          for (let k = 0; k < w / 3; k++) { const ww = w - k * 6; if (ww <= 0) break; T.rect(cx - ww / 2, cy + 4 + k * 2, ww, 2, k % 2 ? '#8a6a4a' : '#7a5a3a'); }
          for (let i = 0; i < w / 6; i++) T.rect(cx - w / 2 + 3 + i * 6, cy + 6 + (i % 3) * 3, 1, 6 + (i % 4) * 2, '#5a4a3a');
        }
        // 神殿の柱と木
        for (const x of [176, 186, 204]) { T.rect(x, 34, 5, 22, '#f0ece0'); T.rect(x, 34, 1, 22, '#ffffff'); T.rect(x - 1, 32, 7, 2, '#d8d0c0'); }
        T.rect(172, 30, 40, 3, '#e8e0d0');
        for (let i = 0; i < 20; i++) { const a = r() * Math.PI * 2, d = r() * 10; T.rect(50 + Math.cos(a) * d * 1.4, 56 + Math.sin(a) * d * 0.8, 3, 2, i % 3 ? '#4a9a3a' : '#7ac85a'); }
        T.rect(49, 60, 2, 10, '#6a4a2a');
      },
      anim(T, t, s) {
        // 流れる雲（手前）
        for (let k = 0; k < 3; k++) { const x = ((t * (k + 1) * 1.2 + k * 90) % (W + 120)) - 120; T.haze(x, 90 + k * 16, 100, 12, '#ffffff', 0.7); }
        // 飛ぶ鳥
        for (let i = 0; i < 3; i++) { const x = ((t * 3 + i * 70) % (W + 20)) - 10, y = 20 + i * 9 + Math.sin((t + i) * 0.6) * 2; const up = (t + i) % 4 < 2; T.dot(x - 1, y + (up ? -1 : 1), '#2a3a5a'); T.dot(x, y, '#2a3a5a'); T.dot(x + 1, y + (up ? -1 : 1), '#2a3a5a'); }
      }
    },
    // 深淵の城
    abyss: {
      base(T, r, s) {
        T.vgrad(0, 108, ['#06040c', '#0c0818', '#140c24', '#1c1030', '#26143c']);
        // 赤い月
        T.glow(60, 26, 30, '#c83a4a', 0.7);
        for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 81) T.dot(60 + x, 26 + y, x + y > 6 ? '#8a1a2a' : '#c83a4a');
        // 城のシルエット（塔と窓）
        const tower = (x, w, h) => {
          T.rect(x, 108 - h, w, h, '#0e0a16');
          for (let k = 0; k < w; k += 4) T.rect(x + k, 108 - h - 3, 2, 3, '#0e0a16');
          T.rect(x - 2, 108 - h - 10, w + 4, 2, '#0e0a16');
          for (let y = 0; y < 8; y++) T.rect(x + w / 2 - 4 + y / 2, 108 - h - 18 + y, 8 - y, 1, '#0e0a16');
        };
        tower(120, 22, 78); tower(150, 16, 58); tower(96, 16, 54); tower(184, 12, 44); tower(70, 12, 40);
        T.rect(66, 76, 136, 32, '#0e0a16');
        s.windows = [];
        for (const [x, y] of [[128, 44], [136, 56], [154, 62], [100, 66], [186, 74], [130, 70], [110, 86], [160, 86]]) { s.windows.push([x, y]); T.rect(x, y, 3, 5, '#5a1a2a'); }
        // コウモリの影
        for (let i = 0; i < 6; i++) { const x = 20 + r() * 220, y = 10 + r() * 40; T.rect(x - 2, y, 5, 1, '#1a1024'); T.dot(x, y + 1, '#1a1024'); }
        // 床（石畳と霧）
        T.vgrad(108, H, ['#1a1222', '#140e1c', '#0e0a14']);
        for (let y = 110; y < H; y += 6) for (let x = (y % 12 ? 0 : 6); x < W; x += 12) T.rect(x, y, 1, 5, '#0a0710');
      },
      anim(T, t, s) {
        s.windows.forEach(([x, y], i) => T.rect(x, y, 3, 5, (t + i * 5) % 13 < 2 ? '#ff6a5a' : '#c83a4a'));
        // 低くたれこめる紫の霧
        for (let k = 0; k < 3; k++) { const off = ((t * (k % 2 ? 1 : -1) + k * 60) % W + W) % W; for (let x = -W; x < W; x += 90) T.haze(x + off, 112 + k * 9, 76, 8, '#6a3a9a', 0.35); }
      }
    },
    // 鉱石の坑道（木の支柱・線路・ランタン・壁の鉱石）
    mine: {
      base(T, r, s) {
        T.vgrad(0, 104, ['#14100c', '#1c1610', '#241c14', '#2c2218']);
        T.speckle(r, 0, 0, W, 104, ['#3a2e22', '#100c08', '#2a2018'], 600);
        // 壁の鉱石（色つきの粒）
        for (let i = 0; i < 40; i++) { const x = r() * W, y = 10 + r() * 86, c = ['#c87a3a', '#9aa4b8', '#5ac8e8', '#e8c25a'][Math.floor(r() * 4)]; T.rect(x, y, 2, 2, c); T.dot(x, y, '#ffffff'); }
        // 木の支柱と梁
        for (const x of [30, 128, 226]) { T.rect(x - 4, 20, 8, 84, '#5a3a20'); T.rect(x - 4, 20, 2, 84, '#7a5230'); }
        T.rect(0, 18, W, 8, '#5a3a20'); T.rect(0, 18, W, 2, '#7a5230');
        s.lamps = [[60, 30], [196, 30]];
        for (const [x, y] of s.lamps) { T.rect(x, y - 4, 1, 4, '#3a2a1a'); T.rect(x - 3, y, 7, 8, '#3a3e48'); }
        // 床と線路
        T.vgrad(104, H, ['#2e241a', '#261e16', '#1c1610']);
        for (let x = 0; x < W; x += 10) T.rect(x, 120, 6, 3, '#4a3420');
        T.rect(0, 118, W, 2, '#8a8e98'); T.rect(0, 124, W, 2, '#8a8e98');
        // トロッコ
        T.rect(150, 104, 34, 14, '#4a4e58'); T.rect(150, 104, 34, 2, '#6a6e78'); T.rect(154, 98, 26, 6, '#c87a3a'); T.dot(160, 99, '#ffd27a'); T.dot(170, 100, '#9aa4b8');
        T.rect(154, 116, 6, 6, '#24262e'); T.rect(174, 116, 6, 6, '#24262e');
      },
      anim(T, t, s) {
        s.lamps.forEach(([x, y], i) => { T.glow(x, y + 4, 26 + ((t + i) % 3), '#ffb04a', 0.9); T.rect(x - 2, y + 1, 5, 6, (t + i) % 4 ? '#ffd27a' : '#fff0b0'); });
      }
    },
    // 繭の洞（白い繭と糸）
    cocoon: {
      base(T, r, s) {
        T.vgrad(0, 104, ['#14101c', '#1c1626', '#241c30', '#2c2238']);
        // 糸の網
        for (let i = 0; i < 26; i++) { const x0 = r() * W, y0 = r() * 40, x1 = r() * W, y1 = 30 + r() * 70; for (let k = 0; k <= 40; k++) T.dot(x0 + (x1 - x0) * k / 40, y0 + (y1 - y0) * k / 40 + Math.sin(k / 6) * 2, '#5a5070'); }
        // ぶら下がる繭
        s.cocoons = [];
        for (const [x, len] of [[34, 30], [86, 46], [150, 24], [204, 40], [240, 18]]) {
          T.rect(x, 0, 1, len, '#8a8098');
          for (let y = 0; y < 18; y++) { const w = Math.round(Math.sin(y / 17 * Math.PI) * 6); T.rect(x - w, len + y, w * 2 + 1, 1, y < 6 ? '#f4f0e6' : '#d8d0c8'); }
          s.cocoons.push([x, len + 9]);
        }
        T.vgrad(104, H, ['#2a2234', '#221c2c', '#1a1422']);
        for (let i = 0; i < 50; i++) T.rect(r() * W, 106 + r() * 36, 4 + r() * 8, 1, '#3a3048');
      },
      anim(T, t, s) {
        s.cocoons.forEach(([x, y], i) => { if ((t + i * 4) % 16 < 3) T.glow(x, y, 12, '#e8d0ff', 0.7); });
        for (let i = 0; i < 10; i++) { const y = (t * 0.8 + i * 23) % 104; T.dot((i * 47 + Math.sin((t + i) * 0.3) * 5 + W) % W, y, '#e8e0f4'); }
      }
    },
    // 宝物庫（金貨の山と宝箱）
    vault: {
      base(T, r, s) {
        for (let y = 0; y < 104; y += 8) for (let x = (y % 16 ? 0 : 8); x < W; x += 16) { T.rect(x, y, 15, 7, '#2a2230'); T.rect(x, y, 15, 1, '#3a3044'); }
        // 柱
        for (const x of [20, 236]) { T.rect(x - 8, 0, 16, 104, '#3a3044'); T.rect(x - 8, 0, 3, 104, '#5a4a66'); T.rect(x - 10, 96, 20, 8, '#4a3e56'); }
        // 金貨の山
        s.coins = [];
        for (const [cx, w, h] of [[70, 70, 22], [180, 90, 30], [128, 50, 14]]) {
          for (let y = 0; y < h; y++) { const ww = w * (1 - y / h); T.rect(cx - ww / 2, 104 - y, ww, 1, y % 3 ? '#c9a24a' : '#e8c25a'); }
          for (let i = 0; i < w / 3; i++) { const x = cx - w / 2 + r() * w, y = 104 - r() * h * 0.8; s.coins.push([x, y]); T.dot(x, y, '#fff2a8'); }
        }
        // 宝箱
        T.rect(110, 82, 36, 22, '#8a5a2a'); T.rect(110, 82, 36, 3, '#a87a3a'); T.rect(126, 82, 4, 22, '#e8c25a'); T.rect(110, 92, 36, 2, '#e8c25a');
        T.vgrad(104, H, ['#3a2e1a', '#2a2214', '#1c160e']);
        for (let i = 0; i < 60; i++) T.dot(r() * W, 106 + r() * 38, r() < 0.5 ? '#e8c25a' : '#8a6a2a');
      },
      anim(T, t, s) {
        // 金貨のきらめき
        s.coins.forEach(([x, y], i) => { if ((t + i * 3) % 19 === 0) { T.dot(x, y - 1, '#ffffff'); T.dot(x - 1, y, '#ffffff'); T.dot(x + 1, y, '#ffffff'); T.dot(x, y + 1, '#ffffff'); } });
        T.glow(128, 92, 34 + (t % 3), '#ffe07a', 0.5);
      }
    },
    // 闘技場（ボスラッシュ）
    arena: {
      base(T, r, s) {
        T.vgrad(0, 70, ['#1a0a10', '#2a1018', '#3a1820', '#4a2028']);
        // 観客席（段々）
        for (let k = 0; k < 6; k++) { const y = 40 + k * 8; T.rect(0, y, W, 8, k % 2 ? '#2a1a20' : '#24161c'); for (let x = (k * 5) % 9; x < W; x += 9) T.rect(x, y + 2, 3, 3, ['#4a3a40', '#3a2a30', '#5a4048'][(x + k) % 3]); }
        // 旗
        for (const x of [40, 128, 216]) { T.rect(x, 6, 2, 34, '#5a4a3a'); for (let y = 0; y < 14; y++) T.rect(x + 2, 8 + y, 14 - y, 1, '#a82a3a'); }
        // 砂の床
        T.vgrad(88, H, ['#8a6a4a', '#7a5a3a', '#6a4a2e']);
        T.rect(0, 88, W, 2, '#3a2a1a');
        T.speckle(r, 0, 90, W, 54, ['#9a7a54', '#6a4a2e', '#a88a62'], 400);
        s.torches = [[14, 70], [242, 70]];
      },
      anim(T, t, s) {
        for (const [x, y] of s.torches) { T.glow(x, y - 6, 28 + (t % 2) * 2, '#ff9a3a', 0.9); torch(T, x, y, t + x); }
      }
    },
    // 工房（生産）
    workshop: {
      base(T, r, s) {
        // 板壁
        for (let y = 0; y < 104; y += 10) {
          T.rect(0, y, W, 10, y % 20 ? '#2c2017' : '#33251a');
          T.rect(0, y, W, 1, '#1a120c');
          T.speckle(r, 0, y + 1, W, 9, ['#3a2a1e', '#241a12'], 90);
        }
        for (let x = 0; x < W; x += 30 + Math.floor(r() * 20)) { T.rect(x, 0, 1, 104, '#1a120c'); T.dot(x + 3, 4 + r() * 90, '#5a4636'); }
        // 棚と品物
        T.rect(14, 34, 84, 3, '#5a4028'); T.rect(14, 34, 84, 1, '#7a5a38'); T.rect(18, 37, 2, 6, '#3a2a1a'); T.rect(92, 37, 2, 6, '#3a2a1a');
        [['#6a7a8a', 10], ['#8a6a40', 12], ['#5a8a6a', 9], ['#a85a4a', 11], ['#c9a24a', 8], ['#5a6aa8', 12]].forEach(([c, h], i) => {
          T.rect(18 + i * 13, 34 - h, 9, h, c); T.rect(18 + i * 13, 34 - h, 9, 1, mix(c, '#ffffff', 0.35)); T.rect(25 + i * 13, 34 - h, 2, h, mix(c, '#000000', 0.3));
        });
        T.rect(160, 40, 84, 3, '#5a4028'); T.rect(160, 40, 84, 1, '#7a5a38');
        for (let i = 0; i < 5; i++) { T.rect(166 + i * 15, 26, 3, 14, '#8a8e98'); T.rect(164 + i * 15, 24, 7, 4, '#6a6e78'); }
        // 炉（レンガとアーチ）
        for (let y = 60; y < 104; y += 5) for (let x = 176 + (y % 10 ? 0 : 4); x < 244; x += 9) { T.rect(x, y, 8, 4, '#5a2e22'); T.rect(x, y, 8, 1, '#7a4030'); }
        for (let y = 76; y < 104; y++) { const w = 30 - Math.max(0, 84 - y) * 1.6; if (w > 0) T.rect(210 - w / 2, y, w, 1, '#120806'); }
        // 床
        T.vgrad(104, H, ['#241a12', '#1e160f', '#18110b']);
        for (let x = 0; x < W; x += 24) T.rect(x, 104, 1, 40, '#120c08');
        // 金床と作業台
        T.rect(104, 92, 40, 7, '#5a5e68'); T.rect(104, 92, 40, 2, '#8a8e98'); T.rect(98, 92, 8, 4, '#5a5e68');
        T.rect(114, 99, 20, 10, '#3a3e48'); T.rect(110, 109, 28, 4, '#2a2c34');
        T.rect(20, 96, 60, 5, '#6a4a2c'); T.rect(20, 96, 60, 1, '#8a6a44'); T.rect(24, 101, 4, 16, '#4a3420'); T.rect(72, 101, 4, 16, '#4a3420');
        T.rect(30, 92, 14, 4, '#c8b080'); T.rect(52, 90, 6, 6, '#8a6a40');
      },
      anim(T, t) {
        T.glow(210, 92, 46 + (t % 3) * 2, '#ff8a3a', 0.9);
        flame(T, 204, 104, 9, t); flame(T, 214, 104, 11, t + 3);
        // 金床の火花
        if (t % 10 < 3) for (let i = 0; i < 6; i++) T.dot(124 + (i - 3) * (2 + (t % 3)), 90 - (t % 10) * 3 - (i % 2) * 2, i % 2 ? '#ffe08a' : '#ff9a3a');
      }
    }
  };

  // ===== 動かす仕組み =====
  const bases = {};
  const live = new Set();
  let timer = null, tick = 0;
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw(item) {
    const { ctx, kind, state } = item;
    ctx.drawImage(bases[kind], 0, 0);
    const p = painters[kind];
    if (p.anim) { const T = tools(ctx); T.ctx = ctx; p.anim(T, tick, state); }
  }
  function loop() {
    tick++;
    for (const item of live) {
      if (!item.canvas.isConnected) { live.delete(item); continue; }
      draw(item);
    }
    if (!live.size) { clearInterval(timer); timer = null; }
  }

  function baseFor(kind) {
    if (!bases[kind]) {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      const state = {};
      if (ctx) {
        const seed = [...kind].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7);
        const T = tools(ctx); T.ctx = ctx;
        painters[kind].base(T, rng(seed), state);
      }
      bases[kind] = c;
      bases[kind].state = state;
    }
    return bases[kind];
  }

  // 場所の絵を canvas で返す（CSSで枠いっぱいに拡大）
  function backdrop(kind, extraClass) {
    // 専用の絵がない場所は、ダンジョンのデータの scene（別の場所の絵）を使う
    if (!painters[kind]) kind = (R.DATA.dungeons && R.DATA.dungeons[kind] && R.DATA.dungeons[kind].scene) || 'cave';
    if (!painters[kind]) kind = 'cave';
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.className = 'backdrop' + (extraClass ? ' ' + extraClass : '');
    c.setAttribute('aria-hidden', 'true');
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    const base = baseFor(kind);
    const item = { canvas: c, ctx, kind, state: base.state };
    draw(item);
    if (!reduceMotion && painters[kind].anim) {
      live.add(item);
      if (!timer) timer = setInterval(loop, 1000 / FPS);
    }
    return c;
  }

  R.UI = R.UI || {};
  R.UI.backdrop = backdrop;
  R.UI.BACKDROPS = Object.keys(painters);
})(globalThis.RASEN = globalThis.RASEN || {});
