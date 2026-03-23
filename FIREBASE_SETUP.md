# Firebase セットアップガイド

## 1. Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」→ プロジェクト名を入力（例：`aiue-battle`）
3. Google Analytics は OFF でOK → 「プロジェクトを作成」

## 2. Webアプリを登録

1. プロジェクトのトップ → 「ウェブ」アイコン（</>）をクリック
2. アプリのニックネーム：`aiue-battle-web`
3. 「Firebase Hosting を設定する」はチェック不要
4. 「アプリを登録」

表示される `firebaseConfig` の値を控えておく。

## 3. Authentication 設定

1. 左メニュー → 「Authentication」→「始める」
2. 「Sign-in method」タブ → 「匿名」をクリック
3. 「有効にする」をON → 「保存」

## 4. Realtime Database 設定

1. 左メニュー → 「Realtime Database」→「データベースを作成」
2. ロケーション：`asia-southeast1`（シンガポール）推奨
3. セキュリティルール：「テストモードで開始」を選択（後で書き換える）

### セキュリティルールを書き換え

「ルール」タブで以下に書き換えて「公開」：

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## 5. アプリにconfig反映

`src/firebase.js` の `firebaseConfig` を、手順2で取得した値に書き換える：

**注意：** `databaseURL` はRealtime Databaseの「データ」タブ上部に表示されるURLを使用。

## 6. 動作確認

```bash
npm start
```

ブラウザで `http://localhost:3000` を開き、以下を確認：
- トップ画面が表示される
- ニックネーム入力 → ルーム作成でロビーに遷移
- 別タブ/別ブラウザからルームIDで参加できる

## 7. GitHub Pages デプロイ

### 初回セットアップ

1. GitHubにリポジトリ `aiue-battle` を作成
2. `package.json` の `homepage` を自分のURLに書き換え：
   ```
   "homepage": "https://YOUR_USERNAME.github.io/aiue-battle"
   ```
3. デプロイ実行：
   ```bash
   git init
   git remote add origin https://github.com/YOUR_USERNAME/aiue-battle.git
   git add .
   git commit -m "initial commit"
   git push -u origin main
   npm run deploy
   ```
4. GitHub → リポジトリ → Settings → Pages → Source が `gh-pages` ブランチになっていることを確認

### 以降のデプロイ

```bash
git add .
git commit -m "update"
git push
npm run deploy
```
