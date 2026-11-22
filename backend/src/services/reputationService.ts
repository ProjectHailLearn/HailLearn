import { Rating } from '../models/Rating.js';
import { Mentor } from '../models/Mentor.js';
import { getQualityWeight, setQualityWeight } from '../search/engine.js';

// ---------- mentor reputation (FR-5.2) ----------

// Speed score from the measured response time: 5 within 15 minutes, falling on a log scale to 1 at 24 hours.
export const speedScore = (minutes: number | undefined): number | null => {
  if (minutes === undefined || minutes < 0) return null;
  if (minutes <= 15) return 5;
  const t = Math.log(minutes / 15) / Math.log((24 * 60) / 15);
  return Math.max(1, 5 - 4 * Math.min(1, t));
};

// One rating's score (1-5): helpfulness matters most, then clarity, then speed (the student's speed
// rating averaged with the measured one when available).
export const ratingScore = (r: { helpfulness: number; clarity: number; responseTime: number; responseMinutes?: number }): number => {
  const measured = speedScore(r.responseMinutes);
  const speed = measured === null ? r.responseTime : (r.responseTime + measured) / 2;
  return 0.5 * r.helpfulness + 0.3 * r.clarity + 0.2 * speed;
};

// Bayesian average with a prior of 4.0 worth 3 ratings: a new mentor starts at 4.0 and one bad (or one
// perfect) rating can't swing them to an extreme. Recomputed from every rating, so concurrent
// confirmations can't lose an update.
export const REPUTATION_PRIOR = 4.0;
export const REPUTATION_PRIOR_WEIGHT = 3;
export const bayesianReputation = (scores: number[]): number =>
  (REPUTATION_PRIOR * REPUTATION_PRIOR_WEIGHT + scores.reduce((s, x) => s + x, 0)) / (REPUTATION_PRIOR_WEIGHT + scores.length);

export const recomputeMentorReputation = async (mentorId: string): Promise<{ reputationScore: number; ratingsCount: number }> => {
  const ratings = await Rating.find({ mentorId, target: 'mentor' }).lean<{ helpfulness: number; clarity: number; responseTime: number; responseMinutes?: number }[]>();
  const reputationScore = Math.round(bayesianReputation(ratings.map(ratingScore)) * 100) / 100;
  const minutes = ratings.map((r) => r.responseMinutes).filter((m): m is number => typeof m === 'number');
  await Mentor.updateOne(
    { _id: mentorId },
    {
      $set: {
        reputationScore,
        ratingsCount: ratings.length,
        avgResponseMinutes: minutes.length ? Math.round(minutes.reduce((s, m) => s + m, 0) / minutes.length) : undefined,
      },
    }
  );
  return { reputationScore, ratingsCount: ratings.length };
};

// ---------- knowledge quality weights (feedback write-back) ----------

// Moves a vault entry's quality weight 30% of the way toward a target set by the rating's helpfulness
// (1 -> 0.4, 3 -> 0.8, 5 -> 1.2). Entries cited by answers students find unhelpful sink in search results.
export const nextQualityWeight = (current: number, helpfulness: number): number => {
  const target = 0.2 + helpfulness / 5;
  return Math.round((0.7 * current + 0.3 * target) * 1000) / 1000;
};

export const applyQualityFeedback = async (sourceIds: string[], helpfulness: number): Promise<void> => {
  for (const id of sourceIds) {
    const current = await getQualityWeight('vault', id);
    await setQualityWeight('vault', id, nextQualityWeight(current, helpfulness));
  }
};
