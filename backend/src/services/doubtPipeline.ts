import { solveDoubt, AiSolution, ConfidenceBreakdown } from './aiService.js';
import { retrieveForQuestion } from './retrievalService.js';
import { decideRouting, rankMentorsForDoubt, RoutingDecision, MentorCandidate } from './routingService.js';
import { notify } from './notificationService.js';

// The RAG pipeline for one doubt: retrieve vault context -> grounded generation -> confidence score ->
// gate -> (if needed) rank mentors. Used when a doubt is posted and by POST /doubts/:id/resolve-ai.

export interface PipelineInput {
  title: string;
  description: string;
  codeSnippet?: string;
  subject: string;
  courseCode: string;
  depth?: 'detailed' | 'concise' | 'socratic';
}

export interface PipelineUser {
  id: string;
  university?: string;
  preferredModel?: string;
}

export interface PipelineResult {
  aiSolution: AiSolution;
  aiConfidenceScore: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  retrievedSources: { id: string; title: string; courseCode: string; match: number; used: boolean; author: string; doubtId?: string }[];
  routing: RoutingDecision & { candidates: MentorCandidate[]; routedAt?: Date };
  routedTo?: MentorCandidate;
  aiSource: 'gemini' | 'grok' | 'fallback';
}

export const runDoubtPipeline = async (input: PipelineInput, user: PipelineUser): Promise<PipelineResult> => {
  const question = `${input.title}\n${input.description}`;
  const sources = await retrieveForQuestion(question, input.courseCode).catch((err) => {
    console.error('[rag] retrieval failed:', (err as Error).message);
    return [];
  });
  const ai = await solveDoubt({ ...input, university: user.university, preferredModel: user.preferredModel, sources });

  // Confidence gate: a confident AI answer resolves the doubt; otherwise it goes to the best-matching mentor.
  const decision = decideRouting(ai.aiConfidenceScore, ai.source !== 'fallback');
  const candidates = decision.mode === 'mentor_routing'
    ? await rankMentorsForDoubt(question, input.courseCode, user.id).catch((err) => {
        console.error('[routing] mentor ranking failed:', (err as Error).message);
        return [] as MentorCandidate[];
      })
    : [];
  const routedTo = candidates[0];

  return {
    aiSolution: ai.aiSolution,
    aiConfidenceScore: ai.aiConfidenceScore,
    confidenceBreakdown: ai.confidence ?? undefined,
    retrievedSources: sources.map((s) => ({
      id: s.id, title: s.title, courseCode: s.courseCode, match: s.match, used: ai.usedSourceIds.includes(s.id),
      author: s.author, doubtId: s.doubtId,
    })),
    routing: { ...decision, candidates: candidates.slice(0, 3), routedAt: routedTo ? new Date() : undefined },
    routedTo,
    aiSource: ai.source,
  };
};

// Fields to store on the doubt document for a pipeline result.
export const pipelineFields = (r: PipelineResult) => ({
  status: r.routedTo ? 'MENTOR_ESCALATED' : 'AI_RESOLVED',
  aiSolution: r.aiSolution,
  aiConfidenceScore: r.aiConfidenceScore,
  confidenceBreakdown: r.confidenceBreakdown,
  retrievedSources: r.retrievedSources,
  routing: r.routing,
  ...(r.routedTo
    ? { assignedMentor: { id: r.routedTo.mentorId, name: r.routedTo.name, avatar: r.routedTo.avatar, karma: r.routedTo.karma } }
    : {}),
});

export const notifyPipelineOutcome = async (
  r: PipelineResult,
  doubt: { id: string; title: string; courseCode: string; authorId: string }
): Promise<void> => {
  const link = `/doubts?id=${doubt.id}`;
  if (r.routedTo) {
    await notify(r.routedTo.userId, {
      type: 'mentor',
      title: 'New doubt routed to you',
      message: `"${doubt.title}" (${doubt.courseCode}) needs a mentor — the AI was ${r.routing.reason === 'ai_unavailable' ? 'unavailable' : `only ${r.aiConfidenceScore}% confident`}. Open it to accept.`,
      link,
    });
    await notify(doubt.authorId, {
      type: 'mentor',
      title: 'Routed to a mentor',
      message: `"${doubt.title}" was sent to ${r.routedTo.name}. The AI draft is shown meanwhile.`,
      link,
    });
    return;
  }
  const cited = r.retrievedSources.find((s) => s.used);
  await notify(doubt.authorId, {
    type: 'ai',
    title: r.aiSource === 'fallback' ? 'Doubt received' : 'AI solved your doubt',
    message: `"${doubt.title}" — ${r.aiSource === 'fallback'
      ? 'a guided outline is ready; escalate for a mentor answer.'
      : `solution ready (${r.aiConfidenceScore}% confidence)${cited?.author ? `, based on a resolution by ${cited.author}` : ''}.`}`,
    link,
  });
};
