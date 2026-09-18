import type { Difficulty, ResourceSlot, Topic } from '../types';
import { TOPICS, CS_SUBJECTS } from './topics';

/* ── Learning-path definition used by the roadmap graph ─────── */

export interface PathNode {
  id: string;
  label: string;
  detail: string;
}

export interface PathStage {
  id: string;
  stage: string;
  title: string;
  outcome: string;
  nodes: PathNode[];
}

export const LEARNING_PATH: PathStage[] = [
  {
    id: 'foundations',
    stage: 'Phase 01',
    title: 'Core Foundations',
    outcome: 'Think in data structures. Write clean, correct code under interview pressure.',
    nodes: [
      { id: 'arrays', label: 'Arrays', detail: 'Two pointers · sliding window · prefix sums' },
      { id: 'strings', label: 'Strings', detail: 'Frequency maps · anagrams · KMP intuition' },
      { id: 'linked', label: 'Linked Lists', detail: 'Reversal · fast/slow pointers' },
      { id: 'stacks', label: 'Stacks & Queues', detail: 'Monotonic stack · BFS/DFS queues' },
      { id: 'recursion', label: 'Recursion', detail: 'Subsets · permutations · backtracking' },
      { id: 'search', label: 'Search & Sort', detail: 'Binary search on answers' },
    ],
  },
  {
    id: 'structures',
    stage: 'Phase 02',
    title: 'Trees, Graphs & DP',
    outcome: 'Solve the medium/hard tier that decides interview outcomes.',
    nodes: [
      { id: 'trees', label: 'Trees & BSTs', detail: 'Traversals · LCA · tree DP' },
      { id: 'heaps', label: 'Heaps', detail: 'Top-K · two-heap medians' },
      { id: 'graphs', label: 'Graphs', detail: 'BFS/DFS · Dijkstra · MST' },
      { id: 'greedy', label: 'Greedy', detail: 'Exchange arguments · intervals' },
      { id: 'dp', label: 'Dynamic Programming', detail: 'Knapsack · LIS · state design' },
      { id: 'tries', label: 'Tries & Bits', detail: 'Prefix trees · XOR tricks' },
    ],
  },
  {
    id: 'build',
    stage: 'Phase 03',
    title: 'Build Real Software',
    outcome: 'Ship full products: frontend, backend, database and deployment.',
    nodes: [
      { id: 'fe', label: 'Frontend', detail: 'React · TypeScript · Tailwind' },
      { id: 'be', label: 'Backend', detail: 'Node · Express · REST · auth' },
      { id: 'db', label: 'Databases', detail: 'PostgreSQL · MongoDB · indexes' },
      { id: 'deploy', label: 'DevOps', detail: 'Docker · CI/CD · Kubernetes' },
      { id: 'test', label: 'Testing', detail: 'Unit · integration · E2E' },
    ],
  },
  {
    id: 'intelligence',
    stage: 'Phase 04',
    title: 'AI-Native Engineering',
    outcome: 'Build intelligent applications with LLMs, RAG and agents.',
    nodes: [
      { id: 'ml', label: 'ML Core', detail: 'Regression · metrics · validation' },
      { id: 'dl', label: 'Deep Learning', detail: 'PyTorch · training loops' },
      { id: 'llm', label: 'LLMs', detail: 'Prompting · function calling' },
      { id: 'rag', label: 'RAG', detail: 'Embeddings · vector search' },
      { id: 'agents', label: 'Agents', detail: 'Planning loops · guardrails' },
    ],
  },
  {
    id: 'mastery',
    stage: 'Phase 05',
    title: 'CS Depth & Interview Mastery',
    outcome: 'Fundamentals, system design and behavioral polish for the offer.',
    nodes: [
      { id: 'oop', label: 'OOPs', detail: 'SOLID · design patterns' },
      { id: 'dbms', label: 'DBMS', detail: 'Normalization · ACID' },
      { id: 'os', label: 'OS', detail: 'Processes · deadlock · memory' },
      { id: 'cn', label: 'Networks', detail: 'TCP · HTTP · DNS' },
      { id: 'coa', label: 'COA', detail: 'Pipelines · cache hierarchy' },
      { id: 'sd', label: 'System Design', detail: 'Scale · cache · balance' },
    ],
  },
];

