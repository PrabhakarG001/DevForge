import {
  Binary,
  Boxes,
  BrainCircuit,
  Database,
  FileCode2,
  Globe,
  Layers,
  Lock,
  Network,
  Scale,
  Server,
  ShieldCheck,
  Sigma,
  Sparkles,
  TestTube2,
  Workflow,
} from 'lucide-react';
import type { Chapter, Difficulty, Topic, ResourceSlot } from '../types';
import { available, comingSoon, placeholder, verifiedNotes } from './resources';

/* ── chapter builder ────────────────────────────────────────── */

interface ChapterSpec {
  title: string;
  summary: string;
  difficulty: Difficulty;
  minutes: number;
  /** curated, stable notes URLs for this chapter */
  notesUrls?: Array<[string, string]>;
}

const buildChapter = (c: ChapterSpec, practiceTitle: string): Chapter => ({
  id: '',
  title: c.title,
  summary: c.summary,
  difficulty: c.difficulty,
  minutes: c.minutes,
  lectures: [placeholder('Lecture — coming soon', comingSoon('video lectures'))],
  notes:
    c.notesUrls?.map(([t, u]) => verifiedNotes(t, u)) ??
    [placeholder('Notes — coming soon', comingSoon('written notes'))],
  practice: [placeholder(practiceTitle, 'A graded problem set unlocks here when practice mode ships.')],
});

const mkChapters = (prefix: string, specs: ChapterSpec[]): Chapter[] =>
  specs.map((s, i) => ({ ...buildChapter(s, `${s.title} — practice set`), id: `${prefix}-ch${i + 1}` }));

/* ── shared slots ───────────────────────────────────────────── */

const link = (title: string, url: string): ResourceSlot => available({
  kind: 'notes',
  title,
  url,
  provider: 'official docs',
  verified: true,
});
void link;

/* ── DSA ────────────────────────────────────────────────────── */

const dsaChapters = mkChapters('dsa', [
  {
    title: 'Arrays & Two Pointers',
    summary: 'Sliding window, prefix sums, Kadane and the classic in-place tricks interviewers love.',
    difficulty: 'Beginner',
    minutes: 90,
    notesUrls: [['Prefix sums', 'https://cp-algorithms.com/misc/prefix-sums.html']],
  },
  {
    title: 'Strings & Pattern Matching',
    summary: 'Frequency maps, anagrams, KMP intuition and string-building patterns.',
    difficulty: 'Beginner',
    minutes: 75,
  },
  {
    title: 'Linked Lists',
    summary: 'Reversal, cycle detection with fast/slow pointers, merging and dummy-head patterns.',
    difficulty: 'Beginner',
    minutes: 70,
  },
  {
    title: 'Stacks & Queues',
    summary: 'Monotonic stacks, next-greater-element families and queue-with-stack designs.',
    difficulty: 'Beginner',
    minutes: 65,
  },
  {
    title: 'Recursion & Backtracking',
    summary: 'Subsets, permutations, N-Queens, Sudoku — decision-tree thinking made systematic.',
    difficulty: 'Intermediate',
    minutes: 110,
  },
  {
    title: 'Searching & Sorting',
    summary: 'Binary search on answers, custom comparators and when each sort actually matters.',
    difficulty: 'Beginner',
    minutes: 80,
    notesUrls: [['Binary search', 'https://cp-algorithms.com/num-methods/binary_search.html']],
  },
  {
    title: 'Trees & BSTs',
    summary: 'Traversals, LCA, validation, serialization and recursive tree DP.',
    difficulty: 'Intermediate',
    minutes: 120,
  },
  {
    title: 'Heaps & Priority Queues',
    summary: 'Top-K, two-heap medians, merge-K-lists and heap-order reasoning.',
    difficulty: 'Intermediate',
    minutes: 70,
  },
  {
    title: 'Graphs I — Traversal',
    summary: 'BFS/DFS, connected components, topological sort and cycle detection.',
    difficulty: 'Intermediate',
    minutes: 130,
    notesUrls: [['Breadth-first search', 'https://cp-algorithms.com/graph/breadth-first-search.html']],
  },
  {
    title: 'Graphs II — Shortest Paths & MST',
    summary: 'Dijkstra, Bellman-Ford, Floyd-Warshall, Kruskal and Prim.',
    difficulty: 'Advanced',
    minutes: 120,
    notesUrls: [['Dijkstra', 'https://cp-algorithms.com/graph/dijkstra.html']],
  },
  {
    title: 'Greedy Algorithms',
    summary: 'Exchange arguments, interval scheduling and proofs that greedy choices are safe.',
    difficulty: 'Intermediate',
    minutes: 80,
  },
  {
    title: 'Dynamic Programming',
    summary: '1-D/2-D tabulation, knapsack families, LIS, LCS and state-design intuition.',
    difficulty: 'Advanced',
    minutes: 180,
  },
  {
    title: 'Tries & Bit Manipulation',
    summary: 'Prefix trees, XOR tricks and bitmask subproblems in interviews.',
    difficulty: 'Advanced',
    minutes: 85,
  },
  {
    title: 'Advanced Algorithms',
    summary: 'Union-Find, segment trees and a tour of harder interview-tier patterns.',
    difficulty: 'Advanced',
    minutes: 140,
  },
]);

