import type { IQuestion } from '../types';

const q = (x: IQuestion): IQuestion => x;

export const AIML_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-ml-001', topic: 'aiml', subTopic: 'Machine Learning', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'A model scores 0.95 train / 0.62 validation AUC. What is the FIRST thing to try?',
    options: [
      'Train longer',
      'Add regularization / more data / simpler model (address overfitting)',
      'Lower the learning rate only',
      'Trust the training score',
    ],
    correctOption: 1,
    answer: 'Address overfitting: regularization, more data, feature cleanup or a simpler model.',
    explanation: 'A large train/validation gap is the definition of overfitting; training longer widens it.',
    commonMistakes: 'Tuning the learning rate while ignoring the gap; trusting train AUC.',
    interviewTip: 'Follow with k-fold CV and leakage checks.',
    relatedConcepts: ['Bias-variance', 'Cross-validation', 'Leakage'],
  }),
  q({
    id: 'i-ml-002', topic: 'aiml', subTopic: 'RAG', difficulty: 'medium',
    questionType: 'conceptual', estimatedTime: 150,
    question: 'In a RAG system the retriever fetches relevant docs but answers are still wrong. Where do you look?',
    answer: 'Check the generation side first: is the context actually placed in the prompt, is the model ignoring it, are chunks too large/small, and is the answer grounded (citation check)? Then retrieval quality: recall@k of the retriever, embedding model fit, chunk overlap, re-ranking. Log and eval with a labeled Q/A set.',
    explanation: 'RAG failures split into retrieval failures (wrong/no chunks) and generation failures (right chunks, wrong answer). Diagnose which before tuning.',
    commonMistakes: 'Tuning chunk size blindly without a retrieval eval set.',
    interviewTip: 'Name a metric: faithfulness/groundedness scoring or recall@k.',
    relatedConcepts: ['Chunking', 'Re-ranking', 'Evaluation harnesses'],
  }),
  q({
    id: 'i-ml-003', topic: 'aiml', subTopic: 'LLMs', difficulty: 'hard',
    questionType: 'conceptual', estimatedTime: 150,
    question: 'Why do LLMs hallucinate, and what are two engineering mitigations?',
    answer: 'LLMs generate the most likely continuation — not verified truth — so gaps in training knowledge plus sampling produce fluent fabrications. Mitigations: ground responses with retrieval (RAG) and require citations; constrain outputs (structured outputs/function calling, validation layers) and route low-confidence cases to fallbacks.',
    explanation: 'Hallucination is a property of probabilistic next-token generation, not a bug that "training more" simply removes.',
    commonMistakes: 'Claiming temperature=0 eliminates hallucination.',
    interviewTip: 'Mention eval: build a golden set and measure groundedness.',
    relatedConcepts: ['Grounding', 'Structured outputs', 'Guardrails'],
  }),
  q({
    id: 'i-ml-004', topic: 'aiml', subTopic: 'AI Application Development', difficulty: 'medium',
    questionType: 'coding', language: 'python', estimatedTime: 240,
    question: 'Write a Python function that calls an LLM API with retries, exponential backoff and a timeout, returning the text or raising after max retries.',
    starterCode: 'import time\n\ndef call_llm(prompt: str, max_retries: int = 3):\n    # your code\n    pass',
    answer: `import time
import random

def call_llm(prompt: str, max_retries: int = 3) -> str:
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                timeout=10,
            )
            return resp.choices[0].message.content
        except Exception:
            if attempt == max_retries:
                raise
            sleep_for = delay + random.uniform(0, 0.5)  # jitter
            time.sleep(sleep_for)
            delay *= 2
    raise RuntimeError("unreachable")`,
    explanation: 'Backoff prevents hammering a rate-limited API; jitter avoids synchronized retries across workers; a per-call timeout bounds worst-case latency.',
    commonMistakes: 'Retrying without backoff/jitter; retrying non-retryable errors (400s).',
    interviewTip: 'Mention idempotency and budget caps for production calls.',
    relatedConcepts: ['Exponential backoff', 'Rate limits', 'Timeouts'],
  }),
];