/* ── Very-important popup content ───────────────────────────── */

export interface PopupTopicItem {
  title: string;
  description: string;
  notes?: ResourceSlot;
  lectures?: ResourceSlot;
}

export interface PopupContent {
  id: string;
  title: string;
  badge: 'VERY IMPORTANT' | 'IMPORTANT';
  why: string;
  topics: PopupTopicItem[];
}

export const DEVOPS_POPUP: PopupContent = {
  id: 'devops-testing-security',
  title: 'DevOps, Testing & Security',
  badge: 'VERY IMPORTANT',
  why: 'Companies increasingly filter for engineers who can ship: containerize, automate pipelines, test properly and secure what they deploy. System Design and Quantitative Aptitude also decide who clears the final rounds.',
  topics: [
    {
      title: 'Docker, CI/CD & Kubernetes',
      description: 'Containers, pipeline-as-code and orchestration — the modern deployment stack.',
      notes: TOPICS.find((t) => t.id === 'devops')?.chapters.map((c) => c.notes[0]).filter(Boolean)[0],
    },
    {
      title: 'Testing Strategy',
      description: 'Test pyramids, meaningful coverage and CI-integrated test suites.',
      notes: TOPICS.find((t) => t.id === 'testing')?.chapters[0]?.notes[0],
    },
    {
      title: 'Security & OWASP Top 10',
      description: 'Injection, XSS, CSRF and building applications with secure defaults.',
      notes: TOPICS.find((t) => t.id === 'security')?.chapters[0]?.notes[0],
    },
    {
      title: 'Authentication & Authorization',
      description: 'JWT, OAuth2, RBAC/ABAC — the full identity stack, done right.',
      notes: TOPICS.find((t) => t.id === 'auth')?.chapters[0]?.notes[0],
    },
    {
      title: 'Quantitative Aptitude',
      description: 'Placement-screen speed math: percentages, ratios, permutations.',
    },
    {
      title: 'System Design',
      description: 'Highlighted for interviews: scalability, caching, load balancing, sharding.',
    },
  ],
};

export const GENAI_POPUP: PopupContent = {
  id: 'gen-ai',
  title: 'Generative AI & AI Automation',
  badge: 'VERY IMPORTANT',
  why: 'LLM-powered features are becoming standard in product teams. Engineers who can integrate AI APIs, build RAG pipelines and automate workflows with agents are commanding a visible salary premium.',
  topics: [
    { title: 'LLM Fundamentals', description: 'Tokens, embeddings, context windows and sampling.' },
    { title: 'Prompt Engineering', description: 'System prompts, few-shotting, structured outputs and evaluation.' },
    { title: 'AI APIs', description: 'OpenAI-class APIs, function calling, streaming and cost control.' },
    { title: 'RAG', description: 'Chunking, embeddings, vector search and grounded answers.' },
    { title: 'AI Agents', description: 'Planning loops, tool use, memory and guardrails.' },
    { title: 'AI Automation Workflows', description: 'Webhooks, pipelines and orchestrating AI into business flows.' },
  ],
};

