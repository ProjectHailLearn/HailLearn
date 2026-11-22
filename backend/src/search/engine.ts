import mongoose, { Schema } from 'mongoose';
import { analyze, termFrequencies } from './analyzer.js';
import { ngramVector, embed, cosine } from './vectors.js';
import {
  Field, FIELDS, ScoringDoc, CorpusStats, bm25f, coverage, reciprocalRankFusion, highlight,
} from './scoring.js';

// An Elasticsearch-style search engine stored in MongoDB.
//   search_docs     — one document per indexed item ("_source", field lengths, filters, vectors, quality weight)
//   search_postings — the inverted index: one row per (index, term, document) with per-field term frequencies
// Queries read only the postings for the query's terms (keyword half) and scan the stored vectors
// (kNN half, exact/brute-force like an ES "flat" index), then fuse both rankings with RRF.

export type IndexName = 'vault' | 'mentors';

export interface IndexInput {
  id: string;
  fields: Record<Field, string>;
  filters?: Record<string, string>; // exact-match fields, like ES keyword fields (e.g. courseCode)
  source: Record<string, unknown>; // returned with hits
  qualityWeight?: number; // multiplies the final score; lowered by poor ratings (default 1)
}

interface SearchDocRow {
  index: IndexName;
  docId: string;
  len: Record<Field, number>;
  filters: Record<string, string>;
  source: Record<string, unknown>;
  vector: number[]; // character-trigram vector (always present)
  dense?: number[]; // semantic embedding when an embedding-capable key is configured
  qualityWeight: number;
  updatedAt: Date;
}

interface PostingRow {
  index: IndexName;
  term: string;
  docId: string;
  tf: Partial<Record<Field, number>>;
}

const SearchDoc =
  mongoose.models.SearchDoc ||
  mongoose.model<SearchDocRow>(
    'SearchDoc',
    new Schema<SearchDocRow>(
      {
        index: { type: String, required: true },
        docId: { type: String, required: true },
        len: { type: Schema.Types.Mixed, required: true },
        filters: { type: Schema.Types.Mixed, default: {} },
        source: { type: Schema.Types.Mixed, default: {} },
        vector: { type: [Number], default: [] },
        dense: { type: [Number], default: undefined },
        qualityWeight: { type: Number, default: 1 },
        updatedAt: { type: Date, default: Date.now },
      },
      { collection: 'search_docs' }
    ).index({ index: 1, docId: 1 }, { unique: true })
  );

const SearchPosting =
  mongoose.models.SearchPosting ||
  mongoose.model<PostingRow>(
    'SearchPosting',
    new Schema<PostingRow>(
      {
        index: { type: String, required: true },
        term: { type: String, required: true },
        docId: { type: String, required: true },
        tf: { type: Schema.Types.Mixed, required: true },
      },
      { collection: 'search_postings' }
    )
      .index({ index: 1, term: 1 })
      .index({ index: 1, docId: 1 })
  );

// ---------- indexing ----------

const statsCache = new Map<IndexName, { at: number; n: number; avgLen: Record<Field, number> }>();
const invalidate = (index: IndexName) => statsCache.delete(index);

