# DevForge

**Forge Your Skills. Build Your Career.**

DevForge is a developer-focused learning and SDE interview-preparation platform covering **DSA,
Full Stack Development, AI/ML, Computer Science Fundamentals, PostgreSQL, DevOps, Testing &
Security, System Design, Generative AI, AI Automation, Number Theory and SDE Interview
Preparation** — with structured roadmaps, a 3D hero, global search, 5 themes and a full mock
interview simulator backed by Google sign-in and Firestore.

## Project Overview

DevForge treats **DSA as the soul of software engineering preparation** — and keeps it in its own
dedicated learning and problem-solving section. Interview Prep is deliberately **not** another DSA
problem bank: it focuses on realistic SDE interview questions across CS fundamentals, development,
databases, PostgreSQL, AI/ML, DevOps, security, system design and project-based technical
discussion.

The interview simulator generates **daily randomized question sets** (seeded per user + day, so
they are stable for the day yet never repeat the same order), tracks **confidence, correctness,
time, streaks, badges and revision history**, and automatically builds a **3-day revision queue**
from mistakes, timeouts and low-confidence answers.

## Key Features

### Learning

- **DSA learning roadmap** — 5-phase skill graph with animated popups (arrays → DP → build → AI → mastery)
- **Full Stack Development** — React, TypeScript, Node.js, REST APIs, auth tracks
- **AI/ML Development** — ML core, deep learning, LLMs, RAG, AI agents
- **CS Fundamentals** — OOPs, DBMS, Operating Systems, Computer Networks, COA
- **DevOps** — Docker, CI/CD, Kubernetes, deployment, cloud fundamentals
- **Testing & Security** — unit/integration/API testing, OWASP fundamentals
- **System Design** — HLD, LLD, scalability, caching, load balancing
- **Generative AI & AI Automation** — prompt engineering, AI APIs, agentic workflows
- **Number Theory** — primes, modular arithmetic, combinatorics
- **PostgreSQL** — a dedicated track inside learning and a dedicated interview category
- Chapter-level lecture/notes slots with an honest "coming soon" policy — only verified, official
  documentation URLs are marked as real links

### Interview Preparation

- **Today's Questions** — a fresh randomized interview set every day, generated from the question
  database with recency + weak-topic weighting (never hardcoded in the frontend)
- **Real interview-style question types** — conceptual, scenario-based, code analysis, debugging,
  MCQ, technical explanation, comparison, practical coding, SQL/PostgreSQL, system design,
  project-based and behavioral-technical
- **Easy / Medium / Hard difficulty** that changes the question content, not just a label
- **Question-specific timers** — per-question time limit derived from difficulty, type and topic
- **Automatic editor** — Monaco opens the right environment per question language (JS, TS, Python,
  C++, Java) and a **SQL/PostgreSQL editor** for database questions
- **System Design workspace** — structured design-answer sections (Requirements, APIs, Data Model,
  Architecture, Scaling & Caching, Trade-offs)
- **Knowledge/confidence percentage** — self-assessment (0–100% with quick 25/50/75/100 shortcuts)
  recorded *before* answers are revealed, enabling perceived-vs-actual performance comparison
- **Knowledge Recorded popup** — confidence, correctness, time, topic and difficulty at a glance
- **Answer explanations** — correct answer, why it is correct, common mistakes, interview tips and
  related concepts; code answers render as code, SQL answers as SQL
- **Voice answer feature** — browser text-to-speech with play/pause/resume/stop (never autoplays)
- **Last 3 Days Revision** — automatically collects questions answered incorrectly, marked
  low-confidence, timed out, or saved for revision; prioritized by severity, not chronology
- **Personalized question selection** — attempts, correctness, confidence, time and recently
  practiced topics all feed the selection engine; weak topics (e.g. PostgreSQL indexing answered
  at 40% confidence) are prioritized in future revision sets
- **Interview streak** — current + longest streak with a 🔥 flame display
- **Achievement badges** — original DevForge artwork at 15/30/60/90/120/150/180-day milestones
  (locked 🔒 until earned, then 🏆), with next-badge progress

## Interview Question Philosophy

> **Interview Prep is not another DSA problem bank.**

DSA problems are **intentionally excluded** from Interview Prep because DSA has its own dedicated
practice section inside DevForge. A highlighted notice on the Interview Prep page states this
explicitly so users are never confused about where to practice what.

Instead, Interview Prep focuses on questions that test:

