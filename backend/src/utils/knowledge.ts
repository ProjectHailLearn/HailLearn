import { IDoubt } from '../models/Doubt.js';

// Plain-text article for the Knowledge Vault: the question, mentor/faculty answers, then the AI walkthrough.
export const knowledgeContentFromDoubt = (doubt: IDoubt): string => {
  const parts: string[] = [`Question\n${doubt.description}`];
  if (doubt.codeSnippet) parts.push(`Code\n${doubt.codeSnippet}`);

  for (const a of doubt.answers) {
    parts.push(`Answer by ${a.authorName} (${a.role})\n${a.content}`);
  }

  const ai = doubt.aiSolution;
  if (ai) {
    const steps = ai.steps.map((s) => `${s.step}. ${s.title}\n${s.content}${s.codeSnippet ? `\n\n${s.codeSnippet}` : ''}`);
    parts.push(`AI walkthrough\n${ai.summary}`, ...steps);
    if (ai.citations?.length) parts.push(`References\n${ai.citations.map((c) => `• ${c}`).join('\n')}`);
  }
  return parts.join('\n\n');
};
