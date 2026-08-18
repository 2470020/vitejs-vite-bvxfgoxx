import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';

// ==========================================================
// イラつく自己紹介ページ（スマホ・タッチ操作版 / TypeScript対応）
// StackBlitzの src/App.tsx を丸ごとこれに置き換えてください。
// Tailwind不要・プレーンCSSのみで動作します。
// ==========================================================

const TAUNTS = [
  'そんなに急いでどこ行くの？',
  '自己紹介、ちゃんと読んでる？',
  'そのボタンは押せません（多分）',
  'わたしは今、あなたを見ています。',
  'タップ回数：もう数えてない',
  '諦めが肝心ですよ',
];

type Pos = { top: number; left: number };

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const runBtnRef = useRef<HTMLButtonElement>(null);

  // 逃げるボタン（タッチ版）
  const [runPos, setRunPos] = useState<Pos>({ top: 10, left: 10 });
  const [dodgeCount, setDodgeCount] = useState(0);

  // 偽モーダル（閉じるボタンが複数）
  const [showModal, setShowModal] = useState(true);
  const [decoyPositions, setDecoyPositions] = useState<Pos[]>([
    { top: 8, left: 8 },
    { top: 8, left: 55 },
    { top: 55, left: 15 },
    { top: 55, left: 55 },
  ]);
  const [fooledCount, setFooledCount] = useState(0);
  const realCloseIndex = 2; // 本物の「閉じる」の位置（見た目では分からない）

  // 謎のローディングバー
  const [progress, setProgress] = useState(0);

  // 目が覚めるボタン
  const [flashing, setFlashing] = useState(false);
  const [shaking, setShaking] = useState(false);

  // 煽りメッセージ
  const [taunt, setTaunt] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 99) return 99; // 絶対に100にならない
        return p + Math.random() * 8;
      });
    }, 300);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const msg = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
      setTaunt(msg);
      setTimeout(() => setTaunt(null), 2200);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  const dodgeToRandomSpot = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const maxLeft = Math.max(rect.width - 150, 10);
    const maxTop = Math.max(rect.height - 60, 10);
    setRunPos({
      left: Math.random() * maxLeft,
      top: Math.random() * maxTop,
    });
    setDodgeCount((c) => c + 1);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // 画面のどこかに触れた瞬間、指がボタンに近ければ逃げる
  const handleContainerTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const btn = runBtnRef.current;
    if (!container || !btn) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = container.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    const btnCenterX = runPos.left + 65;
    const btnCenterY = runPos.top + 20;
    const dist = Math.hypot(touchX - btnCenterX, touchY - btnCenterY);
    if (dist < 90) {
      dodgeToRandomSpot();
    }
  };

  // ボタン自体に指が触れた瞬間も必ず逃がす（ほぼ絶対にタップさせない）
  const handleRunBtnTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dodgeToRandomSpot();
  };

  const handleDecoyTap = (idx: number) => {
    if (idx === realCloseIndex) {
      setShowModal(false);
      return;
    }
    setFooledCount((c) => c + 1);
    if (navigator.vibrate) navigator.vibrate(15);
    setDecoyPositions((prev) =>
      prev.map(() => ({
        top: Math.random() * 65,
        left: Math.random() * 55,
      }))
    );
  };

  const playSiren = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;

      const ctx = new AudioCtx();
      let t = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, t);
        gain.gain.setValueAtTime(0.15, t);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
        t += 0.18;
      }
    } catch (e) {
      // オーディオが使えない環境では無視
    }
  };

  const wakeUp = () => {
    playSiren();
    setFlashing(true);
    setShaking(true);
    if (navigator.vibrate) navigator.vibrate([100, 60, 100, 60, 200]);
    setTimeout(() => setFlashing(false), 1400);
    setTimeout(() => setShaking(false), 700);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleContainerTouch}
      onTouchMove={handleContainerTouch}
      style={{
        ...styles.page,
        animation: shaking ? 'shake 0.15s infinite' : 'none',
      }}
    >
      <style>{`
html, body { margin:0; padding:0; overscroll-behavior: none; }
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
@keyframes shake {
0% { transform: translate(0,0); }
25% { transform: translate(-6px,3px); }
50% { transform: translate(6px,-3px); }
75% { transform: translate(-4px,-4px); }
100% { transform: translate(0,0); }
}
@keyframes flashBg {
0%,100% { background-color: #ff0055; }
25% { background-color: #ffee00; }
50% { background-color: #00e5ff; }
75% { background-color: #7cff00; }
}
@keyframes wobble {
0%,100% { transform: rotate(0deg); }
25% { transform: rotate(-2.5deg); }
75% { transform: rotate(2.5deg); }
}
button { cursor: pointer; font-family: inherit; touch-action: manipulation; }
`}</style>

      {flashing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            animation: 'flashBg 0.15s infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '2.4rem',
              color: '#fff',
              fontWeight: 900,
              textShadow: '2px 2px 8px #000',
            }}
          >
            起きて！！！
          </span>
        </div>
      )}

      {taunt && <div style={styles.toast}>{taunt}</div>}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <p style={{ marginBottom: 8, fontWeight: 700 }}>お知らせ</p>
            <p style={{ fontSize: 13, color: '#444' }}>
              このページを見る前に、下のボタンのどれかをタップしてください。
              <br />
              （どれが本物の「閉じる」かは分かりません）
            </p>
            <div style={{ position: 'relative', height: 130, marginTop: 12 }}>
              {decoyPositions.map((pos, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDecoyTap(idx)}
                  style={{
                    ...styles.decoyBtn,
                    top: `${pos.top}%`,
                    left: `${pos.left}%`,
                  }}
                >
                  閉じる
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
              だまされた回数：{fooledCount}
            </p>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h1
          style={{
            ...styles.title,
            animation: 'wobble 2.2s ease-in-out infinite',
          }}
        >
          自己紹介
        </h1>

        <div style={styles.section}>
          <p>
            <b>大学</b>：データサイエンス学部 データサイエンス学科
          </p>
          <p>
            <b>インターン先</b>：株式会社ベオスアイティホールディングス
          </p>
          <p>
            <b>趣味</b>
            ：ゲーム／デスクトップカスタマイズ（ペルソナ3・5系デザイン、Wallpaper
            Engine）
          </p>
          <p style={{ fontSize: 11, color: '#888' }}>
            ※ここは自分の内容に書き換えてください
          </p>
        </div>

        <div style={styles.progressWrap}>
          <p style={{ fontSize: 13, marginBottom: 4 }}>自己紹介読み込み中…</p>
          <div style={styles.progressOuter}>
            <div style={{ ...styles.progressInner, width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: 12, color: '#888' }}>
            {Math.floor(progress)}% （たぶん終わらない）
          </p>
        </div>

        <div style={styles.buttonRow}>
          <button onClick={wakeUp} style={styles.wakeBtn}>
            🚨 目が覚めるボタン 🚨
          </button>
        </div>

        <div style={styles.runZone}>
          <button
            ref={runBtnRef}
            onTouchStart={handleRunBtnTouchStart}
            onClick={() => alert('捕まえられたら偉い！ 詳細は特にありません。')}
            style={{
              ...styles.runBtn,
              top: runPos.top,
              left: runPos.left,
            }}
          >
            詳細を見る
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
          逃げた回数：{dodgeCount}
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: CSSProperties } = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 12px',
    fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    position: 'relative',
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    display: 'inline-block',
  },
  section: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#222',
    marginBottom: 14,
  },
  progressWrap: { marginBottom: 18 },
  progressOuter: {
    width: '100%',
    height: 10,
    background: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    background: 'linear-gradient(90deg,#ff8a00,#e52e71)',
    transition: 'width 0.3s',
  },
  buttonRow: { marginBottom: 18 },
  wakeBtn: {
    width: '100%',
    padding: '14px 0',
    fontSize: 15,
    fontWeight: 800,
    color: '#fff',
    background: '#e52e71',
    border: 'none',
    borderRadius: 10,
  },
  runZone: {
    position: 'relative',
    height: 150,
    background: '#f7f7fa',
    borderRadius: 10,
    border: '1px dashed #ccc',
  },
  runBtn: {
    position: 'absolute',
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    background: '#3a86ff',
    border: 'none',
    borderRadius: 10,
    transition: 'top 0.15s ease, left 0.15s ease',
  },
  toast: {
    position: 'fixed',
    top: 14,
    left: 12,
    right: 12,
    background: '#222',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    zIndex: 10000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    padding: 16,
  },
  modalBox: {
    background: '#fff',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 320,
  },
  decoyBtn: {
    position: 'absolute',
    padding: '8px 12px',
    fontSize: 12,
    background: '#f2f2f2',
    border: '1px solid #ccc',
    borderRadius: 6,
  },
};
