import React from 'react';
import { Target, Trophy, ArrowUpRight } from 'lucide-react';
import { Card } from '../common/Card';
import { useNavigate } from 'react-router-dom';

export const MasteryMatrix: React.FC = () => {
  const navigate = useNavigate();

  const subjects = [
    { name: 'Data Structures & Algorithms', score: 86, color: 'bg-brand-500', barGlow: 'shadow-brand-500/30' },
    { name: 'Distributed Systems & Cloud', score: 68, color: 'bg-indigo-500', barGlow: 'shadow-indigo-500/30' },
    { name: 'Deep Learning & Transformers', score: 92, color: 'bg-emerald-500', barGlow: 'shadow-emerald-500/30' },
    { name: 'Database Engine Internals', score: 58, color: 'bg-amber-500', barGlow: 'shadow-amber-500/30' },
  ];

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white">Subject Mastery Index</h3>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-0.5 transition"
        >
          <span>Syllabus</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3.5">
        {subjects.map((subj) => (
          <div key={subj.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium truncate max-w-[190px]">
                {subj.name}
              </span>
              <span className="font-mono font-bold text-slate-200">{subj.score}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 shadow-md ${subj.color} ${subj.barGlow}`}
                style={{ width: `${subj.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
          <Trophy className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-slate-200">Dean’s Honor Standing</div>
          <div className="text-slate-400">Top 5% across CSE department</div>
        </div>
      </div>
    </Card>
  );
};
