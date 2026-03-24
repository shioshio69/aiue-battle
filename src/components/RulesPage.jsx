import React from 'react';

export default function RulesPage({ onBack }) {
  return (
    <div className="rules-page">
      <h2 className="page-title">ルール説明</h2>

      <div className="rules-card">
        <section>
          <h3>🎯 ゲームの目的</h3>
          <p>2〜6人で遊べるワード推理ゲーム。各プレイヤーがお題に沿った<strong>秘密の言葉</strong>をそれぞれ設定し、50音ボードから1文字ずつ選んで攻撃。相手の言葉を暴き、<strong>最後まで自分の言葉を守り切った人が勝利</strong>！</p>
        </section>

        <section>
          <h3>📋 ゲームの流れ</h3>
          <p>1. ルームを作成し、友達を招待</p>
          <p>2. 誰か1人が<strong>お題</strong>を決める（例：「食べ物」）</p>
          <p>3. 全員がお題に沿った<strong>秘密の言葉</strong>を入力（例：「こーら」）</p>
          <p>4. 全員の入力が終わったら<strong>バトル開始</strong>！</p>
        </section>

        <section>
          <h3>✏️ 言葉の入力ルール</h3>
          <p>アプリ内の50音キーボードで<strong>2〜8文字</strong>のひらがなを入力します。</p>
          <div className="rules-box">
            <p><strong>表記ルール：</strong></p>
            <p>・すべてひらがな（清音のみ）で入力</p>
            <p>・濁点（゛）半濁点（゜）は取る → 「ビール」→「ひーる」</p>
            <p>・小文字は大文字に → 「きゅうり」→「きゆうり」</p>
            <p>・伸ばす音は「ー」→ 「コーラ」→「こーら」</p>
          </div>
        </section>

        <section>
          <h3>⚔️ バトルの流れ</h3>
          <p>1. 自分の手番がきたら、50音ボードから<strong>1文字を選んで攻撃</strong>！</p>
          <p>2. その文字を持っている<strong>全プレイヤー</strong>（自分含む）の該当文字がオープンされる</p>
          <p>3. 自分以外のプレイヤーにヒットしたら、<strong>もう1回だけ</strong>攻撃可能！（1ターン最大2回まで）</p>
          <p>4. 自分の文字にも当たったら<strong>「自爆」</strong>！自分もオープンされてしまう</p>
          <p className="rules-note">※ 自爆のみ（他の人に当たらない）の場合、連続攻撃にはなりません。</p>
        </section>

        <section>
          <h3>💀 脱落・勝利</h3>
          <p>・自分の言葉が全部オープンされたら<strong>脱落</strong></p>
          <p>・<strong>最後の1人</strong>になったら<strong>勝利</strong>！（最後の1人は自爆しても脱落しない）</p>
          <p>・同時脱落の場合、攻撃した側のプレイヤーが勝ち</p>
        </section>

        <section>
          <h3>💡 攻略のコツ</h3>
          <p>・濁点や半濁点が多い言葉は、清音に変換されるので<strong>当てられにくい</strong>！</p>
          <p>　例：「ジョナサン」→「しよなさん」（さ行だけで3文字分散）</p>
          <p>・短い単語は当てにくいけど、当たったら即脱落のリスクも…</p>
          <p>・よく使われる文字（あ・い・う・か・し…）は早めに攻撃されがち。それを避けた言葉選びがカギ！</p>
        </section>
      </div>

      <button className="btn btn-secondary" onClick={onBack}>戻る</button>
    </div>
  );
}
