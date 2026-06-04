'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWrongAnswers, deleteWrongAnswer, clearWrongAnswers, type WrongAnswer } from '@/lib/history';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ReviewPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<WrongAnswer[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
  }

  async function handleClear() {
    if (!confirm('Clear all wrong answers?')) return;
    await clearWrongAnswers();
    setAnswers([]);
  }

  const typeLabel: Record<string, string> = { mc: 'MC', short: 'Short', long: 'Long' };
  const typeColor: Record<string, string> = {
    mc: 'bg-blue-100 text-blue-700',
    short: 'bg-yellow-100 text-yellow-700',
    long: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          ← Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wrong Answers</h1>
            <p className="text-sm text-gray-400 mt-0.5">錯題本 · {answers.length} questions</p>
          </div>
          {answers.length > 0 && (
            <button onClick={handleClear} className="text-sm text-red-400 hover:text-red-600 transition">
              Clear all
            </button>
          )}
        </div>

        {answers.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-gray-500 font-medium">No wrong answers yet!</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Complete a quiz and wrong answers will appear here.</p>
            <button onClick={() => router.push('/quiz')} className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
              Start a Quiz
            </button>
          </div>
        ) : (
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
                      <span className="text-xs text-gray-400">{formatDate(a.date)}</span>
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
                        <p className="text-xs text-gray-400 mb-1">Your answer</p>
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{a.userAnswer || '(no answer)'}</p>
                      </div>
                    )}

                    {(a.explanation || a.explanationZh) && (
                      <div className={`text-sm p-3 rounded-lg bg-green-50`}>
                        {a.explanation && <p className="text-green-700">{a.explanation}</p>}
                        {a.explanationZh && <p className="text-green-600 mt-1 text-xs">{a.explanationZh}</p>}
                      </div>
                    )}

                    <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-600 transition">
                      Remove from review
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
