// 乱数（シード値を指定すると同じ結果を再現できる。シミュレーターやテストで使う）
(function (R) {
  function createRng(seed) {
    let s = (seed === undefined ? Math.floor(Math.random() * 2 ** 32) : seed) >>> 0;
    const next = function () {
      // mulberry32
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      // a以上b以下の整数
      int(a, b) { return a + Math.floor(next() * (b - a + 1)); },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      chance(p) { return next() < p; },
      shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      },
      // { key: 重み } から1つ選ぶ
      weighted(weights) {
        const entries = Object.entries(weights).filter(([, w]) => w > 0);
        const total = entries.reduce((a, [, w]) => a + w, 0);
        let r = next() * total;
        for (const [k, w] of entries) {
          r -= w;
          if (r < 0) return k;
        }
        return entries[entries.length - 1][0];
      }
    };
  }
  R.createRng = createRng;
})(globalThis.RASEN = globalThis.RASEN || {});