export const indexDocument = async (index: IndexName, doc: IndexInput): Promise<void> => {
  const perField = Object.fromEntries(FIELDS.map((f) => [f, termFrequencies(analyze(doc.fields[f] ?? ''))])) as Record<Field, Record<string, number>>;
  const len = Object.fromEntries(FIELDS.map((f) => [f, Object.values(perField[f]).reduce((s, n) => s + n, 0)])) as Record<Field, number>;
  const allText = FIELDS.map((f) => doc.fields[f] ?? '').join('\n');
  const dense = await embed(allText);
  // The trigram vector uses the title, metadata and opening of the body: over a whole long article,
  // trigram counts flatten out and every document starts to look alike.
  const vectorText = [doc.fields.title, doc.fields.meta, (doc.fields.body ?? '').slice(0, 600)].join('\n');

  const terms = new Set(FIELDS.flatMap((f) => Object.keys(perField[f])));
  const postings: PostingRow[] = [...terms].map((term) => ({
    index,
    term,
    docId: doc.id,
    tf: Object.fromEntries(FIELDS.filter((f) => perField[f][term]).map((f) => [f, perField[f][term]])),
  }));

  const existing = await SearchDoc.findOne({ index, docId: doc.id }, { qualityWeight: 1 }).lean<{ qualityWeight?: number }>();
  await SearchPosting.deleteMany({ index, docId: doc.id });
  if (postings.length) await SearchPosting.insertMany(postings, { ordered: false });
  await SearchDoc.updateOne(
    { index, docId: doc.id },
    {
      $set: {
        len,
        filters: doc.filters ?? {},
        source: doc.source,
        vector: ngramVector(vectorText),
        dense: dense ?? undefined,
        // Reindexing keeps the learned quality weight unless the caller supplies one.
        qualityWeight: doc.qualityWeight ?? existing?.qualityWeight ?? 1,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  invalidate(index);
};

export const removeDocument = async (index: IndexName, id: string): Promise<void> => {
  await Promise.all([SearchPosting.deleteMany({ index, docId: id }), SearchDoc.deleteOne({ index, docId: id })]);
  invalidate(index);
};

export const setQualityWeight = async (index: IndexName, id: string, weight: number): Promise<void> => {
  await SearchDoc.updateOne({ index, docId: id }, { $set: { qualityWeight: Math.min(1.2, Math.max(0.2, weight)) } });
};

export const getQualityWeight = async (index: IndexName, id: string): Promise<number> =>
  (await SearchDoc.findOne({ index, docId: id }, { qualityWeight: 1 }).lean<{ qualityWeight?: number }>())?.qualityWeight ?? 1;

export const countDocuments = (index: IndexName): Promise<number> => SearchDoc.countDocuments({ index });

export const listDocIds = async (index: IndexName): Promise<string[]> =>
  (await SearchDoc.find({ index }, { docId: 1 }).lean<{ docId: string }[]>()).map((d) => d.docId);

export const clearIndex = async (index: IndexName): Promise<void> => {
  await Promise.all([SearchPosting.deleteMany({ index }), SearchDoc.deleteMany({ index })]);
  invalidate(index);
};

// ---------- search ----------

export interface SearchHit {
  id: string;
  score: number; // fused rank score × quality weight (only meaningful for ordering)
  bm25: number;
  match: number; // 0–1 term coverage (see scoring.coverage)
  vectorScore: number; // cosine similarity, 0–1
  vectorKind: 'semantic' | 'ngram';
  qualityWeight: number;
  highlights: string[];
  source: Record<string, unknown>;
}

export interface SearchOptions {
  filter?: Record<string, string>; // exact matches on filter fields (ES "filter" clause)
  boost?: Record<string, string>; // filter values that earn a score boost (ES "should" clause)
  limit?: number;
  minMatch?: number; // drop hits whose keyword coverage is below this...
  // ...unless their vector similarity reaches this. Semantic embeddings and trigram vectors live on different
  // scales (unrelated text scores ~0.45 semantically but <0.2 on trigrams), so each kind has its own cut-off.
  minVector?: { semantic: number; ngram: number };
}

const corpusStats = async (index: IndexName): Promise<{ n: number; avgLen: Record<Field, number> }> => {
  const cached = statsCache.get(index);
  if (cached && Date.now() - cached.at < 60_000) return cached;
  const [agg] = await SearchDoc.aggregate<{ n: number; title: number; meta: number; body: number }>([
    { $match: { index } },
    { $group: { _id: null, n: { $sum: 1 }, title: { $avg: '$len.title' }, meta: { $avg: '$len.meta' }, body: { $avg: '$len.body' } } },
  ]);
  const stats = { at: Date.now(), n: agg?.n ?? 0, avgLen: { title: agg?.title ?? 1, meta: agg?.meta ?? 1, body: agg?.body ?? 1 } };
  statsCache.set(index, stats);
  return stats;
};

export const search = async (index: IndexName, query: string, opts: SearchOptions = {}): Promise<SearchHit[]> => {
  const queryTerms = [...new Set(analyze(query))];
  const { n, avgLen } = await corpusStats(index);
  if (!n || !query.trim()) return [];

  const [postings, docs, queryDense] = await Promise.all([
    queryTerms.length ? SearchPosting.find({ index, term: { $in: queryTerms } }).lean<PostingRow[]>() : Promise.resolve([] as PostingRow[]),
    SearchDoc.find({ index }).lean<SearchDocRow[]>(),
    embed(query),
  ]);

  const df: Record<string, number> = {};
  const byDoc = new Map<string, ScoringDoc['tf']>();
  for (const p of postings) {
    df[p.term] = (df[p.term] ?? 0) + 1;
    const tf = byDoc.get(p.docId) ?? {};
    for (const f of FIELDS) if (p.tf[f]) (tf[f] ??= {})[p.term] = p.tf[f]!;
    byDoc.set(p.docId, tf);
  }
  const stats: CorpusStats = { n, avgLen, df };
  const queryVector = ngramVector(query);

  const matchesFilter = (d: SearchDocRow) => Object.entries(opts.filter ?? {}).every(([k, v]) => d.filters?.[k] === v);
  const scored = docs.filter(matchesFilter).map((d) => {
    const sd: ScoringDoc = { id: d.docId, tf: byDoc.get(d.docId) ?? {}, len: d.len };
    const semantic = !!(queryDense && d.dense?.length);
    let bm25 = bm25f(queryTerms, sd, stats);
    if (bm25 > 0 && Object.entries(opts.boost ?? {}).some(([k, v]) => d.filters?.[k] === v)) bm25 *= 1.2;
    return {
      d,
      bm25,
      match: coverage(queryTerms, sd, stats),
      vectorScore: Math.max(0, semantic ? cosine(queryDense!, d.dense!) : cosine(queryVector, d.vector)),
      vectorKind: (semantic ? 'semantic' : 'ngram') as SearchHit['vectorKind'],
    };
  });

  const minMatch = opts.minMatch ?? 0;
  const vectorOk = (s: (typeof scored)[number]) => !!opts.minVector && s.vectorScore >= opts.minVector[s.vectorKind];
  const kept = scored.filter((s) => (s.bm25 > 0 && s.match >= minMatch) || vectorOk(s));

  const keywordRank = [...kept].filter((s) => s.bm25 > 0).sort((a, b) => b.bm25 - a.bm25).map((s) => s.d.docId);
  const vectorRank = [...kept].filter((s) => s.vectorScore > 0).sort((a, b) => b.vectorScore - a.vectorScore).map((s) => s.d.docId);
  const fused = reciprocalRankFusion([keywordRank, vectorRank]);
  const termSet = new Set(queryTerms);

  return kept
    .map((s) => ({
      id: s.d.docId,
      score: (fused.get(s.d.docId) ?? 0) * (s.d.qualityWeight ?? 1),
      bm25: Math.round(s.bm25 * 100) / 100,
      match: Math.round(s.match * 100) / 100,
      vectorScore: Math.round(s.vectorScore * 100) / 100,
      vectorKind: s.vectorKind,
      qualityWeight: s.d.qualityWeight ?? 1,
      highlights: highlight(String(s.d.source?.body ?? s.d.source?.excerpt ?? ''), termSet, analyze),
      source: s.d.source,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 10);
};
