import { useState } from "react";

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

const FAILURE_LABELS = {
  dependency_error: { label: "Dependency Error", color: "#f97316", icon: "📦" },
  syntax_error: { label: "Syntax Error", color: "#ef4444", icon: "⚠️" },
  test_failure: { label: "Test Failure", color: "#a855f7", icon: "🧪" },
  missing_env_var: { label: "Missing Env Var", color: "#eab308", icon: "🔑" },
  import_error: { label: "Import Error", color: "#3b82f6", icon: "📥" },
  unknown: { label: "Unknown", color: "#6b7280", icon: "❓" },
};

const VERDICT_COLORS = {
  HIGH: "#22c55e",
  MEDIUM: "#eab308",
  LOW: "#ef4444",
};

export default function App() {
  const [log, setLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [agentStep, setAgentStep] = useState(0);

  const AGENT_STEPS = [
    "🔍 Classifier Agent analyzing...",
    "🧠 Root Cause Agent investigating...",
    "🔧 Fix Generator crafting solutions...",
    "✅ Validation Agent reviewing...",
  ];

  async function analyze() {
    if (!log.trim()) {
      setError("Please paste a CI/CD log first.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    setAgentStep(0);

    // Simulate agent steps visually
    const stepInterval = setInterval(() => {
      setAgentStep((prev) => {
        if (prev < AGENT_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1200);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed to connect to backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  const failureInfo = result
    ? FAILURE_LABELS[result.failure_type] || FAILURE_LABELS.unknown
    : null;

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoBracket}>&lt;</span>
            <span style={styles.logoText}>CI/CD</span>
            <span style={styles.logoBracket}>/&gt;</span>
          </div>
          <h1 style={styles.title}>Failure Diagnosis System</h1>
          <p style={styles.subtitle}>
            Multi-agent AI pipeline · Powered by Gemini
          </p>
        </div>
      </header>

      <main style={styles.main}>
        {/* Input Section */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📋</span>
            <h2 style={styles.cardTitle}>Paste CI/CD Log</h2>
          </div>

          {/* Sample log buttons */}
          <div style={styles.sampleRow}>
            <span style={styles.sampleLabel}>Load sample:</span>
            {Object.entries(SAMPLE_LOGS).map(([key, val]) => (
              <button
                key={key}
                style={styles.sampleBtn}
                onClick={() => setLog(val)}
              >
                {key}
              </button>
            ))}
          </div>

          <textarea
            style={styles.textarea}
            placeholder="Paste your build/test failure log here..."
            value={log}
            onChange={(e) => setLog(e.target.value)}
            rows={10}
          />

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          <button
            style={loading ? { ...styles.analyzeBtn, opacity: 0.7 } : styles.analyzeBtn}
            onClick={analyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "⚡ Run Diagnosis"}
          </button>
        </section>

        {/* Agent Pipeline Steps (shown while loading) */}
        {loading && (
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🤖</span>
              <h2 style={styles.cardTitle}>Agent Pipeline Running</h2>
            </div>
            <div style={styles.agentPipeline}>
              {AGENT_STEPS.map((step, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.agentStep,
                    opacity: i <= agentStep ? 1 : 0.3,
                    borderLeftColor: i <= agentStep ? "#22c55e" : "#374151",
                    transform: i === agentStep ? "translateX(6px)" : "none",
                  }}
                >
                  <span style={styles.agentStepText}>{step}</span>
                  {i < agentStep && <span style={styles.agentDone}>✓</span>}
                  {i === agentStep && (
                    <span style={styles.agentActive}>●</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results Section */}
        {result && (
          <>
            {/* Failure Type Badge */}
            <section style={styles.card}>
              <div style={styles.failureBadge}>
                <div
                  style={{
                    ...styles.badgePill,
                    backgroundColor: failureInfo.color + "22",
                    borderColor: failureInfo.color,
                  }}
                >
                  <span style={styles.badgeIcon}>{failureInfo.icon}</span>
                  <span
                    style={{ ...styles.badgeLabel, color: failureInfo.color }}
                  >
                    {failureInfo.label}
                  </span>
                </div>
                <div style={styles.processingTime}>
                  ⏱ {result.processing_time_ms}ms
                </div>
              </div>
            </section>

            {/* Root Cause */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>🧠</span>
                <h2 style={styles.cardTitle}>Root Cause</h2>
              </div>
              <p style={styles.rootCauseText}>{result.root_cause}</p>
            </section>

            {/* Fixes */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>🔧</span>
                <h2 style={styles.cardTitle}>Suggested Fixes</h2>
              </div>
              <ol style={styles.fixList}>
                {result.fixes.map((fix, i) => (
                  <li key={i} style={styles.fixItem}>
                    <span style={styles.fixNumber}>{i + 1}</span>
                    <span style={styles.fixText}>{fix}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Validation */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>✅</span>
                <h2 style={styles.cardTitle}>Validation Agent Report</h2>
              </div>
              <div style={styles.validationRow}>
                <div style={styles.confidenceBox}>
                  <div style={styles.confidenceLabel}>Confidence</div>
                  <div style={styles.confidenceValue}>
                    {result.confidence}%
                  </div>
                  <div style={styles.confidenceBar}>
                    <div
                      style={{
                        ...styles.confidenceFill,
                        width: `${result.confidence}%`,
                        backgroundColor:
                          VERDICT_COLORS[result.verdict] || "#22c55e",
                      }}
                    />
                  </div>
                </div>
                <div style={styles.verdictBox}>
                  <div style={styles.verdictLabel}>Verdict</div>
                  <div
                    style={{
                      ...styles.verdictValue,
                      color: VERDICT_COLORS[result.verdict] || "#22c55e",
                    }}
                  >
                    {result.verdict}
                  </div>
                </div>
              </div>
              <p style={styles.validationNotes}>
                💬 {result.validation_notes}
              </p>
            </section>
          </>
        )}
      </main>

      <footer style={styles.footer}>
        Built at Hackathon · Multi-Agent AI · Gemini 1.5 Flash
      </footer>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    backgroundColor: "#0d1117",
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  header: {
    borderBottom: "1px solid #21262d",
    padding: "24px 0",
    background: "linear-gradient(180deg, #161b22 0%, #0d1117 100%)",
  },
  headerInner: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "0 24px",
    textAlign: "center",
  },
  logo: {
    fontSize: 28,
    marginBottom: 8,
    letterSpacing: 2,
  },
  logoBracket: { color: "#22c55e" },
  logoText: { color: "#58a6ff", margin: "0 4px" },
  title: {
    fontSize: 26,
    fontWeight: 700,
    margin: "0 0 8px 0",
    color: "#e6edf3",
  },
  subtitle: {
    fontSize: 13,
    color: "#8b949e",
    margin: 0,
    letterSpacing: 1,
  },
  main: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  card: {
    background: "#161b22",
    border: "1px solid #21262d",
    borderRadius: 12,
    padding: "24px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardIcon: { fontSize: 20 },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    color: "#e6edf3",
    letterSpacing: 0.5,
  },
  sampleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  sampleLabel: { fontSize: 12, color: "#8b949e" },
  sampleBtn: {
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: 6,
    color: "#8b949e",
    fontSize: 11,
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  textarea: {
    width: "100%",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 8,
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    lineHeight: 1.6,
    padding: 14,
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  },
  errorBox: {
    background: "#2d1c1c",
    border: "1px solid #6e2b2b",
    borderRadius: 8,
    color: "#f87171",
    fontSize: 13,
    padding: "10px 14px",
    marginTop: 12,
  },
  analyzeBtn: {
    marginTop: 16,
    width: "100%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "14px 0",
    transition: "opacity 0.2s",
  },
  agentPipeline: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  agentStep: {
    borderLeft: "3px solid #374151",
    paddingLeft: 16,
    paddingTop: 8,
    paddingBottom: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.4s ease",
    borderRadius: "0 8px 8px 0",
    background: "#0d1117",
  },
  agentStepText: { fontSize: 13, color: "#c9d1d9" },
  agentDone: { color: "#22c55e", fontWeight: 700 },
  agentActive: { color: "#22c55e", animation: "pulse 1s infinite" },
  failureBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgePill: {
    border: "1px solid",
    borderRadius: 20,
    padding: "8px 18px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  badgeIcon: { fontSize: 18 },
  badgeLabel: { fontSize: 15, fontWeight: 700, letterSpacing: 0.5 },
  processingTime: { fontSize: 12, color: "#8b949e" },
  rootCauseText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#c9d1d9",
    margin: 0,
    background: "#0d1117",
    padding: 16,
    borderRadius: 8,
    borderLeft: "3px solid #58a6ff",
  },
  fixList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  fixItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "#0d1117",
    border: "1px solid #21262d",
    borderRadius: 8,
    padding: "12px 16px",
  },
  fixNumber: {
    background: "#22c55e",
    color: "#0d1117",
    borderRadius: "50%",
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1,
  },
  fixText: { fontSize: 13, lineHeight: 1.6, color: "#c9d1d9" },
  validationRow: { display: "flex", gap: 16, marginBottom: 16 },
  confidenceBox: { flex: 2 },
  confidenceLabel: { fontSize: 11, color: "#8b949e", marginBottom: 6, letterSpacing: 1 },
  confidenceValue: { fontSize: 28, fontWeight: 700, color: "#e6edf3", marginBottom: 8 },
  confidenceBar: {
    height: 8,
    background: "#21262d",
    borderRadius: 4,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.8s ease",
  },
  verdictBox: {
    flex: 1,
    background: "#0d1117",
    borderRadius: 8,
    padding: "12px 16px",
    textAlign: "center",
  },
  verdictLabel: { fontSize: 11, color: "#8b949e", marginBottom: 6, letterSpacing: 1 },
  verdictValue: { fontSize: 24, fontWeight: 700, letterSpacing: 2 },
  validationNotes: {
    fontSize: 13,
    color: "#8b949e",
    margin: 0,
    lineHeight: 1.6,
    borderTop: "1px solid #21262d",
    paddingTop: 14,
  },
  footer: {
    textAlign: "center",
    padding: "24px",
    fontSize: 11,
    color: "#484f58",
    letterSpacing: 1,
    borderTop: "1px solid #21262d",
  },
};
