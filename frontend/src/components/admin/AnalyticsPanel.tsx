import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '../common/Card';
import { adminService } from '../../services/adminService';
import { Analytics } from '../../types';
import { apiError } from '../../utils/errors';

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
    <div className="text-[11px] text-slate-400">{label}</div>
    <div className="text-xl font-black text-white tabular-nums">{value}</div>
    {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
  </div>
);

const fmtMinutes = (m: number | null) => (m === null ? '—' : m < 60 ? `${m} min` : `${(m / 60).toFixed(1)} h`);

// Platform analytics (FR-6.2): volume, resolution, AI gate behaviour, mentor responsiveness, ratings.
export const AnalyticsPanel: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reindexMsg, setReindexMsg] = useState<string | null>(null);

  const load = () => adminService.analytics().then(setData).catch((e) => setError(apiError(e, 'Failed to load analytics')));
  useEffect(() => { load(); }, []);

  if (error) return <div className="text-xs text-rose-400">{error}</div>;
  if (!data) return <div className="text-xs text-slate-500">Loading analytics…</div>;

  const maxDay = Math.max(1, ...data.doubts.perDay.map((d) => d.n));
  const maxSubject = Math.max(1, ...data.doubts.bySubject.map((s) => s.total));
  const r = (k: string) => data.ratings[k];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Doubts" value={data.doubts.total} hint={`${data.doubts.resolutionRate}% resolved`} />
        <Stat label="Answered by AI / routed" value={`${data.ai.answeredByAi} / ${data.ai.routedToMentors}`} hint={data.ai.routingRate === null ? 'no gated doubts yet' : `${data.ai.routingRate}% routed to mentors`} />
        <Stat label="Avg AI confidence" value={data.ai.avgConfidence === null ? '—' : `${data.ai.avgConfidence}%`} />
        <Stat label="Avg mentor response" value={fmtMinutes(data.mentors.avgResponseMinutes)} hint={`${data.mentors.acceptedDoubts} accepted doubts`} />
        <Stat label="Users" value={data.users.total} hint={Object.entries(data.users.byRole).map(([k, v]) => `${v} ${k}`).join(' · ')} />
        <Stat label="Suspended" value={data.users.suspended} />
        <Stat label="Open reports" value={data.moderation.openReports} />
        <Stat
          label="Avg ratings (helpful / clear)"
          value={r('mentor') || r('ai') ? `${(r('mentor') ?? r('ai')).helpfulness} / ${(r('mentor') ?? r('ai')).clarity}` : '—'}
          hint={[r('mentor') && `mentors: ${r('mentor').count}`, r('ai') && `AI: ${r('ai').count}`].filter(Boolean).join(' · ') || 'no ratings yet'}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card variant="glass" className="p-4 space-y-2">
          <h3 className="text-xs font-bold text-white">Doubts per day (last 30 days)</h3>
          {data.doubts.perDay.length === 0 ? <p className="text-xs text-slate-500">No doubts in the last 30 days.</p> : (
            <div className="flex items-end gap-1 h-28" role="img" aria-label="Doubts per day">
              {data.doubts.perDay.map((d) => (
                <div key={d._id} className="flex-1 bg-brand-500/70 rounded-t" style={{ height: `${(d.n / maxDay) * 100}%` }} title={`${d._id}: ${d.n}`} />
              ))}
            </div>
          )}
        </Card>
        <Card variant="glass" className="p-4 space-y-2">
          <h3 className="text-xs font-bold text-white">Demand by subject</h3>
          {data.doubts.bySubject.map((s) => (
            <div key={s.subject} className="text-[11px]">
              <div className="flex justify-between text-slate-300"><span className="truncate">{s.subject}</span><span className="tabular-nums">{s.total} ({s.open} open)</span></div>
              <div className="h-1.5 bg-slate-800 rounded"><div className="h-1.5 bg-purple-500/70 rounded" style={{ width: `${(s.total / maxSubject) * 100}%` }} /></div>
            </div>
          ))}
        </Card>
      </div>

      <Card variant="glass" className="p-4 space-y-2">
        <h3 className="text-xs font-bold text-white">Top mentors by reputation</h3>
        {data.mentors.top.length === 0 ? <p className="text-xs text-slate-500">No mentor accounts yet.</p> : data.mentors.top.map((m) => (
          <div key={m._id} className="flex justify-between text-xs text-slate-300">
            <span>{m.name}{m.verifiedBadge ? ' ✓' : ''}</span>
            <span className="tabular-nums text-slate-400">
              {(m.reputationScore ?? 4).toFixed(2)} · {m.ratingsCount ?? 0} ratings · {m.resolvedDoubtsCount ?? 0} answered{m.avgResponseMinutes !== undefined ? ` · ~${fmtMinutes(m.avgResponseMinutes)}` : ''}
            </span>
          </div>
        ))}
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={load} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
        <button
          onClick={async () => {
            setReindexMsg('Rebuilding search indexes…');
            try {
              const n = await adminService.reindexSearch();
              setReindexMsg(`Search rebuilt: ${n.vault} vault entries, ${n.mentors} mentor profiles.`);
            } catch (e) {
              setReindexMsg(apiError(e, 'Reindex failed'));
            }
          }}
          className="text-xs text-slate-400 hover:text-white"
        >
          Rebuild search index
        </button>
        {reindexMsg && <span className="text-xs text-slate-500">{reindexMsg}</span>}
      </div>
    </div>
  );
};
