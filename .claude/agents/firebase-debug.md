# Firebase Debug Agent

Firebase連携に関するデバッグ・改修を行うエージェント。

## 担当範囲

- `src/firebase.js` — Firebase初期化・認証
- `src/roomService.js` — 全Firebase CRUD操作
- Firebase Console上のセキュリティルール・DB構造

## Firebase構成

| サービス | 用途 | 設定場所 |
|----------|------|----------|
| Anonymous Auth | UID発行（ニックネームはクライアント管理） | firebase.js |
| Realtime Database | ルーム・ゲーム状態の同期 | roomService.js |

**使用していないサービス**: Firestore, Storage, Functions, Hosting

## DB構造（`/rooms/{roomId}/`）

```
status: "lobby" | "setting_topic" | "inputting" | "battle" | "result"
hostUid: string
topic: string | null
topicSetterUid: string | null
gameCount: number
turnIndex: number
turnAttackCount: number (0 or 1)
playerOrder: string[]
lastActivity: number (timestamp)
board/
  {char}: boolean (false=未使用, true=使用済み)
players/
  {uid}/
    name: string
    slots: string[] | null (8要素, 清音+✕)
    revealed: boolean[] (8要素)
    isEliminated: boolean
    eliminatedOrder: number | null
    inputReady: boolean
    isDisconnected: boolean
log/
  {index}: { uid, char, hits[], timestamp }
```

## セキュリティルール（MVP）

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

将来的に強化すべき点：
- `slots` の書き込みを本人のみに制限
- `status` の更新をホスト or 特定ロールに制限
- `board` の更新を手番プレイヤーに制限

## roomService.js の関数一覧

| 関数 | 用途 | 呼び出し元 |
|------|------|-----------|
| `createRoom(uid, name)` | ルーム作成 | App.js |
| `joinRoom(roomId, uid, name)` | ルーム参加 | App.js |
| `leaveRoom(roomId, uid, isHost)` | ルーム退出（ホストなら全削除） | App.js |
| `startGame(roomId)` | lobby → setting_topic | App.js |
| `setTopic(roomId, topic)` | setting_topic → inputting | App.js |
| `submitWord(roomId, uid, slots)` | 単語入力完了 | App.js |
| `checkAllReady(roomId)` | 全員入力完了チェック → battle | App.js |
| `executeAttack(roomId, char, attackerUid)` | 攻撃実行（最も複雑） | App.js |
| `nextGame(roomId)` | result → setting_topic（リセット処理） | App.js |
| `subscribeRoom(roomId, callback)` | リアルタイムリスナー登録 | App.js |

## よくある問題と対処

### 「ルームが存在しません」エラー
- ルームIDの大文字小文字が一致しているか
- ホストが退出してルームが削除されていないか
- Firebase Consoleで `/rooms/{roomId}` が存在するか確認

### 認証エラー（auth/unauthorized-domain）
- Firebase Console → Authentication → Settings → 承認済みドメイン
- `localhost` とGitHub Pagesのドメインがリストにあるか確認

### データが同期されない
- `firebase.js` の `databaseURL` が正しいか（asia-southeast1の場合URLが異なる）
- セキュリティルールで `.read` が許可されているか
- ブラウザのConsoleにFirebaseエラーが出ていないか

### onDisconnect が効かない
- `onDisconnect` はFirebase接続時に一度だけ設定される
- ブラウザを閉じた場合はFirebaseサーバー側でタイムアウト後（約60秒）に発火
- 手動の「退出」ボタンは `leaveRoom()` で即座に処理される

## デバッグ手順

1. **ブラウザのConsole** でFirebaseのエラーメッセージを確認
2. **Firebase Console → Realtime Database → データ** でDBの状態を直接確認・編集
3. **通常ウィンドウ + シークレットウィンドウ** で2プレイヤーをシミュレート
4. DB上のデータを手動で変更して画面の反応を確認