- Conceptual understanding — "Why would you use X instead of Y?"
- Technical reasoning — "What happens internally when…?"
- Scenario-based decision making — "Your API suddenly receives 10x traffic. What changes?"
- Debugging — realistic broken code to diagnose and fix
- Code analysis — output, complexity, runtime behavior of real snippets
- Practical development — implement middleware, validation, hooks, endpoints
- PostgreSQL — MVCC, isolation levels, EXPLAIN ANALYZE, window functions, JSONB, partitioning
- AI/ML — RAG failure modes, hallucination mitigations, LLM engineering decisions
- DevOps — Dockerfile caching, CI pipeline design, CrashLoopBackOff debugging
- Security — token storage, SQL injection mitigation, login-rate-limit audits
- System Design — URL shortener, rate limiter, notification system, food-delivery API
- Project-based technical discussion — architecture walkthroughs, trade-off reversals

Every question is designed to pass one filter: **"Could this realistically be asked during an SDE
internship or SDE-1 technical interview?"** Generic "What is React?"-style fillers are excluded.

## Tech Stack

### Frontend

- **React 18** + **TypeScript**
- **Vite** — dev server & production build
- **Tailwind CSS** — theme-tokenized styling (5 themes)
- **Framer Motion** — page transitions and micro-interactions
- **React Router** — lazy-loaded animated routes

### UI / Interactive

- **Lucide React** — iconography
- **React Three Fiber + three.js** — 3D particle hero background
- **Monaco Editor** (@monaco-editor/react) — code/SQL editor inside interview mocks

### Authentication

- **Google Authentication** via Firebase Auth — Google login only

### Backend

- **Firebase (client SDK)** — Auth + Firestore accessed directly from the app; no separate API
  server is required

### Database

- **Cloud Firestore** — per-user interview data (attempts, streak, badges, saved questions, daily
  sets, served log), keyed by the Google account's unique UID
- **localStorage fallback** — when Firebase env vars are absent the app runs in a clearly-labelled
  demo mode with identical functionality persisted locally

### Deployment

- Any static host for the Vite build output (`dist/`) — Vercel, Netlify, GitHub Pages or Firebase
  Hosting all work with zero config beyond the env vars below

## Project Structure

```text
DevForge/
├── src/
│   ├── components/
│   │   ├── interview/      MockRunner, MonacoEditor, StreakPanel, ReviseCard, HowToGuide
│   │   ├── ui/             Modal, ProgressRing, ImportanceBadge, EmptyState
│   │   ├── Navbar.tsx      nav, ⌘K search overlay, theme menu, Google auth
│   │   ├── Hero.tsx        3D hero with floating code snippets
│   │   └── ...             FloatingRoadmap, ChapterList, ImportantPopup, Footer, ErrorBoundary
│   ├── pages/              Home, LearningPath, TopicDetails, CSFundamentals,
│   │                       InterviewPrep, Resources, Progress
│   ├── hooks/
│   │   ├── useInterviewData.tsx   attempts/streak/badges/saved/daily-sets store (Firestore+local)
│   │   ├── useSelectionEngine.ts  seeded daily sets, mixed-mock distribution, weak-topic bias
│   │   ├── useSpeech.ts           text-to-speech (play/pause/resume/stop)
│   │   ├── useProgress.tsx        chapter progress & bookmarks
│   │   └── useTheme.tsx           5 persisted themes
│   ├── context/            AuthContext (Firebase Google sign-in / demo fallback)
│   ├── lib/                firebase.ts (lazy app/auth/firestore init)
│   ├── data/
│   │   ├── interview/      types, topics + mock modes, question bank (cs/postgres/specialist/scenarios)
│   │   ├── topics.ts       curriculum, chapters & resource slots
│   │   └── learningResources.ts  roadmap graph, search index, platform stats
│   ├── types/              shared domain types
│   ├── three/              SceneBackground (R3F particle field)
│   └── App.tsx             providers, lazy routes, animated transitions
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .env.example
└── README.md
```

## Authentication

DevForge uses **Google Login only**.

- Sign-in is handled by **Firebase Google Authentication** (popup flow, `select_account` prompt)
- The **session** is observed via `onAuthStateChanged`; the user's Google UID is the identity used
  to key all Firestore data — never a password (none is ever collected or stored)
- **Profile information**: display name, email and avatar render in the navbar account menu
- **Logout** fully revokes the local session (`signOut`)
- **Protected data**: interview attempts, streaks and badges are stored under the signed-in user's
  UID; guests get an isolated local `guest` namespace. A clearly-labelled demo session (no network
  calls) exercises the UI when Firebase is not configured

## Interview Mock Flow

