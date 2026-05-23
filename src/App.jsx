import { useState } from "react";

const TARGET_RANGES = {
  55: { bond: [15, 22], cash: [20, 28], index: [38, 55], stock: [0, 15] },
  60: { bond: [18, 25], cash: [22, 30], index: [33, 50], stock: [0, 12] },
};

const BUCKET_META = {
  bond:  { label: "購買力維持", emoji: "🛡️", color: "#c8a96e", desc: "債券・インフレ連動資産" },
  cash:  { label: "安全地帯",   emoji: "💴", color: "#7eb8a4", desc: "現金・預金" },
  index: { label: "購買力拡大", emoji: "📈", color: "#6b9fd4", desc: "インデックスファンド中心" },
  stock: { label: "個別株",     emoji: "🌱", color: "#d4896b", desc: "社会とのつながり" },
};

const BUCKET_KEYS = ["bond", "cash", "index", "stock"];

function formatMan(val) {
  if (!val || isNaN(val)) return "0万円";
  return `${Number(val).toLocaleString()}万円`;
}

// ルールベースのアドバイス生成
function generateAdvice(age, total, amounts, pcts, statuses, targets) {
  const issues = BUCKET_KEYS.filter(k => !statuses[k]);

  if (issues.length === 0) {
    return [
      "✅ バランスは目標範囲内です。",
      "",
      "このまま毎月の積立を継続してください。",
      "次回も月末に数字を入力して確認しましょう。",
    ].join("\n");
  }

  const lines = ["⚠️ 以下のバケットが目標範囲からずれています。\n"];

  issues.forEach(k => {
    const meta = BUCKET_META[k];
    const [min, max] = targets[k];
    const current = pcts[k];
    const isOver = current > max;
    const isUnder = current < min;
    const targetMid = Math.round((min + max) / 2);
    const targetAmt = Math.round((targetMid / 100) * total);
    const currentAmt = parseFloat(amounts[k]) || 0;
    const diff = Math.abs(targetAmt - currentAmt);

    if (isUnder) {
      lines.push(`${meta.emoji} 【${meta.label}】が不足しています`);
      lines.push(`　現在 ${current.toFixed(1)}%（目標 ${min}〜${max}%）`);
      if (k === "index") {
        lines.push(`　→ オルカンをあと約${diff}万円分、買い増しを検討してください。`);
        lines.push(`　→ プール資金があれば、このタイミングで投入するのも良いです。`);
      } else if (k === "bond") {
        lines.push(`　→ 個人向け国債（変動10年）などをあと約${diff}万円分、検討してください。`);
      } else if (k === "cash") {
        lines.push(`　→ 証券口座の現金をあと約${diff}万円分、増やしましょう。`);
        lines.push(`　→ 来月以降のプール資金をここに積み上げていきます。`);
      } else if (k === "stock") {
        lines.push(`　→ 個別株への投資余地があります。応援したい企業を検討してみてください。`);
      }
    } else if (isOver) {
      lines.push(`${meta.emoji} 【${meta.label}】が目標を超えています`);
      lines.push(`　現在 ${current.toFixed(1)}%（目標 ${min}〜${max}%）`);
      if (k === "cash") {
        lines.push(`　→ 現金が多めです。プール資金として温存しつつ、`);
        lines.push(`　　 次の下落時にインデックスへ移すことを検討してください。`);
      } else if (k === "stock") {
        lines.push(`　→ 個別株の比率が高くなっています。`);
        lines.push(`　　 新たな個別株購入は控え、インデックスに集中しましょう。`);
      } else if (k === "index") {
        lines.push(`　→ インデックスの比率が高め。現状維持で問題ありませんが、`);
        lines.push(`　　 他のバケットも少しずつ整えていきましょう。`);
      } else if (k === "bond") {
        lines.push(`　→ 債券比率が高めです。新規購入は一時停止し、`);
        lines.push(`　　 積立をインデックスに集中させましょう。`);
      }
    }
    lines.push("");
  });

  lines.push("📌 急いで動かす必要はありません。");
  lines.push("　毎月の積立を続けながら、少しずつ整えていきましょう。");

  return lines.join("\n");
}

function RangeBar({ pct, min, max, color }) {
  const inRange = pct >= min && pct <= max;
  const barPct = Math.min(pct, 100);
  return (
    <div style={{ position: "relative", height: 28, background: "#1a1a2e", borderRadius: 6, overflow: "hidden", marginTop: 6 }}>
      <div style={{
        position: "absolute", left: `${min}%`, width: `${max - min}%`,
        height: "100%", background: "rgba(255,255,255,0.07)",
        borderLeft: "1px dashed rgba(255,255,255,0.2)", borderRight: "1px dashed rgba(255,255,255,0.2)"
      }} />
      <div style={{
        position: "absolute", left: 0, width: `${barPct}%`, height: "100%",
        background: inRange ? color : "#c0392b",
        borderRadius: 6, transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)", opacity: 0.85
      }} />
      <div style={{
        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
        fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "monospace"
      }}>
        {pct.toFixed(1)}% <span style={{ opacity: 0.5 }}>目標 {min}–{max}%</span>
      </div>
    </div>
  );
}

function StatusDot({ inRange }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: inRange ? "#4ecca3" : "#e74c3c",
      boxShadow: inRange ? "0 0 6px #4ecca3" : "0 0 6px #e74c3c",
      marginRight: 6
    }} />
  );
}

