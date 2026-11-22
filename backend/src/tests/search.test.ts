import { analyze, stem } from '../search/analyzer.js';
import { bm25f, coverage, reciprocalRankFusion, highlight, ScoringDoc, CorpusStats } from '../search/scoring.js';
import { ngramVector, cosine } from '../search/vectors.js';

describe('analyzer', () => {
  it('stems plurals and verb forms to a shared root', () => {
    expect(['sorted', 'sorting', 'sorts', 'sort'].map(stem)).toEqual(['sort', 'sort', 'sort', 'sort']);
    expect(['queries', 'indexes', 'running', 'embedded'].map(stem)).toEqual(['query', 'index', 'run', 'embed']);
    expect(['need', 'speed', 'class', 'analysis'].map(stem)).toEqual(['need', 'speed', 'class', 'analysis']);
  });

  it('drops stop words and expands course abbreviations', () => {
    expect(analyze('What is DP?')).toEqual(['dp', 'dynamic', 'program']);
    expect(analyze('BFS vs DFS')).toEqual(['bfs', 'breadth', 'first', 'search', 'dfs', 'depth', 'first', 'search']);
  });
});

describe('BM25F scoring', () => {
  const stats: CorpusStats = { n: 10, avgLen: { title: 4, meta: 4, body: 40 }, df: { quicksort: 2, pivot: 3 } };
  const doc = (tf: ScoringDoc['tf'], len = { title: 4, meta: 4, body: 40 }): ScoringDoc => ({ id: 'd', tf, len });

  it('weights a title match above the same match in the body', () => {
    expect(bm25f(['quicksort'], doc({ title: { quicksort: 1 } }), stats)).toBeGreaterThan(bm25f(['quicksort'], doc({ body: { quicksort: 1 } }), stats));
  });

  it('saturates repeated terms instead of growing linearly', () => {
    const once = bm25f(['pivot'], doc({ body: { pivot: 1 } }), stats);
    const tenTimes = bm25f(['pivot'], doc({ body: { pivot: 10 } }), stats);
    expect(tenTimes).toBeGreaterThan(once);
    expect(tenTimes).toBeLessThan(once * 3);
  });

  it('reports coverage of the query terms, half-weighting unknown words', () => {
    expect(coverage(['quicksort', 'pivot'], doc({ body: { quicksort: 1, pivot: 1 } }), stats)).toBe(1);
    const c = coverage(['quicksort', 'pivot', 'zzz'], doc({ body: { quicksort: 1, pivot: 1 } }), stats);
    expect(c).toBeCloseTo(0.8, 1);
  });
});

describe('hybrid ranking', () => {
  it('fuses keyword and vector rankings with reciprocal rank fusion', () => {
    const fused = reciprocalRankFusion([['a', 'b', 'c'], ['b', 'a']]);
    expect(fused.get('a')).toBeCloseTo(fused.get('b')!);
    expect(fused.get('c')!).toBeLessThan(fused.get('a')!);
  });

  it('gives typos a high trigram-vector similarity and unrelated text a low one', () => {
    const doc = ngramVector('Quicksort worst case pivot selection');
    expect(cosine(ngramVector('quiksort worst case'), doc)).toBeGreaterThan(0.5);
    expect(cosine(ngramVector('photosynthesis in chloroplasts'), doc)).toBeLessThan(0.2);
  });

  it('highlights the sentences that contain query terms', () => {
    const text = 'Introduction to sorting algorithms in general. Quicksort degrades when the pivot is the minimum. Merge sort is stable.';
    expect(highlight(text, new Set(analyze('quicksort pivot')), analyze)).toEqual(['Quicksort degrades when the pivot is the minimum.']);
  });
});
