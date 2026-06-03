'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [hasCode, setHasCode] = useState(false);

  useEffect(() => {
    const code = localStorage.getItem('access-code');
    if (code) setHasCode(true);
  }, []);

  function handleSave() {
    if (!accessCode.trim()) return;
    setError('');
    localStorage.setItem('access-code', accessCode.trim());
    localStorage.removeItem('user-api-key');
    setSaved(true);
    setTimeout(() => router.push('/'), 800);
  }

  function handleClear() {
    localStorage.removeItem('access-code');
    localStorage.removeItem('user-api-key');
    setHasCode(false);
    setAccessCode('');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enter Access Code</h1>
          <p className="text-sm text-gray-500 mt-1">輸入訪問碼以使用 AI 功能</p>
        </div>

        {hasCode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-green-700 font-medium">✓ Access code saved</p>
            <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="relative mb-4">
            <input
              type={showCode ? 'text' : 'password'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Access code..."
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              autoFocus
            />
            <button type="button" onClick={() => setShowCode(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCode
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>

          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saved || !accessCode.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saved ? '✓ Saved!' : 'Continue →'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Contact the app owner for an access code.
        </p>
      </div>
    </div>
  );
}
