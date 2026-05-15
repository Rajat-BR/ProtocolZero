import { useState, useEffect, useRef } from "react";

const SAMPLE_LOGS = {
  "📥 Import Error": `Traceback (most recent call last):
  File "main.py", line 3, in <module>
    from services.email_sender import send_welcome_email
  File "/app/services/email_sender.py", line 7, in <module>
    import sendgrid
ModuleNotFoundError: No module named 'sendgrid'
Job failed: build_and_test`,

  "📦 Dependency": `Collecting flask==2.0.1
ERROR: pip's dependency resolver does not currently take into account all the packages that are installed.
flask 2.0.1 requires Werkzeug<2.1.0,>=2.0.0, but you have Werkzeug 3.0.2 which is incompatible.
ERROR: Could not install packages due to an OSError.
The command 'pip install -r requirements.txt' returned a non-zero code: 1`,

  "⚠️ Syntax": `File "app/routes.py", line 47
    def get_user(user_id)
                         ^
SyntaxError: expected ':'
Error: Process completed with exit code 1.
##[error]Python syntax check failed.`,

  "🧪 Test Fail": `============================= test session starts ==============================
collected 24 items
tests/test_payment.py::test_refund FAILED
AssertionError: assert 'pending' == 'refunded'
2 failed, 22 passed in 4.32s`,

  "🔑 Env Var": `Starting application...
Traceback (most recent call last):
  File "server.py", line 12, in <module>
    DB_URL = os.environ["DATABASE_URL"]
KeyError: 'DATABASE_URL'
Error: Process completed with exit code 1.`,
};

const FAILURE_META = {
  dependency_error: { label: "Dependency Error", color: "#f97316", bg: "#f9731615", icon: "📦" },
  syntax_error:     { label: "Syntax Error",     color: "#ef4444", bg: "#ef444415", icon: "⚠️" },
  test_failure:     { label: "Test Failure",     color: "#a855f7", bg: "#a855f715", icon: "🧪" },
  missing_env_var:  { label: "Missing Env Var",  color: "#eab308", bg: "#eab30815", icon: "🔑" },
  import_error:     { label: "Import Error",     color: "#3b82f6", bg: "#3b82f615", icon: "📥" },
  unknown:          { label: "Unknown",          color: "#6b7280", bg: "#6b728015", icon: "❓" },
};

const VERDICT_COLOR = { HIGH: "#22c55e", MEDIUM: "#eab308", LOW: "#ef4444" };

const AGENTS = [
  { id: "classifier",  label: "Classifier Agent",   icon: "🔍", desc: "Identifying failure category" },
  { id: "rootcause",   label: "Root Cause Agent",   icon: "🧠", desc: "Tracing error origin" },
  { id: "fix",         label: "Fix Generator",      icon: "🔧", desc: "Crafting repair strategy" },
  { id: "validator",   label: "Validation Agent",   icon: "✅", desc: "Scoring diagnosis confidence" },
];