export const DEVOPS_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-do-001', topic: 'devops', subTopic: 'Docker', difficulty: 'easy',
    questionType: 'mcq', estimatedTime: 75,
    question: 'Which ordering makes a Dockerfile cache-friendly for a Node app?',
    options: [
      'COPY . . → npm ci → CMD',
      'COPY package*.json → npm ci → COPY . . → CMD',
      'COPY . . → npm ci → npm cache clean',
      'RUN npm ci → COPY . . → CMD',
    ],
    correctOption: 1,
    answer: 'COPY manifests → npm ci → COPY source.',
    explanation: 'Layer cache invalidates downward; copying only manifests first lets npm ci stay cached when only source changes.',
    commonMistakes: 'COPY . . first, reinstalling deps every build.',
    interviewTip: 'Mention multi-stage builds to keep runtime images small.',
    relatedConcepts: ['Layer caching', 'Multi-stage builds'],
  }),
  q({
    id: 'i-do-002', topic: 'devops', subTopic: 'CI/CD', difficulty: 'medium',
    questionType: 'conceptual', estimatedTime: 150,
    question: 'Design a CI pipeline for a TypeScript monorepo with web + api packages. What runs, in what order, and what do you cache?',
    answer: 'On PR: install (cache node_modules/pnpm store keyed on lockfile) → lint → typecheck → affected-only unit tests → build both packages → integration tests against ephemeral services (testcontainers) → on main: build/push Docker images with SHA tags → deploy staging → smoke tests → manual gate → prod. Cache: dependency store, build artifacts (turbo/nx remote cache), Docker layers.',
    explanation: 'Fail fast left-to-right; run only what the diff affects; artifact promotion means the exact tested bytes get deployed.',
    commonMistakes: 'No caching (slow pipelines get skipped); testing everything always (slow) or nothing (risky).',
    interviewTip: 'Mention required status checks and environment protection rules.',
    relatedConcepts: ['Remote caching', 'Testcontainers', 'GitOps'],
  }),
  q({
    id: 'i-do-003', topic: 'devops', subTopic: 'Kubernetes', difficulty: 'hard',
    questionType: 'conceptual', estimatedTime: 180,
    question: 'Pods are CrashLoopBackOff after a deploy. Walk through your debugging order.',
    answer: 'kubectl describe pod (events: image pull, probe failures, OOMKilled) → logs (current and --previous) → check liveness/readiness probe paths and thresholds vs app startup → resource limits (OOM) → config: missing env/ConfigMap/Secret keys → roll back via kubectl rollout undo while investigating.',
    explanation: 'CrashLoopBackOff is a restart loop; the events + previous-container logs distinguish bad image, bad config, failing probes, and OOM.',
    commonMistakes: 'Re-deploying blindly without reading describe events; missing --previous logs of the crashed container.',
    interviewTip: 'Mention readiness vs liveness semantics — liveness kills, readiness gates traffic.',
    relatedConcepts: ['Probes', 'Resource limits', 'rollout undo'],
  }),
  q({
    id: 'i-do-004', topic: 'devops', subTopic: 'Cloud Fundamentals', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'Your API needs static assets cached globally and dynamic APIs proxied. Which pairing fits?',
    options: [
      'EC2 + EBS volumes',
      'CDN for assets + reverse proxy/edge for API routing',
      'Cron jobs uploading to S3 hourly',
      'A bigger single server',
    ],
    correctOption: 1,
    answer: 'CDN for static assets + edge/reverse proxy (or gateway) for dynamic routes.',
    explanation: 'Static content belongs at the edge close to users; dynamic requests need routing, auth and origin selection at a gateway.',
    commonMistakes: 'Serving assets from app servers; no cache invalidation strategy.',
    interviewTip: 'Mention cache headers: immutable hashed assets vs no-store APIs.',
    relatedConcepts: ['CDN', 'Cache headers', 'API gateway'],
  }),
];

