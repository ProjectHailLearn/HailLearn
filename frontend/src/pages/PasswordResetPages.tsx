import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, KeyRound, MailCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { apiError } from '../utils/errors';

const inputCls =
  'w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition';
const buttonCls =
  'w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold transition disabled:opacity-60';

const AuthShell: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 mb-3">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">{children}</div>
      <p className="text-center text-xs text-slate-500 mt-5">
        <Link to="/login" className="text-brand-400 hover:text-brand-300">Back to sign in</Link>
      </p>
    </div>
  </div>
);

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setMessage(await authService.forgotPassword(email));
    } catch (err) {
      setError(apiError(err, 'Something went wrong. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a link to reset it">
      {message ? (
        <div className="flex items-start gap-3 text-sm text-emerald-300">
          <MailCheck className="w-5 h-5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" className={inputCls} />
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className={buttonCls}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError(null);
    try {
      const creds = await authService.resetPassword(token, password);
      dispatch(setCredentials(creds));
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="You'll be signed in afterwards">
      {!token ? (
        <div className="text-sm text-red-400">This reset link is missing its token. Request a new one.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm password</label>
            <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className={`${buttonCls} flex items-center justify-center gap-2`}>
            <KeyRound className="w-4 h-4" />
            {loading ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};
