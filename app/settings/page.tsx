'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'key' | 'code'>('key');
  const [apiKey, setApiKey] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [current, setCurrent] = useState<{ type: string; value: string } | null>(null);

  useEffect(() => {
    const key = localStorage.getItem('user-api-key');
    const code = localStorage.getItem('access-code');
    if (key) setCurrent({ type: 'key', value: key.slice(0, 12) + '...' });
    else if (code) setCurrent({ type: 'code', value: '••••••••' });
  }, []);

  function handleSave() {
    if (mode === 'key' && apiKey.trim()) {
      localStorage.setItem('user-api-key', apiKey.trim());
      localStorage.removeItem('access-code');
      setSaved(true);
      setTimeout(() => router.push('/'), 1000);
    } else if (mode === 'code' && accessCode.trim()) {
      localStorage.setItem('access-code', accessCode.trim());
      localStorage.removeItem('user-api-key');
      setSaved(true);
      setTimeout(() => router.push('/'), 1000);
    }
  }

  function handleClear() {
    localStorage.removeItem('user-api-key');
    localStorage.removeItem('access-code');
    setCurrent(null);
    setApiKey('');
    setAccessCode('');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500 mb-6">Choose how you want to access the AI features.</p>

        {current && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">
                {current.type === 'key' ? 'Using your own API key' : 'Using access code'}
              </p>
              <p className="text-xs text-green-600 mt-0.5">{current.value}</p>
            </div>
            <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setMode('key')}
              className={`flex-1 py-3 text-sm font-medium transition ${mode === 'key' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Own API Key
            </button>
            <button
              onClick={() => setMode('code')}
              className={`flex-1 py-3 text-sm font-medium transition ${mode === 'code' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Access Code
            </button>
          </div>

          <div className="p-5">
            {mode === 'key' ? (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  Enter your own Anthropic API key. Get one at <span className="text-violet-600">console.anthropic.com</span>
                </p>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    placeholder="sk-ant-..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowKey(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKey
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Your key is stored locally in your browser and never sent to our servers.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  Enter the access code provided by the app owner to use their API.
                </p>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    placeholder="Enter access code..."
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowCode(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCode
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Contact the app owner to request an access code.</p>
              </>
            )}

            <button
              onClick={handleSave}
              disabled={saved || (mode === 'key' ? !apiKey.trim() : !accessCode.trim())}
              className="mt-4 w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saved ? 'Saved! Redirecting...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
