'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAnalyses, deleteAnalysis, type AnalysisRecord } from '@/lib/history';

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-HK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function HistoryPage() {
  const router = useRouter();
  const [all, setAll] = useState<AnalysisRecord[]>([]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { setAll(getAnalyses()); }, []);

  const results = query.trim()
    ? all.filter(a => {
        const q = query.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.keyPoints.some(k => k.en.toLowerCase().includes(q) || k.zh.includes(q) || k.detail.toLowerCase().includes(q)) ||
          (a.text ?? '').toLowerCase().includes(q)
        );
      })
    : all;

  function toggle(id: string) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function handleDelete(id: string) {
    deleteAnalysis(id);
    setAll(getAnalyses());
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          ← Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
            <p className="text-sm text-gray-400 mt-0.5">{all.length} records saved</p>
          </div>
          <button onClick={() => router.push('/analyze')}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
            + New
          </button>
        </div>

        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            placeholder="Search titles, summaries, key points..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {query && (
          <p className="text-xs text-gray-400 mb-3">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
        )}

        {all.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 font-medium mb-1">No history yet</p>
            <p className="text-sm text-gray-400 mb-5">Analyzed documents will appear here.</p>
            <button onClick={() => router.push('/analyze')} className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
              Analyze a Document
            </button>
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No results found for "{query}"</p>
        ) : (
          <div className="space-y-3">
            {results.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 leading-snug">
                        {highlight(a.title, query)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.date)} · {a.keyPoints.length} key points</p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {highlight(a.summary, query)}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 ml-2">
                      <button onClick={() => router.push(`/analyze?id=${a.id}`)}
                        className="text-xs px-2 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition">
                        Open
                      </button>
                      {a.keyPoints.length > 0 && (
                        <button onClick={() => router.push(`/flashcards?id=${a.id}`)}
                          className="text-xs px-2 py-1 bg-violet-100 text-violet-600 rounded-md hover:bg-violet-200 transition">
                          Flashcards
                        </button>
                      )}
                      <button onClick={() => toggle(a.id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition">
                        {expanded.has(a.id) ? 'Less' : 'More'}
                      </button>
                    </div>
                  </div>
                </div>

                {expanded.has(a.id) && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                    {a.keyPoints.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Key Points</p>
                        <ul className="space-y-1.5">
                          {a.keyPoints.map((k, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                              <div>
                                <span className="text-gray-800">{highlight(k.en, query)}</span>
                                <span className="text-violet-500 text-xs ml-2">{highlight(k.zh, query)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {query && a.text && a.text.toLowerCase().includes(query.toLowerCase()) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Found in document text</p>
                        {(() => {
                          const idx = a.text.toLowerCase().indexOf(query.toLowerCase());
                          const start = Math.max(0, idx - 80);
                          const end = Math.min(a.text.length, idx + query.length + 80);
                          const snippet = (start > 0 ? '...' : '') + a.text.slice(start, end) + (end < a.text.length ? '...' : '');
                          return <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{highlight(snippet, query)}</p>;
                        })()}
                      </div>
                    )}

                    <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-600 transition">
                      Delete record
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
