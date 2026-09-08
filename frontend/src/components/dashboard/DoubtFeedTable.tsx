import React from 'react';
import { Sparkles, ThumbsUp, ArrowUpRight, MessageSquare } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setFilterStatus,
  upvoteDoubt,
  setActiveDoubt,
} from '../../store/slices/doubtSlice';
import { DoubtStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

export const DoubtFeedTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const doubts = useAppSelector((state) => state.doubts.doubts);
  const filterStatus = useAppSelector((state) => state.doubts.filterStatus);

  const filterTabs: { id: 'ALL' | DoubtStatus; label: string }[] = [
    { id: 'ALL', label: 'All Queries' },
    { id: 'AI_RESOLVED', label: 'AI Resolved' },
    { id: 'MENTOR_ESCALATED', label: 'In Mentorship' },
    { id: 'FACULTY_VERIFIED', label: 'Faculty Verified' },
  ];

  const filteredDoubts =
    filterStatus === 'ALL'
      ? doubts
      : doubts.filter((d) => d.status === filterStatus);

  const handleOpenDoubt = (id: string) => {
    dispatch(setActiveDoubt(id));
    navigate('/doubts');
  };

  return (
    <Card variant="glass" className="p-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Live Campus Doubt Stream</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h3>
          <p className="text-xs text-slate-400">
            Real-time doubt resolution stream across department courses
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setFilterStatus(tab.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Doubt Stream List */}
      <div className="space-y-3">
        {filteredDoubts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No doubts match the selected filter.
          </div>
        ) : (
          filteredDoubts.map((doubt) => (
            <div
              key={doubt.id}
              className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30 transition duration-200 group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Author & Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar
                    src={doubt.author.avatar}
                    name={doubt.author.name}
                    size="md"
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-300">
                        {doubt.author.name}
                      </span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[11px] font-mono font-medium text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                        {doubt.courseCode}
                      </span>
                      <span className="text-xs text-slate-500">{doubt.createdAt}</span>
                    </div>

                    <h4
                      onClick={() => handleOpenDoubt(doubt.id)}
                      className="text-sm font-semibold text-slate-100 hover:text-brand-300 cursor-pointer transition line-clamp-1 flex items-center gap-1.5 group-hover:text-brand-400"
                    >
                      <span>{doubt.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {doubt.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {doubt.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Status & Meta Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge status={doubt.status} dot>
                      {doubt.status.replace('_', ' ')}
                    </Badge>
                    {doubt.aiConfidenceScore && (
                      <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {doubt.aiConfidenceScore}% AI Match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                    <button
                      onClick={() => dispatch(upvoteDoubt(doubt.id))}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                      title="Upvote solution"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{doubt.upvotes}</span>
                    </button>

                    <button
                      onClick={() => handleOpenDoubt(doubt.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="View thread details"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
