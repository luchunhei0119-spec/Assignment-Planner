'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWrongAnswers, deleteWrongAnswer, clearWrongAnswers, type WrongAnswer } from '@/lib/history';
import { useLang } from '@/lib/LangContext';
import { NavBar } from '@/app/components/NavBar';
import { BottomNav } from '@/app/components/BottomNav';
import { apiFetch } from '@/lib/apiFetch';

interface WeakTopic {
  name: string;
  nameZh: string;
  count: number;
  advice: string;
  adviceZh: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [answers, setAnswers] = useState<WrongAnswer[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [weakTopics, setWeakTopics] = useState<WeakTopic[] | null>(null);
  const [analyzingWeakness, setAnalyzingWeakness] = useState(false);

  useEffect(() => { getWrongAnswers().then(setAnswers); }, []);

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    await deleteWrongAnswer(id);
    getWrongAnswers().then(setAnswers);
    setWeakTopics(null);
  }

  async function handleClear() {
    if (!confirm(t('clearAllConfirm') as string)) return;
    await clearWrongAnswers();
    setAnswers([]);
    setWeakTopics(null);
  }

  async function handleAnalyzeWeakness() {
    if (!answers.length) return;
    setAnalyzingWeakness(true);
    setWeakTopics(null);
    try {
      const res = await apiFetch('/api/analyze-weaknesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrongAnswers: answers.slice(0, 50) }),
      });
      const data = await res.json();
      if (res.ok && data.topics) setWeakTopics(data.topics);
    } finally {
      setAnalyzingWeakness(false);
    }
  }

  const typeLabel: Record<string, string> = { mc: 'MC', short: 'Short', long: 'Long' };
  const typeColor: Record<string, string> = {
    mc: 'bg-blue-100 text-blue-700',
    short: 'bg-yellow-100 text-yellow-700',
    long: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <NavBar back="/" title={t('wrongAnswersTitle')} />

        <div className="flex items-center justify-between mb-6 -mt-2">
          <p className="text-sm text-gray-400">{answers.length} {t('wrongToReview')}</p>
          {answers.length > 0 && (
            <button onClick={handleClear} className="text-sm text-red-400 hover:text-red-600 transition">
              {t('clearAll')}
            </button>
          )}
        </div>

        {answers.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-gray-500 font-medium">{t('noWrongAnswers')}</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">{t('noWrongDesc')}</p>
            <button onClick={() => router.push('/quiz')} className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
              {t('startQuiz')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Weakness analysis button / results */}
            {!weakTopics ? (
              <button
                onClick={handleAnalyzeWeakness}
                disabled={analyzingWeakness}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-violet-200 text-violet-600 text-sm font-medium rounded-xl hover:bg-violet-50 disabled:opacity-50 transition"
              >
                {analyzingWeakness ? (
                  <>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    {t('analyzingTopics')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    {t('analyzeWeakTopics')}
                  </>
                )}
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-violet-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">{t('weakTopicsTitle')}</p>
                  <button onClick={() => setWeakTopics(null)} className="text-xs text-gray-400 hover:text-gray-600">{t('less')}</button>
                </div>
                <div className="space-y-3">
                  {weakTopics.map((topic, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-900">
                          {lang === 'zh' ? topic.nameZh : topic.name}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                          {topic.count} {lang === 'zh' ? '題' : 'wrong'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {lang === 'zh' ? topic.adviceZh : topic.advice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wrong answers list */}
            <div className="space-y-3">
              {answers.map(a => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggle(a.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[a.questionType] || 'bg-gray-100 text-gray-600'}`}>
                          {typeLabel[a.questionType] || a.questionType}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">{a.question}</p>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded.has(a.id) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {expanded.has(a.id) && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                      {a.options && (
                        <div className="space-y-1.5">
                          {a.options.map(opt => {
                            const letter = opt[0];
                            const isCorrect = letter === a.correctAnswer;
                            const isWrong = letter === a.userAnswer && !isCorrect;
                            return (
                              <div key={letter} className={`text-sm px-3 py-2 rounded-lg ${isCorrect ? 'bg-green-50 text-green-700 font-medium' : isWrong ? 'bg-red-50 text-red-600 line-through' : 'text-gray-600'}`}>
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!a.options && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">{t('yourAnswer')}</p>
                          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{a.userAnswer || '(no answer)'}</p>
                        </div>
                      )}

                      {(a.explanation || a.explanationZh) && (
                        <div className="text-sm p-3 rounded-lg bg-green-50">
                          {a.explanation && <p className="text-green-700">{a.explanation}</p>}
                          {a.explanationZh && <p className="text-green-600 mt-1 text-xs">{a.explanationZh}</p>}
                        </div>
                      )}

                      <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-600 transition">
                        {t('removeFromReview')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
