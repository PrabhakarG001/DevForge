import type { IQuestion } from '../types';

const q = (x: IQuestion): IQuestion => x;

/**
 * Scenario / debugging / project-based questions that make the mock feel like
 * a real SDE interview. No generic "what is X" fillers — every question tests
 * reasoning, debugging or engineering judgment.
 */

export const SCENARIO_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-sc-001', topic: 'development', subTopic: 'React', difficulty: 'medium',
    questionType: 'debugging', language: 'javascript', estimatedTime: 210,
    question: `A React component re-renders every time its parent updates even though its props appear unchanged. Diagnose the cause and fix it.

function Parent() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return <Child title="Hello" items={["a", "b"]} onSelect={(i) => console.log(i)} />;
}`,
    starterCode: `// Child currently re-renders every second. Fix it.
function Child({ title, items, onSelect }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onSelect(item)}>{title}: {item}</li>
      ))}
    </ul>
  );
}`,
    answer: `The props are NOT actually unchanged — a new object/array and a new function are created on every Parent render, so Child sees new references and re-renders.

function Child({ title, items, onSelect }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onSelect(item)}>{title}: {item}</li>
      ))}
    </ul>
  );
}

const MemoChild = React.memo(Child);

function Parent() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const items = useMemo(() => ["a", "b"], []);
  const onSelect = useCallback((i) => console.log(i), []);
  return <MemoChild title="Hello" items={items} onSelect={onSelect} />;
}`,
    explanation: 'Reference equality, not value equality, decides whether memoized children bail out. Inline objects/arrays/functions are new references each render. Stabilize them with useMemo/useCallback (or move state down), then React.memo can actually skip the render.',
    commonMistakes: 'Wrapping the child in React.memo while still passing fresh inline props — memo then never bails out; "fixing" it by removing the interval instead of fixing prop identity.',
    interviewTip: 'Say "I would confirm with the React DevTools Profiler before optimizing" — measuring first is the senior signal.',
    relatedConcepts: ['Referential equality', 'React.memo', 'useMemo/useCallback', 'Profiler'],
  }),
  q({
    id: 'i-sc-002', topic: 'postgresql', subTopic: 'Query Optimization', difficulty: 'medium',
    questionType: 'scenario', language: 'sql', estimatedTime: 240,
    question: 'Your PostgreSQL query works correctly but became slow after the table grew from 100K to 20M rows. The query filters on created_at and joins to users. Walk through your investigation and the fixes you would apply, in order.',
    starterCode: `-- the slow query
SELECT o.id, u.name, o.total
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC
LIMIT 50;`,
    answer: `Investigation (in order):
1. EXPLAIN (ANALYZE, BUFFERS) the query — compare estimated vs actual rows, find the slow node.
2. Check pg_stat_user_tables: seq_scan counts, dead tuples (bloat) — is autovacuum keeping up?
3. Check the join: does orders(user_id) have an index? Is the planner choosing a hash join over a nested loop with index scan, and why (row estimates)?

Fixes (in order of likelihood):
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders (user_id);
-- if stats are stale after bulk loads:
ANALYZE orders;
-- if dead tuples are high:
VACUUM (ANALYZE) orders;  -- and tune autovacuum for this table

-- covering variant to enable index-only scans:
CREATE INDEX CONCURRENTLY idx_orders_created_at_cover
  ON orders (created_at DESC) INCLUDE (user_id, total);`,
    explanation: 'A query that was fine at 100K rows usually regresses because a Seq Scan became cheaper than a bad index plan at 20M rows, or because the sort for ORDER BY + LIMIT now spills to disk. The fix is a matching B-tree on created_at (ideally covering) plus healthy statistics and vacuum.',
    commonMistakes: 'Adding indexes blindly without reading EXPLAIN; missing the join-column index; forgetting that LIMIT 50 with ORDER BY on an unindexed column sorts all matching rows.',
    interviewTip: 'Structure the answer as measure → diagnose → fix → re-measure, and mention CONCURRENTLY for production index builds.',
    relatedConcepts: ['EXPLAIN ANALYZE', 'B-Tree Indexes', 'Index-only scans', 'Autovacuum', 'Work memory'],
  }),
  q({
    id: 'i-sc-003', topic: 'development', subTopic: 'Node.js', difficulty: 'medium',
    questionType: 'debugging', language: 'javascript', estimatedTime: 180,
    question: `This Express handler was supposed to return validation errors with 400, but clients receive 500 and an unhandled rejection warning in the logs. Identify the problem and fix it.

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!isValidEmail(email)) {
    throw new ApiError(400, "invalid email");
  }
  const user = await createUser(email, password);
  res.json({ ok: true, userId: user.id });
});`,
    answer: `Two problems: (1) a plain \`throw\` inside an async handler is an unhandled rejection — Express 4 does not catch it, so the promise rejects with nobody attached; (2) there is no error-forwarding middleware.

Fix — wrap or use express 5 / a tiny wrapper, plus a typed error middleware:

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.post("/signup", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!isValidEmail(email)) {
    return next(new ApiError(400, "invalid email"));
  }
  const user = await createUser(email, password);
  res.status(201).json({ ok: true, userId: user.id });
}));

// error middleware — must have 4 args, registered LAST
app.use((err, req, res, _next) => {
  const status = err instanceof ApiError ? err.status : 500;
  res.status(status).json({ error: err.message });
});`,
    explanation: 'Express 4 only routes errors to error middleware when they arrive via next(err); a thrown error inside an async function rejects the promise and never reaches next. The asyncHandler wrapper bridges that gap.',
    commonMistakes: 'Assuming try/catch-less async handlers are safe in Express 4; registering the error middleware before the routes.',
    interviewTip: 'Mention Express 5 handles rejected routers natively, but teams still standardize on wrappers for clarity.',
    relatedConcepts: ['Express error middleware', 'Unhandled rejections', 'Async handlers'],
  }),
  q({
    id: 'i-sc-004', topic: 'system-design', subTopic: 'Scalability', difficulty: 'hard',
    questionType: 'scenario', estimatedTime: 300,
    question: 'Your API normally serves 200 req/s but suddenly receives 10x traffic after a viral post. The database is the first bottleneck. What do you change — immediately and structurally?',
    answer: `Immediate (minutes):
- Enable/raise rate limiting at the gateway (429s) to shed load protectively.
- Turn on static responses / CDN caching for hot GETs; cache the viral content specifically.
- Increase read replicas and point read traffic at them (if already set up).
- Pre-warm/raise connection pool limits so the DB is not thrashing on connection storms.

Structural (days):
- Add a cache layer (Redis) for hot reads with TTL + single-flight to avoid stampedes.
- Make the API tier stateless so it can autoscale horizontally behind a load balancer.
- Move heavy/fan-out work to a queue (async workers) instead of serving it inline.
- Add DB read replicas permanently + consider partitioning the hot table.

Trade-offs: rate limiting risks disappointing real users; caching risks staleness — for a viral post, slightly stale is almost always acceptable.`,
    explanation: 'The interview is testing triage order: protect the database first (shed load, cache reads), then make the architecture scale horizontally. Naming specific mechanisms (single-flight, TTL jitter, queue fan-out) separates senior answers.',
    commonMistakes: 'Jumping to "buy a bigger DB" (vertical scaling) first; proposing caching without discussing staleness and stampede control.',
    interviewTip: 'Frame it as immediate vs structural — interviewers score composure and prioritization.',
    relatedConcepts: ['Rate limiting', 'CDN', 'Single-flight', 'Read replicas', 'Backpressure'],
  }),
  q({
    id: 'i-sc-005', topic: 'development', subTopic: 'Authentication', difficulty: 'hard',
    questionType: 'scenario', estimatedTime: 240,
    question: 'Users of your SPA report being randomly logged out after a deployment. The auth design is: JWT access token (15 min) in localStorage + refresh token in localStorage. Diagnose the likely causes and propose a robust fix.',
    answer: `Likely causes:
1. On deploy, the old bundle is evicted; in-flight SPA code holding the access token in memory is replaced — any token kept only in a JS variable is lost.
2. Multiple tabs race the refresh: two tabs refresh simultaneously with a one-time-use refresh token; the second request fails and logs the tab out.
3. The new deploy changed the token secret/issuer, invalidating all issued tokens (immediate global logout).

Robust fix:
- Move the refresh token to an httpOnly, Secure, SameSite=Strict cookie scoped to the refresh endpoint; keep the short-lived access token in memory only.
- Centralize refresh in a single-flight queue in the API client (one refresh at a time; other requests await it) and retry the original request once after refresh.
- On 401-after-refresh-failure, redirect to login — do not loop.
- Rotate refresh tokens on every use with reuse detection.
- Never store tokens in localStorage: XSS-readable.`,
    explanation: 'Random logouts around deploys are almost always token lifecycle races — multi-tab refresh races and in-memory token loss. The fix is standard: httpOnly refresh cookie + single-flight refresh + rotation.',
    commonMistakes: 'Extending the access token lifetime (worsens XSS blast radius); retrying refresh in a loop causing storms.',
    interviewTip: 'Explicitly compare localStorage vs httpOnly cookie XSS properties — that is the point of the question.',
    relatedConcepts: ['Token rotation', 'Single-flight refresh', 'XSS', 'CSRF'],
  }),
  q({
    id: 'i-sc-006', topic: 'cs-fundamentals', subTopic: 'Computer Networks', difficulty: 'medium',
    questionType: 'comparison', estimatedTime: 150,
    question: 'Compare HTTP/1.1, HTTP/2 and HTTP/3 for a media-heavy SPA. What actually changes on the wire, and what would you enable on the server?',
    answer: `HTTP/1.1: one in-flight request per TCP connection (HOL blocking at the application layer); browsers open ~6 connections; text protocol; HPACK not available.
HTTP/2: single TCP connection, binary framing, multiplexed streams — requests no longer queue behind each other; HPACK header compression; server push (rarely used). HOL blocking remains at the TCP layer: one lost packet stalls all streams.
HTTP/3: replaces TCP with QUIC over UDP — per-stream loss recovery, so a lost packet only stalls its own stream; 0-RTT resumption; connection migration across networks.

Server enablement: TLS required for h2/h3; serve assets with long cache headers and hashed names; enable compression (brotli); keep initial congestion window sane. For a media-heavy SPA, h2/h3 multiplexing plus per-file caching is the win; domain sharding (an h1 hack) becomes harmful.`,
    explanation: 'The core arc is eliminating head-of-line blocking: h2 at the application layer, h3 at the transport layer. Knowing what stops helping (domain sharding, sprite sheets) shows real understanding.',
    commonMistakes: 'Saying h2 "fixes" HOL blocking completely (TCP still blocks); recommending domain sharding under h2/h3.',
    interviewTip: 'Draw the protocol stack in the air: TLS sits under both, QUIC replaces TCP+TLS with one handshake.',
    relatedConcepts: ['Multiplexing', 'QUIC', 'HOL blocking', 'Header compression'],
  }),
  q({
    id: 'i-sc-007', topic: 'testing-security', subTopic: 'Integration Testing', difficulty: 'medium',
    questionType: 'scenario', estimatedTime: 180,
    question: 'Your team\u2019s integration suite passes locally but fails randomly in CI. Tests share one PostgreSQL staging database. Design a fix that makes runs deterministic, and explain what you would NOT do.',
    answer: `Fix:
1. Isolate state per test: wrap each test in a transaction and roll back, or use testcontainers to boot a fresh Postgres per run.
2. Seed deterministic fixtures per test — never depend on leftover rows from other tests.
3. Parallelize safely: unique schema per worker (e.g., schema_1..schema_N) or per-worker containers.
4. Control time: freeze/ inject clocks instead of sleeping.
5. Migrations: run once per container start, not per test.

Would NOT do:
- Retry-flaky tests until green (masks real bugs, wastes CI minutes).
- Serialize the whole suite (hides the coupling, kills velocity).
- Test against the shared staging DB at all — its data drifts and it can be mutated by real traffic.`,
    explanation: 'Shared mutable state is the root cause of order-dependent flakiness; the fix is isolation (transactions or ephemeral containers), not retries.',
    commonMistakes: 'Adding sleep()s for "timing issues"; assuming test order is stable across runners.',
    interviewTip: 'Name testcontainers explicitly and mention per-worker schema isolation for parallel CI.',
    relatedConcepts: ['Testcontainers', 'Fixture isolation', 'Transactional rollbacks'],
  }),
  q({
    id: 'i-sc-008', topic: 'aiml', subTopic: 'AI Application Development', difficulty: 'medium',
    questionType: 'scenario', estimatedTime: 240,
    question: 'Your RAG chatbot over company docs answers confidently but is wrong for questions about recently updated policies. Diagnose the failure modes and design the pipeline changes.',
    answer: `Failure modes:
1. Stale index: embeddings were generated at ingest; updated docs were never re-chunked/re-embedded.
2. Chunking: policy sections changed mid-chunk, so retrieved chunks mix old and new text.
3. Retrieval: old policy chunks outrank new ones (similar text, higher age-weighted popularity).
4. Generation: the model answers from parametric knowledge instead of the provided context.

Pipeline changes:
- Incremental re-index on document update (event-driven, not nightly batch).
- Version/metadata per chunk (doc_version, updated_at); filter retrieval to latest version.
- Add a re-ranker; boost recency for policy-class corpora.
- Grounding enforcement: prompt requires citations; eval set with "recent change" questions; refuse when retrieval confidence is low.`,
    explanation: 'RAG quality decays when the index lifecycle is decoupled from the source lifecycle. The interview is testing whether you treat retrieval as a data pipeline with freshness guarantees, not a one-time embedding job.',
    commonMistakes: 'Re-embedding everything nightly (costly) without metadata filtering; tuning prompts before fixing retrieval freshness.',
    interviewTip: 'Split the answer into retrieval failures vs generation failures — that taxonomy lands well.',
    relatedConcepts: ['Incremental indexing', 'Metadata filtering', 'Re-ranking', 'Groundedness evals'],
  }),
  q({
    id: 'i-sc-009', topic: 'devops', subTopic: 'Deployment', difficulty: 'medium',
    questionType: 'scenario', estimatedTime: 210,
    question: 'A deployment last night increased API p95 latency by 40% with no code changes to the endpoint itself. Walk through your investigation.',
    answer: `Correlate first, then bisect:
1. What changed: diff the deploy — image, dependencies, env vars, config, infra flags. The endpoint code is unchanged, so look around it: DB migrations shipped? Feature flag flipped? Dependency upgraded (e.g., a logging library flushing synchronously)?
2. Metrics: p95 per route before/after; DB query times; cache hit rate; GC/CPU on pods; connection pool saturation.
3. Infra: node pressure/evictions, HPA scale events, noisy neighbors, DNS/TLS handshake cost if a gateway changed.
4. Quick experiments: roll back the deploy (fastest bisect), or toggle the suspected flag for 10% traffic and compare.

Common culprits for "no code change" regressions: migration that added an index/lock churn, changed connection pool size, N+1 enabled by a new object shape, serialization added by a new middleware, cache TTL change.`,
    explanation: 'The discipline being tested: treat latency regressions as a bisection over the deploy diff plus metrics correlation, not guesswork.',
    commonMistakes: 'Profiling application code first when the endpoint did not change; ignoring infra-level causes.',
    interviewTip: 'Say "I would roll back first, investigate second" if user-facing — that instinct is what they want to hear.',
    relatedConcepts: ['p95/p99', 'Bisection', 'Connection pools', 'Migrations'],
  }),
  q({
    id: 'i-sc-010', topic: 'databases', subTopic: 'MongoDB', difficulty: 'medium',
    questionType: 'comparison', estimatedTime: 150,
    question: 'PostgreSQL vs MongoDB for a product-catalog service with occasional cross-entity transactions. Compare honestly and give a recommendation with conditions.',
    answer: `PostgreSQL fits when: relations across products/variants/categories/pricing need integrity; reporting/ad-hoc queries are rich; strict schemas catch bugs; JSONB already covers document-shaped payloads.
MongoDB fits when: the catalog is aggregate-shaped (whole product docs with variants embedded), schema evolves per category, write ingestion is heavy, and sharding by category/key gives horizontal scale; same-shape reads dominate.

Occasional cross-entity transactions: MongoDB supports multi-document ACID transactions (replica sets), but they are slower and hint the data is more relational than the model admits.

Recommendation: default PostgreSQL — it serves document shapes via JSONB, gives real transactions, and avoids operational novelty. Choose MongoDB if the access pattern is truly aggregate-oriented and horizontal write scaling by a shard key is a hard requirement.`,
    explanation: 'A strong answer maps access patterns to the model rather than repeating "SQL vs NoSQL" clichés, and notes that rare transactions are a smell against a document-first design.',
    commonMistakes: 'Recommending MongoDB "for scale" without evidence; ignoring JSONB as the middle path.',
    interviewTip: 'End with a conditional recommendation — interviewers want judgment, not fandom.',
    relatedConcepts: ['Aggregate orientation', 'JSONB', 'Shard keys', 'Multi-document transactions'],
  }),
  q({
    id: 'i-sc-011', topic: 'cs-fundamentals', subTopic: 'Operating Systems', difficulty: 'medium',
    questionType: 'code-analysis', language: 'javascript', estimatedTime: 150,
    question: `In Node.js, what does this print and why? What does it reveal about the event loop?

console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
process.nextTick(() => console.log("4"));
console.log("5");`,
    options: ['1 5 2 3 4', '1 5 4 3 2', '1 3 4 5 2', '1 5 3 2 4'],
    correctOption: 1,
    answer: '1 5 4 3 2',
    explanation: 'Sync code first (1, 5). Then microtasks: nextTick queue drains before promise microtasks (4, 3). Only then does the event loop advance to timers (2). setTimeout(0) is a macrotask that always yields to all microtasks.',
    commonMistakes: 'Believing setTimeout(0) runs "immediately"; not knowing nextTick has its own, higher-priority queue.',
    interviewTip: 'Generalize: sync → nextTick → microtasks → macrotasks, then repeat per loop tick.',
    relatedConcepts: ['Event loop phases', 'Microtasks', 'nextTick'],
  }),
  q({
    id: 'i-sc-012', topic: 'development', subTopic: 'TypeScript', difficulty: 'hard',
    questionType: 'code-analysis', language: 'typescript', estimatedTime: 180,
    question: `What is the runtime difference between these two shapes, and which do you pick for a config object?

type A = { host: string; port?: number };
type B = { host: string; port: number | undefined };`,
    options: [
      'They are identical at runtime and compile time',
      'A allows omitting port entirely; B requires the key to exist (possibly undefined)',
      'B allows omitting port; A requires it',
      'Only A compiles',
    ],
    correctOption: 1,
    answer: 'A allows omitting port entirely; B requires the key to exist (possibly undefined)',
    explanation: '?: marks the property optional — it can be absent. port: number | undefined demands the key be present, assigned undefined explicitly. Same distinction applies to exactOptionalPropertyTypes. Pick A for config objects: absence is the natural "not set" signal, and exactOptionalPropertyTypes treats presence-with-undefined as a bug.',
    commonMistakes: 'Assuming undefined-typed properties are optional; spreading { port: undefined } into configs and overriding defaults.',
    interviewTip: 'Mention exactOptionalPropertyTypes — it shows deep TS config knowledge.',
    relatedConcepts: ['Optional properties', 'exactOptionalPropertyTypes', 'Object spread semantics'],
  }),
  q({
    id: 'i-sc-013', topic: 'development', subTopic: 'REST APIs', difficulty: 'medium',
    questionType: 'coding', language: 'javascript', estimatedTime: 300,
    question: 'Implement Express middleware that validates that req.body.n matches a schema (n is a positive integer). Return 400 with a machine-readable error body on failure, call next() otherwise. Keep it reusable for any field.',
    starterCode: `// Usage: app.post("/n", validateBody({ n: "positiveInt" }), handler)
const validators = {
  positiveInt: (v) => /* ... */,
};

function validateBody(schema) {
  // your code
}`,
    answer: `const validators = {
  positiveInt: (v) =>
    typeof v === "number" && Number.isInteger(v) && v > 0,
};

function validateBody(schema) {
  return (req, res, next) => {
    const errors = {};
    for (const [field, kind] of Object.entries(schema)) {
      const ok = validators[kind]?.(req.body?.[field]);
      if (!ok) {
        errors[field] = \`expected \${kind}\`;
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: "validation_failed", fields: errors });
    }
    next();
  };
}

app.post("/n", validateBody({ n: "positiveInt" }), (req, res) => {
  res.json({ ok: true, n: req.body.n });
});`,
    explanation: 'Validation middleware should be pure (no business logic), accumulate ALL field errors (not fail-fast, better DX), and return a machine-readable shape so clients can render per-field messages.',
    commonMistakes: 'Throwing inside middleware instead of returning a 400; validating req.body without guarding undefined; fail-fast loops hiding remaining errors.',
    interviewTip: 'Note that production teams reach for zod/joi — say you know, then show you can build the primitive anyway.',
    relatedConcepts: ['Middleware chains', '400 vs 422', 'Error envelopes'],
  }),
  q({
    id: 'i-sc-014', topic: 'system-design', subTopic: 'Distributed Systems', difficulty: 'hard',
    questionType: 'system-design', estimatedTime: 420,
    question: 'Design a scalable notification system: email, push and in-app, triggered by user actions. Cover delivery guarantees, fan-out, ordering, and failure handling.',
    answer: `API: POST /notifications (internal) → validate → persist intent → enqueue.

Pipeline: producer → queue (per-priority) → fan-out workers → channel adapters (email/push/in-app) → delivery status tracking.

Fan-out: for follow-style events, precompute recipient lists; for celebrity writes use hybrid fan-out (push for normal users, pull-on-open for huge accounts).

Guarantees: at-least-once delivery ⇒ consumers must be idempotent (dedupe on notification_id). Ordering per (user, thread) via partition key — global ordering is neither needed nor cheap.

Rate limiting & preferences: per-user quiet hours, channel opt-outs, priority lanes (OTP > social).

Failure handling: exponential backoff with jitter per channel; dead-letter queue after N attempts; circuit breaker per provider; replay tooling from the persisted intent table.

Scale: partition queues by user_id; autoscale workers on queue depth; in-app store sharded by user; cache unread counts.`,
    explanation: 'The scoring points: at-least-once + idempotency, hybrid fan-out, per-key ordering, DLQs and provider circuit breakers — all named explicitly.',
    commonMistakes: 'Claiming exactly-once delivery without acknowledging it is effectively at-least-once + dedupe; forgetting user preferences and quiet hours.',
    interviewTip: 'Start with requirements (volumes, latency tolerance) — notification systems live or die on fan-out math.',
    relatedConcepts: ['Idempotency', 'DLQ', 'Fan-out on write vs read', 'Circuit breakers'],
  }),
  q({
    id: 'i-sc-015', topic: 'cs-fundamentals', subTopic: 'OOPs', difficulty: 'easy',
    questionType: 'comparison', estimatedTime: 120,
    question: 'Composition vs inheritance: when would you choose each, and how would you refactor a deep class hierarchy?',
    answer: `Prefer composition when the relationship is "has-a" or behavior varies independently across axes (e.g., ReportGenerator with Formatter × Exporter): wire collaborators at runtime, swap them in tests, avoid coupling subclasses to parent internals.
Inheritance fits genuine "is-a" with stable shared contracts and framework-imposed lifecycles (e.g., React.Component historically, template method patterns).

Refactoring a deep hierarchy: identify the varying axes, extract each into an interface, replace subclasses with composed strategies, push shared state into collaborators; tests move from "test the subclass" to "test the collaborator contract".

Rule of thumb: inheritance fixes the is-a relationship at compile time; composition keeps flexibility at runtime. Deep hierarchies almost always indicate hidden composition trying to get out.`,
    explanation: 'Interviewers want the judgment axis (is-a vs has-a, compile-time vs runtime flexibility) plus a concrete refactoring strategy, not the "favor composition" mantra alone.',
    commonMistakes: 'Reciting "composition over inheritance" without saying when inheritance is right.',
    interviewTip: 'Bring up the diamond problem and how composition sidesteps it.',
    relatedConcepts: ['Strategy pattern', 'LSP', 'Interface segregation'],
  }),
  q({
    id: 'i-sc-016', topic: 'aptitude', subTopic: 'Quantitative Aptitude', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 120,
    question: 'Two taps fill a tank in 12 and 18 hours respectively. A drain empties it in 24 hours. With all three open, how long to fill the empty tank?',
    options: ['10 h 17 min', '11 h 25 min', '12 h 30 min', '14 h 24 min'],
    correctOption: 0,
    answer: '10 h 17 min (72/7 hours)',
    explanation: 'Work in rates per hour: 1/12 + 1/18 − 1/24 = (6 + 4 − 3)/72 = 7/72 tank per hour. Time = 72/7 h ≈ 10.29 h ≈ 10 h 17 min. Options that ignore the drain (like 14 h 24 min) come from 1/12 + 1/18 = 5/36 ⇒ 36/5 = 7.2 h — also check it, but the drain is stated, so subtract it.',
    commonMistakes: 'Adding times instead of rates; forgetting to subtract the drain.',
    interviewTip: 'Verbalize the rate equation before arithmetic — partial credit survives slips.',
    relatedConcepts: ['Work-rate problems', 'LCM method'],
  }),
  q({
    id: 'i-sc-017', topic: 'development', subTopic: 'Web Development', difficulty: 'medium',
    questionType: 'scenario', estimatedTime: 150,
    question: 'Your LCP (Largest Contentful Paint) is 4.2s on mobile for a marketing page. Give a prioritized list of fixes with expected impact.',
    answer: `Prioritized by impact:
1. Serve the hero image properly: modern format (AVIF/WebP), correctly sized (responsive srcset), preload it, and never lazy-load the LCP image. Often −1.5s alone.
2. Ship less blocking JS: code-split, defer non-critical bundles, audit with the coverage tab. Long tasks delay render.
3. Critical CSS inline / defer the rest; avoid render-blocking chains.
4. Font strategy: font-display: swap, preload the primary font, subset it.
5. Move LCP resource origin closer: CDN with cached, immutable headers.
6. Server response (TTFB): cache the page at the edge (ISR/SSG if framework allows).

Measurement: Lighthouse lab + CrUX field data; verify each fix moves LCP, not just the score.`,
    explanation: 'Web-vitals answers are scored on prioritization (image + JS first) and on distinguishing lab vs field data.',
    commonMistakes: 'Lazy-loading the LCP image (a classic self-inflicted wound); optimizing the wrong image.',
    interviewTip: 'Name the metric pipeline: TTFB → resource load → render, and attack the biggest segment first.',
    relatedConcepts: ['Core Web Vitals', 'Preload', 'Code splitting'],
  }),
  q({
    id: 'i-sc-018', topic: 'aiml', subTopic: 'Generative AI', difficulty: 'medium',
    questionType: 'comparison', estimatedTime: 150,
    question: 'RAG vs fine-tuning vs long-context prompting: which do you choose for a customer-support bot over 40k tickets, and why?',
    answer: `Choose RAG as the backbone: tickets/policies change (freshness), answers must cite sources (grounding), corpus is too big for prompts, and updates must be instant without retraining.

Fine-tune only when you need style/format/behavior the base model lacks (e.g., a strict ticket-summary schema) — and even then, typically LoRA on top of a hosted model, evaluated against a golden set. Fine-tuning is bad for facts: it bakes in a snapshot.

Long-context prompting: viable below ~a few hundred pages, but cost and latency scale per request, and recall degrades ("lost in the middle") — use for small, stable corpora.

Production shape: RAG for knowledge + a small fine-tune (or just prompting) for output format + evals to catch drift.`,
    explanation: 'The correct mental model: RAG supplies facts, fine-tuning supplies behavior. The question is engineered to see if you know fine-tuning is the wrong tool for fresh facts.',
    commonMistakes: 'Recommending fine-tuning "so the model knows our docs"; ignoring per-request cost of long contexts.',
    interviewTip: 'Quantify: 40k tickets × 500 tokens ≈ 20M tokens — no prompt window holds that reliably.',
    relatedConcepts: ['Grounding', 'LoRA', 'Lost-in-the-middle', 'Eval harnesses'],
  }),
  q({
    id: 'i-sc-019', topic: 'testing-security', subTopic: 'Security Fundamentals', difficulty: 'medium',
    questionType: 'scenario', estimatedTime: 180,
    question: 'A security audit finds your API sets JWTs in localStorage and lacks rate limiting on /login. List the vulnerabilities, their exploits, and the remediation order.',
    answer: `Vulnerability 1 — JWT in localStorage:
Exploit: any XSS (a compromised npm package, an unsanitized markdown renderer) exfiltrates tokens; they persist after tab close.
Remediation: short-lived access token in memory; refresh token in httpOnly+Secure+SameSite cookie; rotate refresh tokens; CSP to reduce XSS impact.

Vulnerability 2 — no rate limit on /login:
Exploit: credential stuffing and brute force at wire speed; password spraying across accounts.
Remediation: progressive rate limiting per IP+account, exponential lockout/backoff, CAPTCHA after N failures, generic error messages (no user enumeration), and alerting on anomaly.

Order: fix /login first (active attack surface, trivial exploit), then token storage (needs design + deploy coordination), then CSP/monitoring hardening.`,
    explanation: 'Sequencing by exploitability is the senior signal: an open /login is being probed right now; token storage is a design migration.',
    commonMistakes: 'Treating both as equal-priority checklists; forgetting user-enumeration via error messages.',
    interviewTip: 'Mention OWASP ASVS as the checklist you would run through afterwards.',
    relatedConcepts: ['OWASP Top 10', 'Credential stuffing', 'CSP', 'Token rotation'],
  }),
  q({
    id: 'i-sc-020', topic: 'system-design', subTopic: 'API Design', difficulty: 'medium',
    questionType: 'system-design', estimatedTime: 300,
    question: 'Design the REST API for a food-delivery backend: place order, track status, cancel. Cover resources, status model, idempotency, concurrency (two devices cancelling), and webhooks for updates.',
    answer: `Resources:
POST /orders → 202 { orderId, status: "placed" } (async processing)
GET /orders/{id} → order incl. status
POST /orders/{id}/cancel → 200 { status: "cancelling" } | 409 if past cutoff
GET /orders/{id}/events → ordered status events (cursor pagination)

Status model: placed → confirmed → preparing → picked_up → delivered | cancelled | failed (terminal states explicit).

Idempotency: client sends Idempotency-Key on POST /orders and /cancel; server stores key → response for 24h; retries return the first response (prevents double orders).

Concurrency: cancel is a guarded transition — atomic conditional update (WHERE status IN (…pre-cutoff states)); loser gets 409 with current state; both devices poll/subscribe to the same event log so UIs converge.

Webhooks: signed (HMAC) callbacks per merchant/restaurant system with retry+DLQ; also SSE/WS channel for the customer app. Events, not polling, for cross-system consistency.

Validation: 400 for malformed, 401/403 auth, 404 foreign order, 409 business-conflict, 422 semantic errors — with machine-readable codes.`,
    explanation: 'The grading rubric: explicit state machine, idempotency keys, conflict semantics for concurrent transitions, and push-based updates instead of polling.',
    commonMistakes: 'DELETE for cancel (implies erasure); no idempotency on order creation; 200 for a cancel that actually lost the race.',
    interviewTip: 'Volunteer the concurrency scenario — it is where most candidates stumble.',
    relatedConcepts: ['Idempotency keys', 'State machines', 'Optimistic concurrency', 'Webhooks'],
  }),
  q({
    id: 'i-sc-021', topic: 'development', subTopic: 'React', difficulty: 'hard',
    questionType: 'coding', language: 'typescript', estimatedTime: 300,
    question: 'Implement a useDebouncedValue<T>(value: T, delayMs: number) hook in TypeScript: returns the value debounced by delayMs, cleans up on unmount, and keeps the latest value racing-safe (a stale timer must not overwrite a newer value).',
    starterCode: `import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  // your code
}`,
    answer: `import { useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(value);

  useEffect(() => {
    latestRef.current = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebounced(latestRef.current);
    }, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delayMs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return debounced;
}`,
    explanation: 'The race safety comes from (1) clearing the previous timer on every value change and (2) always reading the latest value from a ref when the timer fires — a timer scheduled by an older render can never publish a stale value. Cleanup on unmount prevents setState-after-unmount.',
    commonMistakes: 'Capturing value in the timeout closure (stale closure bug); missing unmount cleanup; resetting the debounce on unrelated re-renders by missing deps.',
    interviewTip: 'Explain WHY the ref+clear combo is race-safe — interviewers probe one layer deeper than the working code.',
    relatedConcepts: ['Stale closures', 'Refs', 'Effect cleanup', 'Generics'],
  }),
  q({
    id: 'i-sc-022', topic: 'cs-fundamentals', subTopic: 'DBMS', difficulty: 'hard',
    questionType: 'scenario', estimatedTime: 210,
    question: 'A report query under READ COMMITTED sometimes returns a total that does not match the sum of its rows. How is that possible, and what do you change?',
    answer: `Under READ COMMITTED each statement sees a fresh snapshot, so the aggregate (SELECT SUM) and the row detail query (separate statements) can observe different committed states between them — rows committed in between appear in one but not the other. It is not corruption; it is two snapshots.

Changes (pick per need):
- Put both statements in one REPEATABLE READ transaction (snapshot at first read) so detail and total agree.
- Or compute both in a single statement (window functions / GROUP BY ROLLUP) so one snapshot covers everything.
- SERIALIZABLE only if concurrent writes must be rejected outright, at the cost of serialization retries.`,
    explanation: 'This is a multi-statement consistency question disguised as a "bug". The answer hinges on per-statement snapshots under READ COMMITTED.',
    commonMistakes: 'Blaming rounding or floating point; jumping to SERIALIZABLE when REPEATABLE READ suffices.',
    interviewTip: 'Say "two snapshots, one report" — memorable phrasing interviewers remember.',
    relatedConcepts: ['Snapshot isolation', 'Isolation levels', 'Consistent reads'],
  }),
];

