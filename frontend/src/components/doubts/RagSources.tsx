import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Gauge } from 'lucide-react';
import { ConfidenceBreakdown, RetrievedSource } from '../../types';

// Shows which Knowledge Vault entries the AI was given (RAG) and how its confidence score was computed.
export const RagSources: React.FC<{ sources?: RetrievedSource[]; confidence?: ConfidenceBreakdown }> = ({ sources = [], confidence }) => (
  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5 text-xs">
    <div className="flex items-center gap-1.5 font-bold text-slate-300">
      <Database className="w-3.5 h-3.5 text-emerald-400" />
      <span>Knowledge Vault sources</span>
    </div>
    {sources.length ? (
      <ul className="space-y-1.5">
        {sources.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 rounded">K{i + 1}</span>
            <Link to={`/knowledge?open=${s.id}`} className="text-slate-200 hover:text-emerald-300 truncate">{s.title}</Link>
            <span className="text-slate-500 flex-shrink-0">{s.courseCode} · {Math.round(s.match * 100)}% match</span>
            <span className={`ml-auto flex-shrink-0 text-[10px] font-semibold ${s.used ? 'text-emerald-400' : 'text-slate-500'}`}>
              {s.used ? 'cited' : 'not used'}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-slate-500">No matching vault entries — this answer is from the AI's general knowledge.</p>
    )}
    {confidence && (
      <div className="flex items-start gap-1.5 pt-2 border-t border-slate-800 text-slate-400">
        <Gauge className="w-3.5 h-3.5 mt-0.5 text-brand-400 flex-shrink-0" />
        <span>
          {confidence.grounding !== null
            ? <>Confidence {confidence.final}% = 75% × AI self-rating ({confidence.model}) + 25% × best cited source match ({confidence.grounding}).</>
            : <>Confidence {confidence.final}% = AI self-rating ({confidence.model}){confidence.model > 90 ? ', capped at 90 because no vault source backs it' : ''}.</>}
        </span>
      </div>
    )}
  </div>
);
