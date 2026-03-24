import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loginAnonymously } from './firebase';
import { STATUS } from './constants';
import {
  createRoom, joinRoom, leaveRoom, startGame, setTopic,
  submitWord, checkAllReady, executeAttack, nextGame, restartGame, subscribeRoom,
} from './roomService';
import TopPage from './components/TopPage';
import RulesPage from './components/RulesPage';
import Lobby from './components/Lobby';
import TopicSetting from './components/TopicSetting';
import WordInput from './components/WordInput';
import BattleScreen from './components/BattleScreen';
import ResultScreen from './components/ResultScreen';
import './App.css';

const SESSION_KEY = 'aiue_session';
const TOAST_DURATION = 3000;

function App() {
  const [uid, setUid] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);
  const [page, setPage] = useState('top');
  const [unsubscribe, setUnsubscribe] = useState(null);
  const [toasts, setToasts] = useState([]);
  const prevPlayersRef = useRef(null);
  const toastIdRef = useRef(0);

  // トースト表示
  const showToast = useCallback((message) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  // セッション管理
  const saveSession = (id, nickname) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId: id, nickname }));
  };
  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
  };
  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch { return null; }
  };

  useEffect(() => {
    loginAnonymously().then(user => setUid(user.uid));
  }, []);

  // 自動復帰: UID取得後にセッションがあれば再接続を試みる
  useEffect(() => {
    if (!uid) return;
    const session = getSession();
    if (!session) return;

    joinRoom(session.roomId, uid, session.nickname)
      .then(() => {
        setRoomId(session.roomId);
        subscribeToRoom(session.roomId);
        setPage('game');
      })
      .catch(() => {
        clearSession();
      });
  }, [uid]);

  // 切断検知 → トースト表示
  useEffect(() => {
    if (!room || !room.players) {
      prevPlayersRef.current = null;
      return;
    }
    const prev = prevPlayersRef.current;
    if (prev) {
      Object.entries(room.players).forEach(([pUid, p]) => {
        const prevPlayer = prev[pUid];
        if (prevPlayer && !prevPlayer.isDisconnected && p.isDisconnected) {
          showToast(`${p.name} が切断しました`);
        }
        if (prevPlayer && prevPlayer.isDisconnected && !p.isDisconnected) {
          showToast(`${p.name} が復帰しました`);
        }
      });
    }
    prevPlayersRef.current = { ...room.players };
  }, [room, showToast]);

  const subscribeToRoom = useCallback((id) => {
    if (unsubscribe) unsubscribe();
    const unsub = subscribeRoom(id, (data) => {
      if (!data) {
        setRoom(null);
        setRoomId(null);
        setPage('top');
        clearSession();
        return;
      }
      setRoom(data);
    });
    setUnsubscribe(() => unsub);
  }, [unsubscribe]);

  const handleCreateRoom = async (nickname) => {
    const id = await createRoom(uid, nickname);
    setRoomId(id);
    saveSession(id, nickname);
    subscribeToRoom(id);
    setPage('game');
  };

  const handleJoinRoom = async (id, nickname) => {
    await joinRoom(id, uid, nickname);
    setRoomId(id);
    saveSession(id, nickname);
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
    clearSession();
  };

  const handleStart = () => startGame(roomId);
  const handleSetTopic = (topic) => setTopic(roomId, topic);
  const handleSubmitWord = async (slots) => {
    await submitWord(roomId, uid, slots);
    await checkAllReady(roomId);
  };
  const handleAttack = (char) => executeAttack(roomId, char, uid);
  const handleNextGame = () => nextGame(roomId);
  const handleRestart = () => restartGame(roomId);

  useEffect(() => {
    if (!room || room.status !== STATUS.INPUTTING) return;
    const active = Object.entries(room.players || {}).filter(([, p]) => !p.isDisconnected);
    if (active.every(([, p]) => p.inputReady) && active.length >= 2) {
      checkAllReady(roomId);
    }
  }, [room, roomId]);

  const toastContainer = toasts.length > 0 && (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.message}</div>
      ))}
    </div>
  );

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
  let screen;
  if (s === STATUS.LOBBY) screen = <Lobby room={room} roomId={roomId} uid={uid} onStart={handleStart} onLeave={handleLeave} />;
  else if (s === STATUS.SETTING_TOPIC) screen = <TopicSetting room={room} uid={uid} onSetTopic={handleSetTopic} />;
  else if (s === STATUS.INPUTTING) screen = <WordInput room={room} uid={uid} onSubmit={handleSubmitWord} />;
  else if (s === STATUS.BATTLE) screen = <BattleScreen room={room} uid={uid} onAttack={handleAttack} onRestart={handleRestart} />;
  else if (s === STATUS.RESULT) screen = <ResultScreen room={room} uid={uid} onNextGame={handleNextGame} onLeave={handleLeave} />;
  else screen = <div className="loading">読み込み中...</div>;

  return (
    <>
      {toastContainer}
      {screen}
    </>
  );
}

export default App;
