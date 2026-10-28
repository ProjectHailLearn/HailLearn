import { KnowledgeItem } from '../models/KnowledgeItem.js';

// Retrieval for RAG over the Knowledge Vault, using BM25 (the ranking function behind most keyword
// search engines). It runs in-process, so it needs no embedding API and works on serverless.

export interface RetrievableDoc {
  id: string;
  title: string;
  courseCode: string;
  category: string;
  author: string;
  verified: boolean;
  tags: string[];
  text: string; // full body (content, or snippet when there is no content)
}

export interface RetrievedSource {
  id: string;
  title: string;
  courseCode: string;
  author: string;
  verified: boolean;
  // 0–1: IDF-weighted share of the query's terms that the document contains (see totalIdf below).
  match: number;
  bm25: number;
  excerpt: string;
}

const STOPWORDS = new Set(
  ('a an and are as at be but by can do does doing for from how i if in into is it its me my of on or our so ' +
    'than that the their them then there these they this to was we were what when where which while who why ' +
    'will with you your explain please help understand question vs versus get use using used work works').split(' ')
);

// Lowercase, split on non-alphanumerics (keeping c++/c#-style tokens), drop stopwords, light plural stemming.
export const tokenize = (text: string): string[] =>
  (text.toLowerCase().match(/[a-z0-9][a-z0-9+#]*/g) ?? [])
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => (t.length > 4 && t.endsWith('ies') ? `${t.slice(0, -3)}y` : t.length > 3 && /[^s]s$/.test(t) ? t.slice(0, -1) : t));

// Field weights: a term in the title counts 3x, in tags/course/category 2x, in the body 1x.
const weightedTerms = (doc: RetrievableDoc): string[] => {
  const title = tokenize(doc.title);
  const meta = tokenize([doc.tags.join(' '), doc.category, doc.courseCode].join(' '));
  return [...title, ...title, ...title, ...meta, ...meta, ...tokenize(doc.text)];
};

const K1 = 1.2;
const B = 0.75;

export const rankDocuments = (
  query: string,
  docs: RetrievableDoc[],
  opts: { courseCode?: string; limit?: number; minMatch?: number } = {}
): RetrievedSource[] => {
  const queryTerms = [...new Set(tokenize(query))];
  if (!queryTerms.length || !docs.length) return [];

  const termLists = docs.map(weightedTerms);
  const avgLen = termLists.reduce((s, t) => s + t.length, 0) / docs.length || 1;
  const docFreq = new Map<string, number>();
  for (const terms of termLists) for (const t of new Set(terms)) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
  const idf = (t: string) => {
    const n = docFreq.get(t) ?? 0;
    return Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
  };
  // Coverage denominator. Query words that appear nowhere in the vault (e.g. "slow") would otherwise get the
  // maximum IDF and swamp the score, so each counts as half an average known term instead.
  const known = queryTerms.filter((t) => docFreq.has(t));
  const knownIdf = known.reduce((s, t) => s + idf(t), 0);
  const unknownWeight = known.length ? (0.5 * knownIdf) / known.length : 1;
  const totalIdf = knownIdf + (queryTerms.length - known.length) * unknownWeight;

  const scored = docs.map((doc, i) => {
    const terms = termLists[i];
    const tf = new Map<string, number>();
    for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
    let bm25 = 0;
    let matchedIdf = 0;
    for (const q of queryTerms) {
      const f = tf.get(q);
      if (!f) continue;
      matchedIdf += idf(q);
      bm25 += idf(q) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * terms.length) / avgLen)));
    }
    if (opts.courseCode && bm25 > 0 && doc.courseCode === opts.courseCode) bm25 *= 1.2; // same-course boost
    return { doc, bm25, match: totalIdf ? matchedIdf / totalIdf : 0 };
  });

  return scored
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
      excerpt: doc.text.slice(0, 1500),
    }));
};

const loadVault = async (): Promise<RetrievableDoc[]> => {
  const items = await KnowledgeItem.find({}, { upvotedBy: 0 }).lean();
  return items.map((k) => ({
    id: String(k._id),
    title: k.title,
    courseCode: k.courseCode,
    category: k.category,
    author: k.author,
    verified: !!k.verificationBadge,
    tags: k.tags ?? [],
    text: k.content || k.snippet,
  }));
};

// Sources passed to the AI: at most 3, and only if they cover at least 30% of the question's key terms.
export const retrieveForQuestion = async (question: string, courseCode?: string): Promise<RetrievedSource[]> =>
  rankDocuments(question, await loadVault(), { courseCode, limit: 3, minMatch: 0.3 });

// Knowledge Vault search: ranked results with their match score.
export const searchVault = async (query: string, limit = 50): Promise<RetrievedSource[]> =>
  rankDocuments(query, await loadVault(), { limit });