export default function App() {
  const [log, setLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [agentsDone, setAgentsDone] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const timerRefs = useRef([]);

  function clearTimers() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }

  function startFakeAgentAnimation(onComplete) {
    setAgentsDone([]);
    setActiveAgent(AGENTS[0].id);
    // Each agent "runs" for ~600ms, staggered
    AGENTS.forEach((agent, i) => {
      const activateAt = i * 650;
      const doneAt = activateAt + 600;

      const t1 = setTimeout(() => setActiveAgent(agent.id), activateAt);
      const t2 = setTimeout(() => {
        setAgentsDone((prev) => [...prev, agent.id]);
        if (i === AGENTS.length - 1) {
          setActiveAgent(null);
          onComplete();
        }
      }, doneAt);

      timerRefs.current.push(t1, t2);
    });
  }

  async function analyze() {
    if (!log.trim()) { setError("Paste a CI/CD log first."); return; }
    setError("");
    setResult(null);
    setLoading(true);
    clearTimers();

    // Fire API + fake animation in parallel
    const apiPromise = fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log }),
    });

    // Animation takes ~2.6s regardless of API speed
    const animationPromise = new Promise((resolve) => startFakeAgentAnimation(resolve));

    try {
      // Wait for BOTH — whichever takes longer wins (usually API)
      const [res] = await Promise.all([apiPromise, animationPromise]);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed to connect. Is the backend running on :8000?");
    } finally {
      setLoading(false);
      setActiveAgent(null);
    }
  }

  const meta = result ? (FAILURE_META[result.failure_type] || FAILURE_META.unknown) : null;

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logoRow}>
            <span style={s.logoBracket}>&lt;</span>
            <span style={s.logoText}>CI/CD</span>
            <span style={s.logoBracket}>/&gt;</span>
          </div>
          <h1 style={s.title}>Autonomous Failure Diagnosis</h1>
          <p style={s.subtitle}>4-agent AI pipeline · OpenRouter · Real-time analysis</p>
        </div>
      </header>

      <main style={s.main}>
        {/* ── Input ── */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.cardIcon}>📋</span>
            <span style={s.cardTitle}>CI/CD Log Input</span>
          </div>

          <div style={s.sampleRow}>
            <span style={s.sampleLabel}>Load sample:</span>
            {Object.entries(SAMPLE_LOGS).map(([label, val]) => (
              <button key={label} style={s.sampleBtn} onClick={() => { setLog(val); setResult(null); setError(""); }}>
                {label}
              </button>
            ))}
          </div>

          <textarea
            style={s.textarea}
            placeholder="Paste your build or test failure log here…"
            value={log}
            onChange={(e) => setLog(e.target.value)}
            rows={9}
          />

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          <button style={{ ...s.runBtn, opacity: loading ? 0.65 : 1 }} onClick={analyze} disabled={loading}>
            {loading ? "Analyzing…" : "⚡  Run Diagnosis"}
          </button>
        </div>

        {/* ── Agent Pipeline (always visible when loading OR done) ── */}
        {(loading || result) && (
          <div style={s.card}>
            <div style={s.cardHead}>
              <span style={s.cardIcon}>🤖</span>
              <span style={s.cardTitle}>Agent Pipeline</span>
              {result && <span style={s.pipelineDone}>All agents completed</span>}
            </div>
            <div style={s.agentGrid}>
              {AGENTS.map((agent, i) => {
                const done = agentsDone.includes(agent.id);
                const active = activeAgent === agent.id;
                return (
                  <div key={agent.id} style={{
                    ...s.agentCard,
                    borderColor: done ? "#22c55e44" : active ? "#58a6ff44" : "#21262d",
                    background: done ? "#22c55e08" : active ? "#58a6ff08" : "#0d1117",
                  }}>
                    <div style={s.agentTop}>
                      <span style={s.agentIcon}>{agent.icon}</span>
                      <span style={{
                        ...s.agentStatus,
                        color: done ? "#22c55e" : active ? "#58a6ff" : "#484f58",
                      }}>
                        {done ? "✓ Done" : active ? "● Running" : "○ Waiting"}
                      </span>
                    </div>
                    <div style={s.agentName}>{agent.label}</div>
                    <div style={s.agentDesc}>{agent.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <>
            {/* Failure type + time */}
            <div style={s.card}>
              <div style={s.failureRow}>
                <div style={{ ...s.failurePill, background: meta.bg, borderColor: meta.color + "55" }}>
                  <span style={s.failurePillIcon}>{meta.icon}</span>
                  <span style={{ ...s.failurePillLabel, color: meta.color }}>{meta.label}</span>
                </div>
                <span style={s.timeTag}>⏱ {(result.processing_time_ms / 1000).toFixed(1)}s</span>
              </div>
            </div>

            {/* Root cause */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardIcon}>🧠</span>
                <span style={s.cardTitle}>Root Cause</span>
              </div>
              <div style={s.rootCauseBox}>
                <div style={{ ...s.rcAccent, background: meta.color }} />
                <p style={s.rcText}>{result.root_cause}</p>
              </div>
            </div>

            {/* Fixes */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardIcon}>🔧</span>
                <span style={s.cardTitle}>Suggested Fixes</span>
              </div>
              <div style={s.fixList}>
                {result.fixes.map((fix, i) => (
                  <div key={i} style={s.fixRow}>
                    <div style={{ ...s.fixNum, background: meta.color }}>{i + 1}</div>
                    <span style={s.fixText}>{fix}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <span style={s.cardIcon}>✅</span>
                <span style={s.cardTitle}>Validation Report</span>
              </div>
              <div style={s.validRow}>
                <div style={s.confBox}>
                  <div style={s.confLabel}>CONFIDENCE</div>
                  <div style={{ ...s.confValue, color: VERDICT_COLOR[result.verdict] || "#22c55e" }}>
                    {result.confidence}%
                  </div>
                  <div style={s.barTrack}>
                    <div style={{
                      ...s.barFill,
                      width: `${result.confidence}%`,
                      background: VERDICT_COLOR[result.verdict] || "#22c55e",
                    }} />
                  </div>
                </div>
                <div style={s.verdictBox}>
                  <div style={s.confLabel}>VERDICT</div>
                  <div style={{ ...s.verdictVal, color: VERDICT_COLOR[result.verdict] || "#22c55e" }}>
                    {result.verdict}
                  </div>
                </div>
              </div>
              <div style={s.notesBox}>
                <span style={s.notesIcon}>💬</span>
                <span style={s.notesText}>{result.validation_notes}</span>
              </div>
            </div>
          </>
        )}
      </main>

      <footer style={s.footer}>
        CI/CD Diagnosis System · Multi-Agent AI · OpenRouter
      </footer>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "'JetBrains Mono','Fira Code',monospace" },

  header: { borderBottom: "1px solid #21262d", background: "linear-gradient(160deg,#161b22 0%,#0d1117 100%)", padding: "28px 0" },
  headerInner: { maxWidth: 860, margin: "0 auto", padding: "0 24px", textAlign: "center" },
  logoRow: { fontSize: 26, letterSpacing: 3, marginBottom: 10 },
  logoBracket: { color: "#22c55e" },
  logoText: { color: "#58a6ff", margin: "0 6px" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#e6edf3" },
  subtitle: { fontSize: 12, color: "#8b949e", margin: 0, letterSpacing: 1 },

  main: { maxWidth: 860, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 18 },

  card: { background: "#161b22", border: "1px solid #21262d", borderRadius: 12, padding: 24 },
  cardHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: "#e6edf3", letterSpacing: 0.5, flex: 1 },
  pipelineDone: { fontSize: 11, color: "#22c55e", background: "#22c55e15", border: "1px solid #22c55e33", borderRadius: 20, padding: "3px 10px" },

  sampleRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  sampleLabel: { fontSize: 11, color: "#8b949e" },
  sampleBtn: { background: "#21262d", border: "1px solid #30363d", borderRadius: 6, color: "#8b949e", fontSize: 11, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", transition: "color .15s,border-color .15s" },

  textarea: { width: "100%", background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 1.65, padding: 14, resize: "vertical", boxSizing: "border-box", outline: "none" },

  errorBox: { background: "#2d1c1c", border: "1px solid #6e2b2b", borderRadius: 8, color: "#f87171", fontSize: 13, padding: "10px 14px", marginTop: 12 },

  runBtn: { marginTop: 16, width: "100%", background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, padding: "14px 0", transition: "opacity .2s" },

  // Agent grid
  agentGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
  agentCard: { border: "1px solid", borderRadius: 10, padding: "14px 12px", transition: "all .3s ease" },
  agentTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  agentIcon: { fontSize: 20 },
  agentStatus: { fontSize: 10, fontWeight: 600, letterSpacing: 0.5, transition: "color .3s" },
  agentName: { fontSize: 12, fontWeight: 600, color: "#c9d1d9", marginBottom: 4 },
  agentDesc: { fontSize: 10, color: "#484f58", lineHeight: 1.4 },

  // Failure badge
  failureRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  failurePill: { border: "1px solid", borderRadius: 24, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 },
  failurePillIcon: { fontSize: 20 },
  failurePillLabel: { fontSize: 15, fontWeight: 700, letterSpacing: 0.5 },
  timeTag: { fontSize: 12, color: "#8b949e" },

  // Root cause
  rootCauseBox: { display: "flex", gap: 0, background: "#0d1117", borderRadius: 8, overflow: "hidden" },
  rcAccent: { width: 4, flexShrink: 0, borderRadius: "4px 0 0 4px" },
  rcText: { fontSize: 13, lineHeight: 1.8, color: "#c9d1d9", margin: 0, padding: "14px 18px" },

  // Fixes
  fixList: { display: "flex", flexDirection: "column", gap: 10 },
  fixRow: { display: "flex", alignItems: "flex-start", gap: 14, background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "12px 16px" },
  fixNum: { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0d1117", flexShrink: 0, marginTop: 1 },
  fixText: { fontSize: 13, lineHeight: 1.65, color: "#c9d1d9" },

  // Validation
  validRow: { display: "flex", gap: 14, marginBottom: 16 },
  confBox: { flex: 2 },
  confLabel: { fontSize: 10, color: "#8b949e", letterSpacing: 1.5, marginBottom: 6 },
  confValue: { fontSize: 32, fontWeight: 700, marginBottom: 10 },
  barTrack: { height: 6, background: "#21262d", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, transition: "width 1s ease" },
  verdictBox: { flex: 1, background: "#0d1117", borderRadius: 10, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center" },
  verdictVal: { fontSize: 26, fontWeight: 700, letterSpacing: 2, marginTop: 6 },
  notesBox: { display: "flex", gap: 10, alignItems: "flex-start", borderTop: "1px solid #21262d", paddingTop: 14 },
  notesIcon: { fontSize: 16, flexShrink: 0 },
  notesText: { fontSize: 12, color: "#8b949e", lineHeight: 1.7 },

  footer: { textAlign: "center", padding: 24, fontSize: 11, color: "#30363d", letterSpacing: 1, borderTop: "1px solid #161b22" },
};