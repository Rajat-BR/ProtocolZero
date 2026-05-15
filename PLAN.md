# 🚀 CI/CD Failure Diagnosis — Hackathon Master Plan
## 5-Hour MVP Playbook for 4 Beginners

---

## 📁 FOLDER STRUCTURE

```
cicd-diagnosis/
├── backend/
│   ├── main.py          ← FastAPI app + /analyze endpoint
│   ├── llm.py           ← ONE reusable Gemini wrapper
│   ├── classifier.py    ← Agent 1: classifies failure type
│   ├── rootcause.py     ← Agent 2: explains root cause
│   ├── fixgenerator.py  ← Agent 3: generates step-by-step fixes
│   ├── validator.py     ← Agent 4: validates & scores confidence
│   └── requirements.txt
├── frontend/
│   └── src/
│       └── App.jsx      ← Complete React UI (single file)
├── sample_logs.py       ← 5 test logs (one per failure type)
└── PLAN.md              ← This file
```

---

## ⚡ SETUP IN 5 MINUTES

### Backend
```bash
cd backend
pip install -r requirements.txt
# Add your Gemini API key in llm.py  OR  set env var:
export GEMINI_API_KEY=your_key_here
uvicorn main:app --reload
# → API running at http://localhost:8000
```

### Frontend
```bash
npx create-react-app frontend   # OR: npm create vite@latest frontend -- --template react
cd frontend
# Copy App.jsx into src/
npm start
# → UI at http://localhost:3000
```

