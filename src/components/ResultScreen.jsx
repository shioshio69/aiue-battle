import React from 'react';
import { buildRanking } from '../gameLogic';
import { PLAYER_COLORS } from '../constants';

const RANK_EMOJI = ['🥇', '🥈', '🥉'];

export default function ResultScreen({ room, uid, onNextGame, onLeave }) {
  const isHost = room.hostUid === uid;
  const ranking = buildRanking(room.players || {});
  const gameCount = room.gameCount || 1;

  return (
    <div className="result-page">
      <h2 className="page-title">結果発表</h2>
      <p className="game-count">第{gameCount}戦</p>

      <div className="result-card">
        {ranking.map((entry, i) => {
          const colorIndex = Object.keys(room.players).indexOf(entry.uid);
          const isWinner = entry.rank === 1;
          const rankLabel = RANK_EMOJI[entry.rank - 1] || `${entry.rank}位`;

          return (
            <div
              key={entry.uid}
              className={`result-row ${isWinner ? 'winner' : ''} ${entry.uid === uid ? 'is-you' : ''}`}
            >
              <span className="result-rank">{rankLabel}</span>
              <span
                className="player-dot"
                style={{ backgroundColor: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length] }}
              />
              <span className="result-name">
                {entry.name}
                {entry.uid === uid && ' (You)'}
              </span>
              <span className="result-word">
                {(entry.slots || []).filter(s => s !== '✕').join('')}
              </span>
            </div>
          );
        })}
      </div>

      <div className="result-actions">
        {isHost && (
          <button className="btn btn-primary" onClick={onNextGame}>
            次のゲームへ
          </button>
        )}
        {!isHost && (
          <p className="waiting-text">ホストが次のゲームを開始するのを待っています...</p>
        )}
        <button className="btn btn-ghost" onClick={onLeave}>
          ルームを出る
        </button>
      </div>
    </div>
  );
}
