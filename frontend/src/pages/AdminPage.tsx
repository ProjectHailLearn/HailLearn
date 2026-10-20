import React, { useEffect, useState } from 'react';
import { Shield, Search, Link2, Plus, Trash2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { adminService } from '../services/adminService';
import { courseService } from '../services/courseService';
import { AdminUser, AdminMentorProfile, Course, UserRole } from '../types';
import { useAppSelector } from '../store';
import { apiError } from '../utils/errors';

const ROLES: UserRole[] = ['student', 'mentor', 'faculty', 'admin'];
const inputCls =
  'w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500';

export const AdminPage: React.FC = () => {
  const me = useAppSelector((s) => s.auth.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [profiles, setProfiles] = useState<AdminMentorProfile[]>([]);
  const [linkChoice, setLinkChoice] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState({ code: '', title: '', subject: '', instructor: '', credits: '3', category: '', nextLecture: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const staffUsers = users.filter((u) => u.role === 'mentor' || u.role === 'faculty');

  const loadUsers = () =>
    adminService.listUsers({ search: search || undefined, role: roleFilter || undefined }).then(setUsers).catch((e) => setError(apiError(e, 'Failed to load users')));
  const loadProfiles = () => adminService.listMentorProfiles().then(setProfiles).catch((e) => setError(apiError(e, 'Failed to load mentor profiles')));
  const loadCourses = () => courseService.getAll().then(setCourses).catch((e) => setError(apiError(e, 'Failed to load courses')));

  useEffect(() => {
    const t = setTimeout(loadUsers, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  useEffect(() => {
    loadProfiles();
    loadCourses();
  }, []);

  const run = async (action: () => Promise<void>, success: string, after: () => unknown) => {
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await after();
    } catch (e) {
      setError(apiError(e, 'Action failed'));
    }
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () => adminService.createCourse({
        ...newCourse,
        credits: Number(newCourse.credits) || 3,
        category: newCourse.category || undefined,
        nextLecture: newCourse.nextLecture || undefined,
      }),
      `Course ${newCourse.code.toUpperCase()} created`,
      () => {
        setNewCourse({ code: '', title: '', subject: '', instructor: '', credits: '3', category: '', nextLecture: '' });
        return loadCourses();
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-rose-400" />
          Admin Console
        </h1>
        <p className="text-xs text-slate-400">Manage roles, mentor profiles and the course catalog</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>}
      {notice && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">{notice}</div>}

      {/* Users */}
      <Card variant="glass" className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white">Users ({users.length})</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, department" className={`${inputCls} pl-8 w-56`} />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`${inputCls} w-28`}>
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
          {users.map((u) => (
            <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={u.avatar} name={u.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{u.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{u.email} · {u.department} · {u.karmaPoints} karma</div>
                </div>
              </div>
              <select
                value={u.role}
                disabled={u.id === me?.id}
                onChange={(e) => run(() => adminService.updateRole(u.id, e.target.value as UserRole), `${u.name} is now ${e.target.value}`, () => Promise.all([loadUsers(), loadProfiles()]))}
                className={`${inputCls} w-28 disabled:opacity-50`}
                title={u.id === me?.id ? "You can't change your own role" : 'Change role'}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
          {users.length === 0 && <div className="py-4 text-xs text-slate-500 text-center">No users match.</div>}
        </div>
      </Card>

      {/* Mentor profiles */}
      <Card variant="glass" className="p-5 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-white">Mentor Profiles</h2>
          <p className="text-[11px] text-slate-400">Link seeded profiles to real mentor/faculty accounts so students can request them.</p>
        </div>
        <div className="divide-y divide-slate-800">
          {profiles.map((p) => (
            <div key={p.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white">{p.name}</div>
                <div className="text-[11px] text-slate-400">
                  {p.department} · {p.linkedEmail ? <span className="text-emerald-400">linked to {p.linkedEmail}</span> : <span className="text-amber-400">not linked</span>}
                </div>
              </div>
              {!p.userId && (
                <div className="flex gap-2">
                  <select
                    value={linkChoice[p.id] || ''}
                    onChange={(e) => setLinkChoice({ ...linkChoice, [p.id]: e.target.value })}
                    className={`${inputCls} w-56`}
                  >
                    <option value="">Choose mentor/faculty account…</option>
                    {staffUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                    disabled={!linkChoice[p.id]}
                    leftIcon={<Link2 className="w-3.5 h-3.5" />}
                    onClick={() => run(() => adminService.linkMentor(p.id, linkChoice[p.id]), `${p.name} linked`, loadProfiles)}
                  >
                    Link
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {staffUsers.length === 0 && (
          <p className="text-[11px] text-slate-500">Tip: clear the role filter above to list mentor/faculty accounts for linking.</p>
        )}
      </Card>

      {/* Courses */}
      <Card variant="glass" className="p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Course Catalog</h2>
        <div className="divide-y divide-slate-800">
          {courses.map((c) => (
            <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-mono font-bold text-brand-400">{c.code}</span>{' '}
                <span className="text-white">{c.title}</span>
                <span className="text-slate-400"> · {c.instructor} · {c.enrolledStudents} enrolled</span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${c.code}? Existing doubts keep their course code.`)) {
                    run(() => adminService.deleteCourse(c.id), `${c.code} deleted`, loadCourses);
                  }
                }}
                className="text-slate-500 hover:text-rose-400 transition"
                title="Delete course"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleCreateCourse} className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <input className={inputCls} placeholder="Code (e.g. CS310)" value={newCourse.code} onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })} required />
          <input className={inputCls} placeholder="Title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} required />
          <input className={inputCls} placeholder="Subject (used for doubts)" value={newCourse.subject} onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })} required />
          <input className={inputCls} placeholder="Instructor" value={newCourse.instructor} onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })} required />
          <input className={inputCls} placeholder="Credits" type="number" min={1} max={10} value={newCourse.credits} onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })} />
          <input className={inputCls} placeholder="Category" value={newCourse.category} onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })} />
          <input className={inputCls} placeholder="Next lecture" value={newCourse.nextLecture} onChange={(e) => setNewCourse({ ...newCourse, nextLecture: e.target.value })} />
          <Button type="submit" size="sm" variant="gradient" className="text-xs" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Course
          </Button>
        </form>
      </Card>
    </div>
  );
};