/**
 * Technical-explanation questions: "explain X the way you would to an
 * interviewer" — tests structured communication, not memorized definitions.
 * Graded by self-assessed confidence; model answers demonstrate HOW to speak.
 */
export const EXPLANATION_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-ex-001', topic: 'cs-fundamentals', subTopic: 'Computer Networks', difficulty: 'medium',
    questionType: 'technical-explanation', estimatedTime: 180,
    question: 'Walk me through what happens when you type a URL and press Enter — but skip the encyclopedia version. Focus on the three steps interviewers actually probe: DNS resolution, the TLS handshake, and where each can fail.',
    answer: `Strong answer structure (one line per hop, then the failure modes):

1. Browser cache → OS resolver → recursive DNS: name resolves to an IP. Failure: no network, NXDOMAIN, or a poisoned/stale record.
2. TCP connection to 443 — SYN, SYN-ACK, ACK. Failure: firewall drop (connection timeout) vs RST (port closed) — different diagnoses.
3. TLS handshake: ClientHello → ServerHello + certificate → key exchange → finished. TLS 1.3 does this in one round-trip (1-RTT), resumable with 0-RTT. Failure: expired/mismatched certificate, blocked SNI, unsupported cipher.
4. HTTP request/response: method+path+headers, server renders or serves, browser parses HTML → fires subresource loads.

Interviewers probe: the difference between a timeout (packets dropped) and a refused connection (RST), what the certificate actually proves, and what changes with HTTP/2/3 (one connection, multiplexed streams).`,
    explanation: 'This question is about communication as much as knowledge: naming failure modes at each hop (timeout vs RST, cert vs cipher) is what separates a rehearsed answer from an owned one.',
    commonMistakes: 'Reciting the OSI model; skipping failure modes entirely; not knowing what TLS actually authenticates.',
    interviewTip: 'Pick the three hops you know cold and go deep there — "I will focus on DNS, TLS and the request path" is a strong opening.',
    relatedConcepts: ['DNS', 'TLS handshake', 'TCP vs UDP', 'HTTP/2'],
  }),
  q({
    id: 'i-ex-002', topic: 'development', subTopic: 'React', difficulty: 'medium',
    questionType: 'technical-explanation', estimatedTime: 150,
    question: 'Explain useEffect cleanup to a junior developer: what it is for, when it runs, and what bug class appears when it is forgotten. Use a subscription example.',
    answer: `Explain it as "the effect\'s undo": every effect that acquires something outside React (subscription, timer, socket, event listener) must return a function that releases it.

function usePrice(ticker) {
  const [price, setPrice] = useState(null);
  useEffect(() => {
    const socket = subscribe(ticker, setPrice);
    return () => socket.close(); // cleanup
  }, [ticker]);
  return price;
}

When it runs: after every re-render where deps changed, BEFORE the next effect fires, and once more on unmount. React does this so the previous effect\'s resources never outlive its inputs.

The bug class when forgotten: with [ticker] switching from "ETH" to "BTC", the old subscription stays open and its updates keep calling setPrice — the UI shows BTC\'s address flashing ETH prices, sockets leak per navigation, and tests flake with "state update on unmounted component".

Mental model for the junior: open file → close file. React just guarantees the close happens at the right moment.`,
    explanation: 'The teaching frame (acquire/release) plus the concrete corrupted-UI symptom is the signal — juniors usually know cleanup exists but not what breaks without it.',
    commonMistakes: 'Saying cleanup runs "on unmount" only; missing that it also runs before each re-run of the effect.',
    interviewTip: 'The stale-subscription flash (old data overwriting new) is the detail interviewers wait to hear.',
    relatedConcepts: ['Effect lifecycle', 'Memory leaks', 'Stale closures'],
  }),
  q({
    id: 'i-ex-003', topic: 'databases', subTopic: 'Transactions', difficulty: 'medium',
    questionType: 'technical-explanation', estimatedTime: 150,
    question: 'Explain ACID to a non-database engineer using ONE concrete example (a ₹500 transfer between two accounts). Tell the story first, then name the properties.',
    answer: `Story first: I send you ₹500 from my account.

- The debit and the credit are ONE unit of work. If the server dies after the debit but before the credit, the bank restarts and finds neither happened — or both. Money is never in limbo. → That is Atomicity.
- Between "money leaves my account" and "money arrives", no one can observe an intermediate state — not another customer, not a report. Every observer sees before-or-after, never mid-flight. → Consistency/Isolation in observable terms.
- My balance can never go negative: the schema itself rejects the transfer if funds are insufficient. → Consistency as enforced invariants.
- The moment the app says "sent", the money is sent — even if the data center loses power a millisecond later. The confirmation is a promise. → Durability.

Close with why a junior should care: without these guarantees, every feature that touches money needs custom recovery code; with them, you write BEGIN…COMMIT and lean on the engine.`,
    explanation: 'Explaining-by-story then labeling is the tested skill: engineers who can only recite the four words usually cannot apply them when designing a schema or debugging a deadlock.',
    commonMistakes: 'Defining the four terms abstractly and never connecting them to the example; conflating consistency (invariants) with isolation (concurrency).',
    interviewTip: 'The "money never in limbo" and "confirmation is a promise" phrases land well — concrete, memorable, correct.',
    relatedConcepts: ['ACID', 'Transactions', 'Schema constraints'],
  }),
];

