import { analyze, termFrequencies } from '../search/analyzer.js';
import { Field, FIELDS, ScoringDoc, CorpusStats, bm25f, coverage } from '../search/scoring.js';
import { search, SearchHit } from '../search/engine.js';
import { ensureIndex } from '../search/indexers.js';

// RAG retrieval over the Knowledge Vault, backed by the Elasticsearch-style engine in src/search:
// BM25F over an inverted index stored in MongoDB, fused (RRF) with vector kNN.

export { tokenize } from '../search/analyzer.js';

export interface RetrievedSource {
  id: string;
  title: string;
  courseCode: string;
  author: string; // who wrote/solved it, for attribution in the answer
  verified: boolean;
  doubtId?: string; // set when the entry came from a verified doubt
  match: number; // 0–1 keyword coverage of the question
  bm25: number;
  vectorScore: number; // 0–1 cosine similarity
  qualityWeight: number; // learned from student ratings
  excerpt: string;
}

const toSource = (h: SearchHit): RetrievedSource => ({
  id: h.id,
  title: String(h.source.title ?? ''),
  courseCode: String(h.source.courseCode ?? ''),
  author: String(h.source.author ?? ''),
  verified: !!h.source.verified,
  doubtId: (h.source.doubtId as string | undefined) || undefined,
  match: h.match,
  bm25: h.bm25,
  vectorScore: h.vectorScore,
  qualityWeight: h.qualityWeight,
  excerpt: String(h.source.excerpt ?? ''),
});

// Sources passed to the AI: at most 3. Each must cover at least 30% of the question's key terms, or be a
// strong vector match (semantic ≥ 0.65 / trigram ≥ 0.6: the same topic paraphrased or misspelt).
export const retrieveForQuestion = async (question: string, courseCode?: string): Promise<RetrievedSource[]> => {
  await ensureIndex('vault');
  const hits = await search('vault', question, {
    boost: courseCode ? { courseCode } : undefined,
    limit: 3,
    minMatch: 0.3,
    minVector: { semantic: 0.65, ngram: 0.6 },
  });
  return hits.map(toSource);
};

// Knowledge Vault search box: ranked hits with match scores and highlighted sentences.
export const searchVault = async (query: string, category?: string, limit = 50): Promise<(RetrievedSource & { highlights: string[] })[]> => {
  await ensureIndex('vault');
  const hits = await search('vault', query, { filter: category ? { category } : undefined, limit, minVector: { semantic: 0.6, ngram: 0.45 } });
  return hits.map((h) => ({ ...toSource(h), highlights: h.highlights }));
};

// ---------- in-memory ranking (same analyzer and BM25F), for small ad-hoc collections and tests ----------

export interface RetrievableDoc {
  id: string;
  title: string;
  courseCode: string;
  category: string;
  author: string;
  verified: boolean;
  tags: string[];
  text: string;
}

export const rankDocuments = (
  query: string,
  docs: RetrievableDoc[],
  opts: { courseCode?: string; limit?: number; minMatch?: number } = {}
): RetrievedSource[] => {
  const queryTerms = [...new Set(analyze(query))];
  if (!queryTerms.length || !docs.length) return [];

  const scoring: ScoringDoc[] = docs.map((d) => {
    const fields: Record<Field, string> = { title: d.title, meta: [...d.tags, d.category, d.courseCode].join(' '), body: d.text };
    const tf = Object.fromEntries(FIELDS.map((f) => [f, termFrequencies(analyze(fields[f]))])) as Record<Field, Record<string, number>>;
    const len = Object.fromEntries(FIELDS.map((f) => [f, Object.values(tf[f]).reduce((s, n) => s + n, 0)])) as Record<Field, number>;
    return { id: d.id, tf, len };
  });
  const df: Record<string, number> = {};
  for (const s of scoring) for (const t of new Set(FIELDS.flatMap((f) => Object.keys(s.tf[f] ?? {})))) df[t] = (df[t] ?? 0) + 1;
  const avg = (f: Field) => scoring.reduce((sum, s) => sum + s.len[f], 0) / scoring.length || 1;
  const stats: CorpusStats = { n: docs.length, avgLen: { title: avg('title'), meta: avg('meta'), body: avg('body') }, df };

  return docs
    .map((doc, i) => {
      let bm25 = bm25f(queryTerms, scoring[i], stats);
      if (opts.courseCode && bm25 > 0 && doc.courseCode === opts.courseCode) bm25 *= 1.2;
      return { doc, bm25, match: coverage(queryTerms, scoring[i], stats) };
    })
    .filter((s) => s.bm25 > 0 && s.match >= (opts.minMatch ?? 0))
    .sort((a, b) => b.bm25 - a.bm25)
    .slice(0, opts.limit ?? 3)
    .map(({ doc, bm25, match }) => ({
      id: doc.id,
      title: doc.title,
      courseCode: doc.courseCode,
      author: doc.author,
      verified: doc.verified,
      match: Math.round(match * 100) / 100,
      bm25: Math.round(bm25 * 100) / 100,
      vectorScore: 0,
      qualityWeight: 1,
      excerpt: doc.text.slice(0, 1500),
    }));
};
