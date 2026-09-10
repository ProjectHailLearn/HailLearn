import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, Eye, EyeOff, Flame, BookOpen, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { loginThunk, registerThunk, clearError } from '../store/slices/authSlice';

type Mode = 'login' | 'register';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    university: 'HailLearn University',
    department: 'Computer Science & Engineering',
    semester: 5,
    role: 'student',
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch(clearError());
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      dispatch(loginThunk({ email: form.email, password: form.password }));
    } else {
      dispatch(registerThunk({
        name: form.name,
        email: form.email,
        password: form.password,
        university: form.university,
        department: form.department,
        semester: Number(form.semester),
        role: form.role,
      }));
    }
  };

  const switchMode = (m: Mode) => { setMode(m); dispatch(clearError()); };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 shadow-lg shadow-brand-500/30 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
            HailLearn
          </h1>
          <p className="text-sm text-slate-400 mt-1">University AI Learning OS</p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: BookOpen, label: '4 Courses', color: 'text-brand-400' },
            { icon: Users, label: '18 Mentors', color: 'text-purple-400' },
            { icon: Flame, label: 'Karma System', color: 'text-amber-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[11px] font-medium text-slate-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab Toggle */}
          <div className="flex border-b border-slate-800">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-150 capitalize active:scale-95 ${
                  mode === m
                    ? 'text-white border-b-2 border-brand-500 bg-brand-600/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">University Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@university.edu"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    >
                      <option value="student">Student</option>
                      <option value="mentor">Peer Mentor</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Semester</label>
                    <select
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">University</label>
                  <input
                    name="university"
                    type="text"
                    value={form.university}
                    onChange={handleChange}
                    placeholder="Your University"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                  <input
                    name="department"
                    type="text"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              ref={btnRef}
              type="submit"
              disabled={isLoading}
              onClick={handleButtonClick}
              className="relative w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-brand-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden active:scale-[0.97] active:shadow-none"
              style={{ transform: 'translateZ(0)' }}
            >
              {/* Ripple effects */}
              {ripples.map((r) => (
                <span
                  key={r.id}
                  className="ripple pointer-events-none absolute rounded-full bg-white/30"
                  style={{
                    left: r.x - 40,
                    top: r.y - 40,
                    width: 80,
                    height: 80,
                  }}
                />
              ))}
              {/* Shimmer sweep on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 hover:translate-x-full" />
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
              )}
              <span className="relative">
                {isLoading
                  ? mode === 'login' ? 'Signing in...' : 'Creating account...'
                  : mode === 'login' ? 'Sign In to HailLearn' : 'Create Account'}
              </span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Secured with JWT • Data stored in MongoDB Atlas
        </p>
      </div>
    </div>
  );
};
