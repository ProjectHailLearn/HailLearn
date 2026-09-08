import React from 'react';
import { Video, Calendar, Users, Radio } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export const StudyRoomsCard: React.FC = () => {
  const rooms = [
    {
      id: 'room-1',
      title: 'CS305: Raft Consensus Proof Walkthrough',
      host: 'Dr. Sarah Jenkins',
      attendees: 14,
      status: 'LIVE',
      time: 'Happening Now',
    },
    {
      id: 'room-2',
      title: 'CS201: Dynamic Programming Problem Jam',
      host: 'Devon Vance (TA)',
      attendees: 28,
      status: 'UPCOMING',
      time: 'Today, 05:00 PM',
    },
  ];

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Live Peer Study Rooms</h3>
        </div>
      </div>

      <div className="space-y-3">
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
                  {room.time}
                </span>
              )}

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {room.attendees} studying
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-200 line-clamp-1">
              {room.title}
            </div>
            <div className="text-[11px] text-slate-400">Host: {room.host}</div>

            <Button
              size="sm"
              variant={room.status === 'LIVE' ? 'gradient' : 'secondary'}
              className="w-full text-xs py-1.5 h-auto"
            >
              {room.status === 'LIVE' ? 'Join Study Canvas' : 'Add to Schedule'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
