// 画面確認の手順（tools/ui-smoke.js から使う）
module.exports = [
  { name: '練習戦闘を開いて自動で戦う', run: async (page) => {
    await page.click('text=練習戦闘');
    await page.click('text=戦闘開始');
    await page.click('.hand .card >> nth=0');
    for (let i = 0; i < 40; i++) {
      if (await page.locator('text=次へ').count()) break;
      await page.click('text=自動で1ターン');
    }
    await page.click('text=次へ');
    await page.click('text=もどる');
  } }
];
