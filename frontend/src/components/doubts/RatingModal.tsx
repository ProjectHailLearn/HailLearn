import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { DoubtRating } from '../../types';

type Scores = Omit<DoubtRating, 'target'>;

const Stars: React.FC<{ label: string; hint: string; value: number; onChange: (n: number) => void }> = ({ label, hint, value, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-xs font-semibold text-slate-200">{label}</div>
      <div className="text-[10px] text-slate-500">{hint}</div>
    </div>
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} of 5`} onClick={() => onChange(n)}>
          <Star className={`w-5 h-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
        </button>
      ))}
    </div>
  </div>
);

// Student confirms their doubt is resolved and rates the answer (feeds mentor reputation / vault quality).
export const RatingModal: React.FC<{
  resolvedBy: string; // "Ananya Gupta" or "the AI"
  onSubmit: (scores: Scores) => Promise<void>;
  onClose: () => void;
}> = ({ resolvedBy, onSubmit, onClose }) => {
  const [scores, setScores] = useState<Scores>({ clarity: 0, helpfulness: 0, responseTime: 0, comment: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = scores.clarity > 0 && scores.helpfulness > 0 && scores.responseTime > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ ...scores, comment: scores.comment?.trim() || undefined });
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not submit rating');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="rate-title" className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 id="rate-title" className="text-sm font-bold text-white">Mark as resolved</h2>
            <p className="text-xs text-slate-400 mt-0.5">Rate the answer from {resolvedBy}. This closes the doubt.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <Stars label="Helpfulness" hint="Did it solve your doubt?" value={scores.helpfulness} onChange={(n) => setScores((s) => ({ ...s, helpfulness: n }))} />
        <Stars label="Clarity" hint="Was it easy to follow?" value={scores.clarity} onChange={(n) => setScores((s) => ({ ...s, clarity: n }))} />
        <Stars label="Response time" hint="Was it fast enough?" value={scores.responseTime} onChange={(n) => setScores((s) => ({ ...s, responseTime: n }))} />
        <textarea
          value={scores.comment}
          onChange={(e) => setScores((s) => ({ ...s, comment: e.target.value }))}
          placeholder="Optional comment"
          rows={2}
          maxLength={1000}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
        />
        {error && <div className="text-xs text-rose-400">{error}</div>}
        <button
          onClick={submit}
          disabled={!complete || busy}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-sm font-bold disabled:opacity-50"
        >
          {busy ? 'Submitting…' : complete ? 'Submit rating and close' : 'Rate all three to continue'}
        </button>
      </div>
    </div>
  );
};
