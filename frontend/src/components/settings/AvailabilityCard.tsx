import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { mentorService } from '../../services/mentorService';
import { Availability } from '../../types';
import { apiError } from '../../utils/errors';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mentors set weekly hours and whether they take routed doubts (FR-4.2). Routing treats a mentor inside a
// slot as available, and skips mentors who turned routed doubts off. Renders nothing for non-mentors.
export const AvailabilityCard: React.FC = () => {
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availableNow, setAvailableNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    mentorService.getMine().then((m) => {
      if (!m) return;
      setMentorId(m.id);
      setAvailableNow(m.availableNow);
      setAvailability({
        acceptingDoubts: m.availability?.acceptingDoubts ?? true,
        timezone: m.availability?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        slots: m.availability?.slots ?? [],
      });
    });
  }, []);

  if (!mentorId || !availability) return null;

  const update = (patch: Partial<Availability>) => { setMessage(null); setAvailability({ ...availability, ...patch }); };
  const setSlot = (i: number, patch: Partial<Availability['slots'][number]>) =>
    update({ slots: availability.slots.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const save = async () => {
    setSaving(true);
    try {
      setAvailability(await mentorService.updateAvailability(mentorId, availability));
      setMessage('Availability saved.');
    } catch (err) {
      setMessage(apiError(err, 'Could not save availability'));
    } finally {
      setSaving(false);
    }
  };

  const input = 'bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500';

  return (
    <Card variant="glass" className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <CalendarClock className="w-5 h-5 text-purple-400" />
        <div>
          <h3 className="text-sm font-bold text-white">Mentor Availability</h3>
          <p className="text-xs text-slate-400">
            Weekly hours when doubts can be routed to you. {availableNow ? 'You count as available right now.' : 'You are not in a slot right now.'}
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-200">
        <input type="checkbox" checked={availability.acceptingDoubts} onChange={(e) => update({ acceptingDoubts: e.target.checked })} />
        Accept routed doubts {availability.acceptingDoubts ? '' : '(paused — the AI will route to other mentors)'}
      </label>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Timezone</span>
        <input value={availability.timezone} onChange={(e) => update({ timezone: e.target.value })} className={`${input} w-48`} aria-label="Timezone" />
      </div>

      <div className="space-y-2">
        {availability.slots.length === 0 && <p className="text-xs text-slate-500">No weekly slots yet. You'll still count as available whenever you're online.</p>}
        {availability.slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={slot.day} onChange={(e) => setSlot(i, { day: Number(e.target.value) })} className={input} aria-label="Day">
              {DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}
            </select>
            <input type="time" value={slot.start} onChange={(e) => setSlot(i, { start: e.target.value })} className={input} aria-label="Start" />
            <span className="text-xs text-slate-500">to</span>
            <input type="time" value={slot.end} onChange={(e) => setSlot(i, { end: e.target.value })} className={input} aria-label="End" />
            <button type="button" onClick={() => update({ slots: availability.slots.filter((_, j) => j !== i) })} className="p-1.5 text-slate-500 hover:text-rose-400" aria-label="Remove slot">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update({ slots: [...availability.slots, { day: 1, start: '18:00', end: '20:00' }] })}
          className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200"
        >
          <Plus className="w-3.5 h-3.5" /> Add slot
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" variant="secondary" isLoading={saving} onClick={save} className="text-xs">Save availability</Button>
        {message && <span className="text-xs text-slate-400">{message}</span>}
      </div>
    </Card>
  );
};