### Test the API
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"log": "ModuleNotFoundError: No module named sendgrid"}'
```

---

## 👥 TEAM SPLIT (4 MEMBERS)

| Person | Role | Owns |
|--------|------|------|
| **Dev A** | Backend Lead | main.py, requirements.txt, test curl commands |
| **Dev B** | LLM/Agents | llm.py, classifier.py, rootcause.py |
| **Dev C** | LLM/Agents | fixgenerator.py, validator.py, prompt tuning |
| **Dev D** | Frontend | App.jsx, styling, sample logs, demo prep |

> Dev A + B start first. Dev C + D can start 20 min later once llm.py is working.

---

## 🕐 HOUR-BY-HOUR TIMELINE

### Hour 1 (0:00 – 1:00) — Foundation
- [ ] Get Gemini API key → test it works
- [ ] Set up backend folder, install requirements
- [ ] Write llm.py → test ask_llm("say hello") works
- [ ] Write classifier.py → test with one sample log
- [ ] Set up React app with create-react-app

### Hour 2 (1:00 – 2:00) — Core Agents
- [ ] Write rootcause.py + test
- [ ] Write fixgenerator.py + test
- [ ] Write validator.py + test
- [ ] Wire all agents into main.py /analyze endpoint
- [ ] Test end-to-end with curl

### Hour 3 (2:00 – 3:00) — Integration
- [ ] Frontend: build textarea + analyze button
- [ ] Frontend: call the /analyze API
- [ ] Frontend: show failure_type + root_cause + fixes
- [ ] Fix CORS if needed (already in main.py)
- [ ] Test all 5 sample logs end-to-end

### Hour 4 (3:00 – 4:00) — Polish & Fixes
- [ ] Frontend: add confidence bar + verdict display
- [ ] Frontend: add sample log buttons
- [ ] Frontend: add agent pipeline animation (loading state)
- [ ] Tune prompts if outputs are bad quality
- [ ] Fix any broken parsing

### Hour 5 (4:00 – 5:00) — Demo Prep
- [ ] Test all 5 failure types
- [ ] Prepare your demo script (what you'll say)
- [ ] Screenshot/record backup in case of WiFi issues
- [ ] Practice the 3-minute demo walkthrough
- [ ] Add README if time allows

---

## 💡 EXAMPLE JSON RESPONSE

```json
{
  "failure_type": "import_error",
  "root_cause": "The application imports 'sendgrid' in email_sender.py line 7, but sendgrid is not installed in the environment. This causes ModuleNotFoundError at startup, preventing the server from running.",
  "fixes": [
    "Run: pip install sendgrid",
    "Add 'sendgrid' to requirements.txt so it's installed in CI",
    "Verify the package name: pip show sendgrid"
  ],
  "confidence": 92,
  "verdict": "HIGH",
  "validation_notes": "The diagnosis is accurate — ModuleNotFoundError for sendgrid is a clear missing dependency issue.",
  "processing_time_ms": 3842
}
```

---

## 🎭 WHAT TO MOCK IF TIME RUNS SHORT

If you're running behind, mock these in order (easiest first):

1. **Mock the Validation Agent** → return a hardcoded `{ confidence: 85, verdict: "HIGH" }`
2. **Mock the Fix Generator** → return 2 hardcoded strings based on failure_type
3. **Skip the animated pipeline UI** → just show a spinner
4. **Skip sample log buttons** → paste manually is fine
5. **Last resort: mock the entire backend**
   ```python
   # In main.py, bypass agents entirely:
   @app.post("/analyze")
   def analyze_log(input: LogInput):
       return {
           "failure_type": "import_error",
           "root_cause": "Mocked root cause for demo",
           "fixes": ["pip install missing_package", "Add to requirements.txt"],
           "confidence": 88,
           "verdict": "HIGH",
           "validation_notes": "Looks correct.",
           "processing_time_ms": 1200
       }
   ```

---

## ✨ HOW TO MAKE IT LOOK IMPRESSIVE

Even with simple code, these tricks make the demo shine:

1. **Agent pipeline animation** — show each step activating (already in App.jsx)
2. **Processing time** — display "3.8 seconds" to imply real computation
3. **Color-coded failure types** — each type has its own color badge
4. **Confidence meter** — animated bar chart looks professional
5. **Exact fix commands** — show `pip install X` not just "install X"
6. **Name your agents** — "Classifier Agent", "Root Cause Agent" sounds impressive
7. **Demo with 3 different logs** — show it works broadly, not just one case
8. **Architecture diagram slide** — draw the 4-agent pipeline on a slide before the demo

---

## 🚨 REALITY CHECK

### ✅ Realistic in 5 hours
- Working FastAPI backend with 4 agent functions
- Clean React UI that calls the API
- Good AI output for all 5 failure types
- Animated loading state showing pipeline
- Confidence score + verdict display
- 5 sample log buttons for quick testing

### ❌ Unrealistic in 5 hours
- Real CI/CD integration (GitHub Actions, Jenkins)
- Storing history / database
- User authentication
- Multiple model support / model switching UI
- Streaming responses
- PDF report generation
- Self-healing (auto-applying fixes)
- Real-time webhook listeners

### 🗑️ Cut these first if time runs out
1. Validation agent (cut first — fewest visual impact)
2. Sample log buttons (hardcode one sample to paste)
3. Agent animation (replace with spinner)
4. Processing time display
5. Confidence bar (just show number as text)

### 🔒 THE MINIMUM VIABLE DEMO (never cut these)
No matter what, preserve:
- **Input textarea** → user can paste a log
- **Analyze button** → calls the backend
- **Failure type display** → colored badge
- **At least 2-3 fix suggestions** → the core value prop
- **It works live** → not mocked

---

## 🪤 WHERE BEGINNERS GET STUCK — AND HOW TO AVOID IT

| Risk | How to Avoid |
|------|--------------|
| Gemini API key not set | Test `ask_llm("hello")` in hour 1 before writing any agent |
| CORS errors in browser | Already handled in main.py — don't remove the middleware |
| LLM returns garbage format | Add safety fallbacks in each agent (already done) |
| Prompts give bad output | Keep prompts short and direct; test each agent solo first |
| Frontend can't reach backend | Make sure backend is on port 8000; check the fetch URL |
| Vite/CRA setup takes too long | Use `npx create-react-app` — slower but reliable |
| Parsing the numbered list | Already handled in fixgenerator.py with fallback |
| LLM rate limits | Gemini free tier is generous; unlikely to hit in 5 hours |
| Import errors in Python | All files are in same folder; run `uvicorn main:app` from backend/ |

---

## 🏆 DEMO SCRIPT (3 MINUTES)

1. **(30s)** "We built an autonomous CI/CD failure diagnosis system using a multi-agent AI pipeline."
2. **(30s)** Show architecture: Log → Classifier → Root Cause → Fix Generator → Validator
3. **(60s)** Live demo: paste a real-looking log, click Analyze, watch agents run
4. **(30s)** Walk through the output: failure type, root cause, specific fixes, confidence
5. **(30s)** "We support 5 failure categories. Let me show another type." — paste second log.

---

## 📌 GEMINI API QUICK REFERENCE

```python
# Free tier limits (as of 2024):
# gemini-1.5-flash: 15 RPM, 1M tokens/day — MORE than enough

# Get API key at:
# https://aistudio.google.com/app/apikey

# Test it works:
import google.generativeai as genai
genai.configure(api_key="YOUR_KEY")
model = genai.GenerativeModel("gemini-1.5-flash")
print(model.generate_content("say hi").text)
```

---

Good luck. Start with llm.py. Everything else depends on that working first. 🚀