export default function App() {
  const [age, setAge] = useState(55);
  const [amounts, setAmounts] = useState({ bond: "", cash: "", index: "", stock: "" });
  const [advice, setAdvice] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const targets = TARGET_RANGES[age] || TARGET_RANGES[55];
  const total = BUCKET_KEYS.reduce((s, k) => s + (parseFloat(amounts[k]) || 0), 0);

  const pcts = {};
  BUCKET_KEYS.forEach(k => {
    pcts[k] = total > 0 ? ((parseFloat(amounts[k]) || 0) / total) * 100 : 0;
  });

  const statuses = {};
  BUCKET_KEYS.forEach(k => {
    const [min, max] = targets[k];
    statuses[k] = pcts[k] >= min && pcts[k] <= max;
  });

  const allOk = Object.values(statuses).every(Boolean);
  const hasData = total > 0;

  function handleAdvice() {
    if (!hasData) return;
    const text = generateAdvice(age, total, amounts, pcts, statuses, targets);
    setAdvice(text);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d1a 0%, #12192b 60%, #0d0d1a 100%)",
      fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
      color: "#e8e0d0",
      padding: "24px 16px 48px",
      maxWidth: 480,
      margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#c8a96e", textTransform: "uppercase", marginBottom: 8 }}>
          Portfolio Monitor
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 300, margin: 0, color: "#f0e8d8", letterSpacing: 1 }}>
          資産バランス確認
        </h1>
      </div>

      {/* Month + Age selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4, letterSpacing: 2 }}>記録月</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{
              width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4a",
              borderRadius: 8, padding: "10px 12px", color: "#e8e0d0", fontSize: 14,
              outline: "none", boxSizing: "border-box"
            }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4, letterSpacing: 2 }}>年齢フェーズ</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[55, 60].map(a => (
              <button key={a} onClick={() => { setAge(a); setAdvice(""); }} style={{
                flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: age === a ? "1px solid #c8a96e" : "1px solid #2a2a4a",
                background: age === a ? "rgba(200,169,110,0.15)" : "#1a1a2e",
                color: age === a ? "#c8a96e" : "#666", cursor: "pointer", transition: "all 0.2s"
              }}>{a}歳〜</button>
            ))}
          </div>
        </div>
      </div>

      {/* Total */}
      {hasData && (
        <div style={{
          background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)",
          borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "center"
        }}>
          <div style={{ fontSize: 10, color: "#c8a96e", letterSpacing: 3, marginBottom: 4 }}>TOTAL</div>
          <div style={{ fontSize: 26, fontWeight: 300, letterSpacing: 2 }}>{formatMan(total)}</div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {BUCKET_KEYS.map(k => (
              <span key={k} style={{ fontSize: 10, color: statuses[k] ? "#4ecca3" : "#e74c3c", display: "flex", alignItems: "center" }}>
                <StatusDot inRange={statuses[k]} />{BUCKET_META[k].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Buckets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        {BUCKET_KEYS.map(k => {
          const meta = BUCKET_META[k];
          const [min, max] = targets[k];
          const inRange = statuses[k];
          return (
            <div key={k} style={{
              background: "#13131f",
              border: `1px solid ${inRange && hasData ? "rgba(78,204,163,0.2)" : hasData ? "rgba(231,76,60,0.2)" : "#1e1e32"}`,
              borderRadius: 14, padding: "16px 16px 14px", transition: "border-color 0.3s"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 20, marginRight: 10 }}>{meta.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{meta.desc}</div>
                </div>
                {hasData && <StatusDot inRange={inRange} />}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  fontSize: 12, color: "#666"
                }}>万円</span>
                <input
                  type="number"
                  placeholder="0"
                  value={amounts[k]}
                  onChange={e => { setAmounts(prev => ({ ...prev, [k]: e.target.value })); setAdvice(""); }}
                  style={{
                    width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4a",
                    borderRadius: 8, padding: "10px 12px 10px 40px", color: "#f0e8d8",
                    fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "monospace"
                  }}
                />
              </div>
              {hasData && <RangeBar pct={pcts[k]} min={min} max={max} color={meta.color} />}
            </div>
          );
        })}
      </div>

      {/* Advice button */}
      {hasData && (
        <button onClick={handleAdvice} style={{
          width: "100%", padding: "16px", borderRadius: 12, fontSize: 15, fontWeight: 700,
          border: "none", cursor: "pointer",
          background: allOk
            ? "linear-gradient(135deg, #2d6a4f, #4ecca3)"
            : "linear-gradient(135deg, #7b2d2d, #c0392b)",
          color: "#fff", letterSpacing: 1, transition: "all 0.3s",
        }}>
          {allOk ? "✓ バランス良好 — 詳細を確認する" : "⚠ ズレあり — アドバイスを見る"}
        </button>
      )}

      {/* Advice output */}
      {advice && (
        <div style={{
          marginTop: 20, background: "#13131f", border: "1px solid #2a2a4a",
          borderRadius: 14, padding: "18px 16px"
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#c8a96e", marginBottom: 12 }}>ADVISOR</div>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: "#d0c8b8", margin: 0, whiteSpace: "pre-wrap" }}>{advice}</p>
        </div>
      )}

      {!hasData && (
        <div style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 16 }}>
          各バケットに金額を入力してください
        </div>
      )}
    </div>
  );
}
