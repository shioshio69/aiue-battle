import React from 'react';

export default function RulesPage({ onBack }) {
  return (
    <div className="rules-page">
      <h2 className="page-title">ルール説明</h2>

      <div className="rules-card">
        <section>
          <h3>🎯 ゲームの目的</h3>
          <p>お題に沿った「ひらがなの言葉」を隠し、50音から1文字ずつ攻撃して相手の言葉を暴こう！最後まで残った人が勝利！</p>
        </section>

        <section>
          <h3>✏️ 準備</h3>
          <p>お題が決まったら、2〜8文字の単語を考えて入力します。</p>
          <div className="rules-box">
            <p><strong>表記ルール：</strong></p>
            <p>・すべてひらがな（清音のみ）で入力</p>
            <p>・濁点（゛）半濁点（゜）は取る → 「ビール」→「ひいる」</p>
            <p>・小文字は大文字に → 「きゅうり」→「きゆうり」</p>
            <p>・伸ばす音は「ー」→ 「コーラ」→「こーら」</p>
            <p>・余ったマスには ✕ を入れる</p>
          </div>
        </section>

        <section>
          <h3>⚔️ バトルの流れ</h3>
          <p>1. 手番で50音から<strong>1文字を指定</strong>して攻撃！</p>
          <p>2. その文字を持っている人は<strong>全てオープン</strong>。</p>
          <p>3. 他プレイヤーにヒットしたら<strong>もう1回攻撃</strong>可能！（最大2回）</p>
          <p>4. 自分の文字に当たったら<strong>「自爆」</strong>！自分もオープン。</p>
          <p className="rules-note">※ 自爆のみ（他の人に当たらない）の場合、連続攻撃はありません。</p>
        </section>

        <section>
          <h3>💀 脱落・勝利</h3>
          <p>・✕以外の文字が全部オープンされたら<strong>脱落</strong>。</p>
          <p>・最後の1人になったら<strong>勝利</strong>！（自爆しても脱落しない）</p>
          <p>・同時脱落の場合、攻撃したプレイヤーが勝ち。</p>
        </section>

        <section>
          <h3>💡 Tips</h3>
          <p>・濁点や半濁点が多い言葉は当てられにくい！</p>
          <p>　例：「ジョナサン」→「しよなさん」</p>
          <p>・短い単語は当てにくいけど、当たったら即脱落のリスクも…</p>
        </section>
      </div>

      <button className="btn btn-secondary" onClick={onBack}>戻る</button>
    </div>
  );
}
