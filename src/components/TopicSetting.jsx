import React, { useState } from 'react';
import { TOPIC_SUGGESTIONS } from '../constants';

export default function TopicSetting({ room, uid, onSetTopic }) {
  const [topic, setTopic] = useState('');
  const isSetter = room.topicSetterUid === uid;
  const setterName = room.players?.[room.topicSetterUid]?.name || '???';

  const handleSubmit = () => {
    if (topic.trim()) {
      onSetTopic(topic.trim());
    }
  };

  return (
    <div className="topic-page">
      <h2 className="page-title">お題設定</h2>

      <div className="topic-card">
        {isSetter ? (
          <>
            <p className="topic-instruction">あなたがお題を決めてください！</p>

            <div className="topic-suggestions">
              {TOPIC_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className={`chip ${topic === s ? 'chip-active' : ''}`}
                  onClick={() => setTopic(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <input
              className="input-field"
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="自由入力もOK"
              maxLength={20}
            />

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!topic.trim()}
            >
              決定
            </button>
          </>
        ) : (
          <div className="waiting-topic">
            <p className="topic-setter-name">{setterName} さんが</p>
            <p className="topic-waiting-text">お題を考えています...</p>
            <div className="loading-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