/**
 * Behavioral-technical questions: workplace-judgment scenarios where the
 * answer must contain the actual technical argument, not soft-skill fluff.
 */
export const BEHAVIORAL_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-bt-001', topic: 'testing-security', subTopic: 'Security Fundamentals', difficulty: 'medium',
    questionType: 'behavioral-technical', estimatedTime: 180,
    question: 'Your team lead wants to ship Friday, but you found that the new payment endpoint logs full card numbers to the error tracker. The lead says "we will rotate the logs next sprint." What do you do — and what is your exact technical argument?',
    answer: `Do not ship; escalate with facts, not alarm. The exact argument:

1. It is not a "log hygiene" problem — PCI-DSS scope: storing PAN in logs (even transiently) pulls the whole logging pipeline into PCI scope and is an explicit violation (requirement 3.x). If the tracker is a SaaS, card data has already left our trust boundary — that is a disclosure decision, not a cleanup task.
2. Containment is small and shippable by Friday: mask in the serializer (keep last 4), add a redaction rule in the tracker for the field, purge the affected log range. Hours of work, not days.
3. The cost asymmetry: shipping means the data sits in a third party until "next sprint" — every hour is retention we chose; fixing now costs one day; a leak costs the audit, the client, and possibly the vendor relationship.

How to communicate: private message to the lead with the three points and the tiny containment PR already open — make the secure path the easy path. If overruled, it goes to the security/compliance owner in writing (a drafted note, not a public callout).

What NOT to do: merge it with a TODO; argue in the team channel; silently redact on a branch that misses the release.`,
    explanation: 'The scoring rubric: a real regulatory fact (PCI scope), a concrete containment that does not kill the deadline, cost asymmetry framing, and escalation that is professional rather than performative.',
    commonMistakes: 'Soft-pedaling it into a preference ("best practice"); framing it as shipping vs not-shipping when a third option (mask + purge before ship) exists.',
    interviewTip: 'Interviewers want judgment plus a constructive option — "make the secure path the easy path" is the phrase that lands.',
    relatedConcepts: ['PCI-DSS', 'Data minimization', 'Incident escalation'],
  }),
  q({
    id: 'i-bt-002', topic: 'system-design', subTopic: 'High-Level Design', difficulty: 'hard',
    questionType: 'behavioral-technical', estimatedTime: 210,
    question: 'You propose adding Redis caching to a slow read API. A senior teammate pushes back: "it adds a failure mode and invalidation complexity — just fix the DB indexes." You checked: the endpoint fans out to five queries per request, each indexed and fast (2–8 ms each). Who is right, and how do you resolve the disagreement?',
    answer: `The teammate is right on the facts given — and the resolution is to reframe with numbers, not opinions.

Their case is strong: 5 queries × ~5 ms ≈ 25 ms of DB time; indexes are already fine. The remaining cost is round-trips + serialization + ORM overhead, which Redis does not remove — it moves them (cache GET + serialize) and adds invalidation logic plus a new dependency that can fail.

The data-driven middle ground:
1. Measure the actual breakdown first: DB time vs serialization vs network. If queries are 5 of 120 ms, indexing was never the bottleneck and neither is caching — the fix is batching the five queries (one JOIN or a single round-trip with WHERE IN).
2. If after batching the p95 is still over target AND the payload is read-heavy with tolerable staleness, THEN Redis is justified — with a TTL and an explicit invalidation trigger written down (which write path bumps which key).
3. Resolve the disagreement in a one-pager, not a meeting: current numbers, cost of each option, the failure mode each adds, and a reversible first step (batch the queries — zero new infra). Commit to re-measuring in a week.

Why this lands: the disagreement dissolves once the profile exists — caching vs indexing was the wrong axis. The senior engineer\'s pushback was really "do not add infra before the profile justifies it", and the answer shows you heard that.`,
    explanation: 'The tested judgment: both camps are usually arguing past each other until measurements exist. Proposing the reversible step (batching) before the infrastructure step (Redis) is the senior signal.',
    commonMistakes: 'Defending the original proposal for ego; conceding entirely without data; treating "it depends" as an answer instead of naming what it depends on.',
    interviewTip: 'Say "the disagreement dissolves with a flame graph" — it shows you resolve technical conflict with evidence, not politics.',
    relatedConcepts: ['N+1 / fan-out queries', 'Batching', 'Invalidation', 'Latency profiling'],
  }),
];

