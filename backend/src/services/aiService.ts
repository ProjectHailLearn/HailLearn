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
}

export interface SolveResult {
  aiSolution: AiSolution;
  aiConfidenceScore: number;
  source: 'gemini' | 'grok' | 'fallback';
}

const buildPrompt = (input: SolveInput): string => `You are HailLearn, an expert university tutor for ${input.subject} (${input.courseCode}).
Solve the student's doubt step by step. Respond ONLY with JSON (no markdown fences) of this exact shape:
{"summary": string, "confidence": number (0-100), "steps": [{"step": number, "title": string, "content": string, "codeSnippet"?: string, "language"?: string}], "citations": string[], "suggestedReadings": string[]}
Use 2-5 steps.

Title: ${input.title}
Question: ${input.description}
${input.codeSnippet ? `Code:\n${input.codeSnippet}` : ''}`;

const fallbackSolution = (input: SolveInput): SolveResult => ({
  source: 'fallback',
  aiConfidenceScore: 70,
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

const normalize = (raw: unknown): { solution: AiSolution; confidence: number } | null => {
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
  const confidence = typeof r.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(r.confidence))) : 85;
  return {
    solution: { summary: r.summary, steps, citations: strings(r.citations), suggestedReadings: strings(r.suggestedReadings) },
    confidence,
  };
};

const callGemini = async (prompt: string, key: string, model: string): Promise<string> => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
        ? await callGemini(prompt, key, pickModel(provider, input.preferredModel, 'gemini-1.5-flash'))
        : await callGrok(prompt, key, pickModel(provider, input.preferredModel, 'grok-2-latest'));
    const parsed = normalize(extractJson(text));
    if (!parsed) return fallbackSolution(input);
    return { aiSolution: parsed.solution, aiConfidenceScore: parsed.confidence, source: provider };
  } catch (err) {
    console.error('[aiService] falling back:', (err as Error).message);
    return fallbackSolution(input);
  }
};