export const NUMBER_THEORY_POPUP: PopupContent = {
  id: 'number-theory',
  title: 'Number Theory',
  badge: 'IMPORTANT',
  why: 'A quiet differentiator in competitive programming rounds. Primes, modular arithmetic and combinatorics unlock the hard problems that filter candidates.',
  topics: [
    { title: 'Prime Numbers', description: 'Primality tests and counting primes efficiently.' },
    { title: 'Sieve of Eratosthenes', description: 'Linear and segmented sieves for O(n log log n) generation.' },
    { title: 'GCD & LCM', description: 'Euclid, extended GCD and Bezout identity applications.' },
    { title: 'Modular Arithmetic', description: 'Mod under addition, multiplication and subtraction rules.' },
    { title: 'Modular Exponentiation', description: 'Binary exponentiation in O(log n).' },
    { title: 'Modular Inverse', description: 'Fermat’s little theorem and extended GCD approaches.' },
    { title: 'Factorization', description: 'Trial division, SPF sieves and divisor counting.' },
    { title: 'Combinatorics Basics', description: 'nCr under mod, pigeonhole and counting patterns.' },
    { title: 'Competitive Programming Applications', description: 'Where each technique shows up in real contests.' },
  ],
};

/* ── Stats & search index ───────────────────────────────────── */

export const PLATFORM_STATS = [
  { label: 'Curated topics', value: `${TOPICS.length + CS_SUBJECTS.length}+` },
  { label: 'Structured chapters', value: '60+' },
  { label: 'Interview questions', value: '70+' },
  { label: 'Learning tracks', value: '5' },
];

export interface SearchDoc {
  id: string;
  kind: 'topic' | 'subject' | 'chapter' | 'question' | 'path';
  title: string;
  subtitle: string;
  to: string;
  tags: string[];
}

export const buildSearchIndex = (): SearchDoc[] => {
  const docs: SearchDoc[] = [];

  for (const t of TOPICS) {
    docs.push({
      id: `topic-${t.id}`,
      kind: 'topic',
      title: t.title,
      subtitle: `${t.categoryLabel} · ${t.difficulty}`,
      to: `/learn/${t.slug}`,
      tags: [...t.tags, t.categoryLabel.toLowerCase()],
    });
    for (const c of t.chapters) {
      docs.push({
        id: `chapter-${t.id}-${c.id}`,
        kind: 'chapter',
        title: c.title,
        subtitle: `Chapter · ${t.shortTitle}`,
        to: `/learn/${t.slug}#${c.id}`,
        tags: [t.shortTitle.toLowerCase(), 'chapter'],
      });
    }
  }

  for (const s of CS_SUBJECTS) {
    docs.push({
      id: `subject-${s.id}`,
      kind: 'subject',
      title: s.name,
      subtitle: `CS Fundamentals · ${s.abbr}`,
      to: `/cs-fundamentals#${s.id}`,
      tags: [s.abbr.toLowerCase(), 'cs fundamentals'],
    });
    for (const c of s.chapters) {
      docs.push({
        id: `chapter-${s.id}-${c.id}`,
        kind: 'chapter',
        title: c.title,
        subtitle: `Chapter · ${s.abbr}`,
        to: `/cs-fundamentals#${s.id}`,
        tags: [s.abbr.toLowerCase(), 'chapter'],
      });
    }
  }

  docs.push({
    id: 'path-roadmap',
    kind: 'path',
    title: 'SDE Roadmap',
    subtitle: 'Full learning path · 5 phases',
    to: '/learning-path',
    tags: ['roadmap', 'learning path', 'roadmap'],
  });
  docs.push({
    id: 'path-interview',
    kind: 'path',
    title: 'Interview Preparation',
    subtitle: 'Mock interviews · PostgreSQL track · smart revision',
    to: '/interview-prep',
    tags: ['interview', 'mock', 'questions'],
  });

  return docs;
};

export const SEARCH_INDEX: SearchDoc[] = buildSearchIndex();

export const searchDocs = (query: string, limit = 8): SearchDoc[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = SEARCH_INDEX.map((doc) => {
    const title = doc.title.toLowerCase();
    const hay = `${title} ${doc.subtitle.toLowerCase()} ${doc.tags.join(' ')}`;
    let score = 0;
    if (title.startsWith(q)) score += 3;
    if (title.includes(q)) score += 2;
    if (hay.includes(q)) score += 1;
    return { doc, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((x) => x.doc);
};

export const difficultyOfTopic = (topic: Topic): Difficulty => topic.difficulty;
