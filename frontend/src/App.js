import { useState, useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════ */
const Y   = "#FFE500";   // neon yellow — THE accent
const YD  = "#FFE50018"; // yellow dim bg
const YM  = "#FFE50040"; // yellow mid
const BG  = "#050505";   // near-black bg
const C1  = "#111111";   // card bg
const C2  = "#1a1a1a";   // card border
const TXT = "#F0F0F0";   // primary text
const DIM = "#666666";   // dim text
const DM2 = "#333333";   // dimmer

const SAMPLE_LOGS = {
  dependency: `Step 3/10 : RUN pip install -r requirements.txt
Collecting flask==2.0.1
ERROR: pip's dependency resolver does not currently take into account all the packages
that are installed. flask 2.0.1 requires Werkzeug<2.1.0,>=2.0.0, but you have Werkzeug 3.0.2 which is incompatible.
ERROR: Could not install packages due to an OSError.
The command '/bin/sh -c pip install -r requirements.txt' returned a non-zero code: 1`,
  syntax: `File "app/routes.py", line 47
    def get_user(user_id)
                         ^
SyntaxError: expected ':'
Error: Process completed with exit code 1.
##[error]Python syntax check failed.`,
  test: `============================= test session starts ==============================
collected 24 items
tests/test_payment.py::test_refund FAILED
AssertionError: assert 'pending' == 'refunded'
2 failed, 22 passed in 4.32s`,
  env: `Starting application...
Traceback (most recent call last):
  File "server.py", line 12, in <module>
    DB_URL = os.environ["DATABASE_URL"]
KeyError: 'DATABASE_URL'
Error: Process completed with exit code 1.`,
  import: `Traceback (most recent call last):
  File "main.py", line 3, in <module>
    from services.email_sender import send_welcome_email
ModuleNotFoundError: No module named 'sendgrid'
Job failed: build_and_test`,
};

const FAILURE_META = {
  dependency_error: { label: "Dependency Error", color: "#FF9500" },
  syntax_error:     { label: "Syntax Error",     color: "#FF4545" },
  test_failure:     { label: "Test Failure",     color: Y         },
  missing_env_var:  { label: "Missing Env Var",  color: "#FFB800" },
  import_error:     { label: "Import Error",     color: "#00C8FF" },
  unknown:          { label: "Unknown",          color: DIM       },
};

const VERDICT_COLOR = { HIGH: "#AAFF00", MEDIUM: "#FFB800", LOW: "#FF4545" };

const AGENTS = [
  { id: 0, name: "CLASSIFIER",    sub: "Failure Type Detection",   desc: "Scans tokens · Matches error signatures · Tags category",      color: "#00C8FF" },
  { id: 1, name: "ROOT CAUSE",    sub: "Deep Reasoning Engine",    desc: "Traces stack frames · Correlates deps · Pinpoints origin",     color: Y        },
  { id: 2, name: "FIX GENERATOR", sub: "Patch Recommendation",     desc: "Queries solution DB · Crafts patches · Ranks by confidence",  color: "#FF9500" },
  { id: 3, name: "VALIDATOR",     sub: "Quality Assurance",        desc: "Cross-checks fixes · Scores confidence · Issues verdict",     color: "#AAFF00" },
];

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
function copyText(t) { navigator.clipboard?.writeText(t).catch(() => {}); }
function getTs() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ══════════════════════════════════════════════════
   LIVE CONSOLE
══════════════════════════════════════════════════ */
function LiveConsole({ lines }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div ref={ref} style={{
      background: "#000", border: `1px solid ${C2}`,
      borderLeft: `2px solid ${Y}`,
      borderRadius: "0 6px 6px 0",
      padding: "12px 14px", fontFamily: "inherit",
      fontSize: 11, lineHeight: 1.8,
      maxHeight: 150, overflowY: "auto", color: DIM,
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <span style={{ color: DM2, flexShrink: 0 }}>{l.time}</span>
          <span style={{ color: l.t === "ok" ? "#AAFF00" : l.t === "err" ? "#FF4545" : l.t === "run" ? Y : DIM }}>
            {l.text}
          </span>
        </div>
      ))}
      {lines.length > 0 && <span style={{ color: Y, animation: "blink 1s step-end infinite" }}>█</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   AGENT CARD
══════════════════════════════════════════════════ */
function AgentCard({ agent, status }) {
  const on  = status === "active";
  const done = status === "done";
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      border: `1px solid ${done ? agent.color + "60" : on ? agent.color : C2}`,
      borderLeft: `3px solid ${done ? agent.color : on ? agent.color : DM2}`,
      borderRadius: 6, padding: "12px 14px",
      background: on ? `${agent.color}0a` : done ? `${agent.color}06` : C1,
      transition: "all 0.35s ease",
      boxShadow: on ? `0 0 20px ${agent.color}25` : "none",
    }}>
      {on && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `linear-gradient(100deg, transparent 35%, ${agent.color}10 50%, transparent 65%)`,
          backgroundSize: "200% 100%", animation: "sweep 1.6s linear infinite",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: done || on ? agent.color : DM2,
          boxShadow: on ? `0 0 8px ${agent.color}, 0 0 16px ${agent.color}60` : done ? `0 0 5px ${agent.color}80` : "none",
          animation: on ? "pulseOrb 1s ease-in-out infinite" : "none",
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: done || on ? agent.color : DM2 }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 9, color: done || on ? "#888" : "#2a2a2a", marginTop: 1 }}>{agent.sub}</div>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
          color: done ? agent.color : on ? agent.color : DM2,
        }}>
          {done ? "✓ DONE" : on ? "LIVE" : "IDLE"}
        </span>
      </div>
      {(on || done) && (
        <div style={{
          fontSize: 10, color: "#555", lineHeight: 1.5,
          marginTop: 8, paddingTop: 8,
          borderTop: `1px solid ${agent.color}20`,
        }}>{agent.desc}</div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CONNECTOR
══════════════════════════════════════════════════ */
function Connector({ lit, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingLeft: 16, gap: 3, height: 24, justifyContent: "center" }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 1, height: 4,
          background: lit ? color : DM2,
          opacity: lit ? 1 - i * 0.2 : 1,
          transition: "background 0.5s",
        }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CONFIDENCE RING
══════════════════════════════════════════════════ */
function ConfRing({ val, color }) {
  const r = 34, c = 42, s = 5, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
      <svg width={84} height={84} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#1a1a1a" strokeWidth={s} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={s}
          strokeDasharray={circ} strokeDashoffset={circ - (val / 100) * circ}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease", filter: `drop-shadow(0 0 5px ${color})` }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{val}</span>
        <span style={{ fontSize: 8, color: DIM, letterSpacing: 1 }}>%</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COPY BUTTON
══════════════════════════════════════════════════ */
function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { copyText(text); setOk(true); setTimeout(() => setOk(false), 1800); }}
      style={{
        background: "none", border: `1px solid ${ok ? "#AAFF00" : DM2}`,
        borderRadius: 3, color: ok ? "#AAFF00" : DIM,
        fontSize: 9, padding: "2px 8px", cursor: "pointer",
        fontFamily: "inherit", letterSpacing: 1, transition: "all 0.2s", flexShrink: 0,
      }}>
      {ok ? "✓ COPIED" : "COPY"}
    </button>
  );
}

