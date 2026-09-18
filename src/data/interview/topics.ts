import type { IQuestionType, MockModeId } from './types';

/** Human labels for question types (badges, filters, results screens). */
export const QUESTION_TYPE_META: Record<IQuestionType, { label: string }> = {
  'mcq': { label: 'MCQ' },
  'coding': { label: 'Coding' },
  'sql': { label: 'SQL' },
  'system-design': { label: 'System Design' },
  'conceptual': { label: 'Conceptual' },
  'scenario': { label: 'Scenario' },
  'code-analysis': { label: 'Code Analysis' },
  'debugging': { label: 'Debugging' },
  'technical-explanation': { label: 'Explanation' },
  'comparison': { label: 'Comparison' },
  'project-based': { label: 'Project-Based' },
  'behavioral-technical': { label: 'Behavioral' },
};

export interface InterviewTopicDef {
  id: string;
  label: string;
  subtopics: string[];
}

export const INTERVIEW_TOPICS: InterviewTopicDef[] = [
  {
    id: 'cs-fundamentals',
    label: 'CS Fundamentals',
    subtopics: ['OOPs', 'DBMS', 'Operating Systems', 'Computer Networks', 'COA'],
  },
  {
    id: 'development',
    label: 'Development',
    subtopics: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'REST APIs', 'Authentication', 'Authorization', 'Git & GitHub', 'Web Development'],
  },
  {
    id: 'databases',
    label: 'Databases',
    subtopics: ['SQL', 'PostgreSQL', 'MongoDB', 'Database Design', 'Indexing', 'Transactions', 'Query Optimization'],
  },
  {
    id: 'postgresql',
    label: 'PostgreSQL',
    subtopics: [
      'Architecture', 'Data Types', 'Constraints', 'Primary Keys', 'Foreign Keys', 'Joins', 'Subqueries',
      'CTEs', 'Window Functions', 'Indexes', 'B-Tree Indexes', 'EXPLAIN', 'Query Optimization',
      'Transactions', 'ACID', 'MVCC', 'Isolation Levels', 'Locks', 'Views', 'Materialized Views',
      'Stored Functions', 'Triggers', 'JSON / JSONB', 'Arrays', 'Full-Text Search', 'Partitioning',
      'Replication', 'Connection Pooling', 'Performance',
    ],
  },
  {
    id: 'aiml',
    label: 'AI/ML',
    subtopics: ['Machine Learning', 'Deep Learning', 'Generative AI', 'LLMs', 'RAG', 'AI Agents', 'AI Application Development'],
  },
  {
    id: 'devops',
    label: 'DevOps',
    subtopics: ['Docker', 'CI/CD', 'Kubernetes', 'Deployment', 'Cloud Fundamentals'],
  },
  {
    id: 'testing-security',
    label: 'Testing & Security',
    subtopics: ['Unit Testing', 'Integration Testing', 'API Testing', 'Security Fundamentals', 'Authentication', 'Authorization'],
  },
  {
    id: 'system-design',
    label: 'System Design',
    subtopics: ['High-Level Design', 'Low-Level Design', 'Scalability', 'Caching', 'Load Balancing', 'API Design', 'Distributed Systems'],
  },
  {
    id: 'aptitude',
    label: 'Aptitude',
    subtopics: ['Quantitative Aptitude', 'Logical Reasoning', 'Number Theory'],
  },
];

export const topicLabel = (id: string): string =>
  INTERVIEW_TOPICS.find((t) => t.id === id)?.label ?? id;

export const INTERVIEW_TOPIC_IDS: string[] = INTERVIEW_TOPICS.map((t) => t.id);

export const subtopicsOf = (id: string): string[] =>
  INTERVIEW_TOPICS.find((t) => t.id === id)?.subtopics ?? [];

/** Mode → topic-id[] mapping (undefined = all interview topics). */
export const MOCK_MODES: Array<{
  id: MockModeId;
  label: string;
  description: string;
  topics?: string[];
}> = [
  { id: 'daily', label: "Today's Questions", description: 'Fresh randomized daily set' },
  { id: 'mixed', label: 'Mixed Interview', description: 'Questions across all topics' },
  { id: 'postgresql', label: 'PostgreSQL Mock', description: 'PostgreSQL-focused interview', topics: ['postgresql'] },
  { id: 'cs-fundamentals', label: 'CS Fundamentals Mock', description: 'CN + OOPs + DBMS + OS + COA', topics: ['cs-fundamentals'] },
  { id: 'development', label: 'Development Mock', description: 'Frontend + Backend + APIs + Auth', topics: ['development'] },
  { id: 'aiml', label: 'AI/ML Mock', description: 'ML + GenAI + AI development', topics: ['aiml'] },
  { id: 'system-design', label: 'System Design Mock', description: 'Architecture and design', topics: ['system-design'] },
  { id: 'revision', label: 'Revision Mode', description: 'Previously weak questions' },
  { id: 'revise-3-days', label: 'Revise Last 3 Days', description: 'Questions from the previous three days' },
];
