import React, { useState } from 'react';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { verifyEmailThunk, cancelVerification, setNotice, clearError } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { apiError } from '../../utils/errors';

// Second signup step: enter the 6-digit code emailed to the user. Success signs them in.
export const VerifyEmailStep: React.FC<{ email: string }> = ({ email }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error, notice } = useAppSelector((s) => s.auth);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) dispatch(verifyEmailThunk({ email, code }));
  };

  const resend = async () => {
    setResending(true);
    dispatch(clearError());
    try {
      await authService.resendVerification(email);
      dispatch(setNotice(`A new code was sent to ${email}.`));
    } catch (err) {
      dispatch(setNotice(apiError(err, 'Could not send a new code')));
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
          <MailCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Verify your email</h2>
          <p className="text-xs text-slate-400 mt-0.5">{notice || `Enter the 6-digit code sent to ${email}.`} It expires in 10 minutes.</p>
        </div>
      </div>

      <input
        value={code}
        onChange={(e) => { dispatch(clearError()); setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="••••••"
        aria-label="Verification code"
        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-3 text-center text-2xl tracking-[0.5em] font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
      />

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">{error}</div>}

      <button
        type="submit"
        disabled={isLoading || code.length !== 6}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verifying…' : 'Verify and sign in'}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={() => dispatch(cancelVerification())} className="flex items-center gap-1 text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button type="button" onClick={resend} disabled={resending} className="text-brand-400 hover:text-brand-300 disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </form>
  );
};
