import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// ============================================================
// ★ ここにFirebaseプロジェクトの設定を貼り付けてください ★
// Firebase Console → プロジェクト設定 → 全般 → マイアプリ
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAFtPk2br5agd0xDk3VlMpcBiW7zIdscV8",
  authDomain: "aiue-battle.firebaseapp.com",
  databaseURL: "https://aiue-battle-f7b06-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aiue-battle-f7b06",
  storageBucket: "aiue-battle-f7b06.firebasestorage.app",
  messagingSenderId: "1091707349741",
  appId: "1:1091707349741:web:5ed7c2f5e7f4badeb07ae4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const loginAnonymously = async () => {
  const result = await signInAnonymously(auth);
  return result.user;
};
