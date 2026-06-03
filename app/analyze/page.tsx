'use client';

import { apiFetch, hasAuth } from '@/lib/apiFetch';
import { saveAnalysis, getAnalysis } from '@/lib/history';
import { useLang } from '@/lib/LangContext';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface KeyPoint {
  en: string;
  zh: string;
  detail: string;
  detailZh: string;
}

interface AnalysisResult {
  summary: string;
  keyPoints: KeyPoint[];
  highlights: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  en?: string;
  zh?: string;
}

function highlightText(text: string, highlights: string[]): React.ReactNode[] {
  if (!highlights.length) return [<span key={0}>{text}</span>];
  const escaped = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const isHighlight = highlights.some(h => h.toLowerCase() === part.toLowerCase());
    return isHighlight
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
      : <span key={i}>{part}</span>;
  });
}

function KeyPointItem({ point, index, onAsk }: { point: KeyPoint; index: number; onAsk: (q: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLang();
  return (
    <li className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 transition"
      >
        <span className="mt-0.5 w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{point.en}</p>
          <p className="text-sm text-violet-600 mt-0.5">{point.zh}</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50 space-y-2">
          <p className="text-sm text-gray-600 leading-relaxed">{point.detail}</p>
          <p className="text-sm text-violet-700 leading-relaxed">{point.detailZh}</p>
          {point.source && (
            <blockquote className="border-l-2 border-gray-300 pl-3 text-xs text-gray-400 italic leading-relaxed">
              "{point.source}"
            </blockquote>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onAsk(`Give me an example for key point ${index + 1}: "${point.en}"`)}
              className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition"
            >
              {t('giveExample')}
            </button>
            <button
              onClick={() => onAsk(`Explain key point ${index + 1} in more depth: "${point.en}"`)}
              className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition"
            >
              {t('explainMore')}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function AnalyzeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [keyPointCount, setKeyPointCount] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const [loadingStep, setLoadingStep] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [quickSummary, setQuickSummary] = useState<{ en: string; zh: string } | null>(null);
  const [loadingQuickSummary, setLoadingQuickSummary] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load from history if ?id= param is present
  useEffect(() => {
    const id = params.get('id');
    if (!id) return;
    const record = getAnalysis(id);
    if (record) {
      setResult({ summary: record.summary, keyPoints: record.keyPoints, highlights: record.highlights });
      if (record.text) setText(record.text);
      setSavedId(id);
    }
  }, []);

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
        return { name: file.name, text: data.text as string };
      }));
      setText(results.map(r => r.text).join('\n\n---\n\n'));
      setFileNames(results.map(r => r.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file');
    } finally {
      setUploading(false);
    }
  }

  async function handleQuickSummary() {
    if (!text.trim()) return;
    setLoadingQuickSummary(true);
    setQuickSummary(null);
    setError('');
    try {
      const res = await apiFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, part: 'summary' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setQuickSummary({ en: data.summary, zh: data.summaryZh });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoadingQuickSummary(false);
    }
  }

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setChatMessages([]);
    try {
      // Step 1: get summary first (fast ~2s)
      setLoadingStep('正在生成摘要...');
      const r1 = await apiFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, part: 'summary' }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error || 'Failed');
      setResult({ summary: d1.summary, keyPoints: [], highlights: [] });
      setLoading(false);

      // Step 2: get key points + highlights (slower, runs in background)
      setLoadingStep('正在提取重點...');
      const r2 = await apiFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, keyPointCount, part: 'keypoints' }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error || 'Failed');
      const keyPoints = d2.keyPoints ?? [];
      const highlights = d2.highlights ?? [];
      setResult(prev => prev ? { ...prev, keyPoints, highlights } : null);
      // Save to history
      const title = text.trim().split('\n')[0].slice(0, 60) || 'Untitled';
      const record = saveAnalysis({ title, summary: d1.summary, keyPoints, highlights, text: text.slice(0, 30000) });
      setSavedId(record.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    } finally {
      setLoadingStep('');
    }
  }

  async function handleChat(question?: string) {
    const q = question || chatInput.trim();
    if (!q || !text) return;
    setChatInput('');
    const userMsg: ChatMessage = { role: 'user', content: q };
    const assistantIdx = chatMessages.length + 1;
    setChatMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', en: '', zh: '' }]);
    setChatLoading(true);
    try {
      const history = [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docText: text, messages: history }),
      });
      if (!res.ok) throw new Error('Failed');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const [en, zh] = raw.split(/\n---\n/);
        setChatMessages(prev => prev.map((m, i) =>
          i === assistantIdx ? { ...m, en: en?.trim() ?? '', zh: zh?.trim() ?? '' } : m
        ));
      }
    } catch {
      setChatMessages(prev => prev.map((m, i) =>
        i === assistantIdx ? { ...m, en: 'Sorry, something went wrong.', zh: '抱歉，發生錯誤。' } : m
      ));
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          {t('backToDashboard')}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('analyzeTitle')}</h1>
        <p className="text-gray-500 mb-6">{t('analyzeDesc')}</p>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleFilesUpload(e.dataTransfer.files); }}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-5 mb-3 text-center hover:border-violet-400 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" multiple className="hidden"
              onChange={e => { if (e.target.files?.length) handleFilesUpload(e.target.files); e.target.value = ''; }} />
            {uploading ? (
              <p className="text-sm text-violet-500 font-medium">{t('readingFiles')}</p>
            ) : fileNames.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-1.5 justify-center mb-1">
                  {fileNames.map(n => <span key={n} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{n}</span>)}
                </div>
                <p className="text-xs text-gray-400 mt-1">{t('clickAddMore')}</p>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <p className="text-sm text-gray-500">{t('uploadFiles')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('dragDrop')}</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{t('orPasteText')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <textarea
            className="w-full h-40 text-sm text-gray-700 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder={t('pasteDocHere')}
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <div className="flex items-center gap-3 mt-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">{t('keyPointsSlider')}</label>
            <input
              type="range"
              min={5}
              max={20}
              value={keyPointCount}
              onChange={e => setKeyPointCount(Number(e.target.value))}
              className="flex-1 accent-violet-600"
            />
            <span className="text-sm font-medium text-violet-600 w-6 text-center">{keyPointCount}</span>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleQuickSummary}
              disabled={loadingQuickSummary || uploading || !text.trim()}
              className="py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:border-violet-400 hover:text-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
            >
              {loadingQuickSummary ? (t('analyzing')) : `⚡ ${t('summary')}`}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading || uploading || !text.trim()}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (loadingStep || t('analyzing')) : t('analyzeBtn')}
            </button>
          </div>
        </div>

        {quickSummary && !result && (
          <div className="bg-white rounded-xl border-2 border-violet-200 p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-violet-600">⚡</span>
              <h2 className="font-semibold text-gray-800">⚡ {t('summary')}</h2>
              <button
                onClick={() => setQuickSummary(null)}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600"
              >✕</button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{quickSummary.en}</p>
            {quickSummary.zh && (
              <p className="text-sm text-violet-600 leading-relaxed mt-2 pt-2 border-t border-violet-100">{quickSummary.zh}</p>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              {t('analyzeBtn')} →
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-2">{t('summary')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">{t('keyPointsTitle')} {result.keyPoints.length > 0 && `(${result.keyPoints.length})`}</h2>
                <div className="flex items-center gap-2">
                  {result.keyPoints.length > 0 && savedId && (
                    <button onClick={() => router.push(`/flashcards?id=${savedId}`)}
                      className="text-xs px-2.5 py-1 rounded-md bg-violet-100 text-violet-600 hover:bg-violet-200 transition flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      {t('flashcards')}
                    </button>
                  )}
                  {result.keyPoints.length > 0 && <span className="text-xs text-gray-400">{t('tapToExpand')}</span>}
                </div>
              </div>
              {result.keyPoints.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-sm text-violet-500">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {loadingStep || t('extractingKP')}
                </div>
              ) : (
                <ul className="space-y-2">
                  {result.keyPoints.map((point, i) => (
                    <KeyPointItem key={i} point={point} index={i} onAsk={q => { handleChat(q); document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' }); }} />
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">{t('fullText')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {highlightText(text, result.highlights)}
              </p>
            </div>

            <div id="chat-section" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">{t('askTitle')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t('askSubtitle')}</p>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {chatMessages.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-3">{t('askPrompt')}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[t('sugQ1'), t('sugQ2'), t('sugQ3')].map(s => (
                        <button key={s} onClick={() => handleChat(s)}
                          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="max-w-xs bg-violet-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="max-w-lg bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2">
                        <p className="text-sm text-gray-700 leading-relaxed">{msg.en}</p>
                        {msg.zh && <p className="text-sm text-violet-700 leading-relaxed border-t border-gray-200 pt-2">{msg.zh}</p>}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder={t('askPlaceholder')}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                  disabled={chatLoading}
                />
                <button
                  onClick={() => handleChat()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {t('send')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeContent />
    </Suspense>
  );
}
