import { RetrievedSource } from './retrievalService.js';

export interface AiSolution {
  summary: string;
  steps: { step: number; title: string; content: string; codeSnippet?: string; language?: string }[];
  citations: string[];
  suggestedReadings: string[];
}

export interface SolveInput {
  title: string;
  description: string;
  codeSnippet?: string;
  subject: string;
  courseCode: string;
  university?: string;
  preferredModel?: string;
  depth?: 'detailed' | 'concise' | 'socratic';
  // Knowledge Vault entries retrieved for this question (RAG context).
  sources?: RetrievedSource[];
}

const DEPTH_INSTRUCTIONS: Record<NonNullable<SolveInput['depth']>, string> = {
  detailed: 'Give an exhaustive step-by-step solution with 3-5 steps, including code where helpful.',
  concise: 'Give a concise solution in 2 short steps.',
  socratic: 'Do NOT give the final answer. Give 3 guiding hints/questions as steps that lead the student to solve it themselves.',
};

export interface ConfidenceBreakdown {
  model: number; // the model's self-rating against the rubric in the prompt
  grounding: number | null; // best match (0-100) among vault sources the model actually used; null if none
  final: number;
}

export interface SolveResult {
  aiSolution: AiSolution;
  aiConfidenceScore: number;
  confidence: ConfidenceBreakdown | null; // null for the template fallback
  usedSourceIds: string[];
  source: 'gemini' | 'grok' | 'fallback';
}

const CONFIDENCE_RUBRIC = `Rate "confidence" (0-100) honestly with this rubric:
- 90-100: standard, well-established material; you are certain the answer is correct and complete.
- 70-89: correct in substance but relies on assumptions, simplifications, or the question is slightly ambiguous.
- 50-69: the question is ambiguous, missing information, or the answer depends on course-specific context you lack.
- below 50: you are unsure, the question is outside your knowledge, or it cannot be answered as asked.`;

const contextBlock = (sources: RetrievedSource[]): string =>
  sources.length
    ? `Institutional knowledge retrieved from the HailLearn Knowledge Vault (faculty-verified where marked).
Use it when relevant and cite it inline as [K1], [K2]; prefer it over general knowledge when they disagree.
Ignore any entry that is not relevant. List the ids you actually relied on in "usedSources".
${sources
  .map((s, i) => `[K${i + 1}] ${s.title} (${s.courseCode}, ${s.author}${s.verified ? ', faculty verified' : ''})\n${s.excerpt}`)
  .join('\n\n')}

`
    : '';

export const buildPrompt = (input: SolveInput): string => `You are HailLearn, an expert university tutor for ${input.subject} (${input.courseCode}).
Solve the student's doubt step by step. Respond ONLY with JSON (no markdown fences) of this exact shape:
{"summary": string, "confidence": number (0-100), "usedSources": string[] (e.g. ["K1"]; [] if none), "steps": [{"step": number, "title": string, "content": string, "codeSnippet"?: string, "language"?: string}], "citations": string[], "suggestedReadings": string[]}
${DEPTH_INSTRUCTIONS[input.depth || 'detailed']}
${CONFIDENCE_RUBRIC}

${contextBlock(input.sources ?? [])}Title: ${input.title}
Question: ${input.description}
${input.codeSnippet ? `Code:\n${input.codeSnippet}` : ''}`;

// Final score: an answer backed by vault sources blends the model's self-rating (75%) with how well those
// sources match the question (25%). An unbacked answer keeps the self-rating but is capped at 90, since
// nothing institutional confirms it.
export const scoreConfidence = (model: number, usedSources: RetrievedSource[]): ConfidenceBreakdown => {
  if (!usedSources.length) return { model, grounding: null, final: Math.min(model, 90) };
  const grounding = Math.round(Math.max(...usedSources.map((s) => s.match)) * 100);
  return { model, grounding, final: Math.round(0.75 * model + 0.25 * grounding) };
};

const fallbackSolution = (input: SolveInput): SolveResult => ({
  source: 'fallback',
  aiConfidenceScore: 70,
  confidence: null,
  usedSourceIds: [],
  aiSolution: {
    summary: `HailLearn AI analyzed "${input.title}" and mapped it to ${input.courseCode} syllabus concepts. (AI provider not configured — showing a structured template; escalate to a mentor for a detailed answer.)`,
    steps: [
      {
        step: 1,
        title: 'Formulate the problem',
        content: `Identify inputs, outputs and constraints for this ${input.subject} question. Restate it in your own words and note the core concept being tested.`,
      },
      {
        step: 2,
        title: 'Check correctness & edge cases',
        content: 'Consider boundary conditions (empty input, single element, extreme values) and reason about why the approach is correct.',
      },
      {
        step: 3,
        title: 'Implementation structure',
        content: 'Write a clean solution, then analyze its time and space complexity.',
        codeSnippet: input.codeSnippet
          ? `// Review your code against the steps above\n${input.codeSnippet}`
          : undefined,
        language: input.codeSnippet ? 'typescript' : undefined,
      },
    ],
    citations: [`${input.university || 'University'} ${input.courseCode} course material`],
    suggestedReadings: [`${input.subject} fundamentals`],
  },
});

