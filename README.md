# ラセン（試作版）

ファンタジーライフ風の「デッキ構築 × 生産」ゲームの試作です。
目的は **遊んでバランスを確かめること**。見た目より、ルールが正しく動くことを優先しています。

仕様の原本：https://docs.google.com/spreadsheets/d/1nT9QLBgmI99EcKGtK96eZO62cuup1pFtIVbov-dkM54/edit

## 遊び方

1. このフォルダの `index.html` をブラウザ（Chrome など）で開く
   - インストールやサーバーは不要です
2. 拠点メニューから遊ぶ

## 数値の調整

数値はすべて `data/` フォルダにまとまっています。テキストエディタで書き換えて、ブラウザを再読み込みすると反映されます。

| ファイル | 中身 |
|---|---|
| `data/config.js` | エネルギー・手札枚数・状態異常の倍率・品質の倍率など全体の数値 |
| `data/cards.js` | カード（コスト・ダメージ・効果） |
| `data/powers.js` | パワー（戦闘終了まで続く効果） |
| `data/jobs.js` | 職業 |
| `data/equipment.js` | 装備（ランクごとのステータス・レシピ・道具） |
| `data/enchants.js` | 付与効果（ランダム枠） |
| `data/enemies.js` | 敵と戦闘の組み合わせ |
| `data/loadouts.js` | 初期装備・シミュレーター用の装備セット |

仕様に書かれていなかったため仮で決めた内容は `DECISIONS.md` にまとめています。

## 開発者向け（Node.js がある場合）

```sh
npm test        # ルールのテスト
npm run sim     # 自動対戦シミュレーター
```

外部ライブラリは使っていないので `npm install` は不要です。
