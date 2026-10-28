import { rankDocuments, tokenize, RetrievableDoc } from '../services/retrievalService.js';
import { buildPrompt, scoreConfidence } from '../services/aiService.js';

const doc = (id: string, title: string, text: string, courseCode = 'CS201', tags: string[] = []): RetrievableDoc => ({
  id, title, text, courseCode, tags, category: 'Algorithms', author: 'Prof', verified: true,
});

const vault = [
  doc('qs', 'Quicksort worst case', 'Quicksort degrades to O(n^2) when the pivot is the smallest element, e.g. on sorted input. Use a randomized pivot.', 'CS201', ['Sorting']),
  doc('bt', 'B-Trees vs LSM-Trees', 'Write amplification and compaction in storage engines.', 'CS245', ['Storage']),
  doc('mt', 'Master Theorem', 'Solving divide and conquer recurrences like merge sort.', 'CS201', ['Recurrences']),
];

describe('retrievalService', () => {
  it('tokenizes, drops stopwords and stems plurals', () => {
    expect(tokenize('Why are the B-Trees and arrays sorted?')).toEqual(['tree', 'array', 'sorted']);
  });

  it('ranks the relevant document first with a match score', () => {
    const [top] = rankDocuments('Why is quicksort slow on a sorted array? pivot choice', vault);
    expect(top.id).toBe('qs');
    expect(top.match).toBeGreaterThan(0.5);
  });

  it('returns nothing for unrelated questions when a minimum match is set', () => {
    expect(rankDocuments('photosynthesis in chloroplasts', vault, { minMatch: 0.3 })).toEqual([]);
  });

  it('boosts documents from the same course', () => {
    const docs = [doc('a', 'Recurrences', 'recurrence tree', 'CS999'), doc('b', 'Recurrences', 'recurrence tree', 'CS201')];
    expect(rankDocuments('recurrence', docs, { courseCode: 'CS201' })[0].id).toBe('b');
  });
});

describe('RAG prompt and confidence', () => {
  const sources = rankDocuments('quicksort sorted pivot', vault, { limit: 1 });
  const input = { title: 'Quicksort', description: 'Why slow?', subject: 'DSA', courseCode: 'CS201' };

  it('includes retrieved sources and the rubric in the prompt', () => {
    const prompt = buildPrompt({ ...input, sources });
    expect(prompt).toContain('[K1] Quicksort worst case');
    expect(prompt).toContain('usedSources');
    expect(prompt).toContain('90-100: standard, well-established material');
  });

  it('omits the knowledge block when nothing was retrieved', () => {
    expect(buildPrompt(input)).not.toContain('Knowledge Vault');
  });

  it('caps unsupported answers at 90 and blends grounded ones', () => {
    expect(scoreConfidence(98, [])).toEqual({ model: 98, grounding: null, final: 90 });
    const grounded = scoreConfidence(80, [{ ...sources[0], match: 1 }]);
    expect(grounded).toEqual({ model: 80, grounding: 100, final: 85 });
  });
});
