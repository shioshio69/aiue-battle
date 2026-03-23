import React, { useState } from 'react';
import { BOARD_ROWS, SLOT_COUNT, EMPTY_SLOT, PLAYER_COLORS } from '../constants';

export default function BattleScreen({ room, uid, onAttack }) {
  const [attacking, setAttacking] = useState(false);

  const playerOrder = room.playerOrder || [];
  const currentTurnUid = playerOrder[room.turnIndex];
  const isMyTurn = currentTurnUid === uid;
  const board = room.board || {};

  const handleAttack = async (char) => {
    if (!isMyTurn || attacking || board[char]) return;
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
  const attackCount = room.turnAttackCount || 0;

  return (
    <div className="battle-page">
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

                  return (
                    <div
                      key={i}
                      className={`hand-slot ${revealed ? 'revealed' : 'hidden'} ${isX && revealed ? 'slot-x' : ''}`}
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
    </div>
  );
}
