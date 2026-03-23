import React, { useState, useEffect, useCallback } from 'react';
import { loginAnonymously } from './firebase';
import { STATUS } from './constants';
import {
  createRoom, joinRoom, leaveRoom, startGame, setTopic,
  submitWord, checkAllReady, executeAttack, nextGame, subscribeRoom,
} from './roomService';
import TopPage from './components/TopPage';
import RulesPage from './components/RulesPage';
import Lobby from './components/Lobby';
import TopicSetting from './components/TopicSetting';
import WordInput from './components/WordInput';
import BattleScreen from './components/BattleScreen';
import ResultScreen from './components/ResultScreen';
import './App.css';

function App() {
  const [uid, setUid] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);
  const [page, setPage] = useState('top');
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    loginAnonymously().then(user => setUid(user.uid));
  }, []);

  const subscribeToRoom = useCallback((id) => {
    if (unsubscribe) unsubscribe();
    const unsub = subscribeRoom(id, (data) => {
      if (!data) {
        setRoom(null);
        setRoomId(null);
        setPage('top');
        return;
      }
      setRoom(data);
    });
    setUnsubscribe(() => unsub);
  }, [unsubscribe]);

  const handleCreateRoom = async (nickname) => {
    const id = await createRoom(uid, nickname);
    setRoomId(id);
    subscribeToRoom(id);
    setPage('game');
  };

  const handleJoinRoom = async (id, nickname) => {
    await joinRoom(id, uid, nickname);
    setRoomId(id);
    subscribeToRoom(id);
    setPage('game');
  };

  const handleLeave = async () => {
    if (roomId && uid && room) {
      await leaveRoom(roomId, uid, room.hostUid === uid);
    }
    if (unsubscribe) unsubscribe();
    setRoom(null);
    setRoomId(null);
    setPage('top');
  };

  const handleStart = () => startGame(roomId);
  const handleSetTopic = (topic) => setTopic(roomId, topic);
  const handleSubmitWord = async (slots) => {
    await submitWord(roomId, uid, slots);
    await checkAllReady(roomId);
  };
  const handleAttack = (char) => executeAttack(roomId, char, uid);
  const handleNextGame = () => nextGame(roomId);

  useEffect(() => {
    if (!room || room.status !== STATUS.INPUTTING) return;
    const active = Object.entries(room.players || {}).filter(([, p]) => !p.isDisconnected);
    if (active.every(([, p]) => p.inputReady) && active.length >= 2) {
      checkAllReady(roomId);
    }
  }, [room, roomId]);

  if (page === 'rules') return <RulesPage onBack={() => setPage('top')} />;

  if (page === 'top' || !room) {
    return (
      <TopPage
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onShowRules={() => setPage('rules')}
      />
    );
  }

  const s = room.status;
  if (s === STATUS.LOBBY) return <Lobby room={room} roomId={roomId} uid={uid} onStart={handleStart} onLeave={handleLeave} />;
  if (s === STATUS.SETTING_TOPIC) return <TopicSetting room={room} uid={uid} onSetTopic={handleSetTopic} />;
  if (s === STATUS.INPUTTING) return <WordInput room={room} uid={uid} onSubmit={handleSubmitWord} />;
  if (s === STATUS.BATTLE) return <BattleScreen room={room} uid={uid} onAttack={handleAttack} />;
  if (s === STATUS.RESULT) return <ResultScreen room={room} uid={uid} onNextGame={handleNextGame} onLeave={handleLeave} />;

  return <div className="loading">読み込み中...</div>;
}

export default App;
