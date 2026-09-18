import type { IQuestion } from '../types';

const q = (x: IQuestion): IQuestion => x;

export const POSTGRES_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-pg-001', topic: 'postgresql', subTopic: 'MVCC', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'Under PostgreSQL MVCC, what does an UPDATE actually do to a row?',
    options: [
      'Overwrites the tuple in place',
      'Creates a new tuple version and marks the old one as expired',
      'Only updates the index entries, not the heap',
      'Acquires an exclusive lock until commit',
    ],
    correctOption: 1,
    answer: 'Creates a new tuple version and marks the old one as expired (dead tuple).',
    explanation: 'PostgreSQL MVCC writes a new row version; the old becomes a dead tuple visible to snapshots that started earlier, and is reclaimed later by VACUUM.',
    commonMistakes: 'Assuming in-place updates like some other engines; missing the table-bloat implication.',
    interviewTip: 'Link to VACUUM, fillfactor, and HOT updates in a follow-up sentence.',
    relatedConcepts: ['VACUUM', 'Snapshots', 'HOT updates'],
  }),
  q({
    id: 'i-pg-002', topic: 'postgresql', subTopic: 'EXPLAIN', difficulty: 'medium',
    questionType: 'sql', language: 'sql', estimatedTime: 240,
    question: 'You have this slow query. Rewrite it to use an index-friendly form and explain how you would verify the plan.\n\nSELECT * FROM orders WHERE EXTRACT(YEAR FROM created_at) = 2025;',
    starterCode: '-- rewrite the query below\nSELECT * FROM orders WHERE EXTRACT(YEAR FROM created_at) = 2025;',
    answer: `SELECT * FROM orders
WHERE created_at >= DATE '2025-01-01'
  AND created_at <  DATE '2026-01-01';

-- verify with:
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE created_at >= DATE '2025-01-01'
  AND created_at <  DATE '2026-01-01';`,
    explanation: 'Wrapping the indexed column in a function makes the predicate non-sargable — the planner cannot use a B-tree index on created_at. Range predicates keep the index usable.',
    commonMistakes: 'Applying functions to the indexed column instead of the constant; reading EXPLAIN without ANALYZE (estimated, not actual rows).',
    interviewTip: 'Say: "I check estimated vs actual rows, whether an Index Scan replaced Seq Scan, and the BUFFERS hit ratio."',
    relatedConcepts: ['Sargable predicates', 'B-Tree Indexes', 'EXPLAIN ANALYZE'],
  }),
  q({
    id: 'i-pg-003', topic: 'postgresql', subTopic: 'Window Functions', difficulty: 'medium',
    questionType: 'sql', language: 'sql', estimatedTime: 300,
    question: 'For each row in `sales`, add the running total of `amount` ordered by `sold_at`, and each row’s rank by amount within its region.',
    starterCode: "-- table: sales(id, region, amount, sold_at)\nSELECT id, region, amount, sold_at\nFROM sales;",
    answer: `SELECT
  id,
  region,
  amount,
  sold_at,
  SUM(amount) OVER (ORDER BY sold_at)                                AS running_total,
  RANK()      OVER (PARTITION BY region ORDER BY amount DESC)        AS region_rank
FROM sales;`,
    explanation: 'Window functions compute aggregates per row without collapsing rows. PARTITION BY scopes the ranking, ORDER BY defines the running frame.',
    commonMistakes: 'Mixing GROUP BY with window functions unnecessarily; forgetting the frame default (RANGE UNBOUNDED PRECEDING TO CURRENT ROW) can double-count tied timestamps.',
    interviewTip: 'Mention ROWS BETWEEN for exact row-based frames when ties matter.',
    relatedConcepts: ['PARTITION BY', 'Frames', 'CTEs'],
  }),
  q({
    id: 'i-pg-004', topic: 'postgresql', subTopic: 'JSON / JSONB', difficulty: 'medium',
    questionType: 'sql', language: 'sql', estimatedTime: 240,
    question: 'Table `events(data jsonb)` stores payloads like {"user": {"id": 7}, "action": "click"}. Count clicks per user id efficiently.',
    starterCode: "-- table: events(data jsonb)\nSELECT '...';",
    answer: `SELECT
  data #>> '{user,id}'          AS user_id,
  count(*)                      AS clicks
FROM events
WHERE data ->> 'action' = 'click'
GROUP BY 1
ORDER BY clicks DESC;`,
    explanation: '->> returns text (so the equality matches the JSON string "click"), #>> extracts a nested path as text. For large tables, create an expression index: CREATE INDEX ON events ((data->>\'action\')) WHERE data->>\'action\' = \'click\';',
    commonMistakes: 'Using -> (returns jsonb, never equals a text literal); ignoring expression indexes on JSONB.',
    interviewTip: 'Contrast json vs jsonb: jsonb is decompressed-binary, indexable, and deduplicates keys.',
    relatedConcepts: ['Expression indexes', 'json vs jsonb', 'GIN indexes'],
  }),
  q({
    id: 'i-pg-005', topic: 'postgresql', subTopic: 'Isolation Levels', difficulty: 'hard',
    questionType: 'mcq', estimatedTime: 120,
    question: 'In PostgreSQL, which statement about READ COMMITTED is TRUE?',
    options: [
      'A SELECT sees a snapshot taken at transaction start for the whole transaction',
      'Each statement sees a fresh snapshot, so re-reads can see other transactions’ commits',
      'It prevents phantom reads entirely',
      'It is implemented with table-level locks',
    ],
    correctOption: 1,
    answer: 'Each statement sees a fresh snapshot — that’s why non-repeatable reads are possible.',
    explanation: 'READ COMMITTED (PostgreSQL default) takes a new snapshot per statement. REPEATABLE READ uses the transaction-start snapshot; SERIALIZABLE adds SSI conflict detection.',
    commonMistakes: 'Porting MySQL InnoDB mental models (REPEATABLE READ default) onto PostgreSQL.',
    interviewTip: 'Name the anomaly each level prevents and mention Postgres SERIALIZABLE uses SSI, not 2PL.',
    relatedConcepts: ['MVCC', 'SSI', 'Snapshot semantics'],
  }),
  q({
    id: 'i-pg-006', topic: 'postgresql', subTopic: 'Indexes', difficulty: 'medium',
    questionType: 'conceptual', estimatedTime: 150,
    question: 'A B-tree index on status exists, but queries WHERE status = \'active\' still scan the table. Diagnose.',
    answer: 'Check, in order: (1) planner statistics — is the column histogram stale (run ANALYZE)? (2) selectivity — if 80% of rows are active, a seq scan is genuinely cheaper; (3) data type mismatch — e.g., int column vs text literal, or collation differences preventing index use; (4) the index is invalid/bloated (pg_stat_user_indexes idx_scan, REINDEX CONCURRENTLY); (5) the query wrapping the column in a function or casting it.',
    explanation: 'The planner uses selectivity + cost estimates, not presence of an index. Low-selectivity predicates and stale stats are the two most common culprits.',
    commonMistakes: 'Blindly adding more indexes instead of measuring; forgetting ANALYZE after bulk loads.',
    interviewTip: 'Quote pg_stat_user_indexes and EXPLAIN (ANALYZE, BUFFERS) as your first two tools.',
    relatedConcepts: ['Selectivity', 'ANALYZE', 'Index bloat'],
  }),
  q({
    id: 'i-pg-007', topic: 'postgresql', subTopic: 'Partitioning', difficulty: 'hard',
    questionType: 'conceptual', estimatedTime: 180,
    question: 'When would you choose declarative partitioning for a PostgreSQL table, and what are the trade-offs?',
    answer: 'Choose it when a table is large enough that per-partition maintenance (drop old data, vacuum, index) and partition pruning give real wins — e.g., time-series data partitioned by month. Trade-offs: all unique/PK constraints must include the partition key; pruning requires predicates on the key; cross-partition operations (unique checks, foreign keys to/from partitioned tables) are limited; too many partitions add planning overhead.',
    explanation: 'Partitioning buys manageability (DROP of a month vs DELETE of millions of rows) and pruning, not automatic query speed for arbitrary predicates.',
    commonMistakes: 'Partitioning by a column queries rarely filter on — no pruning, only overhead.',
    interviewTip: 'Mention pg_partman for automation and that PG 14+ improves many-partition planning.',
    relatedConcepts: ['Partition pruning', 'BRIN indexes', 'Retention policies'],
  }),
  q({
    id: 'i-pg-008', topic: 'postgresql', subTopic: 'Stored Functions', difficulty: 'medium',
    questionType: 'sql', language: 'sql', estimatedTime: 240,
    question: 'Write a PL/pgSQL function `get_or_create_tag(name text)` that returns the existing tag id or inserts it and returns the new id, handling race conditions.',
    starterCode: "-- table: tags(id serial PK, name text UNIQUE)\nCREATE OR REPLACE FUNCTION get_or_create_tag(p_name text)\nRETURNS int AS $$\n  -- your code\n$$ LANGUAGE plpgsql;",
    answer: `CREATE OR REPLACE FUNCTION get_or_create_tag(p_name text)
RETURNS int AS $$
DECLARE
  v_id int;
BEGIN
  SELECT id INTO v_id FROM tags WHERE name = p_name;
  IF v_id IS NULL THEN
    BEGIN
      INSERT INTO tags (name) VALUES (p_name) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
      SELECT id INTO v_id FROM tags WHERE name = p_name;
    END;
  END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;`,
    explanation: 'The race: two sessions both find no row, both INSERT, one gets a unique_violation. The exception block re-selects the winner’s row, making the function correct under concurrency.',
    commonMistakes: 'Ignoring the unique_violation path entirely — fails under concurrent calls.',
    interviewTip: 'Point out ON CONFLICT (name) DO UPDATE RETURNING id as a shorter SQL-only alternative.',
    relatedConcepts: ['UPSERT', 'Exception handling', 'Concurrency'],
  }),
  q({
    id: 'i-pg-009', topic: 'postgresql', subTopic: 'Connection Pooling', difficulty: 'easy',
    questionType: 'mcq', estimatedTime: 75,
    question: 'Why does a PostgreSQL deployment typically put PgBouncer (or similar) in front of the database?',
    options: [
      'To cache query results',
      'Because each Postgres backend is a process; pooling reuses connections cheaply',
      'To encrypt traffic',
      'To replicate writes across nodes',
    ],
    correctOption: 1,
    answer: 'Each Postgres connection is a full backend process (~MBs of RAM); pooling multiplexes thousands of app connections onto a few backends.',
    explanation: 'Postgres has no built-in connection multiplexing; spawning a process per connection limits scale. PgBouncer (transaction mode) keeps backend count low.',
    commonMistakes: 'Assuming pool mode "transaction" is always safe — it breaks session state (prepared statements, advisory locks).',
    interviewTip: 'Mention max_connections economics and alternative: RDS Proxy / built-in poolers on managed PG.',
    relatedConcepts: ['Transaction pooling mode', 'max_connections', 'Prepared statements'],
  }),
  q({
    id: 'i-pg-010', topic: 'postgresql', subTopic: 'Views', difficulty: 'easy',
    questionType: 'mcq', estimatedTime: 75,
    question: 'What is the key difference between a view and a materialized view in PostgreSQL?',
    options: [
      'Views are read-only, materialized views are writable',
      'A view runs its query at read time; a materialized view stores the result until refreshed',
      'Materialized views cannot be indexed',
      'Views cannot join tables',
    ],
    correctOption: 1,
    answer: 'A view is a stored query evaluated every time; a materialized view persists the result and is refreshed explicitly (REFRESH MATERIALIZED VIEW [CONCURRENTLY]).',
    explanation: 'Materialized views trade freshness for read performance; CONCURRENTLY allows refreshes without blocking readers (requires a unique index).',
    commonMistakes: 'Thinking REFRESH CONCURRENTLY works without a unique index on the matview.',
    interviewTip: 'Give the classic use: expensive dashboard aggregate refreshed every N minutes.',
    relatedConcepts: ['REFRESH MATERIALIZED VIEW CONCURRENTLY', 'Incremental refresh patterns'],
  }),
];