```text
Choose Interview Mode
        ↓
Select Topics / Mixed Interview
        ↓
Random Interview Questions
        ↓
Question-Specific Timer
        ↓
Answer Question
        ↓
Enter Knowledge/Confidence %
        ↓
Knowledge Recorded Popup
        ↓
View Correct Answer
        ↓
Explanation + Voice
        ↓
Next Question
        ↓
Interview Results
        ↓
Weak Areas + Revision
```

## Streak & Badge System

Completing a mock (3+ questions) marks the day active and extends the **Interview Streak** 🔥
(breaking a day resets the current streak; the longest streak is kept forever).

Original DevForge badge artwork — geometric glyphs in themed gradients, no third-party assets:

| Badge | Milestone |
|-------|-----------|
| ▲ | 15-Day Interview Streak |
| ◆ | 30-Day Interview Streak |
| ★ | 60-Day Interview Streak |
| ✦ | 90-Day Interview Streak |
| ⬢ | 120-Day Interview Streak |
| ❖ | 150-Day Interview Streak |
| ♛ | 180-Day Interview Streak |

Badges stay **locked** until the streak reaches the milestone, and the panel always shows
**Next Badge → N days** with live progress.

## Database

The app uses **Cloud Firestore** (noSQL) with a single per-user document plus the question bank as
typed data modules that feed the selection engine. Effective entities:

```text
interviewData/{uid}              ← Firestore document, keyed by Google UID
  ├── attempts[]                 ← question_attempts (one entry per answer)
  │     { userId, questionId, attemptedAt, isCorrect, confidencePercentage,
  │       timeTaken, difficulty, topic, language?, timedOut }
  ├── streak                     ← user_streaks { current, longest, lastActiveDate }
  ├── badges.unlocked[]          ← user_badges { days, unlockedAt }
  ├── saved[]                    ← saved_questions / revision marks
  ├── dailySets{mode:date}       ← daily_interviews (persisted generated sets)
  └── servedLog{date}            ← de-dup log to avoid immediate repetition
```

Supporting structures (in code, consumed by the engine):

```text
interview_questions   ← src/data/interview/questions/* (typed bank)
question_topics       ← src/data/interview/topics.ts (topics, subtopics, mock modes)
user_topic_progress   ← derived per-topic accuracy/confidence/time (weak-area detection)
revision_queue        ← derived last-3-days candidates (wrong, low-confidence, timed-out, saved)
```

## Environment Variables

```bash
cp .env.example .env
```

```env
# Firebase (Google sign-in + Firestore) — console.firebase.google.com
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

- `.env` is git-ignored; **never commit real keys or secrets**. Firebase web app config keys are
  public identifiers but still belong only in env vars.
- Without these variables the app runs in demo mode (no network calls, localStorage persistence).

## Installation

Requires **Node.js 18+** (Node 20 recommended).

```bash
git clone https://github.com/PrabhakarG001/DevForge.git
cd DevForge
npm install
```

### Environment & authentication setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. **Authentication → Sign-in method → enable Google**
3. **Authentication → Settings → Authorized domains**: add your dev/deploy domain
4. **Build → Firestore Database → Create database**
5. Copy the web app config into `.env` (see above) and restart the dev server

No separate database setup is needed — Firestore collections/documents are created on first write.

### Development & production

```bash
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview    # serve the production build locally
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc --noEmit` typecheck + production build |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check only |

## Screenshots

<!-- Placeholder checklist — capture screenshots and replace with actual images:
     ![Homepage](docs/screenshots/home.png) ... etc. Do not add fake images. -->

Screenshots to capture:

- [ ] Homepage
- [ ] 3D Hero
- [ ] Learning Roadmap
- [ ] CS Fundamentals
- [ ] Interview Dashboard
- [ ] Today's Questions
- [ ] Interview Question Interface
- [ ] PostgreSQL Interview
- [ ] Knowledge Percentage Popup
- [ ] Answer Explanation
- [ ] Streak Dashboard
- [ ] Badges
- [ ] Revision Mode

## Future Improvements

- More interview question datasets (company-pattern scenario packs, deeper PostgreSQL coverage)
- Advanced personalization — spaced-repetition scheduling (SM-2 style) for revision
- Better performance analytics — per-subtopic trend charts, confidence-vs-accuracy calibration
- More PostgreSQL scenarios — locking deep-dives, logical replication, performance tuning labs
- AI-powered answer evaluation — LLM-based grading of open-ended/design answers against rubrics
- Additional system-design exercises — interactive whiteboard with draggable components
- More compiler/language support — in-browser execution for Python/C++/Java (Piston/WASM runtimes)
- Advanced revision algorithms — time-of-day performance modeling, fatigue-aware set sizing

## License

Released under the [MIT License](LICENSE) — Copyright (c) 2026 Prabhakar Gupta.
