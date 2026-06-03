'use client';

import { apiFetch, hasAuth } from '@/lib/apiFetch';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function TranslatePage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [targetLang, setTargetLang] = useState<'zh' | 'en'>('zh');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesUpload(files: FileList | File[]) {
    setUploading(true);
    setError('');
    try {
      const results = await Promise.all(Array.from(files).map(async file => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiFetch('/api/parse-file', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(`${file.name}: ${data.error || 'Failed'}`);
        return data.text as string;
      }));
      setText(results.join('\n\n---\n\n'));
      setTranslated('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file');
    } finally {
      setUploading(false);
    }
  }

  async function handleTranslate() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setTranslated('');
    try {
      const res = await apiFetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTranslated(data.translated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleSwap() {
    setTargetLang(prev => prev === 'zh' ? 'en' : 'zh');
    setText(translated);
    setTranslated(text);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Translate</h1>
        <p className="text-gray-500 mb-6">Translate between English and Traditional Chinese.</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg py-2">
            {targetLang === 'zh' ? 'English' : '繁體中文'}
          </div>
          <button
            onClick={handleSwap}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:border-violet-400 hover:text-violet-600 transition flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </button>
          <div className="flex-1 text-center text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg py-2">
            {targetLang === 'zh' ? '繁體中文' : 'English'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Input</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {uploading ? 'Reading...' : 'Upload files'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                className="hidden"
                onChange={e => { if (e.target.files?.length) handleFilesUpload(e.target.files); e.target.value = ''; }}
              />
            </div>
            <textarea
              className="w-full h-64 text-sm text-gray-700 resize-none focus:outline-none"
              placeholder="Enter text to translate..."
              value={text}
              onChange={e => { setText(e.target.value); setTranslated(''); }}
            />
            {text && (
              <p className="text-xs text-gray-400 mt-1 text-right">{text.length} chars</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Translation</span>
              {translated && (
                <button
                  onClick={() => navigator.clipboard.writeText(translated)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy
                </button>
              )}
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-violet-500">Translating...</p>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap h-64 overflow-y-auto leading-relaxed">
                {translated || <span className="text-gray-300">Translation will appear here...</span>}
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleTranslate}
          disabled={loading || uploading || !text.trim()}
          className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Translating...' : `Translate to ${targetLang === 'zh' ? '繁體中文' : 'English'}`}
        </button>
      </div>
    </div>
  );
}