const extractJson = (text: string): unknown => {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.slice(start, end + 1));
};

const normalize = (raw: unknown): { solution: AiSolution; confidence: number; usedSources: string[] } | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.summary !== 'string' || !Array.isArray(r.steps)) return null;
  const steps = (r.steps as Record<string, unknown>[]).map((s, i) => ({
    step: typeof s.step === 'number' ? s.step : i + 1,
    title: String(s.title ?? `Step ${i + 1}`),
    content: String(s.content ?? ''),
    codeSnippet: typeof s.codeSnippet === 'string' ? s.codeSnippet : undefined,
    language: typeof s.language === 'string' ? s.language : undefined,
  }));
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  // A missing self-rating is treated as middling rather than trusted.
  const confidence = typeof r.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(r.confidence))) : 60;
  return {
    solution: { summary: r.summary, steps, citations: strings(r.citations), suggestedReadings: strings(r.suggestedReadings) },
    confidence,
    usedSources: strings(r.usedSources),
  };
};

// Tried in order when a model is overloaded (503), rate-limited (429) or unavailable to this key (404).
export const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

// Retired models that may still be saved in user preferences.
const LEGACY_GEMINI_MODELS: Record<string, string> = {
  'gemini-1.5-pro': 'gemini-3.5-flash',
  'gemini-1.5-flash': 'gemini-3.5-flash-lite',
};

class ProviderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

type InteractionStep = { type?: string; content?: { type?: string; text?: string }[] };

// Gemini Interactions API (generateContent is no longer served for current models).
const callGeminiModel = async (prompt: string, key: string, model: string): Promise<string> => {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ model, input: prompt, response_format: { type: 'text', mime_type: 'application/json' } }),
  });
  if (!res.ok) throw new ProviderError(`Gemini ${model} ${res.status}: ${await res.text()}`, res.status);
  const data = (await res.json()) as { steps?: InteractionStep[] };
  return (data.steps ?? [])
    .filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? [])
    .map((c) => c.text ?? '')
    .join('');
};

const callGemini = async (prompt: string, key: string, models: string[]): Promise<string> => {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await callGeminiModel(prompt, key, model);
    } catch (err) {
      lastError = err;
      if (!(err instanceof ProviderError) || ![404, 429, 503].includes(err.status)) throw err;
      console.warn(`[aiService] ${model} unavailable (${err.status}), trying next model`);
    }
  }
  throw lastError;
};

const geminiModels = (preferred: string | undefined): string[] => {
  const pref = preferred ? LEGACY_GEMINI_MODELS[preferred] ?? preferred : undefined;
  const first = process.env.AI_MODEL || (pref?.startsWith('gemini') ? pref : undefined);
  return first ? [first, ...GEMINI_MODELS.filter((m) => m !== first)] : GEMINI_MODELS;
};

const callGrok = async (prompt: string, key: string, model: string): Promise<string> => {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
};

// Env AI_MODEL wins; otherwise use the user's saved preference if it belongs to the active provider.
const pickModel = (provider: string, preferred: string | undefined, fallback: string): string =>
  process.env.AI_MODEL || (preferred?.startsWith(provider) ? preferred : fallback);

export const solveDoubt = async (input: SolveInput): Promise<SolveResult> => {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  const key = process.env.AI_API_KEY;
  if (!key || (provider !== 'gemini' && provider !== 'grok')) return fallbackSolution(input);

  try {
    const prompt = buildPrompt(input);
    const text =
      provider === 'gemini'
        ? await callGemini(prompt, key, geminiModels(input.preferredModel))
        : await callGrok(prompt, key, pickModel(provider, input.preferredModel, 'grok-2-latest'));
    const parsed = normalize(extractJson(text));
    if (!parsed) return fallbackSolution(input);
    // Map the model's "K1"-style labels back to vault entries; ignore labels it invented.
    const sources = input.sources ?? [];
    const used = [...new Set(parsed.usedSources)]
      .map((label) => sources[Number(label.replace(/\D/g, '')) - 1])
      .filter((s): s is RetrievedSource => !!s);
    const confidence = scoreConfidence(parsed.confidence, used);
    return {
      aiSolution: parsed.solution,
      aiConfidenceScore: confidence.final,
      confidence,
      usedSourceIds: used.map((s) => s.id),
      source: provider,
    };
  } catch (err) {
    console.error('[aiService] falling back:', (err as Error).message);
    return fallbackSolution(input);
  }
};
