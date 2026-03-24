import { ref, set, get, update, onValue, off, remove, onDisconnect } from 'firebase/database';
import { db } from './firebase';
import { STATUS, ALL_CHARS, SLOT_COUNT } from './constants';
import { generateRoomId, shuffle, emptyRevealed, emptyBoard, getLoser } from './gameLogic';

const roomRef = (roomId) => ref(db, `rooms/${roomId}`);
const playerRef = (roomId, uid) => ref(db, `rooms/${roomId}/players/${uid}`);

const STALE_ROOM_AGE_MS = 24 * 60 * 60 * 1000; // 24時間

// 古いルームを掃除（fire-and-forget）
export const cleanupStaleRooms = async () => {
  try {
    const snap = await get(ref(db, 'rooms'));
    if (!snap.exists()) return;
    const rooms = snap.val();
    let deleted = 0;
    const now = Date.now();
    for (const [id, room] of Object.entries(rooms)) {
      if (deleted >= 10) break; // 1回の掃除は最大10件
      if (room.lastActivity && now - room.lastActivity > STALE_ROOM_AGE_MS) {
        await remove(roomRef(id));
        deleted++;
      }
    }
  } catch (e) {
    console.error('cleanup error:', e);
  }
};

// ルーム作成
export const createRoom = async (uid, name) => {
  // 古いルームを非同期で掃除
  cleanupStaleRooms().catch(() => {});

  const roomId = generateRoomId();
  const existing = await get(roomRef(roomId));
  if (existing.exists()) return createRoom(uid, name); // 衝突時リトライ

  await set(roomRef(roomId), {
    status: STATUS.LOBBY,
    hostUid: uid,
    topic: null,
    topicSetterUid: null,
    gameCount: 0,
    turnIndex: 0,
    turnAttackCount: 0,
    playerOrder: [uid],
    lastActivity: Date.now(),
    board: emptyBoard(ALL_CHARS),
    players: {
      [uid]: {
        name,
        slots: null,
        revealed: emptyRevealed(),
        isEliminated: false,
        eliminatedOrder: null,
        inputReady: false,
        isDisconnected: false,
      },
    },
  });

  // 切断時フラグ設定
  const disconnRef = ref(db, `rooms/${roomId}/players/${uid}/isDisconnected`);
  onDisconnect(disconnRef).set(true);

  return roomId;
};

// ルーム参加（再接続対応: 同名の切断プレイヤーがいればデータ移行して復帰）
export const joinRoom = async (roomId, uid, name) => {
  const snap = await get(roomRef(roomId));
  if (!snap.exists()) throw new Error('ルームが存在しません');

  const room = snap.val();

  // 再接続チェック: 同名の切断中プレイヤーを探す
  const disconnectedEntry = Object.entries(room.players || {})
    .find(([, p]) => p.name === name && p.isDisconnected);

  if (disconnectedEntry) {
    const [oldUid, oldPlayer] = disconnectedEntry;

    // 同一UIDなら単純に復帰
    if (oldUid === uid) {
      await update(playerRef(roomId, uid), { isDisconnected: false });
      await update(roomRef(roomId), { lastActivity: Date.now() });
    } else {
      // 新UIDにデータ移行（アトミック更新）
      const updates = {};
      updates[`players/${uid}`] = { ...oldPlayer, isDisconnected: false };
      updates[`players/${oldUid}`] = null; // 旧エントリ削除

      // playerOrder の差し替え
      const newOrder = (room.playerOrder || []).map(id => id === oldUid ? uid : id);
      updates['playerOrder'] = newOrder;

      // ホスト・お題設定者の参照を更新
      if (room.hostUid === oldUid) updates['hostUid'] = uid;
      if (room.topicSetterUid === oldUid) updates['topicSetterUid'] = uid;

      updates['lastActivity'] = Date.now();
      await update(roomRef(roomId), updates);
    }

    // 切断時フラグ設定
    const disconnRef = ref(db, `rooms/${roomId}/players/${uid}/isDisconnected`);
    onDisconnect(disconnRef).set(true);
    return { reconnected: true };
  }

  // 通常の新規参加（ロビー時のみ）
  if (room.status !== STATUS.LOBBY) throw new Error('ゲーム中のため参加できません');

  const playerCount = room.players ? Object.keys(room.players).filter(id => !room.players[id].isDisconnected).length : 0;
  if (playerCount >= 6) throw new Error('ルームが満員です');

  await update(ref(db, `rooms/${roomId}/players/${uid}`), {
    name,
    slots: null,
    revealed: emptyRevealed(),
    isEliminated: false,
    eliminatedOrder: null,
    inputReady: false,
    isDisconnected: false,
  });

  // playerOrderに追加
  const newOrder = [...(room.playerOrder || []), uid];
  await update(roomRef(roomId), {
    playerOrder: newOrder,
    lastActivity: Date.now(),
  });

  // 切断時フラグ設定
  const disconnRef = ref(db, `rooms/${roomId}/players/${uid}/isDisconnected`);
  onDisconnect(disconnRef).set(true);
  return { reconnected: false };
};

