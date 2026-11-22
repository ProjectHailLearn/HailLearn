import { scoreConfidence } from '../services/aiService.js';
import { decideRouting, rankMentorProfiles, MentorProfile, confidenceThreshold } from '../services/routingService.js';

const mentor = (over: Partial<MentorProfile>): MentorProfile => ({
  id: 'm', userId: 'u', name: 'M', avatar: '', department: 'Computer Science', specializations: [], bio: '',
  karmaPoints: 0, reputationScore: 4, online: false, available: false, answeredTitles: [], ...over,
});

describe('confidence gate', () => {
  it('serves confident answers and routes low-confidence ones', () => {
    expect(decideRouting(85, true, 70)).toMatchObject({ mode: 'grounded_answer', reason: 'confident' });
    expect(decideRouting(55, true, 70)).toMatchObject({ mode: 'mentor_routing', reason: 'low_confidence' });
  });

  it('routes a score exactly at the threshold to a mentor', () => {
    expect(decideRouting(70, true, 70).mode).toBe('mentor_routing');
    expect(decideRouting(71, true, 70).mode).toBe('grounded_answer');
  });

  it('routes to a mentor whenever the AI is unavailable', () => {
    expect(decideRouting(95, false, 70)).toMatchObject({ mode: 'mentor_routing', reason: 'ai_unavailable' });
  });

  it('reads CONFIDENCE_THRESHOLD and ignores invalid values', () => {
    const prev = process.env.CONFIDENCE_THRESHOLD;
    process.env.CONFIDENCE_THRESHOLD = '82';
    expect(confidenceThreshold()).toBe(82);
    process.env.CONFIDENCE_THRESHOLD = 'abc';
    expect(confidenceThreshold()).toBe(70);
    process.env.CONFIDENCE_THRESHOLD = prev;
  });
});

describe('mentor ranking', () => {
  const graphs = mentor({ id: 'graphs', specializations: ['Graph Algorithms', 'BFS', 'DFS'], karmaPoints: 50 });
  const dbs = mentor({ id: 'dbs', specializations: ['Databases', 'SQL', 'Indexing'], karmaPoints: 50 });

  it('ranks the topically relevant mentor first', () => {
    const [top] = rankMentorProfiles('Difference between BFS and DFS graph traversal', 'CS201', [dbs, graphs]);
    expect(top.mentorId).toBe('graphs');
    expect(top.relevance).toBeGreaterThan(0);
  });

  it('counts doubts a mentor has answered as expertise', () => {
    const experienced = mentor({ id: 'exp', answeredTitles: ['Why does Dijkstra fail with negative edges?'] });
    const [top] = rankMentorProfiles('Dijkstra negative edge weights', 'CS201', [mentor({ id: 'new' }), experienced]);
    expect(top.mentorId).toBe('exp');
  });

  it('prefers the available mentor when relevance and reputation tie', () => {
    const ranked = rankMentorProfiles('SQL indexing', 'CS245', [dbs, { ...dbs, id: 'dbs-online', online: true, available: true }]);
    expect(ranked[0].mentorId).toBe('dbs-online');
    expect(ranked[0].score - ranked[1].score).toBeCloseTo(0.15);
  });

  it('falls back to reputation when nobody matches the topic', () => {
    const ranked = rankMentorProfiles('photosynthesis', 'BIO101', [dbs, { ...graphs, karmaPoints: 200 }]);
    expect(ranked[0].mentorId).toBe('graphs');
    expect(ranked.every((c) => c.relevance === 0)).toBe(true);
  });
});

describe('missing-context cap', () => {
  it('caps the self-rating at 60 when the model reports missing information, which then routes', () => {
    const c = scoreConfidence(95, [], ['the SQL query text']);
    expect(c).toEqual({ model: 60, grounding: null, missingContext: ['the SQL query text'], final: 60 });
    expect(decideRouting(c.final, true, 70).mode).toBe('mentor_routing');
  });

  it('leaves complete questions unaffected', () => {
    expect(scoreConfidence(95, [], [])).toEqual({ model: 95, grounding: null, final: 90 });
  });
});
