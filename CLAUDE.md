# CLAUDE.md - あいうえバトル Online

## プロジェクト概要

「あいうえバトル」のオンライン対戦Webアプリ。身内同士でルームを作り、お題に沿ったひらがなの言葉を隠し、50音から1文字ずつ攻撃して相手の言葉を暴くワード推理ゲーム。

## 技術スタック

- **フロントエンド**: React + Vite
- **バックエンド**: Firebase (Anonymous Auth + Realtime Database)
- **ホスティング**: GitHub Pages
- **デプロイ**: gh-pages パッケージ（dist/ をpush）

## プロジェクト構成

```
aiue-battle/
├── CLAUDE.md                    # ← このファイル（Claude Code用プロジェクト説明）
├── README.md                    # プロジェクト概要
├── FIREBASE_SETUP.md            # Firebase設定手順書
├── docs/
│   ├── app-spec.md              # アプリ仕様書（確定版）
│   ├── rule-spec.md             # ゲームルール仕様書（確定版）
│   └── design-decisions.md      # 設計判断ログ
├── .claude/
│   └── agents/
│       ├── game-logic.md        # ゲームロジック改修用エージェント
│       ├── ui-design.md         # UI/UXデザイン改修用エージェント
│       └── firebase-debug.md    # Firebase連携デバッグ用エージェント
├── package.json
├── vite.config.js               # Vite設定（base path等）
├── index.html                   # HTMLエントリーポイント
├── public/                      # 静的アセット
└── src/
    ├── firebase.js              # Firebase初期化・匿名認証
    ├── constants.js             # 50音ボード定義・ゲーム定数・状態定義
    ├── gameLogic.js             # 純粋な判定ロジック（Firebase非依存）
    ├── roomService.js           # Firebase CRUD操作（全DB操作を集約）
    ├── App.jsx                  # メインルーター（statusベースの画面切替）
    ├── App.css                  # 全スタイル（単一CSSファイル）
    ├── main.jsx                 # Viteエントリーポイント
    ├── index.css                # グローバルリセット
    └── components/
        ├── TopPage.jsx          # トップ画面（ニックネーム・ルーム作成/参加）
        ├── RulesPage.jsx        # ルール説明画面
        ├── Lobby.jsx            # ロビー（参加者一覧・ゲーム開始）
        ├── TopicSetting.jsx     # お題設定画面
        ├── WordInput.jsx        # 単語入力（アプリ内50音キーボード）
        ├── BattleScreen.jsx     # バトル画面（50音ボード＋手札）
        └── ResultScreen.jsx     # 結果画面（順位・全単語公開）
```

## アーキテクチャ

### 状態管理
- グローバル状態はFirebase Realtime Databaseが真のソース
- `App.js` が `subscribeRoom()` でルーム全体をリアルタイムリッスン
- `room` オブジェクトをpropsで各画面コンポーネントに渡す
- 画面切替は `room.status` フィールド（"lobby" | "setting_topic" | "inputting" | "battle" | "result"）で決定
- React Router は未使用（useStateベースの画面遷移）

### ファイルの責務分離
- `constants.js` — 定数のみ。ロジックなし
- `gameLogic.js` — 純粋関数のみ。Firebase非依存。テスト可能
- `roomService.js` — 全Firebase操作を集約。コンポーネントから直接 `firebase/database` をimportしない
- `components/*.js` — UI表示とイベントハンドリングのみ。DB操作はApp.jsのコールバック経由

### データフロー
```
ユーザー操作 → Component → App.js handler → roomService → Firebase DB
                                                    ↓
Firebase DB → onValue listener → App.js setRoom → Component re-render
```

## ゲームルール（実装上の重要ポイント）

### 表記変換
- 濁点・半濁点を除去、小文字→大文字変換、長音（ー）はそのまま
- アプリ内50音キーボードにより変換ミスを構造的に防止（清音+ん+ーのみ）

### 攻撃判定
- クライアント側で全プレイヤーの `slots` を読み取り判定（身内利用で割り切り）
- 同じ文字が複数スロットにある場合は全てオープン
- 連続攻撃：他プレイヤーにヒット → もう1回（1手番最大2回）
- 自爆のみ（他プレイヤー無傷）→ 連続攻撃なし
- 自爆で自分が脱落 → 連続攻撃権が残っていても手番終了

### 勝利条件
- 残り1人で即ゲーム終了（連続攻撃途中でも打ち切り）
- 最後の1人は勝利確定（自爆しても脱落しない）
- 同時脱落 → 攻撃者が勝利

### お題設定者
- 初回：ランダム
- 2回目以降：前ゲームの最下位（最初に脱落した人）
- 最下位が退出済みなら残りからランダム

## コマンド

```bash
npm run dev        # ローカル開発サーバー起動（localhost:5173）
npm run build      # プロダクションビルド（dist/に出力）
npm run preview    # ビルド結果のプレビュー
npm run deploy     # GitHub Pagesにデプロイ（build → gh-pages push）
```

## Firebase設定

- `src/firebase.js` にconfigが入っている（APIキー等）
- Authentication: 匿名認証
- Realtime Database: セキュリティルールは `auth != null` で読み書き可（MVP）
- 詳細は `FIREBASE_SETUP.md` 参照

## 開発方針

- スマホ縦画面をメイン想定のレスポンシブデザイン
- CSS変数でテーマカラー管理（`App.css` の `:root`）
- フォント: M PLUS Rounded 1c（Google Fonts）
- ダーク系UI（var(--bg): #1a1a2e）

## 実装フェーズ

### Phase 1（MVP）✅ 完了
- 全画面（トップ〜結果）の基本実装
- Firebase連携（ルーム作成/参加/攻撃/次ゲーム）
- ルール説明画面

### Phase 2（改善）🔧 次にやること
- 攻撃アニメーション・SE
- 切断対応（onDisconnect）の強化
- レスポンシブ最適化
- ルームの自動削除

### Phase 3（追加機能）
- 戦績記録
- 英語モード
- 観戦モード
- カスタムお題リスト管理

## 注意事項

- `npm run deploy` 前に `package.json` の `homepage` を自分のGitHub PagesのURLに書き換えること
- ブラウザリロード = ルーム離脱になる（SPAルーティング未対応）
- GitHub PagesのドメインをFirebase Authenticationの承認済みドメインに追加すること
