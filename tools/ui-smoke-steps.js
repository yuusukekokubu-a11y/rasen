// 画面確認の手順（tools/ui-smoke.js から使う）

// 生産のパズルを最後まで解く（空いているマスを順に押し、置けなければ回転・捨てる）
async function solvePuzzle(page) {
  for (let i = 0; i < 80 && !(await page.locator('button:text-is("もどる")').count()); i++) {
    if (await page.locator('button:has-text("完成品を見る")').count()) { await page.click('button:has-text("完成品を見る")'); continue; }
    const before = await page.locator('.bp-cell.filled').count();
    const open = await page.locator('.bp-cell.open').count();
    for (let k = 0; k < open; k++) {
      await page.click(`.bp-cell.open >> nth=${k}`);
      if ((await page.locator('.bp-cell.filled').count()) > before || await page.locator('button:has-text("完成品を見る")').count()) break;
    }
    if ((await page.locator('.bp-cell.filled').count()) === before && !(await page.locator('button:has-text("完成品を見る")').count())) {
      await page.click('button:has-text("捨てる")');
    }
  }
}

module.exports = [
  { name: '練習戦闘を開いて自動で戦う', run: async (page) => {
    await page.click('text=練習戦闘');
    await page.click('text=戦闘開始');
    await page.click('.hand .card >> nth=0');
    for (let i = 0; i < 40; i++) {
      if (await page.locator('text=次へ').count()) break;
      await page.click('text=おまかせ');
    }
    await page.click('text=次へ');
    await page.click('.back-btn');
  } }
];
module.exports.push(
  { name: 'シミュレーターを実行（テスト用の機能をオン）', run: async (page) => {
    await page.click('.menu-item:has-text("持ち物")');
    await page.check('#debug-toggle');
    await page.click('.back-btn');
    await page.click('text=シミュレーター');
    await page.fill('input[type=number] >> nth=0', '10');
    await page.press('input[type=number] >> nth=0', 'Tab');
    await page.click('text=実行');
    await page.waitForSelector('table');
    await page.click('.back-btn');
  } }
);
// ダンジョンを最後（クリアか全滅）まで自動で進める
async function playDungeon(page) {
  for (let i = 0; i < 600; i++) {
    const has = async (sel) => (await page.locator(sel).count()) > 0;
    if (await has('button:has-text("拠点へ")')) { await page.click('button:has-text("拠点へ")'); return; }
    if (await has('.modal button')) { await page.click('.modal button'); continue; }
    if (await has('button:has-text("次へ")')) { await page.click('button:has-text("次へ")'); continue; }
    if (await has('button:has-text("おまかせ")')) { await page.click('button:has-text("おまかせ")'); continue; }
    if (await has('button:has-text("戦う")')) { await page.click('button:has-text("戦う")'); continue; }
    if (await has('button:has-text("結果を見る")')) { await page.click('button:has-text("結果を見る")'); continue; }
    if (await has('.vein-cell.closed:not([disabled])')) { await page.click('.vein-cell.closed:not([disabled]) >> nth=0'); continue; }
    if (await has('.menu-item')) { await page.click('.menu-item >> nth=0'); continue; }
    await page.waitForTimeout(100);
  }
  throw new Error('ダンジョンが終わらない');
}
module.exports.playDungeon = playDungeon;
module.exports.solvePuzzle = solvePuzzle;
module.exports.push(
  { name: 'ダンジョンを最後まで進める', run: async (page) => {
    await page.click('.menu-item:has-text("ダンジョン")');
    await page.click('.dungeon-card.pick >> nth=0');
    await page.click('.stage-row >> nth=0');
    await page.click('button:has-text("出発")');
    await playDungeon(page);
    await page.waitForSelector('.home-hero');
  } },
  { name: '持ち物画面', run: async (page) => {
    await page.click('.menu-item:has-text("持ち物")');
    await page.waitForSelector('.life-tile');
    await page.click('.back-btn');
  } }
);
module.exports.push(
  { name: '生産：銅の剣を作って比較・装備', run: async (page) => {
    await page.click('text=生産');
    await page.click('.recipe:has-text("銅の剣") button:has-text("作る")');
    await solvePuzzle(page);
    await page.waitForSelector('.compare');
    await page.click('button:has-text("剣士に装備する")');
    await page.click('text=細工');
    await page.click('.back-btn');
  } },
  { name: '装備画面で付け替え', run: async (page) => {
    await page.click('.menu-item:has-text("装備")');
    await page.click('button:has-text("武器：")');
    const n = await page.locator('.row button:has-text("銅の剣")').count();
    if (n) {
      await page.click('.row button:has-text("銅の剣") >> nth=-1');
      await page.waitForSelector('.compare');
      await page.click('button:has-text("装備する")');
    }
    await page.click('.back-btn');
  } }
);
module.exports.push(
  { name: '盗賊・弓使い・僧侶で練習戦闘（選択肢の操作）', run: async (page) => {
    await page.click('.menu-item:has-text("練習戦闘")');
    // 職業はタイルを押して選ぶ
    const setJob = async (name, on) => {
      const tile = page.locator(`label.job-option:has(.job-name:text-is("${name}"))`);
      if ((await tile.locator('input').isChecked()) !== on) await tile.click();
    };
    for (const j of ['剣士', '魔法使い', '占星師']) await setJob(j, false);
    for (const j of ['盗賊', '弓使い', '僧侶']) await setJob(j, true);
    await page.click('text=戦闘開始');
    for (let i = 0; i < 400; i++) {
      if (await page.locator('button:has-text("次へ")').count()) break;
      if (await page.locator('.choice').count()) {
        const n = await page.locator('.choice .card').count();
        for (let k = 0; k < n; k++) await page.click(`.choice .card >> nth=${k}`);
        await page.click('.choice button:has-text("決定")');
        // 枚数が多すぎて決定できない場合は選び直す
        if (await page.locator('.choice').count()) {
          for (let k = 0; k < n; k++) if (await page.locator(`.choice .card.selected >> nth=0`).count()) await page.click('.choice .card.selected >> nth=0');
          await page.click('.choice .card >> nth=0');
          await page.click('.choice button:has-text("決定")');
        }
        continue;
      }
      const playable = page.locator('.hand .card:not(.disabled)');
      if (await playable.count()) { await playable.first().click(); continue; }
      await page.click('button:has-text("ターン終了")');
    }
    await page.click('button:has-text("次へ")');
    await page.click('.back-btn');
  } },
  { name: '細工：持ち込みアイテムのレシピ', run: async (page) => {
    await page.click('.menu-item:has-text("生産")');
    await page.click('button:has-text("細工")');
    await page.waitForSelector('text=回復薬');
    await page.click('.back-btn');
  } }
);
