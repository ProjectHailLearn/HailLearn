// Dense vectors for the kNN half of hybrid search.
//
// Default: character-trigram vectors built locally with signed feature hashing (no external API).
// Words are split into overlapping 3-letter pieces ("#quicksort#" -> "#qu", "qui", "uic", ...) and hashed
// into a fixed number of dimensions, then L2-normalised. Cosine similarity between these vectors catches
// spelling variants and typos ("quiksort" ~ "quicksort") that whole-word BM25 misses. They are lexical,
// not semantic: they don't know that "fast" and "quick" mean the same thing.
//
// Optional: if EMBEDDING_API_KEY (or AI_API_KEY) can call a Gemini embedding model, semantic embeddings
// are stored and searched instead. A failed call disables the provider for this process, so an
// unsupported key costs one request, not one per document.

import { tokenize } from './analyzer.js';

export const NGRAM_DIMS = 384;

// 32-bit FNV-1a hash.
const fnv1a = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

export const normalize = (v: number[]): number[] => {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm ? v.map((x) => x / norm) : v;
};

export const ngramVector = (text: string, dims = NGRAM_DIMS): number[] => {
  const counts = new Map<string, number>();
  for (const word of tokenize(text)) {
    if (word.length < 2) continue;
    const padded = `#${word}#`;
    for (let i = 0; i + 3 <= padded.length; i++) {
      const g = padded.slice(i, i + 3);
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  const v = new Array<number>(dims).fill(0);
  for (const [g, c] of counts) {
    const h = fnv1a(g);
    v[h % dims] += (h & 0x80000000 ? -1 : 1) * (1 + Math.log(c)); // signed hashing, sublinear tf
  }
  return normalize(v);
};

export const cosine = (a: number[], b: number[]): number => {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // both sides are L2-normalised
};

// ---------- optional semantic embeddings ----------

export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMS = 768;
let embeddingsDisabled = false;

const embeddingKey = (): string | undefined =>
  process.env.EMBEDDING_API_KEY || ((process.env.AI_PROVIDER || '').toLowerCase() === 'gemini' ? process.env.AI_API_KEY : undefined);

export const embeddingsAvailable = (): boolean => !embeddingsDisabled && !!embeddingKey() && process.env.EMBEDDINGS !== 'off';

// Returns a normalised semantic embedding, or null when no embedding-capable key is configured.
export const embed = async (text: string): Promise<number[] | null> => {
  const key = embeddingKey();
  if (!key || !embeddingsAvailable()) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        output_dimensionality: EMBEDDING_DIMS,
      }),
    });
    if (!res.ok) throw new Error(`embedding ${res.status}`);
    const data = (await res.json()) as { embedding?: { values?: number[] }; embeddings?: { values?: number[] }[] };
    const values = data.embedding?.values ?? data.embeddings?.[0]?.values;
    if (!values?.length) throw new Error('empty embedding');
    return normalize(values);
  } catch (err) {
    embeddingsDisabled = true;
    console.warn(`[search] semantic embeddings disabled (${(err as Error).message}); using character n-gram vectors`);
    return null;
  }
};

export const resetEmbeddingProbe = (): void => {
  embeddingsDisabled = false;
};