// ルーム退出
export const leaveRoom = async (roomId, uid, isHost) => {
  if (isHost) {
    await remove(roomRef(roomId));
  } else {
    await remove(playerRef(roomId, uid));
    const snap = await get(roomRef(roomId));
    if (snap.exists()) {
      const room = snap.val();
      const newOrder = (room.playerOrder || []).filter(id => id !== uid);
      await update(roomRef(roomId), { playerOrder: newOrder });
    }
  }
};

// ゲーム開始（lobby → setting_topic）
export const startGame = async (roomId) => {
  const snap = await get(roomRef(roomId));
  const room = snap.val();
  const uids = Object.keys(room.players).filter(uid => !room.players[uid].isDisconnected);
  const shuffled = shuffle(uids);
  const topicSetter = shuffled[Math.floor(Math.random() * shuffled.length)];

  await update(roomRef(roomId), {
    status: STATUS.SETTING_TOPIC,
    topicSetterUid: topicSetter,
    gameCount: (room.gameCount || 0) + 1,
    playerOrder: shuffled,
    lastActivity: Date.now(),
  });
};

// お題設定
export const setTopic = async (roomId, topic) => {
  await update(roomRef(roomId), {
    status: STATUS.INPUTTING,
    topic,
    lastActivity: Date.now(),
  });
};

// 単語入力完了
export const submitWord = async (roomId, uid, slots) => {
  await update(playerRef(roomId, uid), {
    slots,
    revealed: emptyRevealed(),
    inputReady: true,
  });
};

// 全員入力完了チェック → battle開始
export const checkAllReady = async (roomId) => {
  const snap = await get(roomRef(roomId));
  const room = snap.val();
  if (!room || !room.players) return false;

  const activePlayers = Object.entries(room.players)
    .filter(([, p]) => !p.isDisconnected);

  const allReady = activePlayers.every(([, p]) => p.inputReady);
  if (allReady) {
    await update(roomRef(roomId), {
      status: STATUS.BATTLE,
      turnIndex: 0,
      turnAttackCount: 0,
      lastActivity: Date.now(),
    });
    return true;
  }
  return false;
};

// 攻撃実行
export const executeAttack = async (roomId, char, attackerUid) => {
  const snap = await get(roomRef(roomId));
  const room = snap.val();
  if (!room) return null;

  const updates = {};
  updates[`board/${char}`] = true;
  updates['lastAttackChar'] = char;
  updates['lastAttackTime'] = Date.now();
  // lastAttackHitsは判定後に設定

  let anyOtherHit = false;
  let attackerHit = false;
  let hitSlotCount = 0;
  const eliminatedThisTurn = [];

  // 勝利確定チェック：攻撃者以外に生存者がいるか
  const aliveOthers = Object.entries(room.players)
    .filter(([uid, p]) => uid !== attackerUid && !p.isEliminated && !p.isDisconnected);
  const attackerIsLastStanding = aliveOthers.length === 0;

  // 全プレイヤー判定
  Object.entries(room.players).forEach(([uid, player]) => {
    if (player.isEliminated || player.isDisconnected) return;
    if (!player.slots) return;

    const revealed = [...(player.revealed || emptyRevealed())];
    let playerHits = 0;

    for (let i = 0; i < SLOT_COUNT; i++) {
      if (player.slots[i] === char && !revealed[i]) {
        revealed[i] = true;
        playerHits++;
      }
    }

    if (playerHits > 0) {
      updates[`players/${uid}/revealed`] = revealed;
      hitSlotCount += playerHits;

      if (uid === attackerUid) {
        attackerHit = true;
      } else {
        anyOtherHit = true;
      }

      // 脱落判定（勝利確定状態の攻撃者は脱落しない）
      const isNowEliminated = revealed.every((r, i) =>
        player.slots[i] === '✕' || r
      );

      if (isNowEliminated && !(uid === attackerUid && attackerIsLastStanding)) {
        updates[`players/${uid}/isEliminated`] = true;
        // eliminatedOrder計算
        let maxOrder = 0;
        Object.values(room.players).forEach(p => {
          if (p.eliminatedOrder && p.eliminatedOrder > maxOrder) maxOrder = p.eliminatedOrder;
        });
        eliminatedThisTurn.forEach(e => {
          if (e.order > maxOrder) maxOrder = e.order;
        });
        const newOrder = maxOrder + 1;
        updates[`players/${uid}/eliminatedOrder`] = newOrder;
        eliminatedThisTurn.push({ uid, order: newOrder });
      }
    }
  });

  // 同時脱落は同じeliminatedOrderに
  if (eliminatedThisTurn.length > 1) {
    const minOrder = Math.min(...eliminatedThisTurn.map(e => e.order));
    eliminatedThisTurn.forEach(e => {
      updates[`players/${e.uid}/eliminatedOrder`] = minOrder;
    });
  }

  // 攻撃結果をFirebaseに保存
  updates['lastAttackHits'] = hitSlotCount;
  updates['lastAttackSelfHit'] = attackerHit;
  updates['lastAttackAnyOtherHit'] = anyOtherHit;

  // 攻撃者自身が脱落したかチェック
  const attackerEliminated = eliminatedThisTurn.some(e => e.uid === attackerUid);

  // 残り生存者数を計算（更新後）
  let aliveCount = 0;
  Object.entries(room.players).forEach(([uid, p]) => {
    if (p.isDisconnected) return;
    const willBeEliminated = eliminatedThisTurn.some(e => e.uid === uid);
    if (!p.isEliminated && !willBeEliminated) aliveCount++;
  });

  // ゲーム終了判定
  if (aliveCount <= 1) {
    updates['status'] = STATUS.RESULT;
    updates['lastActivity'] = Date.now();
    await update(roomRef(roomId), updates);
    return { gameOver: true, anyOtherHit, attackerHit, attackerEliminated };
  }

  // 連続攻撃判定
  const currentAttackCount = room.turnAttackCount || 0;
  let continueTurn = false;

  if (!attackerEliminated && anyOtherHit && currentAttackCount < 1) {
    // 1回目でヒット → もう1回
    updates['turnAttackCount'] = currentAttackCount + 1;
    continueTurn = true;
  } else {
    // 手番終了 → 次のプレイヤーへ
    const playerOrder = room.playerOrder || [];
    let nextIndex = (room.turnIndex + 1) % playerOrder.length;

    // 脱落・切断プレイヤーをスキップ
    let checked = 0;
    while (checked < playerOrder.length) {
      const nextUid = playerOrder[nextIndex];
      const nextPlayer = room.players[nextUid];
      const willBeEliminated = eliminatedThisTurn.some(e => e.uid === nextUid);
      if (nextPlayer && !nextPlayer.isEliminated && !willBeEliminated && !nextPlayer.isDisconnected) {
        break;
      }
      nextIndex = (nextIndex + 1) % playerOrder.length;
      checked++;
    }

    updates['turnIndex'] = nextIndex;
    updates['turnAttackCount'] = 0;
  }

  updates['lastActivity'] = Date.now();
  await update(roomRef(roomId), updates);

  return { gameOver: false, continueTurn, anyOtherHit, attackerHit, attackerEliminated };
};