/* ── Full Stack ─────────────────────────────────────────────── */

const fullstackChapters = mkChapters('fs', [
  {
    title: 'HTML & Semantic Markup',
    summary: 'Document structure, accessibility primitives and SEO-critical markup.',
    difficulty: 'Beginner',
    minutes: 50,
    notesUrls: [['HTML basics', 'https://developer.mozilla.org/en-US/docs/Web/HTML']],
  },
  {
    title: 'CSS & Tailwind CSS',
    summary: 'The box model, flex/grid layout systems and utility-first workflows.',
    difficulty: 'Beginner',
    minutes: 80,
    notesUrls: [
      ['CSS layout', 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_layout'],
      ['Tailwind — utility-first', 'https://tailwindcss.com/docs/utility-first'],
    ],
  },
  {
    title: 'JavaScript Deep Dive',
    summary: 'Closures, prototypes, the event loop, promises and async/await internals.',
    difficulty: 'Intermediate',
    minutes: 130,
    notesUrls: [['JavaScript guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide']],
  },
  {
    title: 'TypeScript for Product Teams',
    summary: 'Generics, narrowing, utility types and typing real API layers.',
    difficulty: 'Intermediate',
    minutes: 95,
    notesUrls: [['Handbook — generics', 'https://www.typescriptlang.org/docs/handbook/2/generics.html']],
  },
  {
    title: 'React Fundamentals',
    summary: 'Components, hooks, state colocation and rendering behaviour.',
    difficulty: 'Intermediate',
    minutes: 120,
    notesUrls: [
      ['useState', 'https://react.dev/reference/react/useState'],
      ['useEffect', 'https://react.dev/reference/react/useEffect'],
    ],
  },
  {
    title: 'Node.js & Express.js',
    summary: 'HTTP servers, middleware pipelines, routing and error handling.',
    difficulty: 'Intermediate',
    minutes: 110,
    notesUrls: [
      ['Node.js http module', 'https://nodejs.org/docs/latest/api/http.html'],
      ['Express routing', 'https://expressjs.com/en/guide/routing.html'],
    ],
  },
  {
    title: 'REST APIs & Authentication',
    summary: 'Resource design, status codes, JWT vs sessions and OAuth2 flows.',
    difficulty: 'Intermediate',
    minutes: 90,
  },
  {
    title: 'Databases — PostgreSQL & MongoDB',
    summary: 'Schema design, indexes, transactions and when NoSQL is the right call.',
    difficulty: 'Intermediate',
    minutes: 115,
    notesUrls: [
      ['PostgreSQL indexes', 'https://www.postgresql.org/docs/current/indexes.html'],
      ['MongoDB CRUD', 'https://www.mongodb.com/docs/manual/crud/'],
    ],
  },
]);

/* ── AI/ML ──────────────────────────────────────────────────── */

const aimlChapters = mkChapters('aiml', [
  {
    title: 'Python for AI/ML',
    summary: 'NumPy, pandas and the idioms every ML engineer uses daily.',
    difficulty: 'Beginner',
    minutes: 80,
    notesUrls: [['Python tutorial', 'https://docs.python.org/3/tutorial/index.html']],
  },
  {
    title: 'Machine Learning Core',
    summary: 'Regression, classification, overfitting, metrics and train/test discipline.',
    difficulty: 'Intermediate',
    minutes: 140,
  },
  {
    title: 'Deep Learning with PyTorch',
    summary: 'Tensors, autograd, training loops and the mental model of backpropagation.',
    difficulty: 'Advanced',
    minutes: 160,
    notesUrls: [['PyTorch tensors', 'https://pytorch.org/docs/stable/torch.html']],
  },
  {
    title: 'Model Integration & Serving',
    summary: 'Wrapping models in APIs, batching, latency budgets and evaluation.',
    difficulty: 'Advanced',
    minutes: 100,
  },
  {
    title: 'AI APIs & Generative AI',
    summary: 'LLM APIs, prompt design, function calling and cost-aware integration.',
    difficulty: 'Intermediate',
    minutes: 90,
    notesUrls: [['OpenAI API reference', 'https://platform.openai.com/docs/api-reference']],
  },
  {
    title: 'AI-powered Applications',
    summary: 'RAG pipelines, agents, streaming UX and shipping intelligent products.',
    difficulty: 'Advanced',
    minutes: 120,
    notesUrls: [['Transformers docs', 'https://huggingface.co/docs/transformers/index']],
  },
]);

/* ── CS Fundamentals ────────────────────────────────────────── */

const cnChapters = mkChapters('cn', [
  {
    title: 'Network Models & Layers',
    summary: 'OSI vs TCP/IP, encapsulation and where each protocol lives.',
    difficulty: 'Beginner',
    minutes: 60,
  },
  {
    title: 'Transport Layer — TCP & UDP',
    summary: 'Handshakes, flow control, congestion control and reliability guarantees.',
    difficulty: 'Intermediate',
    minutes: 80,
  },
  {
    title: 'Application Protocols — HTTP/HTTPS, DNS',
    summary: 'Request lifecycle, TLS, caching headers and name resolution.',
    difficulty: 'Intermediate',
    minutes: 75,
    notesUrls: [['RFC 9110 — HTTP semantics', 'https://datatracker.ietf.org/doc/html/rfc9110']],
  },
]);

const oopChapters = mkChapters('oop', [
  {
    title: 'Classes, Objects & the Four Pillars',
    summary: 'Encapsulation, abstraction, inheritance and polymorphism with real examples.',
    difficulty: 'Beginner',
    minutes: 65,
  },
  {
    title: 'SOLID Principles & Composition',
    summary: 'Writing extensible classes and why "prefer composition" wins arguments.',
    difficulty: 'Intermediate',
    minutes: 70,
  },
  {
    title: 'Design Patterns in Interviews',
    summary: 'Factory, strategy, observer and singleton — plus when NOT to use them.',
    difficulty: 'Intermediate',
    minutes: 85,
  },
]);

const dbmsChapters = mkChapters('dbms', [
  {
    title: 'Relational Model & SQL',
    summary: 'Joins, aggregates, subqueries and thinking in sets.',
    difficulty: 'Beginner',
    minutes: 85,
  },
  {
    title: 'Normalization & Schema Design',
    summary: '1NF→BCNF, anomalies and designing schemas that age well.',
    difficulty: 'Intermediate',
    minutes: 70,
  },
  {
    title: 'Transactions, Indexes & ACID',
    summary: 'Isolation levels, locking, B-trees and query planning basics.',
    difficulty: 'Advanced',
    minutes: 95,
  },
]);

const osChapters = mkChapters('os', [
  {
    title: 'Processes, Threads & Scheduling',
    summary: 'Context switches, schedulers and concurrency vs parallelism.',
    difficulty: 'Intermediate',
    minutes: 75,
  },
  {
    title: 'Synchronization & Deadlocks',
    summary: 'Mutexes, semaphores, the four deadlock conditions and avoidance.',
    difficulty: 'Advanced',
    minutes: 80,
  },
  {
    title: 'Memory & Virtual Memory',
    summary: 'Paging, segmentation, TLBs and page-replacement strategies.',
    difficulty: 'Advanced',
    minutes: 85,
  },
]);

const coaChapters = mkChapters('coa', [
  {
    title: 'Data Representation & Arithmetic',
    summary: "Two's complement, IEEE-754 floats and ALU-level addition/multiplication.",
    difficulty: 'Beginner',
    minutes: 60,
  },
  {
    title: 'Instruction Sets & Pipelining',
    summary: 'RISC vs CISC, hazards, forwarding and the classic 5-stage pipeline.',
    difficulty: 'Intermediate',
    minutes: 90,
  },
  {
    title: 'Memory Hierarchy & Cache',
    summary: 'Cache lines, associativity, locality and why it explains real performance.',
    difficulty: 'Intermediate',
    minutes: 80,
  },
]);

/* ── DevOps / Testing / Security / SD / Aptitude ───────────── */

const devopsChapters = mkChapters('devops', [
  {
    title: 'Docker & Containers',
    summary: 'Images, layers, volumes and writing production-sane Dockerfiles.',
    difficulty: 'Intermediate',
    minutes: 85,
    notesUrls: [['Dockerfile reference', 'https://docs.docker.com/reference/dockerfile/']],
  },
  {
    title: 'CI/CD Pipelines',
    summary: 'Build-test-deploy automation, gates and pipeline-as-code with GitHub Actions.',
    difficulty: 'Intermediate',
    minutes: 75,
    notesUrls: [
      ['Workflow syntax', 'https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions'],
    ],
  },
  {
    title: 'Kubernetes Essentials',
    summary: 'Pods, deployments, services and why the platform behaves the way it does.',
    difficulty: 'Advanced',
    minutes: 110,
    notesUrls: [['Pods overview', 'https://kubernetes.io/docs/concepts/workloads/pods/']],
  },
  {
    title: 'Testing Strategy',
    summary: 'Unit vs integration vs E2E, test pyramids and meaningful coverage.',
    difficulty: 'Intermediate',
    minutes: 70,
  },
  {
    title: 'Security & OWASP Top 10',
    summary: 'Injection, XSS, CSRF and hardening real applications.',
    difficulty: 'Intermediate',
    minutes: 80,
    notesUrls: [['OWASP Top 10', 'https://owasp.org/www-project-top-ten/']],
  },
  {
    title: 'Authentication & Authorization',
    summary: 'JWT, OAuth2, RBAC/ABAC and session security done right.',
    difficulty: 'Intermediate',
    minutes: 75,
    notesUrls: [['JWT introduction', 'https://jwt.io/introduction']],
  },
  {
    title: 'System Design — The Fundamentals',
    summary: 'Scalability, caching, load balancing, sharding and back-of-envelope math.',
    difficulty: 'Advanced',
    minutes: 150,
  },
  {
    title: 'Quantitative Aptitude',
    summary: 'Percentages, ratios, permutations and the speed patterns placement tests use.',
    difficulty: 'Beginner',
    minutes: 60,
  },
]);

/* ── GenAI ──────────────────────────────────────────────────── */

const genaiChapters = mkChapters('genai', [
  {
    title: 'LLM Fundamentals',
    summary: 'Tokens, embeddings, context windows and sampling parameters.',
    difficulty: 'Intermediate',
    minutes: 80,
    notesUrls: [['OpenAI models guide', 'https://platform.openai.com/docs/models']],
  },
  {
    title: 'Prompt Engineering',
    summary: 'System prompts, few-shotting, structured outputs and evaluation harnesses.',
    difficulty: 'Beginner',
    minutes: 60,
  },
  {
    title: 'RAG — Retrieval-Augmented Generation',
    summary: 'Chunking, embeddings, vector search and grounding answers in your data.',
    difficulty: 'Advanced',
    minutes: 100,
  },
  {
    title: 'AI Agents & Tool Use',
    summary: 'Function calling, planning loops, memory and guardrails for autonomous flows.',
    difficulty: 'Advanced',
    minutes: 95,
  },
  {
    title: 'AI Automation Workflows',
    summary: 'Pipelines, webhooks and orchestrating AI into reliable business workflows.',
    difficulty: 'Intermediate',
    minutes: 70,
  },
]);

/* ── Number Theory ──────────────────────────────────────────── */

const numberTheoryChapters = mkChapters('nt', [
  {
    title: 'Primes & the Sieve of Eratosthenes',
    summary: 'Linear and classic sieves, segmented sieving and prime counting.',
    difficulty: 'Beginner',
    minutes: 60,
    notesUrls: [['Sieve of Eratosthenes', 'https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html']],
  },
  {
    title: 'GCD, LCM & Euclid',
    summary: 'Euclidean algorithm, extended GCD and Bezout identity applications.',
    difficulty: 'Beginner',
    minutes: 45,
    notesUrls: [['Extended Euclidean', 'https://cp-algorithms.com/algebra/extended-euclid-algorithm.html']],
  },
  {
    title: 'Modular Arithmetic & Exponentiation',
    summary: 'Fast power, modular inverse, Fermat and CRT-style problem patterns.',
    difficulty: 'Intermediate',
    minutes: 85,
    notesUrls: [
      ['Modular exponentiation', 'https://cp-algorithms.com/algebra/binary-exp.html'],
      ['Modular inverse', 'https://cp-algorithms.com/algebra/module-inverse.html'],
    ],
  },
  {
    title: 'Factorization & Divisors',
    summary: 'Trial division, SPF sieves and divisor-count shortcuts.',
    difficulty: 'Intermediate',
    minutes: 65,
    notesUrls: [['Prime factorization', 'https://cp-algorithms.com/algebra/factorization.html']],
  },
  {
    title: 'Combinatorics Basics',
    summary: 'nCr under mod, pigeonhole and the counting patterns CP loves.',
    difficulty: 'Intermediate',
    minutes: 75,
    notesUrls: [['Binomial coefficients', 'https://cp-algorithms.com/combinatorics/binomial-coefficients.html']],
  },
]);

/* ── topic registry ─────────────────────────────────────────── */

export const TOPICS: Topic[] = [
  {
    id: 'dsa',
    slug: 'dsa',
    title: 'Data Structures & Algorithms',
    shortTitle: 'DSA',
    description:
      'The single highest-leverage skill for 10+ LPA interviews. Arrays to graphs to DP — patterns, not memorization.',
    category: 'dsa',
    categoryLabel: 'DSA',
    icon: Binary,
    difficulty: 'Intermediate',
    lectureCount: 14,
    noteCount: 14,
    tags: ['Arrays', 'Trees', 'Graphs', 'DP', 'Greedy'],
    importance: 'very-important',
    chapters: dsaChapters,
  },
  {
    id: 'fullstack',
    slug: 'full-stack-development',
    title: 'Full Stack Development',
    shortTitle: 'Full Stack',
    description:
      'Ship complete products: React frontends, Node/Express APIs, PostgreSQL/MongoDB and auth that works.',
    category: 'fullstack',
    categoryLabel: 'Full Stack',
    icon: Layers,
    difficulty: 'Intermediate',
    lectureCount: 8,
    noteCount: 8,
    tags: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB'],
    importance: 'very-important',
    chapters: fullstackChapters,
  },
  {
    id: 'aiml',
    slug: 'ai-ml-development',
    title: 'AI/ML Development',
    shortTitle: 'AI/ML',
    description:
      'From ML fundamentals to LLM-powered products — build and integrate models, not just call APIs.',
    category: 'aiml',
    categoryLabel: 'AI/ML',
    icon: BrainCircuit,
    difficulty: 'Advanced',
    lectureCount: 6,
    noteCount: 6,
    tags: ['Python', 'PyTorch', 'LLMs', 'RAG'],
    importance: 'very-important',
    chapters: aimlChapters,
  },
  {
    id: 'system-design',
    slug: 'system-design',
    title: 'System Design',
    shortTitle: 'System Design',
    description:
      'Scale, cache, balance, shard. The interview round that separates seniors from juniors — start early.',
    category: 'system-design',
    categoryLabel: 'DevOps & Architecture',
    icon: Network,
    difficulty: 'Advanced',
    lectureCount: 1,
    noteCount: 1,
    tags: ['Scalability', 'Caching', 'Load Balancing', 'APIs'],
    importance: 'very-important',
    chapters: devopsChapters.slice(6, 7),
  },
  {
    id: 'devops',
    slug: 'devops',
    title: 'DevOps & Containers',
    shortTitle: 'DevOps',
    description: 'Docker, CI/CD and Kubernetes — the deployment literacy every team expects.',
    category: 'devops',
    categoryLabel: 'DevOps & Architecture',
    icon: Workflow,
    difficulty: 'Intermediate',
    lectureCount: 3,
    noteCount: 3,
    tags: ['Docker', 'CI/CD', 'Kubernetes'],
    importance: 'important',
    chapters: devopsChapters.slice(0, 3),
  },
  {
    id: 'testing',
    slug: 'testing',
    title: 'Testing & Quality',
    shortTitle: 'Testing',
    description: 'Write tests that catch bugs before users do — unit, integration and E2E strategy.',
    category: 'testing',
    categoryLabel: 'DevOps & Architecture',
    icon: TestTube2,
    difficulty: 'Beginner',
    lectureCount: 1,
    noteCount: 1,
    tags: ['Unit', 'E2E', 'Coverage'],
    importance: 'important',
    chapters: devopsChapters.slice(3, 4),
  },
  {
    id: 'security',
    slug: 'security',
    title: 'Security',
    shortTitle: 'Security',
    description: 'OWASP Top 10, secure defaults and the threat mindset for real applications.',
    category: 'security',
    categoryLabel: 'DevOps & Architecture',
    icon: ShieldCheck,
    difficulty: 'Intermediate',
    lectureCount: 1,
    noteCount: 1,
    tags: ['OWASP', 'XSS', 'Hardening'],
    importance: 'important',
    chapters: devopsChapters.slice(4, 5),
  },
  {
    id: 'auth',
    slug: 'auth-and-authorization',
    title: 'Authentication & Authorization',
    shortTitle: 'Auth',
    description: 'JWT, OAuth2, RBAC — the flows behind every login screen, done securely.',
    category: 'auth',
    categoryLabel: 'DevOps & Architecture',
    icon: Lock,
    difficulty: 'Intermediate',
    lectureCount: 1,
    noteCount: 1,
    tags: ['JWT', 'OAuth2', 'RBAC'],
    importance: 'important',
    chapters: devopsChapters.slice(5, 6),
  },
  {
    id: 'aptitude',
    slug: 'quantitative-aptitude',
    title: 'Quantitative Aptitude',
    shortTitle: 'Aptitude',
    description: 'Speed math for placement screens — patterns, shortcuts and timed drills.',
    category: 'aptitude',
    categoryLabel: 'DevOps & Architecture',
    icon: Sigma,
    difficulty: 'Beginner',
    lectureCount: 1,
    noteCount: 1,
    tags: ['Percentages', 'Ratios', 'P&C'],
    importance: 'important',
    chapters: devopsChapters.slice(7, 8),
  },
  {
    id: 'gen-ai',
    slug: 'generative-ai',
    title: 'Generative AI',
    shortTitle: 'GenAI',
    description: 'LLMs, RAG, agents and prompt engineering — the stack reshaping software teams.',
    category: 'gen-ai',
    categoryLabel: 'Generative AI',
    icon: Sparkles,
    difficulty: 'Advanced',
    lectureCount: 5,
    noteCount: 5,
    tags: ['LLMs', 'RAG', 'Agents', 'Prompting'],
    importance: 'very-important',
    chapters: genaiChapters,
  },
  {
    id: 'number-theory',
    slug: 'number-theory',
    title: 'Number Theory',
    shortTitle: 'Number Theory',
    description: 'Primes, modular arithmetic and combinatorics — the CP toolkit for contests.',
    category: 'number-theory',
    categoryLabel: 'Competitive Programming',
    icon: Scale,
    difficulty: 'Intermediate',
    lectureCount: 5,
    noteCount: 5,
    tags: ['Primes', 'Modulo', 'Combinatorics'],
    importance: 'important',
    chapters: numberTheoryChapters,
  },
];

/** CS fundamentals render from a dedicated page + modal. */
export const CS_SUBJECTS = [
  {
    id: 'cn',
    abbr: 'CN',
    name: 'Computer Networks',
    description: 'Layers, TCP/UDP, HTTP/HTTPS and DNS — how data actually moves.',
    icon: Globe,
    chapters: cnChapters,
  },
  {
    id: 'oops',
    abbr: 'OOPs',
    name: 'Object-Oriented Programming',
    description: 'The four pillars, SOLID and design patterns interviewers probe.',
    icon: Boxes,
    chapters: oopChapters,
  },
  {
    id: 'dbms',
    abbr: 'DBMS',
    name: 'Database Management Systems',
    description: 'SQL, normalization, transactions and indexes under the hood.',
    icon: Database,
    chapters: dbmsChapters,
  },
  {
    id: 'os',
    abbr: 'OS',
    name: 'Operating Systems',
    description: 'Processes, scheduling, synchronization and virtual memory.',
    icon: Server,
    chapters: osChapters,
  },
  {
    id: 'coa',
    abbr: 'COA',
    name: 'Computer Organization & Architecture',
    description: 'Pipelines, caches and the hardware beneath your code.',
    icon: FileCode2,
    chapters: coaChapters,
  },
] as const;

export const getTopicBySlug = (slug: string): Topic | undefined =>
  TOPICS.find((t) => t.slug === slug);

export const ALL_TOPIC_CHAPTER_COUNT = TOPICS.reduce((n, t) => n + t.chapters.length, 0);
