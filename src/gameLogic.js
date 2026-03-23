import { EMPTY_SLOT, SLOT_COUNT } from './constants';

// 4桁ルームID生成（英大文字+数字）
export const generateRoomId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい文字を除外
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

// 配列シャッフル（Fisher-Yates）
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 脱落判定：✕以外の全スロットがrevealed=trueか
export const isEliminated = (slots, revealed) => {
  if (!slots || !revealed) return false;
  for (let i = 0; i < SLOT_COUNT; i++) {
    if (slots[i] !== EMPTY_SLOT && !revealed[i]) {
      return false;
    }
  }
  return true;
};

// 生存プレイヤー数を取得
export const countAlive = (players) => {
  return Object.values(players).filter(p => !p.isEliminated && !p.isDisconnected).length;
};

// 空のrevealed配列を生成
export const emptyRevealed = () => Array(SLOT_COUNT).fill(false);

// 空のボード状態を生成
export const emptyBoard = (allChars) => {
  const board = {};
  allChars.forEach(c => { board[c] = false; });
  return board;
};

// 攻撃判定：指定文字に該当するスロットのインデックスを返す
export const findHitSlots = (slots, revealed, char) => {
  const hits = [];
  if (!slots) return hits;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === char && !revealed[i]) {
      hits.push(i);
    }
  }
  return hits;
};

// eliminatedOrderの次の番号を取得
export const getNextEliminatedOrder = (players) => {
  let max = 0;
  Object.values(players).forEach(p => {
    if (p.eliminatedOrder && p.eliminatedOrder > max) {
      max = p.eliminatedOrder;
    }
  });
  return max + 1;
};

// 最下位プレイヤー（eliminatedOrder が最小 = 最初に脱落）を取得
export const getLoser = (players) => {
  let loserUid = null;
  let minOrder = Infinity;
  const losers = [];

  Object.entries(players).forEach(([uid, p]) => {
    if (p.eliminatedOrder && !p.isDisconnected) {
      if (p.eliminatedOrder < minOrder) {
        minOrder = p.eliminatedOrder;
        losers.length = 0;
        losers.push(uid);
      } else if (p.eliminatedOrder === minOrder) {
        losers.push(uid);
      }
    }
  });

  if (losers.length === 0) return null;
  if (losers.length === 1) return losers[0];
  // 同率の場合ランダム
  return losers[Math.floor(Math.random() * losers.length)];
};

// 順位リスト生成（1位=最後まで生存 → 以下脱落逆順）
export const buildRanking = (players) => {
  const entries = Object.entries(players)
    .filter(([, p]) => !p.isDisconnected)
    .map(([uid, p]) => ({
      uid,
      name: p.name,
      slots: p.slots || [],
      eliminatedOrder: p.eliminatedOrder || Infinity,
    }));

  // eliminatedOrder大きい方が上位（後で脱落=上位）、Infinity=生存=1位
  entries.sort((a, b) => b.eliminatedOrder - a.eliminatedOrder);

  return entries.map((e, i) => ({
    ...e,
    rank: i + 1,
  }));
};
