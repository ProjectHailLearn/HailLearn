import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { flagService, FlagTarget } from '../../services/flagService';
import { apiError } from '../../utils/errors';

const REASONS = ['Incorrect or misleading', 'Spam or off-topic', 'Abusive or inappropriate', 'Plagiarism / exam cheating'];

// Small "Report" control that sends content to the admin moderation queue.
export const ReportButton: React.FC<{ targetType: FlagTarget; targetId: string; parentId?: string; className?: string }> = ({
  targetType, targetId, parentId, className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      setStatus(await flagService.report(targetType, targetId, reason, parentId));
      setOpen(false);
    } catch (err) {
      setStatus(apiError(err, 'Could not send report'));
    } finally {
      setBusy(false);
    }
  };

  if (status && !open) return <span className={`text-[10px] text-slate-500 ${className}`}>{status}</span>;

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400"
        title="Report to moderators"
      >
        <Flag className="w-3 h-3" /> Report
      </button>
      {open && (
        <span
          className="absolute right-0 top-5 z-20 w-56 p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
          >
            {REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <span className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-slate-400 hover:text-slate-200">Cancel</button>
            <button type="button" onClick={submit} disabled={busy} className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-50">
              {busy ? 'Sending…' : 'Send report'}
            </button>
          </span>
        </span>
      )}
    </span>
  );
};
