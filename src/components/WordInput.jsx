import React, { useState } from 'react';
import { BOARD_ROWS, SLOT_COUNT, EMPTY_SLOT, MIN_WORD_LENGTH } from '../constants';

export default function WordInput({ room, uid, onSubmit }) {
  const [slots, setSlots] = useState(Array(SLOT_COUNT).fill(''));
  const [cursor, setCursor] = useState(0);
  const isReady = room.players?.[uid]?.inputReady;

  const activePlayers = Object.entries(room.players || {})
    .filter(([, p]) => !p.isDisconnected);

  const handleCharInput = (char) => {
    if (cursor >= SLOT_COUNT || isReady) return;
    const next = [...slots];
    next[cursor] = char;
    setSlots(next);
    setCursor(cursor + 1);
  };

  const handleDelete = () => {
    if (cursor <= 0 || isReady) return;
    const next = [...slots];
    next[cursor - 1] = '';
    setSlots(next);
    setCursor(cursor - 1);
  };

  const handleClear = () => {
    if (isReady) return;
    setSlots(Array(SLOT_COUNT).fill(''));
    setCursor(0);
  };

  const handleFillX = () => {
    if (isReady) return;
    const next = [...slots];
    for (let i = cursor; i < SLOT_COUNT; i++) {
      next[i] = EMPTY_SLOT;
    }
    setSlots(next);
    setCursor(SLOT_COUNT);
  };

  const handleSubmit = () => {
    const filled = slots.filter(s => s && s !== EMPTY_SLOT).length;
    if (filled < MIN_WORD_LENGTH) return;
    if (slots.some(s => !s)) return; // 全スロット埋まっていること
    onSubmit(slots);
  };

  const filledCount = slots.filter(s => s && s !== EMPTY_SLOT).length;
  const allFilled = slots.every(s => s !== '');
  const canSubmit = allFilled && filledCount >= MIN_WORD_LENGTH && !isReady;

  return (
    <div className="word-input-page">
      <div className="topic-banner">お題：{room.topic}</div>

      <div className="slots-row">
        {slots.map((s, i) => (
          <div
            key={i}
            className={`slot ${i === cursor && !isReady ? 'slot-active' : ''} ${s === EMPTY_SLOT ? 'slot-x' : ''}`}
            onClick={() => !isReady && setCursor(i)}
          >
            {s || <span className="slot-number">{i + 1}</span>}
          </div>
        ))}
      </div>

      {!isReady ? (
        <>
          <div className="keyboard">
            {BOARD_ROWS.map((row, ri) => (
              <div key={ri} className="kb-row">
                {row.map((char, ci) =>
                  char ? (
                    <button
                      key={ci}
                      className="kb-key"
                      onClick={() => handleCharInput(char)}
                      disabled={cursor >= SLOT_COUNT}
                    >
                      {char}
                    </button>
                  ) : (
                    <span key={ci} className="kb-empty" />
                  )
                )}
              </div>
            ))}
          </div>

          <div className="kb-actions">
            <button className="btn btn-small" onClick={handleDelete}>← 削除</button>
            <button className="btn btn-small" onClick={handleFillX}>✕で埋める</button>
            <button className="btn btn-small" onClick={handleClear}>全消し</button>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            決定
          </button>
        </>
      ) : (
        <p className="ready-text">入力完了！他のプレイヤーを待っています...</p>
      )}

      <div className="player-status-list">
        {activePlayers.map(([pUid, p]) => (
          <span key={pUid} className={`player-status ${p.inputReady ? 'ready' : ''}`}>
            {p.name} {p.inputReady ? '✓' : '...'}
          </span>
        ))}
      </div>
    </div>
  );
}
