// index.html と読み込んでいる CSS・JS を 1 つの HTML ファイルにまとめる（配布・公開用）
//   使い方: node tools/build-single.js [出力先]   （既定: dist/rasen.html）
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.argv[2] || path.join(root, 'dist', 'rasen.html');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
// </script> がファイル内に出てきても壊れないようにする
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');

const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => read(m[1])).join('\n');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(m => `<script>/* ${m[1]} */\n${safe(read(m[1]))}\n</script>`).join('\n');
const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'ラセン'])[1];

const page = `<title>${title}</title>
<style>
:root { color-scheme: dark; }
${css}
</style>
<div id="app"></div>
${scripts}
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log('書き出しました: ' + out + ` (${Math.round(page.length / 1024)}KB)`);
