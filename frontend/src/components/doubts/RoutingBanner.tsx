import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { RoutingDecision, RetrievedSource } from '../../types';

// Explains the confidence gate's decision: served as the answer, or routed to a mentor (and to whom).
export const RoutingBanner: React.FC<{ routing?: RoutingDecision; confidence?: number; sources?: RetrievedSource[] }> = ({ routing, confidence, sources }) => {
  if (!routing) return null;

  if (routing.mode === 'grounded_answer') {
    // Attribution: the person whose verified resolution the answer is built on.
    const basis = sources?.find((s) => s.used && s.author);
    return (
      <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
        <span>
          Answered by AI — confidence {confidence}% is above the {routing.threshold}% threshold.
          {basis && <> Based on the verified resolution “{basis.title}” by <strong className="text-white">{basis.author}</strong>.</>}
          {' '}You can still escalate to a mentor.
        </span>
      </div>
    );
  }

  const [top, ...others] = routing.candidates;
  const why = routing.reason === 'ai_unavailable'
    ? 'The AI was unavailable'
    : `Confidence ${confidence}% is not above the ${routing.threshold}% threshold`;

  return (
    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-100 space-y-2">
      <div className="flex items-start gap-2">
        {top ? <UserCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" /> : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />}
        <span>
          {why}, so {top
            ? <>this doubt was routed to <strong className="text-white">{top.name}</strong>{top.online ? ' (online now)' : ' (notified)'}. They'll accept it or pass it on. Treat the AI text below as a draft until they answer.</>
            : <>it needs a mentor, but none with an account is available. Escalate it manually below.</>}
        </span>
      </div>
      {top && (
        <div className="pl-6 text-[11px] text-amber-200/80 space-y-0.5">
          <div>Mentor rank = 60% topic match + 25% reputation + 15% available now.</div>
          {[top, ...others].map((c, i) => (
            <div key={c.mentorId} className={i === 0 ? 'text-amber-100' : ''}>
              {i + 1}. {c.name} — score {Math.round(c.score * 100)} (match {Math.round(c.relevance * 100)}%, reputation {Math.round(c.reputation * 100)}%{c.available ?? c.online ? ', available' : ''})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
