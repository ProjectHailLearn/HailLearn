import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  PlusCircle,
  Cpu,
  Shield,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  toggleSidebar,
  setCommandPaletteOpen,
  toggleNotificationDrawer,
  setNotifications,
  addNotification,
} from '../store/slices/uiSlice';
import { notificationService, toNotification } from '../services/notificationService';
import { connectSocket, disconnectSocket, isSocketConnected } from '../services/socketService';
import { presenceService } from '../services/presenceService';
import { logout } from '../store/slices/authSlice';
import { systemService } from '../services/adminService';
import { SystemStatus } from '../types';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { CommandPalette } from '../components/common/CommandPalette';
import { NotificationDrawer } from '../components/common/NotificationDrawer';

export const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const isSidebarCollapsed = useAppSelector((state) => state.ui.isSidebarCollapsed);
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const handleLogout = () => {
    if (token) presenceService.goOffline(token).catch(() => {});
    disconnectSocket();
    dispatch(logout());
    navigate('/login');
  };
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Real-time notifications over Socket.IO, with a slow poll as a fallback.
  useEffect(() => {
    if (!token) return;
    const load = () => notificationService.getAll().then((n) => dispatch(setNotifications(n))).catch(() => {});
    load();
    const socket = connectSocket(token);
    const onNotification = (n: Record<string, unknown>) => dispatch(addNotification(toNotification(n)));
    socket.on('notification', onNotification);
    // Without a socket (e.g. on Vercel) poll every 20s; with one, refresh every 2 minutes as a safety net.
    let ticks = 0;
    const id = window.setInterval(() => { ticks += 1; if (!isSocketConnected() || ticks % 6 === 0) load(); }, 20000);
    return () => {
      socket.off('notification', onNotification);
      window.clearInterval(id);
    };
  }, [dispatch, token]);

  // AI provider + live mentor count; presence changes are pushed over the socket.
  const [system, setSystem] = useState<SystemStatus | null>(null);
  useEffect(() => {
    if (!token) return;
    const load = () => systemService.get().then(setSystem).catch(() => {});
    load();
    const socket = connectSocket(token);
    socket.on('mentors:presence', load);
    const id = window.setInterval(() => { if (!isSocketConnected()) load(); }, 30000);
    return () => {
      socket.off('mentors:presence', load);
      window.clearInterval(id);
    };
  }, [token]);

  // Presence heartbeat: keeps this user's mentor profile "online" while the app is open.
  useEffect(() => {
    if (!token) return;
    const beat = () => presenceService.heartbeat().catch(() => {});
    beat();
    const id = window.setInterval(beat, 30000);
    return () => window.clearInterval(id);
  }, [token]);

  const unreadNotifCount = useAppSelector(
    (state) => state.ui.notifications.filter((n) => !n.read).length
  );

  const navItems = [
    {
      to: '/',
      icon: LayoutDashboard,
      label: 'Overview',
      badge: null,
    },
    {
      to: '/doubts',
      icon: Sparkles,
      label: 'AI Doubt Resolver',
      badge: 'Live',
    },
    {
      to: '/mentorship',
      icon: Users,
      label: 'Mentorship Hub',
      badge: system ? `${system.onlineMentors} Online` : null,
    },
    {
      to: '/knowledge',
      icon: BookOpen,
      label: 'Knowledge Vault',
      badge: null,
    },
    {
      to: '/courses',
      icon: GraduationCap,
      label: 'Courses & Syllabus',
      badge: null,
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
      badge: null,
    },
    ...(user?.role === 'admin'
      ? [{ to: '/admin', icon: Shield, label: 'Admin Console', badge: null }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <CommandPalette />
      <NotificationDrawer />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
            <div
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-brand-500/20 flex-shrink-0 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                    HailLearn
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide truncate max-w-[130px]">
                    University AI OS
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition hidden md:flex items-center justify-center"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Action Button */}
          <div className="p-3">
            <Button
              variant="gradient"
              size={isSidebarCollapsed ? 'sm' : 'md'}
              onClick={() => navigate('/doubts')}
              className={`w-full ${isSidebarCollapsed ? 'p-2.5 justify-center' : ''}`}
              leftIcon={<PlusCircle className="w-4 h-4 flex-shrink-0" />}
            >
              {!isSidebarCollapsed && <span>Ask AI Doubt</span>}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-sm shadow-brand-500/5'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'text-brand-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isSidebarCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {!isSidebarCollapsed && item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        item.badge === 'Live'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* AI Cluster Status Widget */}
          {!isSidebarCollapsed && (
            <div className="p-3 mx-3 mb-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span>
                    {system?.aiProvider === 'gemini' ? 'Gemini AI' : system?.aiProvider === 'grok' ? 'Grok AI' : 'AI Engine'}
                  </span>
                </div>
                <span className={`w-2 h-2 rounded-full ${system?.aiConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {system?.aiConfigured
                  ? 'Live AI answers enabled'
                  : 'Template mode — add an AI key to enable live answers'}
              </p>
            </div>
          )}

          {/* User Profile Mini Bar */}
          <div className="p-3 border-t border-slate-800/80 flex items-center gap-3">
            <Avatar src={user?.avatar || ''} name={user?.name || 'User'} size="sm" isOnline={true} />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  <span>{user?.karmaPoints ?? 0} Karma</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <header className="h-16 bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
            {/* Campus / Search */}
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <button
                onClick={() => dispatch(setCommandPaletteOpen(true))}
                className="w-full max-w-md flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs transition group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 transition" />
                  <span className="text-slate-400">Search doubts, mentors, concepts...</span>
                </div>
                <kbd className="bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700">
                  Ctrl K
                </kbd>
              </button>

              <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-800">
                <Shield className="w-3.5 h-3.5 text-brand-400" />
                <span className="truncate">{user?.university}</span>
              </div>
            </div>

            {/* Right Tools & Profile */}
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-slate-400 font-medium">Role:</span>
                <span className="text-xs font-semibold text-brand-400 capitalize">{user?.role}</span>
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => dispatch(toggleNotificationDrawer())}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-slate-900">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* User Avatar with dropdown */}
              <div ref={profileRef} className="relative pl-2 border-l border-slate-800">
                <button
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-800/60 transition"
                >
                  <Avatar src={user?.avatar || ''} name={user?.name || 'User'} size="sm" isOnline={true} />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-100">{user?.name}</div>
                    <div className="text-[10px] text-slate-400">{user?.department}</div>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page View Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
