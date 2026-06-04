'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasCode, setHasCode] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const code = localStorage.getItem('access-code');
    const key = localStorage.getItem('user-api-key');
    if (code || key) { setHasCode(true); setIsLogin(false); }
  }, []);

  function handleSave() {
    if (!accessCode.trim()) return;
    localStorage.setItem('access-code', accessCode.trim());
    localStorage.removeItem('user-api-key');
    setSaved(true);
    setTimeout(() => router.push('/'), 700);
  }

  function handleClear() {
    localStorage.removeItem('access-code');
    localStorage.removeItem('user-api-key');
    setHasCode(false);
    setAccessCode('');
    setIsLogin(true);
  }

  // Settings management view (already logged in)
  if (hasCode && !isLogin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-8 flex items-center gap-1.5 transition">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-400 mb-8">Manage your access</p>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Access granted</p>
                <p className="text-xs text-gray-400">You are signed in with an access code</p>
              </div>
            </div>
            <button onClick={handleClear} className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition">
              Sign out
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Change access code</p>
            <div className="relative mb-3">
              <input
                type={showCode ? 'text' : 'password'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="New access code..."
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
              />
              <button type="button" onClick={() => setShowCode(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCode ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
            <button onClick={handleSave} disabled={saved || !accessCode.trim()} className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {saved ? '✓ Saved!' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login view
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StudyAI</h1>
          <p className="text-gray-400 mt-1.5 text-sm">AI-powered study assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Welcome</h2>
          <p className="text-sm text-gray-400 mb-6">Enter your access code to continue</p>

          <div className="relative mb-4">
            <input
              type={showCode ? 'text' : 'password'}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-gray-50"
              placeholder="Access code"
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              autoFocus
            />
            <button type="button" onClick={() => setShowCode(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              {showCode
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saved || !accessCode.trim()}
            className="w-full py-3.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saved ? '✓ Welcome!' : 'Get Started →'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Contact the app owner for an access code
        </p>
      </div>
    </div>
  );
}
