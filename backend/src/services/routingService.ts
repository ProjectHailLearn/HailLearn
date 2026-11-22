import { Mentor } from '../models/Mentor.js';
import { Doubt } from '../models/Doubt.js';
import { rankDocuments, RetrievableDoc } from './retrievalService.js';
import { isOnline } from './presenceService.js';

// Confidence gate: an AI answer below this score (0-100) is sent to a mentor instead of being served
// as the resolution. Below 70 the prompt's rubric means "ambiguous, missing information, or unsure".
export const confidenceThreshold = (): number => {
  const n = Number(process.env.CONFIDENCE_THRESHOLD);
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : 70;
};

export type RoutingMode = 'grounded_answer' | 'mentor_routing';

export interface RoutingDecision {
  mode: RoutingMode;
  reason: 'confident' | 'low_confidence' | 'ai_unavailable';
  threshold: number;
}

// The gate: a score exactly at the threshold still routes to a mentor (strictly greater to auto-answer).
export const decideRouting = (confidence: number, aiAvailable: boolean, threshold = confidenceThreshold()): RoutingDecision => {
  if (!aiAvailable) return { mode: 'mentor_routing', reason: 'ai_unavailable', threshold };
  return confidence > threshold
    ? { mode: 'grounded_answer', reason: 'confident', threshold }
    : { mode: 'mentor_routing', reason: 'low_confidence', threshold };
};

export interface MentorProfile {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  department: string;
  specializations: string[];
  bio: string;
  karmaPoints: number;
  rating: number;
  online: boolean;
  answeredTitles: string[]; // doubts this mentor has answered: their demonstrated expertise
}

export interface MentorCandidate {
  mentorId: string;
  userId: string;
  name: string;
  avatar: string;
  karma: number;
  online: boolean;
  relevance: number; // 0-1 topical match between the doubt and the mentor's expertise
  reputation: number; // 0-1 from rating and karma
  score: number; // 0-1 final rank
}

// rank = 0.6 × relevance + 0.25 × reputation + 0.15 × online.
// Relevance dominates; reputation stops a barely-relevant mentor outranking a proven one; being online
// breaks near-ties in favour of someone who can answer now.
export const rankMentorProfiles = (question: string, courseCode: string, mentors: MentorProfile[]): MentorCandidate[] => {
  if (!mentors.length) return [];
  const docs: RetrievableDoc[] = mentors.map((m) => ({
    id: m.id,
    title: m.specializations.join(' '),
    courseCode: '',
    category: m.department,
    author: m.name,
    verified: false,
    tags: m.specializations,
    text: [m.bio, ...m.answeredTitles].join('\n'),
  }));
  const relevance = new Map(rankDocuments(`${courseCode} ${question}`, docs, { limit: docs.length }).map((r) => [r.id, r.match]));
  const maxKarma = Math.max(1, ...mentors.map((m) => m.karmaPoints));

  return mentors
    .map((m) => {
      const rel = relevance.get(m.id) ?? 0;
      const reputation = 0.5 * Math.min(1, Math.max(0, m.rating / 5)) + 0.5 * (m.karmaPoints / maxKarma);
      const score = 0.6 * rel + 0.25 * reputation + 0.15 * (m.online ? 1 : 0);
      return {
        mentorId: m.id,
        userId: m.userId,
        name: m.name,
        avatar: m.avatar,
        karma: m.karmaPoints,
        online: m.online,
        relevance: Math.round(rel * 100) / 100,
        reputation: Math.round(reputation * 100) / 100,
        score: Math.round(score * 100) / 100,
      };
    })
    .sort((a, b) => b.score - a.score);
};

// Only mentors with an account can be routed to; seeded profiles without one can't log in to answer.
export const rankMentorsForDoubt = async (question: string, courseCode: string, excludeUserId?: string): Promise<MentorCandidate[]> => {
  const mentors = await Mentor.find({ userId: { $exists: true, $nin: [null, '', excludeUserId ?? ''] } }).lean();
  if (!mentors.length) return [];
  const answered = await Doubt.aggregate<{ _id: string; titles: string[] }>([
    { $unwind: '$answers' },
    { $match: { 'answers.authorId': { $in: mentors.map((m) => m.userId) } } },
    { $group: { _id: '$answers.authorId', titles: { $addToSet: '$title' } } },
  ]);
  const titlesByUser = new Map(answered.map((a) => [a._id, a.titles.slice(0, 50)]));

  return rankMentorProfiles(
    question,
    courseCode,
    mentors.map((m) => ({
      id: String(m._id),
      userId: m.userId as string,
      name: m.name,
      avatar: m.avatar,
      department: m.department,
      specializations: m.specializations ?? [],
      bio: m.bio ?? '',
      karmaPoints: m.karmaPoints ?? 0,
      rating: m.rating ?? 4.5,
      online: isOnline(m.lastSeenAt),
      answeredTitles: titlesByUser.get(m.userId as string) ?? [],
    }))
  );
};
