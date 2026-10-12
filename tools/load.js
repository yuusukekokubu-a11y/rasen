// Node.js からゲームのコードを読み込むための共通処理（シミュレーターとテストで使う）
// ブラウザと同じファイルを、index.html と同じ順番で読み込む
const path = require('path');
const fs = require('fs');

function loadGame() {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
    .map(m => m[1])
    .filter(f => !f.startsWith('src/ui/'));
  for (const f of files) require(path.join(root, f));
  return globalThis.RASEN;
}

module.exports = { loadGame };
