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
module.exports.push(
  { name: 'シミュレーターを実行', run: async (page) => {
    await page.click('text=シミュレーター');
    await page.fill('input[type=number] >> nth=0', '10');
    await page.press('input[type=number] >> nth=0', 'Tab');
    await page.click('text=実行');
    await page.waitForSelector('table');
    await page.click('text=もどる');
  } }
);
// ダンジョンを最後（クリアか全滅）まで自動で進める
async function playDungeon(page) {
  for (let i = 0; i < 600; i++) {
    const has = async (sel) => (await page.locator(sel).count()) > 0;
    if (await has('text=拠点へ戻る')) { await page.click('text=拠点へ戻る'); return; }
    if (await has('.modal button')) { await page.click('.modal button'); continue; }
    if (await has('button:has-text("次へ")')) { await page.click('button:has-text("次へ")'); continue; }
    if (await has('button:has-text("自動で1ターン")')) { await page.click('button:has-text("自動で1ターン")'); continue; }
    if (await has('button:has-text("戦う")')) { await page.click('button:has-text("戦う")'); continue; }
    if (await has('.minigame button:not([disabled])')) { await page.click('.minigame button'); continue; }
    if (await has('.menu-item')) { await page.click('.menu-item >> nth=0'); continue; }
    await page.waitForTimeout(100);
  }
  throw new Error('ダンジョンが終わらない');
}
module.exports.playDungeon = playDungeon;
module.exports.push(
  { name: 'ダンジョンを最後まで進める', run: async (page) => {
    await page.click('text=ダンジョンへ出発');
    await page.click('text=出発する');
    await playDungeon(page);
    await page.waitForSelector('text=拠点');
  } },
  { name: '持ち物画面', run: async (page) => {
    await page.click('text=持ち物・ライフ');
    await page.waitForSelector('text=ライフ（生産・採集のレベル）');
    await page.click('text=もどる');
  } }
);
module.exports.push(
  { name: '生産：銅の剣を作って比較・装備', run: async (page) => {
    await page.click('text=生産');
    await page.click('tr:has-text("銅の剣") button:has-text("作る")');
    for (let i = 0; i < 40 && !(await page.locator('text=生産画面に戻る').count()); i++) {
      if (await page.locator('.minigame button:not([disabled])').count()) await page.click('.minigame button');
      else await page.waitForTimeout(100);
    }
    await page.waitForSelector('text=デッキに入るカード');
    await page.click('button:has-text("剣士に装備する")');
    await page.click('text=細工');
    await page.click('text=もどる');
  } },
  { name: '装備画面で付け替え', run: async (page) => {
    await page.click('.menu-item:has-text("装備")');
    await page.click('button:has-text("武器：")');
    const n = await page.locator('h2:has-text("付け替え候補") + * button, .row button:has-text("銅の剣")').count();
    if (n) {
      await page.click('.row button:has-text("銅の剣") >> nth=-1');
      await page.waitForSelector('text=デッキから外れるカード');
      await page.click('button:has-text("装備する")');
    }
    await page.click('text=もどる');
  } }
);
module.exports.push(
  { name: '盗賊・弓使い・僧侶で練習戦闘（選択肢の操作）', run: async (page) => {
    await page.click('.menu-item:has-text("練習戦闘")');
    for (const j of ['剣士', '魔法使い', '占星師']) await page.uncheck(`label:has-text("${j}") input`);
    for (const j of ['盗賊', '弓使い', '僧侶']) await page.check(`label:has-text("${j}") input`);
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
    await page.click('text=もどる');
  } },
  { name: '細工：パワーの選択と持ち込みアイテムのレシピ', run: async (page) => {
    await page.click('.menu-item:has-text("生産")');
    await page.click('button:has-text("細工")');
    await page.waitForSelector('text=アクセサリーに乗せるパワー');
    await page.selectOption('select >> nth=0', 'priest');
    await page.waitForSelector('text=回復薬');
    await page.click('text=もどる');
  } }
);
