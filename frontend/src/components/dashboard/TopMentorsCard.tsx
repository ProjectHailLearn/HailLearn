import React from 'react';
import { Users, Star, Flame, MessageSquare, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { useAppSelector } from '../../store';
import { useNavigate } from 'react-router-dom';

export const TopMentorsCard: React.FC = () => {
  const navigate = useNavigate();
  const mentors = useAppSelector((state) => state.mentors.mentors);

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Active Mentors</h3>
        </div>
        <button
          onClick={() => navigate('/mentorship')}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-0.5 transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {mentors.slice(0, 3).map((mentor) => (
          <div
            key={mentor.id}
            className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={mentor.avatar}
                name={mentor.name}
                size="sm"
                isOnline={mentor.isOnline}
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {mentor.name}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {mentor.rating}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-slate-300">
                    <Flame className="w-3 h-3 text-brand-400" />
                    {mentor.karmaPoints}
                  </span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/mentorship')}
              className="text-[11px] py-1 px-2.5 h-auto flex-shrink-0"
              leftIcon={<MessageSquare className="w-3 h-3" />}
            >
              Ask
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
