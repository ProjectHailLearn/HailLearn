import React, { useEffect, useState } from 'react';
import { Video, Calendar, Users, Radio, Plus, X, Trash2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { roomService } from '../../services/roomService';
import { courseService } from '../../services/courseService';
import { getSocket } from '../../services/socketService';
import { StudyRoom } from '../../types';

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `Today, ${time}` : `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`;
};

// Default the schedule picker to the next half hour, in local time.
const nextSlot = (): string => {
  const d = new Date(Date.now() + 30 * 60000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const errMsg = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

export const StudyRoomsCard: React.FC = () => {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [courseCodes, setCourseCodes] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', courseCode: '', scheduledAt: nextSlot(), durationMins: 60, meetingLink: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => roomService.getAll().then(setRooms).catch(() => setError('Failed to load study rooms'));

  useEffect(() => {
    load();
    courseService.getAll().then((c) => {
      const codes = c.map((x) => x.code);
      setCourseCodes(codes);
      setForm((f) => ({ ...f, courseCode: f.courseCode || codes[0] || '' }));
    }).catch(console.error);

    // Other users joining/hosting rooms push an update.
    const socket = getSocket();
    socket?.on('rooms:changed', load);
    return () => { socket?.off('rooms:changed', load); };
  }, []);

  const replace = (room: StudyRoom) => setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));

  const handleToggle = async (room: StudyRoom) => {
    setError(null);
    try {
      const updated = await roomService.toggleJoin(room.id);
      replace(updated);
      if (updated.isAttending && updated.status === 'LIVE' && updated.meetingLink) {
        window.open(updated.meetingLink, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(errMsg(err, 'Failed to update attendance'));
    }
  };

  const handleDelete = async (room: StudyRoom) => {
    setError(null);
    try {
      await roomService.remove(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch (err) {
      setError(errMsg(err, 'Failed to cancel room'));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const room = await roomService.create({
        title: form.title,
        courseCode: form.courseCode,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMins: Number(form.durationMins),
        meetingLink: form.meetingLink.trim() || undefined,
      });
      setRooms((prev) => [...prev, room].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
      setShowForm(false);
      setForm((f) => ({ ...f, title: '', meetingLink: '', scheduledAt: nextSlot() }));
    } catch (err) {
      setError(errMsg(err, 'Failed to create room'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500';

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Live Peer Study Rooms</h3>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Host'}
        </button>
      </div>

      {error && <div className="mb-3 text-xs text-rose-400">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <input
            className={inputCls}
            placeholder="Session title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select className={inputCls} value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })}>
              {courseCodes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={inputCls} value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })}>
              {[30, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <input
            type="datetime-local"
            className={inputCls}
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            required
          />
          <input
            className={inputCls}
            placeholder="Meeting link (optional, e.g. https://meet.google.com/...)"
            value={form.meetingLink}
            onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
          />
          <Button type="submit" size="sm" variant="gradient" isLoading={saving} className="w-full text-xs">
            Create Study Room
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {rooms.length === 0 && !showForm && (
          <div className="text-xs text-slate-500 text-center py-4">No upcoming rooms. Host one!</div>
        )}
        {rooms.map((room) => (
          <div
            key={room.id}
            className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
          >
            <div className="flex items-center justify-between">
              {room.status === 'LIVE' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Radio className="w-3 h-3 animate-pulse" />
                  LIVE NOW
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  <Calendar className="w-3 h-3" />
                  {formatTime(room.scheduledAt)}
                </span>
              )}

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {room.attendees} {room.status === 'LIVE' ? 'studying' : 'going'}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-200 line-clamp-1">
              {room.courseCode}: {room.title}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Host: {room.isHost ? 'You' : room.hostName}</span>
              {room.isHost && (
                <button onClick={() => handleDelete(room)} className="text-slate-500 hover:text-rose-400 transition" title="Cancel room">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!room.isHost && (
              <Button
                size="sm"
                variant={room.isAttending ? 'secondary' : room.status === 'LIVE' ? 'gradient' : 'outline'}
                className="w-full text-xs py-1.5 h-auto"
                onClick={() => handleToggle(room)}
              >
                {room.isAttending
                  ? room.status === 'LIVE' ? 'Leave Room' : 'Remove from Schedule'
                  : room.status === 'LIVE' ? 'Join Study Room' : 'Add to Schedule'}
              </Button>
            )}
            {room.isAttending && room.meetingLink && (
              <a
                href={room.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                Open meeting link ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
