import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAppDispatch, useAppSelector } from '../store';
import { updateProfile } from '../store/slices/authSlice';
import { authService } from '../services/authService';

export const SettingsPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [model, setModel] = useState(user?.preferences?.aiModel || 'gemini-1.5-flash');
  const [form, setForm] = useState({
    name: user?.name || '',
    university: user?.university || '',
    department: user?.department || '',
    semester: user?.semester ? String(user.semester) : '',
    avatar: user?.avatar || '',
    specializations: (user?.specializations || []).join(', '),
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await authService.updateMe({
        name: form.name,
        university: form.university,
        department: form.department,
        semester: form.semester ? Number(form.semester) : undefined,
        avatar: form.avatar,
        specializations: form.specializations.split(',').map((x) => x.trim()).filter(Boolean),
        preferences: { aiModel: model, emailNotifications: user.preferences?.emailNotifications ?? true },
      });
      dispatch(updateProfile(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-400" />
          University System & AI Preferences
        </h1>
        <p className="text-xs text-slate-400">
          Configure Gemini AI inference models, institutional vector indexes, and alert thresholds
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Model Configuration */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="text-sm font-bold text-white">AI Inference Engine</h3>
              <p className="text-xs text-slate-400">
                Choose the foundational model for step-by-step doubt reasoning
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition ${
                model === 'gemini-1.5-pro'
                  ? 'bg-brand-950/40 border-brand-500/60 shadow-lg shadow-brand-500/10'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="radio"
                  name="model"
                  value="gemini-1.5-pro"
                  checked={model === 'gemini-1.5-pro'}
                  onChange={(e) => setModel(e.target.value)}
                  className="text-brand-600 focus:ring-brand-500 mt-1"
                />
                <span className="text-[10px] font-bold uppercase bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
                  Recommended
                </span>
              </div>
              <div className="mt-2 text-sm font-bold text-white">Gemini 1.5 Pro (Deep Reasoning)</div>
              <p className="text-xs text-slate-400 mt-1">
                2M token context window, optimal for exhaustive proof generation and mathematical derivations.
              </p>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition ${
                model === 'gemini-1.5-flash'
                  ? 'bg-brand-950/40 border-brand-500/60 shadow-lg shadow-brand-500/10'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="radio"
                  name="model"
                  value="gemini-1.5-flash"
                  checked={model === 'gemini-1.5-flash'}
                  onChange={(e) => setModel(e.target.value)}
                  className="text-brand-600 focus:ring-brand-500 mt-1"
                />
                <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  Ultra Fast
                </span>
              </div>
              <div className="mt-2 text-sm font-bold text-white">Gemini 1.5 Flash (Sub-Second)</div>
              <p className="text-xs text-slate-400 mt-1">
                Optimized for low-latency live study rooms and instant chat hint generation.
              </p>
            </label>
          </div>
        </Card>

        {/* Profile */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Profile & University Identity</h3>
              <p className="text-xs text-slate-400">
                {user.email} · {user.role}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">University</label>
              <input
                type="text"
                value={form.university}
                onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Semester</label>
              <input
                type="number"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Avatar URL</label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Specializations (comma separated)</label>
              <input
                type="text"
                value={form.specializations}
                onChange={(e) => setForm((f) => ({ ...f, specializations: e.target.value }))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings successfully saved!
            </span>
          ) : error ? (
            <span className="text-xs font-semibold text-rose-400">{error}</span>
          ) : (
            <span />
          )}

          <Button type="submit" variant="gradient" size="md" isLoading={saving}>
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
