# ラセン（試作版）

ファンタジーライフ風の「デッキ構築 × 生産」ゲームの試作です。
目的は **遊んでバランスを確かめること**。見た目より、ルールが正しく動くことを優先しています。

仕様の原本：https://docs.google.com/spreadsheets/d/1nT9QLBgmI99EcKGtK96eZO62cuup1pFtIVbov-dkM54/edit

## 遊び方

公開版：https://yuusukekokubu-a11y.github.io/rasen/ （GitHub Pages。このブランチに更新を送ると公開版も新しくなる）

1. このフォルダの `index.html` をブラウザ（Chrome など）で開く
   - インストールやサーバーは不要です
2. 拠点メニューから遊ぶ
   - **ダンジョン**：ダンジョン→ステージ（初級〜地獄級）→パーティを選んで出発。4階のボスを倒すとクリア
   - **装備**：付け替え（ステータスとデッキの変化を比較して選べる）
   - **生産**：鍛冶・大工・裁縫・細工で装備・道具・持ち込みアイテムを作る
   - **持ち物・ライフ**：素材や生産Lvの確認、セーブデータの消去
   - **練習戦闘**：今の装備で好きな敵と戦う（記録は残らない）
   - **シミュレーター**：自動対戦で勝率などを確認（持ち物画面の「テスト用の機能を表示」をオンにすると出る）

セーブはブラウザに自動保存されます（ブラウザの閲覧データを消すとセーブも消えます）。

## 作った範囲

1. 戦闘（6職・行動予告・パワー・付与効果18種）
2. 自動対戦シミュレーター
3. ダンジョンの周回（4つのダンジョンと解禁の流れ・4階・報酬3択・HP持ち越し・全滅で全喪失・採集ミニゲーム）
6. 進行：全ダンジョンクリア後の難易度段階（2〜5）とランク4装備、無限階層「螺旋の塔」
4. 生産（4つの生産ライフ・ランダム2枠・品質ミニゲーム・装備比較画面）
5. 残り3職（盗賊・弓使い・僧侶）・持ち込みアイテム・パワー解禁

作っていないもの：生産の固有スキル（仕様で検討中）、見た目（デザイン）の作り込み（進行要素の後に予定）

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
| `data/materials.js` | 素材 |
| `data/dungeons.js` | ダンジョンの構成・報酬・採集ミニゲームの数値 |
| `data/crafting.js` | 生産（品質ミニゲーム・ランダム枠の出やすさ・経験値） |
| `data/items.js` | 持ち込みアイテム |

仕様に書かれていなかったため仮で決めた内容は `DECISIONS.md` にまとめています。

## 開発者向け（Node.js がある場合）

```sh
npm test                                    # ルールのテスト
npm run sim                                 # 自動対戦シミュレーター（初期装備で全部の敵と）
node tools/simulate.js --list               # 使える装備セットと敵の一覧
node tools/simulate.js --preset rank2_plain --enc boss_golem --n 1000
node tools/simulate.js --dungeon forest     # ダンジョンを通しで自動周回してクリア率を見る（cave/forest/marsh/ruins/spiral）
node tools/simulate.js --dungeon cave --diff 3 --preset rank4_plain   # 難易度を指定
node tools/simulate.js --dungeon spiral --target 12                    # 塔：12階で帰還する想定
node tools/simulate.js --combos             # 全20通りのパーティを比べる
node tools/ui-smoke.js                      # 画面の動作確認（Playwright がある環境のみ）
```

外部ライブラリは使っていないので `npm install` は不要です。
