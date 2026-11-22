// Pure ranking functions shared by the persisted index (engine.ts) and in-memory callers.

export type Field = 'title' | 'meta' | 'body';
export const FIELDS: Field[] = ['title', 'meta', 'body'];

// Field boosts, as in an Elasticsearch multi_match "title^3 meta^2 body".
export const FIELD_WEIGHTS: Record<Field, number> = { title: 3, meta: 2, body: 1 };
const K1 = 1.2;
const B: Record<Field, number> = { title: 0.5, meta: 0.5, body: 0.75 }; // short fields get less length normalisation

export interface ScoringDoc {
  id: string;
  tf: Partial<Record<Field, Record<string, number>>>; // term frequencies per field
  len: Record<Field, number>; // field lengths in terms
}

export interface CorpusStats {
  n: number; // documents in the index
  avgLen: Record<Field, number>;
  df: Record<string, number>; // documents containing each term (any field)
}

export const idf = (stats: CorpusStats, term: string): number => {
  const n = stats.df[term] ?? 0;
  return Math.log(1 + (stats.n - n + 0.5) / (n + 0.5));
};

// BM25F: per-field normalised term frequencies are combined with boosts *before* saturation, so a term
// repeated across fields isn't counted as if it were several different terms.
export const bm25f = (queryTerms: string[], doc: ScoringDoc, stats: CorpusStats): number => {
  let score = 0;
  for (const term of queryTerms) {
    let weightedTf = 0;
    for (const f of FIELDS) {
      const tf = doc.tf[f]?.[term];
      if (!tf) continue;
      const norm = 1 - B[f] + (B[f] * doc.len[f]) / (stats.avgLen[f] || 1);
      weightedTf += (FIELD_WEIGHTS[f] * tf) / norm;
    }
    if (weightedTf > 0) score += idf(stats, term) * (weightedTf / (K1 + weightedTf));
  }
  return score;
};

// 0–1: IDF-weighted share of the query's terms that the document contains. Query words that appear
// nowhere in the index count as half an average known term, so one unknown word can't sink a good match.
export const coverage = (queryTerms: string[], doc: ScoringDoc, stats: CorpusStats): number => {
  const known = queryTerms.filter((t) => (stats.df[t] ?? 0) > 0);
  if (!known.length) return 0;
  const knownIdf = known.reduce((s, t) => s + idf(stats, t), 0);
  const total = knownIdf + (queryTerms.length - known.length) * ((0.5 * knownIdf) / known.length);
  const matched = known.filter((t) => FIELDS.some((f) => doc.tf[f]?.[t])).reduce((s, t) => s + idf(stats, t), 0);
  return total ? matched / total : 0;
};

// Reciprocal Rank Fusion (the method behind Elasticsearch's hybrid "rrf" retriever):
// score(d) = Σ over result lists of 1 / (k + rank of d in that list). Robust to the two lists using
// incomparable score scales (BM25 vs cosine).
export const RRF_K = 60;
export const reciprocalRankFusion = (lists: string[][], k = RRF_K): Map<string, number> => {
  const fused = new Map<string, number>();
  for (const list of lists) list.forEach((id, i) => fused.set(id, (fused.get(id) ?? 0) + 1 / (k + i + 1)));
  return fused;
};

// Best one or two sentences of a text for a query, for result highlighting.
export const highlight = (text: string, queryTerms: Set<string>, analyzeFn: (s: string) => string[], max = 2): string[] =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .map((s) => ({ s, hits: new Set(analyzeFn(s).filter((t) => queryTerms.has(t))).size }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, max)
    .map((x) => (x.s.length > 240 ? `${x.s.slice(0, 237)}…` : x.s));
