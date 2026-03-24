// === Sound Service (Web Audio API) ===
// 外部ファイル不要の効果音生成

let ctx = null;

function getContext() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ミュート管理
const MUTE_KEY = 'aiue-se-muted';
export const isMuted = () => localStorage.getItem(MUTE_KEY) === 'true';
export const setMuted = (v) => localStorage.setItem(MUTE_KEY, v ? 'true' : 'false');

// ヘルパー: オシレーターを鳴らす
function playTone({ freq, type = 'sine', duration = 0.1, volume = 0.15, delay = 0, rampTo = null }) {
  if (isMuted()) return;
  const c = getContext();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  if (rampTo) {
    osc.frequency.linearRampToValueAtTime(rampTo, c.currentTime + delay + duration);
  }
  gain.gain.setValueAtTime(volume, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration);
}

// 攻撃選択時 — 短い打撃音
export function playAttackSelect() {
  playTone({ freq: 600, duration: 0.08, volume: 0.12 });
}

// ヒット（成功音）— 明るい上昇音
export function playHit(hitCount = 1) {
  playTone({ freq: 520, duration: 0.15, volume: 0.2, rampTo: 780 });
  if (hitCount >= 2) {
    playTone({ freq: 660, duration: 0.15, volume: 0.2, delay: 0.12, rampTo: 880 });
  }
  if (hitCount >= 3) {
    playTone({ freq: 780, duration: 0.2, volume: 0.2, delay: 0.24, rampTo: 1040 });
  }
}

// ノーヒット — 空振り音
export function playMiss() {
  playTone({ freq: 250, type: 'sawtooth', duration: 0.25, volume: 0.08, rampTo: 150 });
}

// 自爆 — 不穏な下降音
export function playSelfHit() {
  playTone({ freq: 500, duration: 0.35, volume: 0.15, rampTo: 250 });
  playTone({ freq: 180, type: 'triangle', duration: 0.4, volume: 0.1, delay: 0.1 });
}

// 脱落 — 重い衝撃音
export function playElimination() {
  playTone({ freq: 120, type: 'triangle', duration: 0.6, volume: 0.25, rampTo: 60 });
  playTone({ freq: 80, type: 'sawtooth', duration: 0.4, volume: 0.08, delay: 0.05 });
}

// 勝利 — 3音ファンファーレ (C5-E5-G5)
export function playVictory() {
  playTone({ freq: 523, duration: 0.25, volume: 0.2 });
  playTone({ freq: 659, duration: 0.25, volume: 0.2, delay: 0.22 });
  playTone({ freq: 784, duration: 0.45, volume: 0.25, delay: 0.44 });
}

// ターン切替 — 軽い通知音
export function playTurnChange() {
  playTone({ freq: 800, duration: 0.06, volume: 0.1 });
  playTone({ freq: 1000, duration: 0.08, volume: 0.12, delay: 0.07 });
}
