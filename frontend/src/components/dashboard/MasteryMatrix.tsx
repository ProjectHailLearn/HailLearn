import React, { useEffect, useState } from 'react';
import { Target, Trophy, ArrowUpRight } from 'lucide-react';
import { Card } from '../common/Card';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { Course, DashboardStats } from '../../types';

const BAR_COLORS = ['bg-brand-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];

export const MasteryMatrix: React.FC<{ stats: DashboardStats | null }> = ({ stats }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseService.getAll().then(setCourses).catch(console.error);
  }, [stats?.myDoubts]);

  // Show enrolled courses; fall back to every course until the user enrolls.
  const enrolled = courses.filter((c) => c.isEnrolled);
  const subjects = (enrolled.length ? enrolled : courses).map((c, i) => ({
    name: `${c.code} · ${c.subject}`,
    score: c.progress,
    detail: `${c.myResolved}/${c.myDoubts}`,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));
  const percentile = stats && stats.totalUsers
    ? Math.max(1, Math.round((stats.karmaRank / stats.totalUsers) * 100))
    : null;

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white">Course Progress</h3>
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
              <span className="font-mono font-bold text-slate-200" title="Your doubts resolved">{subj.detail}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 shadow-md ${subj.color}`}
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
          <div className="font-semibold text-slate-200">
            Karma Rank {stats ? `#${stats.karmaRank} of ${stats.totalUsers}` : '—'}
          </div>
          <div className="text-slate-400">
            {percentile !== null ? `Top ${percentile}% on campus · ${stats?.karmaPoints} pts` : 'Loading…'}
          </div>
        </div>
      </div>
    </Card>
  );
};
