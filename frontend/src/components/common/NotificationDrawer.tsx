import React from 'react';
import { Bell, CheckCheck, Sparkles, Users, BookOpen, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  toggleNotificationDrawer,
  markAllNotificationsRead,
} from '../../store/slices/uiSlice';
import { Button } from './Button';

export const NotificationDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isNotificationDrawerOpen);
  const notifications = useAppSelector((state) => state.ui.notifications);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ai':
        return <Sparkles className="w-4 h-4 text-brand-400" />;
      case 'mentor':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-white">Notifications</h2>
            <span className="bg-brand-500/20 text-brand-400 text-xs px-2 py-0.5 rounded-full font-medium">
              {notifications.filter((n) => !n.read).length} new
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(markAllNotificationsRead())}
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-white"
            >
              Mark all read
            </Button>
            <button
              onClick={() => dispatch(toggleNotificationDrawer())}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border transition ${
                notif.read
                  ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                  : 'bg-slate-800/60 border-brand-500/30 text-slate-200 shadow-md shadow-brand-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-semibold text-slate-100 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-center text-xs text-slate-500">
          Real-time university mentorship updates via Socket.IO
        </div>
      </div>
    </div>
  );
};
