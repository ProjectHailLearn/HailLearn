import React from 'react';
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
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  toggleSidebar,
  setCommandPaletteOpen,
  toggleNotificationDrawer,
} from '../store/slices/uiSlice';
import { setUserRole } from '../store/slices/authSlice';
import { UserRole } from '../types';
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
      badge: '18 Online',
    },
    {
      to: '/knowledge',
      icon: BookOpen,
      label: 'Knowledge Vault',
      badge: 'RAG',
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
  ];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setUserRole(e.target.value as UserRole));
  };

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
                  <span>Gemini RAG Engine</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Vector SLA: <strong className="text-slate-300">99.8%</strong> • Latency: <strong className="text-slate-300">180ms</strong>
              </p>
            </div>
          )}

          {/* User Profile Mini Bar */}
          <div className="p-3 border-t border-slate-800/80 flex items-center gap-3">
            <Avatar src={user.avatar} name={user.name} size="sm" isOnline={true} />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {user.name}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  <span>{user.karmaPoints} Karma</span>
                </div>
              </div>
            )}
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
                <span className="truncate">{user.university}</span>
              </div>
            </div>

            {/* Right Tools & Profile */}
            <div className="flex items-center gap-3">
              {/* Role Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-[11px] text-slate-400 font-medium">Role:</span>
                <select
                  value={user.role}
                  onChange={handleRoleChange}
                  className="bg-transparent text-xs font-semibold text-brand-400 focus:outline-none cursor-pointer"
                >
                  <option value="student" className="bg-slate-900 text-slate-200">
                    Student
                  </option>
                  <option value="mentor" className="bg-slate-900 text-slate-200">
                    Peer Mentor
                  </option>
                  <option value="faculty" className="bg-slate-900 text-slate-200">
                    Faculty
                  </option>
                  <option value="admin" className="bg-slate-900 text-slate-200">
                    Admin
                  </option>
                </select>
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

              {/* User Avatar with Karma pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <Avatar src={user.avatar} name={user.name} size="sm" isOnline={true} />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-100">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.department}</div>
                </div>
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