// 次のゲームへ
export const nextGame = async (roomId) => {
  const snap = await get(roomRef(roomId));
  const room = snap.val();
  if (!room) return;

  const activePlayers = Object.entries(room.players)
    .filter(([, p]) => !p.isDisconnected);

  // お題設定者を決定（最下位 or ランダム）
  let topicSetter = getLoser(room.players);
  // 最下位が退出済みの場合はランダム
  if (!topicSetter || room.players[topicSetter]?.isDisconnected) {
    const activeUids = activePlayers.map(([uid]) => uid);
    topicSetter = activeUids[Math.floor(Math.random() * activeUids.length)];
  }

  const activeUids = activePlayers.map(([uid]) => uid);
  const shuffled = shuffle(activeUids);

  const updates = {
    status: STATUS.SETTING_TOPIC,
    topic: null,
    topicSetterUid: topicSetter,
    gameCount: (room.gameCount || 0) + 1,
    turnIndex: 0,
    turnAttackCount: 0,
    playerOrder: shuffled,
    lastActivity: Date.now(),
  };

  // ボードリセット
  ALL_CHARS.forEach(c => {
    updates[`board/${c}`] = false;
  });

  // 各プレイヤーリセット
  activePlayers.forEach(([uid]) => {
    updates[`players/${uid}/slots`] = null;
    updates[`players/${uid}/revealed`] = emptyRevealed();
    updates[`players/${uid}/isEliminated`] = false;
    updates[`players/${uid}/eliminatedOrder`] = null;
    updates[`players/${uid}/inputReady`] = false;
  });

  await update(roomRef(roomId), updates);
};

// ゲームをやり直す（ホスト専用：ロビーに戻す）
export const restartGame = async (roomId) => {
  const snap = await get(roomRef(roomId));
  const room = snap.val();
  if (!room) return;

  const activePlayers = Object.entries(room.players)
    .filter(([, p]) => !p.isDisconnected);

  const updates = {
    status: STATUS.LOBBY,
    topic: null,
    topicSetterUid: null,
    turnIndex: 0,
    turnAttackCount: 0,
    lastAttackChar: null,
    lastAttackTime: null,
    lastAttackHits: null,
    lastAttackSelfHit: null,
    lastAttackAnyOtherHit: null,
    playerOrder: activePlayers.map(([uid]) => uid),
    lastActivity: Date.now(),
  };

  ALL_CHARS.forEach(c => {
    updates[`board/${c}`] = false;
  });

  activePlayers.forEach(([uid]) => {
    updates[`players/${uid}/slots`] = null;
    updates[`players/${uid}/revealed`] = emptyRevealed();
    updates[`players/${uid}/isEliminated`] = false;
    updates[`players/${uid}/eliminatedOrder`] = null;
    updates[`players/${uid}/inputReady`] = false;
  });

  await update(roomRef(roomId), updates);
};

// リアルタイムリスナー
export const subscribeRoom = (roomId, callback) => {
  const r = roomRef(roomId);
  onValue(r, (snap) => {
    callback(snap.val());
  });
  return () => off(r);
};
