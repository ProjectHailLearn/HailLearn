// Text analysis, modelled on an Elasticsearch analyzer: tokenizer -> lowercase -> stop words -> synonyms
// -> light English stemmer. The same chain runs at index time and query time, so terms always line up.

const STOPWORDS = new Set(
  ('a an and are as at be but by can do does doing for from how i if in into is it its me my of on or our so ' +
    'than that the their them then there these they this to was we were what when where which while who why ' +
    'will with you your explain please help understand question vs versus get use using used work works ' +
    'would should could tell about between difference').split(' ')
);

// Abbreviations common in CS courses, expanded at index and query time ("synonym filter" with expand).
const SYNONYMS: Record<string, string[]> = {
  dp: ['dynamic', 'programming'],
  bfs: ['breadth', 'first', 'search'],
  dfs: ['depth', 'first', 'search'],
  bst: ['binary', 'search', 'tree'],
  os: ['operating', 'system'],
  dbms: ['database'],
  db: ['database'],
  ml: ['machine', 'learning'],
  ai: ['artificial', 'intelligence'],
  nn: ['neural', 'network'],
  oop: ['object', 'oriented', 'programming'],
  lsm: ['log', 'structured', 'merge'],
  ds: ['data', 'structure'],
  algo: ['algorithm'],
  rag: ['retrieval', 'augmented', 'generation'],
  ann: ['approximate', 'nearest', 'neighbour'],
  dsa: ['data', 'structure', 'algorithm'],
};

const VOWEL = /[aeiouy]/;

// Light English stemmer (similar in spirit to Elasticsearch's light_english): strips plural and
// common verb suffixes conservatively, so "sorted"/"sorting"/"sorts" all become "sort".
export const stem = (t: string): string => {
  if (t.length <= 3 || /\d/.test(t)) return t;
  let w = t.replace(/'s$/, '');
  if (w.endsWith('ies') && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith('sses')) w = w.slice(0, -2);
  else if (/(x|z|ch|sh|ss)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);

  const strip = (suffix: string, minStem: number) => {
    if (!w.endsWith(suffix)) return false;
    const base = w.slice(0, -suffix.length);
    if (base.length < minStem || !VOWEL.test(base)) return false;
    w = /([^aeiouslz])\1$/.test(base) ? base.slice(0, -1) : base; // running -> run, embedded -> embed
    return true;
  };
  if (!w.endsWith('eed') && !strip('ing', 3)) strip('ed', 3);
  return w;
};

export const tokenize = (text: string): string[] => text.toLowerCase().match(/[a-z0-9][a-z0-9+#]*/g) ?? [];

// Full analyzer: returns terms in order (with repeats, so callers can count term frequency).
export const analyze = (text: string): string[] => {
  const out: string[] = [];
  for (const tok of tokenize(text)) {
    if (tok.length < 2 || STOPWORDS.has(tok)) continue;
    out.push(stem(tok));
    for (const syn of SYNONYMS[tok] ?? []) out.push(stem(syn));
  }
  return out;
};

export const termFrequencies = (terms: string[]): Record<string, number> => {
  const tf: Record<string, number> = {};
  for (const t of terms) tf[t] = (tf[t] ?? 0) + 1;
  return tf;
};
