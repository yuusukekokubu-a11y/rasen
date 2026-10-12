// 生産・採集のレベル（ライフ）
(function (R) {
  const LIVES = {
    smith: '鍛冶', carpenter: '大工', tailor: '裁縫', jeweler: '細工', mining: '採掘', logging: '伐採'
  };

  function expToNext(lv) {
    const c = R.DATA.config.life;
    return c.expBase + c.expPerLv * lv;
  }

  // 経験値を足す。上がったレベル数を返す
  function addExp(life, amount) {
    const max = R.DATA.config.life.maxLv;
    let ups = 0;
    life.exp += Math.max(0, Math.round(amount));
    while (life.lv < max && life.exp >= expToNext(life.lv)) {
      life.exp -= expToNext(life.lv);
      life.lv++;
      ups++;
    }
    if (life.lv >= max) life.exp = 0;
    return ups;
  }

  function newLives() {
    const out = {};
    for (const k of Object.keys(LIVES)) out[k] = { lv: 1, exp: 0 };
    return out;
  }

  R.Life = { LIVES, expToNext, addExp, newLives };
})(globalThis.RASEN = globalThis.RASEN || {});
