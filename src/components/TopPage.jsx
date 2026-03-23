import React, { useState, useRef } from 'react';
import { ROOM_ID_CHARS } from '../gameLogic';

export default function TopPage({ onCreateRoom, onJoinRoom, onShowRules }) {
  const [nickname, setNickname] = useState(() => localStorage.getItem('aiue_nickname') || '');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const composingRef = useRef(false);

  const handleNicknameChange = (e) => {
    const v = e.target.value.slice(0, 8);
    setNickname(v);
    localStorage.setItem('aiue_nickname', v);
  };

  const filterHiragana = (value) => {
    return [...value].filter(c => ROOM_ID_CHARS.includes(c)).join('').slice(0, 4);
  };

  const handleRoomIdChange = (e) => {
    if (composingRef.current) return;
    setRoomIdInput(filterHiragana(e.target.value));
  };

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
    if (!nickname.trim() || !roomIdInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onJoinRoom(roomIdInput.trim(), nickname.trim());
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
        <div className="join-row">
          <input
            className="input-field"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={roomIdInput}
            onChange={handleRoomIdChange}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              setRoomIdInput(filterHiragana(e.target.value));
            }}
            placeholder="ひらがな4文字"
          />
          <button
            className="btn btn-secondary"
            onClick={handleJoin}
            disabled={!nickname.trim() || roomIdInput.length < 4 || loading}
          >
            参加
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>

      <button className="btn btn-ghost" onClick={onShowRules}>
        ルール説明
      </button>
    </div>
  );
}
