import React, { useState, useEffect, useRef } from 'react';
import { BOARD_ROWS, SLOT_COUNT, EMPTY_SLOT, PLAYER_COLORS } from '../constants';
import {
  playAttackSelect, playHit, playMiss, playSelfHit,
  playElimination, playTurnChange, isMuted, setMuted,
} from '../soundService';

const ATTACK_OVERLAY_MS = 1700;
const REVEAL_DELAY_MS = 800;
const TURN_OVERLAY_MS = 1500;

export default function BattleScreen({ room, uid, onAttack, onRestart }) {
  const [attacking, setAttacking] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [attackOverlay, setAttackOverlay] = useState(null);
  const [attackOverlayKey, setAttackOverlayKey] = useState(0);
  const [justRevealedChar, setJustRevealedChar] = useState(null);
  const [turnOverlay, setTurnOverlay] = useState(null);
  const [overlayKey, setOverlayKey] = useState(0);
  const prevTurnIndexRef = useRef(room.turnIndex);
  const prevAttackCountRef = useRef(room.turnAttackCount || 0);
  const prevAttackTimeRef = useRef(room.lastAttackTime || 0);
  const prevEliminatedRef = useRef(() => {
    const set = new Set();
    Object.entries(room.players || {}).forEach(([uid, p]) => {
      if (p.isEliminated) set.add(uid);
    });
    return set;
  });
  const timersRef = useRef([]);

  const playerOrder = room.playerOrder || [];
  const currentTurnUid = playerOrder[room.turnIndex];
  const isMyTurn = currentTurnUid === uid;
  const board = room.board || {};
  const attackCount = room.turnAttackCount || 0;

  // タイマー管理ヘルパー
  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };
  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // 攻撃検知 → 攻撃オーバーレイ → オープン演出 → ターンオーバーレイ
  useEffect(() => {
    const attackTime = room.lastAttackTime || 0;
    const attackChar = room.lastAttackChar;
    const attackHappened = attackTime > prevAttackTimeRef.current && attackChar;

    const turnChanged = prevTurnIndexRef.current !== room.turnIndex;
    const comboTriggered = !turnChanged
      && prevAttackCountRef.current < attackCount
      && attackCount > 0;

    prevAttackTimeRef.current = attackTime;
    prevTurnIndexRef.current = room.turnIndex;
    prevAttackCountRef.current = attackCount;

    if (!attackHappened && !turnChanged && !comboTriggered) return;

    clearAllTimers();
    setAttackOverlay(null);
    setJustRevealedChar(null);
    setTurnOverlay(null);

    if (attackHappened) {
      // Step 1: 攻撃文字オーバーレイ（hit数付き）
      const hits = room.lastAttackHits || 0;
      const selfHit = room.lastAttackSelfHit;
      const otherHit = room.lastAttackAnyOtherHit;
      setAttackOverlay({ char: attackChar, hits });
      setAttackOverlayKey(k => k + 1);

      // SE: 攻撃結果音
      if (hits === 0) {
        playMiss();
      } else if (selfHit && !otherHit) {
        playSelfHit();
      } else {
        playHit(hits);
      }

      // 今回新たに脱落したプレイヤーを検出
      const prevElim = prevEliminatedRef.current;
      const newlyEliminated = Object.entries(room.players || {}).some(
        ([pUid, p]) => p.isEliminated && !p.isDisconnected && !prevElim.has(pUid)
      );
      // 脱落状態を更新
      const nextElim = new Set();
      Object.entries(room.players || {}).forEach(([pUid, p]) => {
        if (p.isEliminated) nextElim.add(pUid);
      });
      prevEliminatedRef.current = nextElim;

      // Step 2: オープン演出（攻撃文字をhand-slotに反映するタイミング）
      addTimer(() => {
        setJustRevealedChar(attackChar);
        // SE: 新たな脱落者がいれば脱落音
        if (newlyEliminated) {
          addTimer(() => playElimination(), 200);
        }
      }, REVEAL_DELAY_MS);

      // Step 3: 攻撃オーバーレイ消す
      addTimer(() => {
        setAttackOverlay(null);
      }, ATTACK_OVERLAY_MS);

      // Step 4: ターンオーバーレイ（攻撃オーバーレイの後）
      if (turnChanged || comboTriggered) {
        addTimer(() => {
          showTurnOverlay(turnChanged, comboTriggered);
        }, ATTACK_OVERLAY_MS + 200);
      }

      // Step 5: オープン演出リセット
      addTimer(() => {
        setJustRevealedChar(null);
      }, ATTACK_OVERLAY_MS + 1000);
    } else if (turnChanged || comboTriggered) {
      showTurnOverlay(turnChanged, comboTriggered);
    }

    return clearAllTimers;
  }, [room.lastAttackTime, room.turnIndex, attackCount]);

  const showTurnOverlay = (turnChanged, comboTriggered) => {
    const turnUid = playerOrder[room.turnIndex];
    const turnPlayer = room.players?.[turnUid];
    if (!turnPlayer) return;
    const isMe = turnUid === uid;

    setTurnOverlay({
      name: isMe ? 'あなた' : turnPlayer.name,
      isMe,
      isCombo: comboTriggered,
    });
    setOverlayKey(k => k + 1);
    playTurnChange();
    addTimer(() => setTurnOverlay(null), TURN_OVERLAY_MS);
  };

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    setMutedState(newVal);
  };

  const handleAttack = async (char) => {
    if (!isMyTurn || attacking || board[char]) return;
    playAttackSelect();
    setAttacking(true);
    try {
      await onAttack(char);
    } catch (e) {
      console.error(e);
    }
    setAttacking(false);
  };

  const activePlayers = playerOrder
    .map((pUid, orderIndex) => ({
      uid: pUid,
      ...room.players[pUid],
      colorIndex: Object.keys(room.players).indexOf(pUid),
    }))
    .filter(p => p.name);

  const currentPlayerName = room.players?.[currentTurnUid]?.name || '???';
  const isHost = room.hostUid === uid;
  const myPlayer = room.players?.[uid];
  const mySlots = myPlayer?.slots || [];

  return (
    <div className="battle-page">
      <button className="mute-btn" onClick={toggleMute} title={muted ? '音ON' : '音OFF'}>
        {muted ? '🔇' : '🔊'}
      </button>
      <div className="topic-banner">お題：{room.topic}</div>

      <div className="battle-layout">
        {/* プレイヤー手札 */}
        <div className="hands-container">
          {activePlayers.map((p) => (
            <div
              key={p.uid}
              className={`hand-card ${p.isEliminated ? 'eliminated' : ''} ${p.isDisconnected ? 'disconnected' : ''} ${p.uid === currentTurnUid ? 'current-turn' : ''}`}
            >
              <div className="hand-header">
                <span
                  className="player-dot"
                  style={{ backgroundColor: PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length] }}
                />
                <span className="hand-name">
                  {p.name}
                  {p.uid === uid && ' (You)'}
                </span>
                {p.isEliminated && <span className="eliminated-badge">💀</span>}
              </div>
              <div className="hand-slots">
                {Array(SLOT_COUNT).fill(null).map((_, i) => {
                  const revealed = p.revealed?.[i];
                  const slotChar = p.slots?.[i];
                  const isX = slotChar === EMPTY_SLOT;
                  const isJustRevealed = revealed && slotChar === justRevealedChar && !isX;

                  return (
                    <div
                      key={i}
                      className={`hand-slot ${revealed ? 'revealed' : 'hidden'} ${isX && revealed ? 'slot-x' : ''} ${isJustRevealed ? 'just-revealed' : ''}`}
                    >
                      {revealed ? slotChar : (i + 1)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 50音ボード */}
        <div className="board-container">
          <div className="board-grid">
            {BOARD_ROWS.map((row, ri) => (
              <div key={ri} className="board-row">
                {row.map((char, ci) =>
                  char ? (
                    <button
                      key={ci}
                      className={`board-cell ${board[char] ? 'used' : ''} ${isMyTurn && !board[char] ? 'attackable' : ''}`}
                      onClick={() => handleAttack(char)}
                      disabled={!isMyTurn || board[char] || attacking}
                    >
                      {char}
                    </button>
                  ) : (
                    <span key={ci} className="board-empty" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="turn-indicator">
        <span className={`turn-text ${isMyTurn ? 'my-turn' : ''}`}>
          {isMyTurn ? '🎯 あなたのターン！' : `${currentPlayerName} のターン`}
          {isMyTurn && attackCount > 0 && ' (連続攻撃！)'}
        </span>
      </div>

      {attackOverlay && (
        <div className="attack-overlay" key={attackOverlayKey}>
          <div className="attack-overlay-content">
            <span className="attack-overlay-char">{attackOverlay.char}</span>
            <span className={`attack-overlay-hits ${attackOverlay.hits > 0 ? 'has-hits' : 'no-hits'}`}>
              {attackOverlay.hits > 0 ? `${attackOverlay.hits} HIT!` : 'NO HIT...'}
            </span>
          </div>
        </div>
      )}

      {turnOverlay && (
        <div className="turn-overlay" key={overlayKey}>
          <div className={`turn-overlay-content ${turnOverlay.isMe ? 'is-me' : ''} ${turnOverlay.isCombo ? 'is-combo' : ''}`}>
            {turnOverlay.isCombo && <span className="turn-overlay-combo">連続攻撃！</span>}
            <span className="turn-overlay-name">{turnOverlay.name}</span>
            <span className="turn-overlay-sub">のターン！</span>
          </div>
        </div>
      )}

      <div className="my-word-area">
        <span className="my-word-label">あなたの言葉</span>
        <div className="my-word-slots">
          {mySlots.map((char, i) => (
            <span
              key={i}
              className={`my-word-char ${char === EMPTY_SLOT ? 'is-x' : ''}`}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      {isHost && (
        <button
          className="btn btn-ghost restart-btn"
          onClick={() => {
            if (window.confirm('ゲームを中断してロビーに戻りますか？')) {
              onRestart();
            }
          }}
        >
          ゲームをやり直す
        </button>
      )}
    </div>
  );
}