export const DB_QUESTIONS: IQuestion[] = [
  q({
    id: 'i-db-001', topic: 'databases', subTopic: 'Indexing', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'For a composite index on (city, created_at), which query CANNOT use it efficiently?',
    options: [
      'WHERE city = ? AND created_at > ?',
      'WHERE city = ?',
      'WHERE created_at > ?',
      'WHERE city = ? ORDER BY created_at',
    ],
    correctOption: 2,
    answer: 'WHERE created_at > ? — skipping the leading column breaks the B-tree locality.',
    explanation: 'B-tree composite indexes follow the leftmost-prefix rule; created_at alone has no usable prefix here.',
    commonMistakes: 'Believing any subset of columns in any order works.',
    interviewTip: 'Then discuss covering indexes (INCLUDE) as a follow-up.',
    relatedConcepts: ['Leftmost prefix', 'Covering index'],
  }),
  q({
    id: 'i-db-002', topic: 'databases', subTopic: 'Database Design', difficulty: 'medium',
    questionType: 'conceptual', estimatedTime: 150,
    question: 'How would you model "a user can follow many users" in a relational schema? Cover constraints and indexing.',
    answer: 'A self-referencing join table follows(follower_id, followee_id, created_at) with PK (follower_id, followee_id), FKs to users(id) ON DELETE CASCADE, CHECK (follower_id <> followee_id), and a second index on followee_id for "followers of X" lookups.',
    explanation: 'The composite PK prevents duplicate follows and serves follower→followee queries; the followee_id index prevents a seq scan for reverse lookups.',
    commonMistakes: 'Forgetting the reverse index; allowing self-follows; using surrogate PK instead of composite (dupes possible).',
    interviewTip: 'Extend to the N+1 "feed" question: how you’d fan out or pull on read.',
    relatedConcepts: ['Join tables', 'Composite keys', 'Denormalization'],
  }),
  q({
    id: 'i-db-003', topic: 'databases', subTopic: 'Transactions', difficulty: 'hard',
    questionType: 'conceptual', estimatedTime: 150,
    question: 'Explain how a transfer of ₹100 between two accounts should be implemented safely in a relational DB.',
    answer: 'A single transaction: BEGIN; debit A; credit B; COMMIT — with both UPDATEs row-locked by the DB. Enforce a CHECK (balance >= 0) (or equivalent guard), use consistent lock ordering (e.g., ORDER BY account id in application-acquired locks across multiple transfers) to avoid deadlock, and retry on serialization/deadlock errors.',
    explanation: 'Atomicity guarantees both legs or neither; row locks prevent lost updates; a DB-level check is the last line of defense against app bugs.',
    commonMistakes: 'Two separate HTTP-triggered transactions; locking in inconsistent order causing deadlocks.',
    interviewTip: 'Mention idempotency keys at the API layer for retries.',
    relatedConcepts: ['ACID', 'Deadlocks', 'Idempotency'],
  }),
  q({
    id: 'i-db-004', topic: 'databases', subTopic: 'MongoDB', difficulty: 'medium',
    questionType: 'conceptual', estimatedTime: 120,
    question: 'When is MongoDB a better fit than PostgreSQL, and when is it the wrong choice?',
    answer: 'Better fit: document-shaped, evolving schemas; write-heavy ingestion; horizontal shard-by-key scaling; same-shape aggregate reads (e.g., event payloads, product catalogs with variants). Wrong choice: multi-entity ACID transactions, heavy relational joins/reporting, strict normalization needs, complex ad-hoc queries.',
    explanation: 'The data-access shape should drive the engine: documents for aggregate reads, relations for cross-entity integrity and ad-hoc joins.',
    commonMistakes: 'Choosing "NoSQL for scale" without checking whether relational + indexes already fits.',
    interviewTip: 'Mention MongoDB multi-document transactions exist but are not a reason to pick it.',
    relatedConcepts: ['Document model', 'Sharding', 'CAP trade-offs'],
  }),
  q({
    id: 'i-db-005', topic: 'databases', subTopic: 'Query Optimization', difficulty: 'medium',
    questionType: 'mcq', estimatedTime: 90,
    question: 'SELECT * on a 100M-row table with LIMIT 10 ORDER BY created_at (no index) is slow. What is the primary fix?',
    options: [
      'Increase DB memory',
      'Index on created_at so the ORDER BY + LIMIT walks the index',
      'Use OFFSET pagination',
      'Convert the table to a view',
    ],
    correctOption: 1,
    answer: 'Index on created_at.',
    explanation: 'With a B-tree on created_at the planner reads the first 10 entries directly — O(10) instead of a full sort of 100M rows.',
    commonMistakes: 'OFFSET pagination (also degrades with depth) as a "fix".',
    interviewTip: 'Contrast keyset (cursor) pagination for deep pages.',
    relatedConcepts: ['Top-N sort', 'Keyset pagination'],
  }),
];
