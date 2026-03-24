import React, { useState } from 'react';
import { ROOM_ID_CHARS } from '../gameLogic';

const ROOM_ID_LENGTH = 4;
const MINI_BOARD_ROWS = [
  ['あ','い','う','え','お'],
  ['か','き','く','け','こ'],
  ['さ','し','す','せ','そ'],
  ['た','ち','つ','て','と'],
  ['な','に','ぬ','ね','の'],
  ['は','ひ','ふ','へ','ほ'],
  ['ま','み','む','め','も'],
  ['や','','ゆ','','よ'],
  ['ら','り','る','れ','ろ'],
  ['わ','','ん','',''],
];

export default function TopPage({ onCreateRoom, onJoinRoom, onShowRules }) {
  const [nickname, setNickname] = useState(() => localStorage.getItem('aiue_nickname') || '');
  const [roomIdChars, setRoomIdChars] = useState([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNicknameChange = (e) => {
    const v = e.target.value.slice(0, 8);
    setNickname(v);
    localStorage.setItem('aiue_nickname', v);
  };

  const handleCharInput = (char) => {
    if (roomIdChars.length >= ROOM_ID_LENGTH) return;
    setRoomIdChars([...roomIdChars, char]);
  };

  const handleDelete = () => {
    if (roomIdChars.length === 0) return;
    setRoomIdChars(roomIdChars.slice(0, -1));
  };

  const roomId = roomIdChars.join('');
  const canJoin = nickname.trim() && roomIdChars.length === ROOM_ID_LENGTH;

  const handleCreate = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onCreateRoom(nickname.trim());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!canJoin) return;
    setLoading(true);
    setError('');
    try {
      await onJoinRoom(roomId, nickname.trim());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="top-page">
      <div className="top-hero">
        <h1 className="top-title">あいうえバトル</h1>
        <p className="top-subtitle">Online</p>
        <p className="top-summary">
          お題に沿った秘密の言葉をひらがなで設定し、<br />
          50音から1文字ずつ攻撃！<br />
          相手の言葉を暴きつつ、<br />
          自分の言葉を最後まで守り切れ！
        </p>
        <button className="btn btn-ghost top-rules-link" onClick={onShowRules}>
          詳細ルール説明はこちら
        </button>
      </div>

      <div className="top-card">
        <label className="input-label">ニックネーム</label>
        <input
          className="input-field"
          type="text"
          value={nickname}
          onChange={handleNicknameChange}
          placeholder="名前を入力（8文字まで）"
          maxLength={8}
        />

        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={!nickname.trim() || loading}
        >
          ルーム作成
        </button>

        <div className="divider"><span>または</span></div>

        <label className="input-label">ルームIDで参加</label>

        <div
          className="room-id-input-slots"
          onClick={() => setShowKeyboard(true)}
        >
          {Array(ROOM_ID_LENGTH).fill(null).map((_, i) => (
            <span
              key={i}
              className={`room-id-slot ${roomIdChars[i] ? 'filled' : ''} ${i === roomIdChars.length && showKeyboard ? 'active' : ''}`}
            >
              {roomIdChars[i] || ''}
            </span>
          ))}
        </div>

        {showKeyboard && (
          <div className="room-id-keyboard">
            {MINI_BOARD_ROWS.map((row, ri) => (
              <div key={ri} className="room-id-kb-row">
                {row.map((char, ci) =>
                  char ? (
                    <button
                      key={ci}
                      className="room-id-kb-key"
                      onClick={() => handleCharInput(char)}
                      disabled={roomIdChars.length >= ROOM_ID_LENGTH}
                    >
                      {char}
                    </button>
                  ) : (
                    <span key={ci} className="room-id-kb-empty" />
                  )
                )}
              </div>
            ))}
            <div className="room-id-kb-actions">
              <button className="btn btn-small" onClick={handleDelete}>
                ← 削除
              </button>
              <button
                className="btn btn-small"
                onClick={() => { setRoomIdChars([]); }}
              >
                全消し
              </button>
              <button
                className="btn btn-small"
                onClick={() => setShowKeyboard(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={handleJoin}
          disabled={!canJoin || loading}
          style={{ width: '100%' }}
        >
          参加
        </button>

        {error && <p className="error-text">{error}</p>}
      </div>

    </div>
  );
}
