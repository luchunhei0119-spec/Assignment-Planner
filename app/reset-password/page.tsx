'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Handle case where recovery session is already active (page reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('Invalid or expired reset link. Please request a new one.');
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleResetPassword() {
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Both fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password reset successful! Redirecting...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : 'Something went wrong';
      setError(raw);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Enter your new password</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          {ready ? (
            <>
              <div className="space-y-3 mb-5">
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  placeholder="New Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleResetPassword(); }}
                />
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleResetPassword(); }}
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}
              {message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="text-green-700 text-xs">{message}</p>
                </div>
              )}
              <button
                onClick={handleResetPassword}
                disabled={loading || !password.trim() || !confirmPassword.trim()}
                className="w-full py-3.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              {error ? (
                <p className="text-red-600 text-xs">{error}</p>
              ) : (
                <p className="text-gray-400 text-sm">Verifying reset link...</p>
              )}
            </div>
          )}

          <button
            onClick={() => router.push('/login')}
            className="w-full mt-3 py-3.5 rounded-2xl bg-gray-100 text-gray-900 text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