/* ══════════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════════ */
function SLabel({ text, color = Y }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 1, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color, textTransform: "uppercase" }}>{text}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════ */
export default function App() {
  const [log, setLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(-1);
  const [lines, setLines] = useState([
    { time: getTs(), text: "System initialized — 4 agents on standby.", t: "info" },
    { time: getTs(), text: "Awaiting CI/CD log input...", t: "info" },
  ]);
  const [history, setHistory] = useState([]);
  const iRef = useRef(null);

  function push(text, t = "info") {
    setLines(p => [...p.slice(-40), { time: getTs(), text, t }]);
  }

  async function analyze() {
    if (!log.trim()) { setError("Paste a CI/CD log to begin."); return; }
    setError(""); setResult(null); setLoading(true); setStep(0);
    push("─────────────── NEW REQUEST ───────────────", "info");
    push("Log received. Launching multi-agent pipeline...", "run");

    const msgs = [
      ["Classifier Agent → scanning error signatures...",     "run"],
      ["Root Cause Agent → tracing failure origin...",        "run"],
      ["Fix Generator   → building patch recommendations...", "run"],
      ["Validator Agent → running quality assurance...",      "run"],
    ];
    let s = 0;
    iRef.current = setInterval(() => {
      if (s < msgs.length) { push(msgs[s][0], msgs[s][1]); setStep(s); s++; }
      else clearInterval(iRef.current);
    }, 1100);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log }),
      });
      clearInterval(iRef.current);
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Server error"); }
      const data = await res.json();
      setStep(4); setResult(data);
      push(`Diagnosis complete — confidence: ${data.confidence}%`, "ok");
      push(`Verdict: ${data.verdict}  ·  Type: ${data.failure_type}`, "ok");
      setHistory(p => [{ result: data, log, ts: getTs() }, ...p].slice(0, 4));
    } catch (e) {
      clearInterval(iRef.current);
      setStep(-1);
      setError(e.message || "Cannot reach backend on :8000");
      push("ERROR: " + (e.message || "Backend unreachable"), "err");
    } finally { setLoading(false); }
  }

  const fi = result ? (FAILURE_META[result.failure_type] || FAILURE_META.unknown) : null;
  const vc = result ? (VERDICT_COLOR[result.verdict] || "#AAFF00") : "#AAFF00";

  function agSt(id) {
    if (result) return "done";
    if (step === -1) return "idle";
    if (id < step) return "done";
    if (id === step) return "active";
    return "idle";
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TXT, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* background grid */
        body {
          background-image:
            linear-gradient(rgba(255,229,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,229,0,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
          background-attachment: fixed;
        }

        @keyframes pulseOrb  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.5} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes sweep     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hScan     { 0%{top:-2px} 100%{top:100vh} }
        @keyframes titleGlow { 0%,100%{text-shadow:0 0 30px #FFE50060,0 0 60px #FFE50020} 50%{text-shadow:0 0 50px #FFE500a0,0 0 100px #FFE50040} }

        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#000}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        textarea:focus { border-color:${Y} !important; box-shadow:0 0 0 2px ${YM} !important; outline:none; }
        .sbtn:hover  { border-color:${Y} !important; color:${Y} !important; background:#111 !important; }
        .fix-row:hover { border-color:#333 !important; }
        .hist-btn:hover { border-color:#333 !important; }
      `}</style>

      {/* Global horizontal scan line */}
      <div style={{
        position: "fixed", left: 0, right: 0, height: 1, zIndex: 100, pointerEvents: "none",
        background: `linear-gradient(90deg,transparent 0%,${Y}50 50%,transparent 100%)`,
        animation: "hScan 12s linear infinite",
      }} />

      {/* ══════════════════════════════════════════
          HEADER — big, centered, impressive
      ══════════════════════════════════════════ */}
      <header style={{
        position: "relative",
        borderBottom: `1px solid ${C2}`,
        background: "#000",
        padding: "0 40px",
        overflow: "hidden",
      }}>
        {/* Top yellow neon bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${Y} 30%, ${Y} 70%, transparent 100%)`,
          boxShadow: `0 0 18px ${Y}, 0 0 36px ${YM}`,
        }} />

        {/* Corner brackets */}
        {[
          { top: 14, left: 24 },
          { top: 14, right: 24 },
          { bottom: 14, left: 24 },
          { bottom: 14, right: 24 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", ...pos,
            width: 14, height: 14,
            borderTop:    i < 2  ? `2px solid ${Y}` : "none",
            borderBottom: i >= 2 ? `2px solid ${Y}` : "none",
            borderLeft:   i % 2 === 0 ? `2px solid ${Y}` : "none",
            borderRight:  i % 2 === 1 ? `2px solid ${Y}` : "none",
            opacity: 0.7,
          }} />
        ))}

        {/* Glow orb behind title */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 500, height: 200, borderRadius: "50%",
          background: `radial-gradient(ellipse, ${Y}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Main header content — CENTERED */}
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", padding: "36px 0 32px" }}>

          {/* Eyebrow line */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ flex: 1, maxWidth: 120, height: 1, background: `linear-gradient(90deg, transparent, ${Y}60)` }} />
            <span style={{ fontSize: 9, color: Y, letterSpacing: 4, fontWeight: 700 }}>
              HACKOASIS 2026 · AGENTIC AI DEVTOOLS
            </span>
            <div style={{ flex: 1, maxWidth: 120, height: 1, background: `linear-gradient(270deg, transparent, ${Y}60)` }} />
          </div>

          {/* Giant title */}
          <h1 style={{
            fontSize: 42, fontWeight: 800, letterSpacing: 2, lineHeight: 1.1,
            color: "#fff", margin: "0 0 10px",
            animation: "titleGlow 3s ease-in-out infinite",
          }}>
            CI/CD Failure
            <br />
            <span style={{ color: Y }}>Diagnosis System</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: 13, color: DIM, letterSpacing: 2, margin: "14px 0 0" }}>
            AUTONOMOUS  ·  MULTI-AGENT  ·  AI-POWERED 
          </p>

          {/* Agent status strip */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 22, flexWrap: "wrap" }}>
            {AGENTS.map(a => {
              const st = agSt(a.id);
              return (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  border: `1px solid ${st !== "idle" ? a.color + "50" : "#222"}`,
                  borderRadius: 20, padding: "5px 14px",
                  background: st !== "idle" ? `${a.color}08` : "#0a0a0a",
                  transition: "all 0.3s",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: st !== "idle" ? a.color : "#333",
                    boxShadow: st === "active" ? `0 0 8px ${a.color}, 0 0 14px ${a.color}60` : "none",
                    animation: st === "active" ? "pulseOrb 1s infinite" : "none",
                  }} />
                  <span style={{
                    fontSize: 9, letterSpacing: 2, fontWeight: 700,
                    color: st !== "idle" ? a.color : "#444",
                  }}>{a.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom yellow neon bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${Y}50 50%, transparent 100%)`,
        }} />
      </header>

      {/* ══════════════════════════════════════════
          MAIN LAYOUT
      ══════════════════════════════════════════ */}
      <div style={{
        maxWidth: 1300, margin: "0 auto",
        padding: "28px 32px 60px",
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 20, alignItems: "start",
      }}>

        {/* ════ LEFT COLUMN ════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Log Input ── */}
          <div style={CARD}>
            <SLabel text="Input Log" color={Y} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ fontSize: 9, color: "#444", letterSpacing: 2 }}>SAMPLES:</span>
              {Object.keys(SAMPLE_LOGS).map(k => (
                <button key={k} className="sbtn" style={{
                  background: "#0a0a0a", border: "1px solid #222", borderRadius: 3,
                  color: "#555", fontSize: 9, padding: "3px 10px",
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, transition: "all 0.15s",
                }} onClick={() => { setLog(SAMPLE_LOGS[k]); setResult(null); setStep(-1); }}>
                  {k}
                </button>
              ))}
            </div>
            <textarea
              value={log}
              onChange={e => setLog(e.target.value)}
              rows={10}
              placeholder="> Paste your CI/CD failure log here..."
              style={{
                width: "100%", background: "#000",
                border: `1px solid ${C2}`, borderRadius: 6,
                color: "#ccc", fontFamily: "inherit",
                fontSize: 12, lineHeight: 1.7, padding: "12px 14px",
                resize: "vertical", transition: "all 0.2s",
              }}
            />
            {error && (
              <div style={{
                marginTop: 12, background: "#110000",
                border: "1px solid #440000", borderLeft: "3px solid #FF4545",
                borderRadius: "0 6px 6px 0",
                color: "#FF8888", fontSize: 12, padding: "10px 14px",
              }}>
                ■ {error}
              </div>
            )}
            <button onClick={analyze} disabled={loading} style={{
              marginTop: 14, width: "100%",
              background: loading ? "#111" : Y,
              border: `1px solid ${loading ? "#333" : Y}`,
              borderRadius: 6, color: loading ? "#555" : "#000",
              fontFamily: "inherit", fontSize: 13, fontWeight: 800,
              letterSpacing: 3, padding: "14px 0",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : `0 0 20px ${Y}50, 0 0 40px ${Y}20`,
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              {loading
                ? <><span style={{ animation: "pulseOrb 0.8s infinite", fontSize: 8 }}>●</span> AGENTS RUNNING…</>
                : "⚡  INITIATE DIAGNOSIS"}
            </button>
          </div>

          {/* ── Console ── */}
          <div style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 3, height: 14, background: Y, borderRadius: 1, boxShadow: `0 0 6px ${Y}` }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: Y }}>SYSTEM CONSOLE</span>
              <span style={{
                marginLeft: "auto", fontSize: 8, letterSpacing: 2,
                border: `1px solid #AAFF0060`, borderRadius: 10,
                padding: "2px 10px", color: "#AAFF00",
                animation: "pulseOrb 2s infinite",
              }}>● LIVE</span>
            </div>
            <LiveConsole lines={lines} />
          </div>

          {/* ── Results ── */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp 0.4s ease" }}>

              {/* Failure banner */}
              <div style={{
                ...CARD,
                border: `1px solid ${fi.color}50`,
                borderLeft: `3px solid ${fi.color}`,
                background: `${fi.color}08`,
                boxShadow: `0 0 24px ${fi.color}15`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 8,
                      border: `1px solid ${fi.color}60`,
                      background: `${fi.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 12px ${fi.color}40`,
                      fontSize: 22,
                    }}>⬡</div>
                    <div>
                      <div style={{ fontSize: 9, color: fi.color, letterSpacing: 3, marginBottom: 4 }}>FAILURE DETECTED</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: fi.color, letterSpacing: 0.5 }}>{fi.label}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    {[["VERDICT", result.verdict, vc], ["RESPONSE TIME", `${result.processing_time_ms}ms`, "#555"]].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 4 }}>{l}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Root cause */}
              <div style={CARD}>
                <SLabel text="Root Cause Analysis" color="#BB88FF" />
                <div style={{
                  background: "#000", border: `1px solid ${C2}`,
                  borderLeft: "3px solid #BB88FF",
                  borderRadius: "0 6px 6px 0", padding: "14px 16px",
                }}>
                  <p style={{ fontSize: 13, lineHeight: 1.8, color: "#ccc", margin: 0 }}>{result.root_cause}</p>
                </div>
              </div>

              {/* Fixes */}
              <div style={CARD}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 3, height: 14, background: "#FF9500", borderRadius: 1, boxShadow: "0 0 6px #FF9500" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: "#FF9500" }}>GENERATED FIXES</span>
                  <span style={{
                    marginLeft: "auto", fontSize: 9, color: "#FF9500",
                    border: "1px solid #FF950040", borderRadius: 10, padding: "1px 10px",
                  }}>{result.fixes.length} patches</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.fixes.map((fix, i) => (
                    <div key={i} className="fix-row" style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      background: "#000", border: `1px solid ${C2}`,
                      borderRadius: 6, padding: "12px 14px", transition: "border-color 0.2s",
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: "#FF9500", color: "#000",
                        fontSize: 10, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 1, boxShadow: "0 0 8px #FF950060",
                      }}>{i + 1}</div>
                      <span style={{ fontSize: 12, lineHeight: 1.7, color: "#bbb", flex: 1 }}>{fix}</span>
                      <CopyBtn text={fix} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation */}
              <div style={CARD}>
                <SLabel text="Validation Report" color="#AAFF00" />
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <ConfRing val={result.confidence} color={vc} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 10 }}>AGENT NOTES</div>
                    <p style={{ fontSize: 12, color: "#888", lineHeight: 1.8, margin: 0 }}>{result.validation_notes}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── History ── */}
          {history.length > 0 && (
            <div style={CARD}>
              <SLabel text="Diagnosis History" color={DIM} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((h, i) => {
                  const hfi = FAILURE_META[h.result.failure_type] || FAILURE_META.unknown;
                  return (
                    <button key={i} className="hist-btn"
                      onClick={() => { setLog(h.log); setResult(h.result); setStep(4); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: "#000", border: `1px solid ${C2}`,
                        borderRadius: 6, padding: "9px 14px",
                        cursor: "pointer", fontFamily: "inherit",
                        textAlign: "left", width: "100%", transition: "border-color 0.15s",
                      }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: hfi.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#bbb", flex: 1 }}>{hfi.label}</span>
                      <span style={{ fontSize: 10, color: DIM }}>{h.result.confidence}% conf</span>
                      <span style={{ fontSize: 9, color: "#333" }}>{h.ts}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT COLUMN — sticky agent pipeline ════ */}
        <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Pipeline header card */}
          <div style={{ ...CARD, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 3, height: 14, background: Y, borderRadius: 1, boxShadow: `0 0 8px ${Y}` }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: TXT }}>Agent Pipeline</span>
            </div>
            <p style={{ fontSize: 10, color: DIM, lineHeight: 1.6, marginLeft: 13 }}>
              4 specialized agents run in sequence — each hands off to the next
            </p>
          </div>

          {/* Agents */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {AGENTS.map((a, i) => (
              <div key={a.id}>
                <AgentCard agent={a} status={agSt(a.id)} />
                {i < AGENTS.length - 1 && <Connector lit={step > i || result !== null} color={AGENTS[i + 1].color} />}
              </div>
            ))}
          </div>

          {/* Status card */}
          <div style={{
            ...CARD,
            border: result ? `1px solid #AAFF0040` : loading ? `1px solid ${YM}` : `1px solid ${C2}`,
            padding: "14px 18px", transition: "all 0.4s",
          }}>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 3, marginBottom: 10 }}>PIPELINE STATUS</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: result ? 12 : 0 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: result ? "#AAFF00" : loading ? Y : "#333",
                boxShadow: result ? "0 0 8px #AAFF00" : loading ? `0 0 10px ${Y}` : "none",
                animation: loading ? "pulseOrb 1s infinite" : "none",
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 1,
                color: result ? "#AAFF00" : loading ? Y : "#444",
              }}>
                {result ? "DIAGNOSIS COMPLETE" : loading ? "PIPELINE RUNNING" : "AWAITING INPUT"}
              </span>
            </div>
            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  ["Failure",    fi?.label,                  fi?.color],
                  ["Confidence", `${result.confidence}%`,    vc],
                  ["Verdict",    result.verdict,              vc],
                  ["Patches",    `${result.fixes?.length}`,  "#FF9500"],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: DIM }}>{l}</span>
                    <span style={{ fontSize: 10, color: c, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Architecture reference */}
          <div style={{ ...CARD, padding: "14px 18px", borderColor: "#151515" }}>
            <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, marginBottom: 12 }}>ARCHITECTURE</div>
            {[
              ["Input",   "Raw CI/CD log",         Y],
              ["A1",      "Classify failure",       "#00C8FF"],
              ["A2",      "Root cause reasoning",   "#BB88FF"],
              ["A3",      "Patch generation",       "#FF9500"],
              ["A4",      "Validate + score",       "#AAFF00"],
              ["Output",  "Structured diagnosis",   TXT],
            ].map(([lbl, desc, c], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, flexShrink: 0, boxShadow: `0 0 4px ${c}80` }} />
                <span style={{ fontSize: 9, color: c, fontWeight: 700, width: 44, flexShrink: 0, letterSpacing: 0.5 }}>{lbl}</span>
                <span style={{ fontSize: 9, color: "#444" }}>{desc}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        borderTop: `1px solid ${C2}`, padding: "16px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#000",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${Y}30, transparent)`,
        }} />
        <span style={{ fontSize: 9, color: "#333", letterSpacing: 2 }}>
          HACKOASIS · MULTI-AGENT CI/CD DIAGNOSIS
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          {["GEMINI 1.5 FLASH", "4 AGENTS", "AGENTIC AI"].map(t => (
            <span key={t} style={{
              fontSize: 8, color: "#333", letterSpacing: 2,
              border: "1px solid #1a1a1a", borderRadius: 3, padding: "2px 8px",
            }}>{t}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHARED CARD STYLE
══════════════════════════════════════════════════ */
const CARD = {
  background: C1,
  border: `1px solid ${C2}`,
  borderRadius: 8,
  padding: "20px 22px",
};
