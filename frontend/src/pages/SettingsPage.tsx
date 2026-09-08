import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAppSelector } from '../store';

export const SettingsPage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [model, setModel] = useState('gemini-1.5-pro');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

        {/* Institutional Settings */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">University Identity & Privacy</h3>
              <p className="text-xs text-slate-400">
                Institutional SSO and departmental access configurations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">University</label>
              <input
                type="text"
                disabled
                value={user.university}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Department</label>
              <input
                type="text"
                disabled
                value={user.department}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400 font-mono"
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
          ) : (
            <span />
          )}

          <Button type="submit" variant="gradient" size="md">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
