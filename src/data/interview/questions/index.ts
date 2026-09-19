import type { IQuestion } from '../types';
import { INTERVIEW_TOPIC_IDS } from '../topics';
import { CS_QUESTIONS, DEV_QUESTIONS } from './cs';
import { POSTGRES_QUESTIONS, DB_QUESTIONS } from './postgres';
import { AIML_QUESTIONS, DEVOPS_QUESTIONS, SECURITY_QUESTIONS, SYSDESIGN_QUESTIONS, APTITUDE_QUESTIONS } from './specialist';
import {
  SCENARIO_QUESTIONS, PROJECT_QUESTIONS, EXPLANATION_QUESTIONS, BEHAVIORAL_QUESTIONS,
} from './scenarios';

export const ALL_QUESTIONS: IQuestion[] = [
  ...CS_QUESTIONS,
  ...DEV_QUESTIONS,
  ...POSTGRES_QUESTIONS,
  ...DB_QUESTIONS,
  ...AIML_QUESTIONS,
  ...DEVOPS_QUESTIONS,
  ...SECURITY_QUESTIONS,
  ...SYSDESIGN_QUESTIONS,
  ...APTITUDE_QUESTIONS,
  ...SCENARIO_QUESTIONS,
  ...EXPLANATION_QUESTIONS,
  ...BEHAVIORAL_QUESTIONS,
  ...PROJECT_QUESTIONS,
];

/** Fail fast in dev if a question references an unknown topic or is malformed. */
if (import.meta.env.DEV) {
  const topicIds = new Set(INTERVIEW_TOPIC_IDS);
  const seen = new Set<string>();
  for (const q of ALL_QUESTIONS) {
    if (seen.has(q.id)) console.warn(`[interview] duplicate question id: ${q.id}`);
    seen.add(q.id);
    if (!topicIds.has(q.topic)) console.warn(`[interview] unknown topic '${q.topic}' on ${q.id}`);
    if (q.questionType === 'mcq' && (q.options?.length !== 4 || q.correctOption == null)) {
      console.warn(`[interview] MCQ ${q.id} must have 4 options + correctOption`);
    }
    if ((q.questionType === 'coding' || q.questionType === 'sql') && !q.language) {
      console.warn(`[interview] ${q.questionType} question ${q.id} missing language`);
    }
  }
}
