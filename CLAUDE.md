# このリポジトリで作業するときの約束

- 仕様の原本：https://docs.google.com/spreadsheets/d/1nT9QLBgmI99EcKGtK96eZO62cuup1pFtIVbov-dkM54/edit
- 仕様にないことは仮で決めてよいが、`DECISIONS.md` に記録する
- 数値はコードに直接書かず `data/` に置く
- 外部ライブラリは使わない（素のHTML/JavaScript）。文字は textContent で表示し、innerHTML は使わない
- **ゲーム内の説明文は最小限にする**。数字・ボタン名・見た目で伝わることは文章で説明しない。どうしても必要な説明は1行に収める
- 見た目（デザイン）の作り込みは、進行要素がそろって数値が落ち着いてから行う
- 変更したら `npm test` と `node tools/ui-smoke.js` を通してからコミットする
