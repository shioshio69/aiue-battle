# あいうえバトル Online

身内同士でオンライン対戦できる「あいうえバトル」のWebアプリです。

## 技術構成

- **フロントエンド**: React + Vite
- **バックエンド**: Firebase（Anonymous Auth + Realtime Database）
- **ホスティング**: GitHub Pages

## セットアップ

### 1. 依存インストール

```bash
npm install
```

### 2. Firebase設定

[FIREBASE_SETUP.md](./FIREBASE_SETUP.md) を参照して Firebase プロジェクトを作成し、`src/firebase.js` の config を書き換えてください。

### 3. ローカル起動

```bash
npm run dev
```

### 4. デプロイ

```bash
npm run deploy
```

## ファイル構成

```
src/
├── firebase.js         # Firebase初期化・認証
├── constants.js        # 50音ボード定義・ゲーム定数
├── gameLogic.js        # 判定ロジック・ユーティリティ
├── roomService.js      # Firebase CRUD操作
├── App.jsx             # メインルーター
├── App.css             # スタイルシート
├── main.jsx            # エントリーポイント
├── index.css           # グローバルリセット
└── components/
    ├── TopPage.jsx      # トップ画面
    ├── RulesPage.jsx    # ルール説明
    ├── Lobby.jsx        # ロビー
    ├── TopicSetting.jsx # お題設定
    ├── WordInput.jsx    # 単語入力
    ├── BattleScreen.jsx # バトル画面
    └── ResultScreen.jsx # 結果画面
```

## ゲームの流れ

1. ルーム作成 → 友達にルームIDを共有
2. 全員集まったらホストが「ゲーム開始」
3. お題設定 → 各自単語を入力
4. 50音ボードから1文字ずつ攻撃！
5. 最後まで残った人が勝利！
