import React from 'react';
import { PLAYER_COLORS, MAX_PLAYERS } from '../constants';

export default function Lobby({ room, roomId, uid, onStart, onLeave }) {
  if (!room || !room.players) return null;

  const isHost = room.hostUid === uid;
  const players = Object.entries(room.players).filter(([, p]) => !p.isDisconnected);
  const canStart = players.length >= 2;

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="lobby-page">
      <h2 className="page-title">ロビー</h2>

      <div className="room-id-card">
        <span className="room-id-label">ルームID</span>
        <span className="room-id-value">{roomId}</span>
        <button className="btn btn-small" onClick={copyRoomId}>コピー</button>
      </div>

      <div className="lobby-card">
        <p className="player-count">{players.length} / {MAX_PLAYERS} 人</p>
        <ul className="player-list">
          {players.map(([pUid, p], i) => (
            <li key={pUid} className="player-item">
              <span
                className="player-dot"
                style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
              />
              <span className="player-name">
                {p.name}
                {pUid === room.hostUid && <span className="host-badge">HOST</span>}
                {pUid === uid && <span className="you-badge">YOU</span>}
              </span>
            </li>
          ))}
        </ul>

        {isHost ? (
          <button
            className="btn btn-primary"
            onClick={onStart}
            disabled={!canStart}
          >
            {canStart ? 'ゲーム開始' : '2人以上で開始'}
          </button>
        ) : (
          <p className="waiting-text">ホストがゲームを開始するのを待っています...</p>
        )}
      </div>

      <button className="btn btn-ghost" onClick={onLeave}>
        {isHost ? 'ルームを閉じる' : '退出'}
      </button>
    </div>
  );
}
