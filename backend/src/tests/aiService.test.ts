import { solveDoubt } from '../services/aiService.js';

const input = {
  title: 'Why is quicksort O(n^2)?',
  description: 'Worst case on sorted input',
  subject: 'Data Structures & Algorithms',
  courseCode: 'CS201',
};

const validJson = JSON.stringify({
  summary: 'Pivot choice matters.',
  confidence: 92,
  steps: [{ step: 1, title: 'Pivot', content: 'Pick a random pivot.' }],
  citations: ['CLRS ch. 7'],
  suggestedReadings: ['Randomized algorithms'],
});

const mockFetch = (body: unknown, ok = true) =>
  jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body, text: async () => 'err' });

describe('aiService.solveDoubt', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
  });

  it('returns the template fallback when no key is configured', async () => {
    delete process.env.AI_API_KEY;
    const res = await solveDoubt(input);
    expect(res.source).toBe('fallback');
    expect(res.aiSolution.steps.length).toBeGreaterThan(0);
  });

  it('parses a Gemini response', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test-key';
    const fetchMock = mockFetch({ candidates: [{ content: { parts: [{ text: validJson }] } }] });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await solveDoubt({ ...input, depth: 'socratic' });
    expect(res.source).toBe('gemini');
    expect(res.aiConfidenceScore).toBe(92);
    expect(res.aiSolution.summary).toBe('Pivot choice matters.');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.contents[0].parts[0].text).toContain('Do NOT give the final answer');
  });

  it('parses a Grok response wrapped in markdown fences', async () => {
    process.env.AI_PROVIDER = 'grok';
    process.env.AI_API_KEY = 'test-key';
    global.fetch = mockFetch({ choices: [{ message: { content: '```json\n' + validJson + '\n```' } }] }) as unknown as typeof fetch;

    const res = await solveDoubt(input);
    expect(res.source).toBe('grok');
    expect(res.aiSolution.steps[0].title).toBe('Pivot');
  });

  it('falls back when the provider errors', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.AI_API_KEY = 'test-key';
    global.fetch = mockFetch({}, false) as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await solveDoubt(input);
    expect(res.source).toBe('fallback');
  });

  it('falls back when the model returns malformed JSON', async () => {
    process.env.AI_PROVIDER = 'grok';
    process.env.AI_API_KEY = 'test-key';
    global.fetch = mockFetch({ choices: [{ message: { content: 'not json at all' } }] }) as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await solveDoubt(input);
    expect(res.source).toBe('fallback');
  });
});
