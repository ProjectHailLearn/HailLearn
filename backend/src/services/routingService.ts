import { Mentor } from '../models/Mentor.js';
import { Doubt } from '../models/Doubt.js';
import { rankDocuments, RetrievableDoc } from './retrievalService.js';
import { isOnline } from './presenceService.js';
import { isWithinSlots } from './availabilityService.js';
import { search } from '../search/engine.js';
import { ensureIndex } from '../search/indexers.js';

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
  reputationScore: number; // 0-5, from student ratings (services/reputationService.ts)
  online: boolean;
  available: boolean; // online now, or inside one of their weekly availability slots
  answeredTitles: string[]; // doubts this mentor has answered: their demonstrated expertise
}

export interface MentorCandidate {
  mentorId: string;
  userId: string;
  name: string;
  avatar: string;
  karma: number;
  online: boolean;
  available: boolean;
  relevance: number; // 0-1 topical match between the doubt and the mentor's expertise
  reputation: number; // 0-1 from rating and karma
  score: number; // 0-1 final rank
}

// rank = 0.6 × relevance + 0.25 × reputation + 0.15 × available.
// Relevance dominates; reputation stops a barely-relevant mentor outranking a proven one; availability
// (online now, or inside a weekly slot) breaks near-ties in favour of someone who can answer soon.
// reputation = 0.6 × (rating-based reputation score / 5) + 0.4 × (karma / highest karma).
// `relevance` comes from the persisted mentors index when available; otherwise it's computed in memory.
export const rankMentorProfiles = (
  question: string,
  courseCode: string,
  mentors: MentorProfile[],
  relevanceById?: Map<string, number>
): MentorCandidate[] => {
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
  const relevance = relevanceById ?? new Map(rankDocuments(`${courseCode} ${question}`, docs, { limit: docs.length }).map((r) => [r.id, r.match]));
  const maxKarma = Math.max(1, ...mentors.map((m) => m.karmaPoints));

  return mentors
    .map((m) => {
      const rel = relevance.get(m.id) ?? 0;
      const reputation = 0.6 * Math.min(1, Math.max(0, m.reputationScore / 5)) + 0.4 * (m.karmaPoints / maxKarma);
      const score = 0.6 * rel + 0.25 * reputation + 0.15 * (m.available ? 1 : 0);
      return {
        mentorId: m.id,
        userId: m.userId,
        name: m.name,
        avatar: m.avatar,
        karma: m.karmaPoints,
        online: m.online,
        available: m.available,
        relevance: Math.round(rel * 100) / 100,
        reputation: Math.round(reputation * 100) / 100,
        score: Math.round(score * 100) / 100,
      };
    })
    .sort((a, b) => b.score - a.score);
};

// Only mentors with an account can be routed to; seeded profiles without one can't log in to answer.
// Mentors who paused routed doubts (availability.acceptingDoubts = false) are skipped.
export const rankMentorsForDoubt = async (question: string, courseCode: string, excludeUserId?: string): Promise<MentorCandidate[]> => {
  const mentors = await Mentor.find({
    userId: { $exists: true, $nin: [null, '', excludeUserId ?? ''] },
    'availability.acceptingDoubts': { $ne: false },
  }).lean();
  if (!mentors.length) return [];
  const answered = await Doubt.aggregate<{ _id: string; titles: string[] }>([
    { $unwind: '$answers' },
    { $match: { 'answers.authorId': { $in: mentors.map((m) => m.userId) } } },
    { $group: { _id: '$answers.authorId', titles: { $addToSet: '$title' } } },
  ]);
  const titlesByUser = new Map(answered.map((a) => [a._id, a.titles.slice(0, 50)]));

  // Topical relevance from the mentors index (specializations, bio, answered doubts): keyword coverage,
  // or vector similarity when it's a strong near-match (e.g. a misspelt topic).
  await ensureIndex('mentors');
  const hits = await search('mentors', `${courseCode} ${question}`, { limit: 200, minVector: { semantic: 0.65, ngram: 0.6 } });
  const strongVector = (h: (typeof hits)[number]) => h.vectorScore >= (h.vectorKind === 'semantic' ? 0.65 : 0.6);
  const relevance = new Map(hits.map((h) => [h.id, Math.max(h.match, strongVector(h) ? h.vectorScore : 0)]));

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
      reputationScore: m.reputationScore ?? 4,
      online: isOnline(m.lastSeenAt),
      available: isOnline(m.lastSeenAt) || isWithinSlots(m.availability),
      answeredTitles: titlesByUser.get(m.userId as string) ?? [],
    })),
    relevance
  );
};
