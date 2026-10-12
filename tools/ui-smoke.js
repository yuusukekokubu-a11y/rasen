// 画面の動作確認（開発用）。Playwright（ブラウザ自動操作ツール）が入っている環境でだけ動く
//   使い方: node tools/ui-smoke.js
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.log('playwright が見つからないためスキップします'); process.exit(0);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  const steps = require('./ui-smoke-steps.js');
  for (const s of steps) {
    try { await s.run(page); console.log('OK  ', s.name); }
    catch (e) { errors.push(s.name + ': ' + e.message); console.log('FAIL', s.name, e.message); }
  }
  if (process.argv[2]) await page.screenshot({ path: process.argv[2], fullPage: true });
  await browser.close();
  if (errors.length) { console.log('エラー:\n' + errors.join('\n')); process.exit(1); }
  console.log('すべてOK');
})();
