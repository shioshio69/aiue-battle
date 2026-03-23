// 50音ボード構成（48文字）
export const BOARD_ROWS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '', 'を', '', 'ん'],
  ['ー', '', '', '', ''],
];

export const ALL_CHARS = BOARD_ROWS.flat().filter(c => c !== '');

export const SLOT_COUNT = 8;
export const MIN_WORD_LENGTH = 2;
export const MAX_PLAYERS = 6;
export const MAX_ATTACKS_PER_TURN = 2;

export const EMPTY_SLOT = '✕';

export const TOPIC_SUGGESTIONS = [
  '動物', '飲みもの', '食べもの', 'ポケモン名', '果物',
  '国名', 'スポーツ', 'コンビニにあるもの', '赤いもの',
  '行きたい場所', '乗りもの', 'キャラクター名', '文房具', '4文字の言葉',
];

export const PLAYER_COLORS = [
  '#FF6B35', // オレンジ
  '#4ECDC4', // ティール
  '#FFE66D', // イエロー
  '#A8E6CF', // ミント
  '#FF8B94', // ピンク
  '#B8A9C9', // ラベンダー
];

export const STATUS = {
  LOBBY: 'lobby',
  SETTING_TOPIC: 'setting_topic',
  INPUTTING: 'inputting',
  BATTLE: 'battle',
  RESULT: 'result',
};