export const SECURITY_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-sec-001', topic: 'testing-security', subTopic: 'Security Fundamentals', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'Which change actually mitigates SQL injection?',
    options: [
      'Escaping quotes in input',
      'Parameterized queries / prepared statements',
      'Hiding error messages',
      'Input length limits',
    ],
    correctOption: 1,
    answer: 'Parameterized queries — data is never parsed as SQL.',
    explanation: 'Prepared statements send the query shape and parameters separately, so input can’t alter structure. Escaping is error-prone; hiding errors is not a fix.',
    commonMistakes: 'Manual escaping/blacklists; ORM raw-query escape hatches.',
    interviewTip: 'Mention least-privilege DB users as defense in depth.',
    relatedConcepts: ['OWASP Top 10', 'Least privilege'],
  }),
  q({
    id: 'i-sec-002', topic: 'testing-security', subTopic: 'Authentication', difficulty: 'hard',
    questionType: 'conceptual', estimatedTime: 180,
    question: 'Design token storage for a SPA + API: access token and refresh token. Where does each live and why?',
    answer: 'Access token in memory (JS variable) — short-lived (5–15 min), sent as Authorization header. Refresh token in an httpOnly, Secure, SameSite=Strict cookie scoped to the auth endpoint path — long-lived, rotated on every use, revocable server-side. No tokens in localStorage (XSS-readable). CSRF protection for the cookie endpoint (SameSite + origin checks).',
    explanation: 'XSS steals localStorage; in-memory access tokens limit blast radius, and httpOnly cookies keep the refresh token invisible to JS.',
    commonMistakes: 'Long-lived JWTs in localStorage; refresh tokens in JS-readable storage.',
    interviewTip: 'Discuss rotation + reuse detection for stolen refresh tokens.',
    relatedConcepts: ['XSS', 'CSRF', 'Token rotation'],
  }),
  q({
    id: 'i-sec-003', topic: 'testing-security', subTopic: 'Unit Testing', difficulty: 'medium',
    questionType: 'conceptual', estimatedTime: 120,
    question: 'You inherit a module with 80% line coverage that still breaks in production. Why does coverage mislead, and what do you add?',
    answer: 'Line coverage says code executed, not behavior verified — asserts may be trivial. Add: behavior tests around observable outputs/contracts, boundary cases (empty, none, huge, unicode), error paths and retries, property-based tests for parsers, and contract tests at integration seams. Track mutation testing to score assert strength.',
    explanation: 'Coverage is a lagging indicator; assertion strength and case selection determine whether regressions are caught.',
    commonMistakes: 'Chasing a coverage number with snapshot-everything tests.',
    interviewTip: 'Name the pyramid: many unit, fewer integration, few E2E.',
    relatedConcepts: ['Test pyramid', 'Mutation testing', 'Contract testing'],
  }),
  q({
    id: 'i-sec-004', topic: 'testing-security', subTopic: 'API Testing', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'Your integration tests hit a shared staging database and flake. What is the standard fix?',
    options: [
      'Retry flaky tests until green',
      'Per-test isolated fixtures: transactions/testcontainers + seeded data per run',
      'Run tests only at night',
      'Disable DB-related tests',
    ],
    correctOption: 1,
    answer: 'Isolate state per test/run — transactions rolled back, or ephemeral containers with fresh seeds.',
    explanation: 'Shared mutable state is the root cause of inter-test coupling and flakiness; isolation makes order irrelevant.',
    commonMistakes: 'Sleep-based waits; test-order dependence.',
    interviewTip: 'Mention testcontainers for real-engine parity without shared staging.',
    relatedConcepts: ['Testcontainers', 'Fixture seeding', 'Determinism'],
  }),
];

export const SYSDESIGN_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-sd-001', topic: 'system-design', subTopic: 'Caching', difficulty: 'medium',
    questionType: 'conceptual', estimatedTime: 150,
    question: 'Your cache hit rate is 92% but the API is still slow. Diagnose.',
    answer: 'High hit rate ≠ fast: check (1) large objects — network/serialization dominates; (2) hot keys funnelling to one node (add replication/single-flight); (3) TTL storms — many keys expiring together causing origin stampedes; (4) cache is in-band: per-request chain still does DB calls for uncached parts; (5) client-side latency (TLS, cold connections) or payload size. Measure p95/p99 per step, not averages.',
    explanation: 'Tail latency often lives outside the cache — serialization, fan-out, and key concentration.',
    commonMistakes: 'Optimizing hit rate while ignoring payload size and fan-out.',
    interviewTip: 'Say "measure p99 per hop" — interviewers reward the tail-latency mindset.',
    relatedConcepts: ['Single-flight', 'Jittered TTLs', 'p99 latency'],
  }),
  q({
    id: 'i-sd-002', topic: 'system-design', subTopic: 'Scalability', difficulty: 'hard',
    questionType: 'system-design', estimatedTime: 420,
    question: 'Design a rate limiter for a public API. Cover algorithm choice, distributed state, failure behavior, and headers.',
    answer: `Requirements: per-key limits (e.g., 100 req/min), burst tolerance, distributed deployment.

Algorithm: sliding window counter (approximate) or token bucket for burst control; exact sliding-window log only if audit-grade.

Distributed state: Redis with INCR/EXPIRE or Lua for atomicity; shard by key; local in-memory pre-check to cut Redis load (accept minor drift).

Failure behavior: fail-open or fail-closed per business risk; degrade to local limits if Redis is down.

Response: 429 with Retry-After; X-RateLimit-Limit/Remaining/Reset headers.

Trade-offs: token bucket smooths bursts but allows short overshoot; sliding log is exact but memory-heavy.`,
    explanation: 'The design must state precision vs cost, failure semantics and the observable contract — those are the senior-level signals.',
    commonMistakes: 'No discussion of Redis atomicity or fail-open vs fail-closed.',
    interviewTip: 'Back-of-envelope: 10k keys × counters — memory is trivial; contention is the real issue.',
    relatedConcepts: ['Token bucket', 'Redis Lua', '429 semantics'],
  }),
  q({
    id: 'i-sd-003', topic: 'system-design', subTopic: 'High-Level Design', difficulty: 'hard',
    questionType: 'system-design', estimatedTime: 420,
    question: 'Design a URL shortener. Include ID generation, redirect path, analytics, and trade-offs.',
    answer: `API: POST /shorten {longUrl} → 201 {code}; GET /:code → 301/302.

ID: base62 of a distributed counter (per-node ranges or Snowflake) — collision-free, short codes. Hash-based (md5 prefix) risks collisions + rehashing.

Redirect: GET /:code hits cache (Redis, long TTL) → DB KV lookup → 302 (analytics-friendly) or 301 (cacheable by browsers). Return location header; CDN edge cache for hot codes.

Analytics: fire-and-forget events to a queue → async aggregation (avoid write path impact).

DB: KV store or Postgres (code PK, long_url, created_by, expires_at).

Scale math: 100M new/month ≈ 40/s writes — modest; reads dominate → cache aggressively.

Trade-offs: 301 (browser caches, no analytics) vs 302 (analytics, more origin hits); custom domains; abuse control (spam blocklists).`,
    explanation: 'The core decisions are ID strategy and 301 vs 302; analytics placement shows awareness of read/write path separation.',
    commonMistakes: 'Random short codes without collision handling; ignoring abuse vectors.',
    interviewTip: 'Lead with requirements and estimates — interviewers score structure.',
    relatedConcepts: ['Base62', 'Key-value stores', 'Edge caching'],
  }),
  q({
    id: 'i-sd-004', topic: 'system-design', subTopic: 'Load Balancing', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'Which LB algorithm fits long-lived WebSocket connections on unevenly-sized nodes?',
    options: [
      'Round robin',
      'Least-connections (weighted)',
      'Random',
      'Source-IP hash alone',
    ],
    correctOption: 1,
    answer: 'Weighted least-connections.',
    explanation: 'With long-lived heterogeneous connections, least-connections adapts to actual load; round robin overloads small nodes; IP hash ignores node capacity.',
    commonMistakes: 'Round robin for WebSocket; forgetting health checks.',
    interviewTip: 'Mention sticky sessions at the connection layer and graceful draining.',
    relatedConcepts: ['L7 vs L4 LB', 'Sticky sessions', 'Health checks'],
  }),
];

