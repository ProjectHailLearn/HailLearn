import React from 'react';
import { Sparkles, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { Card } from '../common/Card';

export const MetricsGrid: React.FC = () => {
  const metrics = [
    {
      id: 'resolved',
      label: 'Doubts Resolved',
      value: '1,482',
      subtext: '+14.6% vs last week',
      trend: 'up',
      icon: Sparkles,
      color: 'text-brand-400',
      bgGlow: 'from-brand-500/10 to-transparent',
      borderColor: 'border-brand-500/20',
    },
    {
      id: 'ai-rate',
      label: 'AI Auto-Resolution Rate',
      value: '78.4%',
      subtext: '98.2% accuracy confidence',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/20',
    },
    {
      id: 'mentor-latency',
      label: 'Avg Mentor Response',
      value: '4.2 mins',
      subtext: '18 faculty & peer active',
      trend: 'down',
      icon: Clock,
      color: 'text-purple-400',
      bgGlow: 'from-purple-500/10 to-transparent',
      borderColor: 'border-purple-500/20',
    },
    {
      id: 'knowledge-retention',
      label: 'Institutional Knowledge Reuse',
      value: '96.8%',
      subtext: '1,240 queries matched in RAG',
      trend: 'up',
      icon: BookOpen,
      color: 'text-amber-400',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.id}
            variant="glass"
            className={`p-5 overflow-hidden border ${metric.borderColor} relative group hover:border-slate-700 transition-all duration-300`}
          >
            <div
              className={`absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br ${metric.bgGlow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
            />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 tracking-wide">
                {metric.label}
              </span>
              <div
                className={`p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 ${metric.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black tracking-tight text-white">
                {metric.value}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">{metric.subtext}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
