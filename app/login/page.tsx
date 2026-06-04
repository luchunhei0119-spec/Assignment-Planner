'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ErrorType = 'email_not_confirmed' | 'invalid_credentials' | 'generic' | null;

function friendlyError(msg: string): { type: ErrorType; text: string } {
  const m = msg.toLowerCase();
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
    return { type: 'email_not_confirmed', text: 'Email not confirmed. Please check your inbox and click the confirmation link.' };
  }
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) {
    return { type: 'invalid_credentials', text: 'Wrong email or password. Please try again.' };
  }
  if (m.includes('password') && m.includes('6')) {
    return { type: 'generic', text: 'Password must be at least 6 characters.' };
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return { type: 'generic', text: 'This email is already registered. Try logging in instead.' };
  }
  return { type: 'generic', text: msg };
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  function clearMessages() {
    setError('');
    setErrorType(null);
    setMessage('');
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    clearMessages();
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          // email confirmation disabled — logged in immediately
          router.push('/');
          router.refresh();
        } else {
          setMessage('Check your email to confirm your account, then log in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : 'Something went wrong';
      const { type, text } = friendlyError(raw);
      setErrorType(type);
      setError(text);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email.trim()) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setMessage('Confirmation email resent! Check your inbox.');
      setError('');
      setErrorType(null);
    } catch (e: unknown) {
      setMessage('');
      setError(e instanceof Error ? e.message : 'Failed to resend email.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StudyAI</h1>
          <p className="text-gray-400 mt-1.5 text-sm">AI-powered study assistant</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          {/* Tab */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            <button onClick={() => { setMode('login'); clearMessages(); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              Log In
            </button>
            <button onClick={() => { setMode('signup'); clearMessages(); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              Sign Up
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <input
              type="email"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
            <input
              type="password"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-red-600 text-xs">{error}</p>
              {errorType === 'email_not_confirmed' && (
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendLoading || !email.trim()}
                  className="mt-2 text-xs text-violet-600 font-medium underline underline-offset-2 disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend confirmation email'}
                </button>
              )}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-2xl">
              <p className="text-green-700 text-xs">{message}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Log In →' : 'Create Account →'}
          </button>
        </div>

        {mode === 'signup' && (
          <p className="text-center text-xs text-gray-400 mt-4">
            A confirmation email will be sent to verify your account.
          </p>
        )}
      </div>
    </div>
  );
}