export const APTITUDE_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-ap-001', topic: 'aptitude', subTopic: 'Number Theory', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 120,
    question: 'What is the remainder when 7^100 is divided by 13?',
    options: ['1', '5', '9', '12'], correctOption: 2,
    answer: '9',
    explanation: '7^12 ≡ 1 (mod 13) by Fermat. 100 = 12·8 + 4, so 7^100 ≡ 7^4 = 2401 ≡ 2401 − 184·13 = 2401 − 2392 = 9 (mod 13).',
    commonMistakes: 'Computing 7^100 directly; misapplying the cycle length (12, not 13).',
    interviewTip: 'State Fermat’s little theorem before computing — structure scores.',
    relatedConcepts: ['Fermat’s little theorem', 'Fast exponentiation'],
  }),
  q({
    id: 'i-ap-002', topic: 'aptitude', subTopic: 'Quantitative Aptitude', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'A machine fills 3 tanks in 42 minutes. How long for 5 tanks at the same rate?',
    options: ['60 min', '70 min', '75 min', '84 min'], correctOption: 1,
    answer: '70 min',
    explanation: 'Rate: 42/3 = 14 min/tank; 5 × 14 = 70. Direct proportion — no compounding.',
    commonMistakes: 'Multiplying 42 × 5/3 incorrectly or averaging.',
    interviewTip: 'Verbalize the unit rate first; it prevents almost every error.',
    relatedConcepts: ['Unit rates', 'Direct proportion'],
  }),
  q({
    id: 'i-ap-003', topic: 'aptitude', subTopic: 'Logical Reasoning', difficulty: 'easy',
    questionType: 'mcq', estimatedTime: 75,
    question: 'All engineers in the room wear badges. Ravi does not wear a badge. What follows?',
    options: [
      'Ravi is not an engineer',
      'Ravi is an engineer',
      'Ravi is a manager',
      'Nothing follows',
    ],
    correctOption: 0,
    answer: 'Ravi is not an engineer (contrapositive).',
    explanation: 'From "all engineers wear badges", non-badge-wearer ⇒ not an engineer. The converse (badge ⇒ engineer) does NOT follow.',
    commonMistakes: 'Affirming the converse.',
    interviewTip: 'Name the fallacy explicitly — it signals formal-reasoning training.',
    relatedConcepts: ['Contrapositive', 'Converse error'],
  }),
];
