import { speedScore, ratingScore, bayesianReputation, nextQualityWeight } from '../services/reputationService.js';
import { isWithinSlots } from '../services/availabilityService.js';

describe('mentor reputation', () => {
  it('scores speed from 5 (≤15 min) down to 1 (≥24 h)', () => {
    expect(speedScore(10)).toBe(5);
    expect(speedScore(24 * 60)).toBe(1);
    expect(speedScore(3 * 24 * 60)).toBe(1);
    const hour = speedScore(60)!;
    expect(hour).toBeGreaterThan(3);
    expect(hour).toBeLessThan(5);
    expect(speedScore(undefined)).toBeNull();
  });

  it('weights helpfulness 50%, clarity 30%, speed 20%', () => {
    expect(ratingScore({ helpfulness: 5, clarity: 5, responseTime: 5 })).toBe(5);
    expect(ratingScore({ helpfulness: 1, clarity: 5, responseTime: 5 })).toBeCloseTo(3);
    // speed averages the student's rating (1) with the measured score (5 for 10 minutes)
    expect(ratingScore({ helpfulness: 5, clarity: 5, responseTime: 1, responseMinutes: 10 })).toBeCloseTo(4.6);
  });

  it('uses a Bayesian average so one rating cannot swing a new mentor to an extreme', () => {
    expect(bayesianReputation([])).toBe(4);
    expect(bayesianReputation([1])).toBeCloseTo(3.25);
    expect(bayesianReputation([5, 5, 5, 5, 5, 5, 5, 5, 5])).toBeCloseTo(4.75);
  });

  it('moves a vault entry quality weight toward the rating', () => {
    expect(nextQualityWeight(1, 1)).toBeCloseTo(0.82);
    expect(nextQualityWeight(1, 5)).toBeCloseTo(1.06);
    expect(nextQualityWeight(1, 4)).toBeCloseTo(1); // 4/5 helpful keeps the weight steady
  });
});

describe('availability slots', () => {
  // 2026-11-23 is a Monday. 13:00 UTC = 18:30 in Asia/Kolkata.
  const monday1830IST = new Date('2026-11-23T13:00:00Z');
  const evening = { timezone: 'Asia/Kolkata', slots: [{ day: 1, start: '18:00', end: '21:00' }] };

  it('matches a slot in the mentor timezone', () => {
    expect(isWithinSlots(evening, monday1830IST)).toBe(true);
    expect(isWithinSlots({ ...evening, timezone: 'UTC' }, monday1830IST)).toBe(false);
  });

  it('handles slots that cross midnight', () => {
    const late = { timezone: 'UTC', slots: [{ day: 0, start: '22:00', end: '02:00' }] }; // Sunday 22:00 → Monday 02:00
    expect(isWithinSlots(late, new Date('2026-11-23T01:00:00Z'))).toBe(true); // Monday 01:00
    expect(isWithinSlots(late, new Date('2026-11-23T03:00:00Z'))).toBe(false);
  });

  it('is never available without slots', () => {
    expect(isWithinSlots({ timezone: 'UTC', slots: [] }, monday1830IST)).toBe(false);
  });
});
