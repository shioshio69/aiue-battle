# UI/UX Design Agent

UI・UX・デザインの改修を行うエージェント。

## 担当範囲

- `src/components/*.js` — 全画面コンポーネント
- `src/App.css` — 全スタイル（単一ファイルに集約）
- `public/index.html` — メタタグ、favicon等

## デザインシステム

### テーマカラー（`App.css` の `:root`）
```css
--bg: #1a1a2e          /* 背景（ダーク） */
--bg-card: #16213e     /* カード背景 */
--primary: #e94560     /* メインアクション（赤系） */
--primary-hover: #ff6b81
--secondary: #0f3460   /* セカンダリ（紺） */
--accent: #f5c518      /* アクセント（黄） */
--text: #eee           /* テキスト */
--text-muted: #8899aa  /* サブテキスト */
--success: #4ecdc4     /* 成功・完了（ティール） */
--danger: #e94560      /* エラー・脱落 */
```

### フォント
- M PLUS Rounded 1c（Google Fonts）
- ウェイト: 400（本文）、700（見出し・ボタン）、900（タイトル・強調）

### プレイヤーカラー（`constants.js`）
```
P1: #FF6B35（オレンジ）
P2: #4ECDC4（ティール）
P3: #FFE66D（イエロー）
P4: #A8E6CF（ミント）
P5: #FF8B94（ピンク）
P6: #B8A9C9（ラベンダー）
```

### レスポンシブ方針
- スマホ縦画面をメイン想定（max-width: 480px でブレークポイント）
- PC横画面では600px以上でバトル画面が横並びレイアウト
- 50音ボードはスマホでもタップしやすいサイズ確保（最小30px）

## 画面一覧と参考UI

| 画面 | コンポーネント | 状態 |
|------|-------------|------|
| トップ | TopPage.js | status未参加 |
| ルール | RulesPage.js | status未参加 |
| ロビー | Lobby.js | status=lobby |
| お題設定 | TopicSetting.js | status=setting_topic |
| 単語入力 | WordInput.js | status=inputting |
| バトル | BattleScreen.js | status=battle |
| 結果 | ResultScreen.js | status=result |

## バトル画面のレイアウト構成

```
┌─────────────────────────────────┐
│         お題バナー                │
├──────────────────────────────────┤
│  [プレイヤー手札]  [50音ボード]    │
│  (grid)          (grid)         │
├──────────────────────────────────┤
│         手番インジケーター          │
└─────────────────────────────────┘

スマホ: 縦並び（手札 → ボード → 手番）
PC:    横並び（左:手札 / 右:ボード）
```

## アニメーション

現在実装済み：
- `revealPop` — 手札オープン時のポップアニメーション
- `pulse` — 自分のターン表示の点滅
- `dotPulse` — 待機中のローディングドット

Phase 2で追加予定：
- 攻撃時のボード文字ハイライト演出
- 脱落時の演出
- ゲーム終了時の勝利演出
- SE（効果音）

## CSS設計ルール

- 全スタイルは `App.css` に集約（CSSモジュール未使用）
- クラス名は画面プレフィックス付き（例: `.battle-page`, `.result-card`）
- レイアウトはFlexbox/Grid（floatは使わない）
- アニメーションは `@keyframes` で定義
- メディアクエリは `App.css` 末尾にまとめて記述