export const PROJECT_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-pj-001', topic: 'development', subTopic: 'Web Development', difficulty: 'easy',
    questionType: 'project-based', estimatedTime: 180,
    question: 'Walk me through the architecture of a project you built: request lifecycle from the browser to the database and back. What happens at each hop?',
    answer: `Strong structure (adapt to your stack):
1. Browser: user action → event handler → state update → API call (fetch/axios) with auth header.
2. Edge/network: DNS → CDN (static assets cached, API passes through) → TLS → reverse proxy/LB.
3. Backend: middleware chain (CORS, auth/JWT verify, rate limit, validation) → route handler → business logic.
4. Data: ORM/SQL (transactions where multi-table), connection pool (PgBouncer if present), indexes touched.
5. Response: serialization → status code → client updates state/UI; errors mapped to typed error codes.

Know one number per hop (payload size, p95, pool size). Depth at one hop beats breadth of buzzwords.`,
    explanation: 'The question tests whether you own your project end-to-end or only know the framework glue. Concrete per-hop details (what middleware, what indexes, what would break first) are what interviewers probe.',
    commonMistakes: 'Reciting tech-list instead of lifecycle; unable to say what happens when auth fails or the DB is down.',
    interviewTip: 'Prepare ONE project narrative with a diagram in your head and a failure story per hop.',
    relatedConcepts: ['Request lifecycle', 'Middleware', 'Connection pooling'],
  }),
  q({
    id: 'i-pj-002', topic: 'development', subTopic: 'Git & GitHub', difficulty: 'easy',
    questionType: 'project-based', estimatedTime: 150,
    question: 'Tell me about a production bug you introduced. How did you find it, fix it, and what did you change so it cannot recur?',
    answer: `STAR-shaped technical answer:
Situation: e.g., a checkout flow broke for users with emoji in their address after a validation "improvement".
Task: own the incident end-to-end (found via error-rate alert, not user report).
Action: traced logs to the regex rejecting astral-plane characters; hotfixed with a unicode-aware validator + test for the exact payload; wrote the postmortem.
Result/learning: added property-based tests for validators, staged rollouts (canary) for form logic, and an alert on checkout error rate — bug class, not just the instance.

Interviewers are screening for: honesty, diagnosis method (logs/metrics/bisect), the fix, and the systemic change. Never blame teammates.`,
    explanation: 'This is a judgment question wearing a story costume: the systemic-prevention part carries the most signal.',
    commonMistakes: 'Choosing a trivial bug; skipping the "what changed so it cannot recur" step.',
    interviewTip: 'Have one real incident story rehearsed with metrics — it doubles as your behavioral answer.',
    relatedConcepts: ['Postmortems', 'Canary releases', 'Alerting'],
  }),
  q({
    id: 'i-pj-003', topic: 'development', subTopic: 'Node.js', difficulty: 'medium',
    questionType: 'project-based', estimatedTime: 210,
    question: 'In your last backend project, what happens when a request reaches your Express/Node server? Trace one authenticated POST request through every layer, including failure paths.',
    answer: `Trace (with failure paths at each layer):
1. LB/proxy terminates TLS → forwards to Node.
2. Express middleware: helmet/security headers → CORS preflight handling → JSON body parser (413 if too large) → rate limiter (429) → auth middleware verifies JWT (401 invalid/expired), loads user onto req.
3. Route: validateBody schema (400 field errors) → service layer.
4. Service: starts transaction if multi-write; calls repository/ORM; row-level checks (404/403); conflict handling (409).
5. DB: parameterized query on indexed columns; commit; pool returns connection.
6. Response: serialize DTO (never raw entities) → 201/200; on throw → asyncHandler → error middleware maps ApiError subclasses to status codes, logs with request id.
7. Observability: request-id correlation, timing header, structured log per hop.

Failure paths are the interview target: say what status each layer returns and why.`,
    explanation: 'Strong candidates narrate middleware order and the exact failure status per layer — that demonstrates ownership of the stack, not framework familiarity.',
    commonMistakes: 'Describing happy path only; not knowing where the transaction begins/ends.',
    interviewTip: 'Prepare the failure path first — interviewers always ask "and if the DB write fails?"',
    relatedConcepts: ['Middleware order', 'Transaction boundaries', 'Error middleware'],
  }),
  q({
    id: 'i-pj-004', topic: 'system-design', subTopic: 'Low-Level Design', difficulty: 'medium',
    questionType: 'project-based', estimatedTime: 240,
    question: 'Pick one module from your project and redesign it live: interfaces, data model, error handling, and the trade-off you would now reverse. Why the reversal?',
    answer: `Template for a strong live redesign:
1. State the current design in one sentence, including its original constraint (time, learning goals).
2. Draw interfaces: 2-3 types with methods, not classes-with-everything.
3. Data model: tables/collections, keys, one denormalization and its justification.
4. Error handling: typed error taxonomy crossing the boundary, retry policy for external calls.
5. The reversal: e.g., "I rolled my own auth then; today I would delegate to an auth provider — the trade-off flips once you count rotation, MFA and audit-log surface area."
6. What you would NOT change and why (team familiarity, migration cost).

Keep it 3 minutes. The trade-off reversal is the point of the question — growth, not the code itself.`,
    explanation: 'The question measures self-review maturity: can you critique your own shipped decisions with hindsight and articulate what changed in your judgment?',
    commonMistakes: 'Re-describing the module without critique; picking a redesign so vast it cannot be defended.',
    interviewTip: 'Rehearse one module end-to-end — this question appears in almost every project deep-dive.',
    relatedConcepts: ['Interfaces', 'Trade-off analysis', 'Design reviews'],
  }),
  q({
    id: 'i-pj-005', topic: 'aiml', subTopic: 'AI Application Development', difficulty: 'medium',
    questionType: 'project-based', estimatedTime: 210,
    question: 'Why did you choose your AI/LLM stack (model, retrieval, framework) for your project — and what would you change with more time?',
    answer: `Answer shape:
1. Constraints first: latency budget, cost/token budget, data freshness, team familiarity, on-prem/privacy needs.
2. Model: chose X because context length Y fits our chunking, cost per 1M tokens fits budget at Z req/day; fallback model for degradation.
3. Retrieval: embedding model dims/quality vs cost; pgvector vs dedicated vector DB — chose pgvector because we already run Postgres (ops simplicity) and corpus < N chunks.
4. Framework: minimal glue over a heavy agent framework — fewer abstractions, easier evals; or the opposite if you used one, defend it concretely.
5. With more time: proper eval harness (golden Q/A + groundedness scoring), hybrid search (BM25 + vectors), caching identical prompts, streaming UX, finer chunking for tables.`,
    explanation: 'The scoring axis is constraint-driven justification, not brand names. "What would you change" screens for eval literacy — the most common gap in AI projects.',
    commonMistakes: 'Naming frameworks without trade-offs; no answer for how answers are evaluated.',
    interviewTip: 'Always end with the eval plan — it is the #1 follow-up question.',
    relatedConcepts: ['Embeddings', 'pgvector', 'Evaluation harnesses', 'Cost engineering'],
  }),
  q({
    id: 'i-pj-006', topic: 'development', subTopic: 'Express.js', difficulty: 'medium',
    questionType: 'debugging', language: 'javascript', estimatedTime: 210,
    question: `A teammate's Express route returns "Cannot set headers after they are sent" intermittently. Here is the handler. Find every defect.

app.get("/user", async (req, res) => {
  const u = await db.findUser(req.query.id);
  if (!u) res.status(404).json({ error: "not found" });
  res.json(u);
});`,
    answer: `Defects:
1. Missing return: after res.status(404).json(...), execution falls through and res.json(u) runs again — the second attempt to send headers throws ERR_HTTP_HEADERS_SENT. Intermittent because it only fires when u is falsy.
2. res.json(u) with u = null would still try to send — combined with #1 it double-sends.
3. No try/catch: db.findUser rejection becomes an unhandled rejection (Express 4).

Fixed:
app.get("/user", async (req, res, next) => {
  try {
    const u = await db.findUser(req.query.id);
    if (!u) {
      return res.status(404).json({ error: "not found" });
    }
    res.json(u);
  } catch (e) {
    next(e);
  }
});`,
    explanation: '"Cannot set headers after they are sent" is almost always a missing return (or next) after the first response. The intermittency maps exactly to the conditional path that forgot it.',
    commonMistakes: 'Adding res.end() instead of return; wrapping in try/catch but leaving the fall-through.',
    interviewTip: 'Read the error literally — "headers already sent" tells you the exact line to search for double-responds.',
    relatedConcepts: ['Express response lifecycle', 'Guard clauses', 'async error propagation'],
  }),
  q({
    id: 'i-pj-007', topic: 'testing-security', subTopic: 'Authentication', difficulty: 'medium',
    questionType: 'comparison', estimatedTime: 150,
    question: 'Authentication vs authorization — explain the difference through a concrete API request, and where each is enforced in a typical Express + PostgreSQL stack.',
    answer: `Authentication = who you are (verify JWT signature → user id). Authorization = what you may do (role/ownership checks on the resource).

Concrete request: PUT /orders/42/cancel
1. AuthN middleware: verify token signature/expiry → req.user = { id: 7 } — 401 if invalid.
2. AuthZ: load order 42; check order.userId === req.user.id (ownership) AND role allows cancellation (RBAC) — 403 (not 404, unless hiding existence is intended) when denied.

Enforcement points: AuthN once, globally, at middleware. AuthZ per resource — in the service layer (not the route), because the same rule must hold for background jobs and webhooks. DB as last line: row-level security or WHERE user_id = $1 in queries so a missed check cannot leak rows.

Common bug: AuthZ in the UI only — the API remains wide open with a valid token for someone else\u2019s resources (IDOR/BOLA).`,
    explanation: 'The IDOR/BOLA angle and "enforce authz in the service layer, defense-in-depth in SQL" are the senior signals.',
    commonMistakes: 'Conflating the two terms; enforcing authz only in route handlers or only in the frontend.',
    interviewTip: 'OWASP calls the missing-authz bug class BOLA — #1 on the API Top 10. Saying that lands well.',
    relatedConcepts: ['JWT', 'RBAC', 'IDOR/BOLA', 'Row-level security'],
  }),
  q({
    id: 'i-pj-008', topic: 'postgresql', subTopic: 'Indexes', difficulty: 'hard',
    questionType: 'sql', language: 'sql', estimatedTime: 300,
    question: 'Your users table (50M rows) filters by (status, created_at) and sorts by created_at DESC. Write the optimal index DDL, the query that benefits, and explain when PostgreSQL would still ignore it.',
    starterCode: `-- table: users(id, name, status, created_at)
-- write: 1) index DDL  2) a representative query  3) comments on when it is ignored`,
    answer: `-- 1) Composite B-tree matching equality-then-range/order:
CREATE INDEX CONCURRENTLY idx_users_status_created
  ON users (status, created_at DESC);

-- 2) Representative query that uses it (index scan, no sort node):
SELECT id, name, created_at
FROM users
WHERE status = 'active'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;

-- 3) When PostgreSQL still ignores it:
--   • Low selectivity: 80% of rows are 'active' → seq scan is cheaper.
--   • Stale statistics after bulk load → run ANALYZE.
--   • Predicate wraps the column: WHERE lower(status) = 'active' →
--     needs an expression index instead.
--   • Type mismatch (int column vs text literal) or collation mismatch.
--   • tiny LIMIT + high OFFSET pagination patterns may prefer other plans.
-- Verify with EXPLAIN (ANALYZE, BUFFERS): expect Index Scan + no Sort node.`,
    explanation: 'Equality column first, then range/order column — the composite order is the whole question. The "when ignored" half tests planner literacy: cost-based decisions, not presence.',
    commonMistakes: 'Reversing index column order (created_at, status) — sort still needs an explicit Sort node; forgetting CONCURRENTLY in production DDL.',
    interviewTip: 'Name the expected plan nodes out loud ("Index Scan, no Sort") — that is EXPLAIN fluency.',
    relatedConcepts: ['Composite indexes', 'Selectivity', 'EXPLAIN ANALYZE', 'ANALYZE'],
  }),
  q({
    id: 'i-pj-009', topic: 'aptitude', subTopic: 'Logical Reasoning', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'Exactly one of these four statements about this PR batch is true. Which one?',
    options: [
      'All four PRs in this batch have failing tests',
      'Exactly three PRs have failing tests',
      'Exactly one PR has a failing test',
      'At least one PR has a failing test',
    ],
    correctOption: 3,
    answer: 'At least one PR has a failing test',
    explanation: 'If A ("all four") were the one true statement, then D ("at least one") would also be true — two truths, contradiction. The same applies to B and C: each implies D. So A, B, C must all be false, which makes D the only true statement — and it constrains the actual world to 1, 2 or 3 failing PRs.',
    commonMistakes: 'Testing only whether a candidate world is consistent, instead of also checking that the other statements are false in it; missing that "at least one" is implied by each of the others.',
    interviewTip: 'In these puzzles, enumerate combinations systematically instead of pattern-matching.',
    relatedConcepts: ['Truth tables', 'Systematic elimination'],
  }),
  q({
    id: 'i-pj-010', topic: 'devops', subTopic: 'CI/CD', difficulty: 'medium',
    questionType: 'project-based', estimatedTime: 210,
    question: 'Describe the CI/CD pipeline you actually used in your project: stages, what each gates, and one failure it caught that would have reached production.',
    answer: `Pipeline shape (adapt):
1. PR: install (lockfile cache) → lint → typecheck → unit tests → build → preview deploy. Gates: no red PR merges (branch protection).
2. Merge to main: full test suite → integration tests (testcontainers) → build/push image tagged with commit SHA → deploy staging → smoke tests.
3. Release: manual gate → promote the SAME SHA-tagged image to prod → post-deploy smoke + error-rate watch → auto-rollback on breach.

Failure story template: "Typecheck caught a nullability regression the unit tests missed because the type was only exercised in an edge branch — we tightened the type and added the missing test."

Gates worth naming: required status checks, no-force-push main, signed commits, dependabot/audit step.`,
    explanation: 'Same-artifact promotion (SHA-tagged image flows staging → prod) and a concrete caught-failure story are what interviewers listen for.',
    commonMistakes: 'Rebuilding images per environment; describing a pipeline without any gate or failure story.',
    interviewTip: 'Know your numbers: pipeline duration, deploy frequency, rollback time.',
    relatedConcepts: ['Artifact promotion', 'Branch protection', 'Canary deploys'],
  }),
];
