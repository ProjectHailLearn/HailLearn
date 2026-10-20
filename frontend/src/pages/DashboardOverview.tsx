import React, { useEffect, useState } from 'react';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { QuickAskCard } from '../components/dashboard/QuickAskCard';
import { DoubtFeedTable } from '../components/dashboard/DoubtFeedTable';
import { MasteryMatrix } from '../components/dashboard/MasteryMatrix';
import { TopMentorsCard } from '../components/dashboard/TopMentorsCard';
import { StudyRoomsCard } from '../components/dashboard/StudyRoomsCard';
import { useAppDispatch, useAppSelector } from '../store';
import { setDoubts } from '../store/slices/doubtSlice';
import { setMentors } from '../store/slices/mentorSlice';
import { updateProfile } from '../store/slices/authSlice';
import { doubtService } from '../services/doubtService';
import { mentorService } from '../services/mentorService';
import { statsService } from '../services/statsService';
import { authService } from '../services/authService';
import { DashboardStats } from '../types';

export const DashboardOverview: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const doubtCount = useAppSelector((state) => state.doubts.doubts.length);
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    doubtService.getAll().then((d) => dispatch(setDoubts(d))).catch(console.error);
    mentorService.getAll().then((m) => dispatch(setMentors(m))).catch(console.error);
    authService.getMe().then((u) => dispatch(updateProfile(u))).catch(console.error);
  }, [dispatch]);

  // Refresh stats whenever a doubt is added from Quick Ask.
  useEffect(() => {
    statsService.get().then(setStats).catch(console.error);
  }, [doubtCount]);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900/30 via-slate-900/60 to-purple-900/30 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            HailLearn has <strong className="text-brand-300">{stats?.totalDoubts ?? '—'} doubts</strong> and <strong className="text-purple-300">{stats?.onlineMentors ?? '—'} mentors online</strong> for the {user.department}. You've asked <strong className="text-brand-300">{stats?.myDoubts ?? 0}</strong> so far.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Semester</div>
            <div className="text-sm font-black text-white">Sem {user.semester || 5}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Karma Score</div>
            <div className="text-sm font-black text-amber-400">{stats?.karmaPoints ?? user.karmaPoints} pts</div>
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Metrics */}
      <MetricsGrid stats={stats} />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Quick Ask & Live Doubt Feed */}
        <div className="lg:col-span-2 space-y-6">
          <QuickAskCard />
          <DoubtFeedTable />
        </div>

        {/* Right 1 Column: Mastery Index, Mentors, Study Rooms */}
        <div className="space-y-6">
          <MasteryMatrix stats={stats} />
          <TopMentorsCard />
          <StudyRoomsCard />
        </div>
      </div>
    </div>
  );
};
