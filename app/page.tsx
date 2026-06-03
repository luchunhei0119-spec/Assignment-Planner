'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Assignment } from '@/lib/types';
import { getAssignments, deleteAssignment } from '@/lib/store';
import { hasAuth } from '@/lib/apiFetch';
import { getAnalyses, getWrongAnswers, type AnalysisRecord } from '@/lib/history';
import { useLang } from '@/lib/LangContext';
import { LangToggle } from './components/LangToggle';

type Filter = 'all' | 'upcoming' | 'done';

const difficultyColor: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

function daysUntil(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getProgress(a: Assignment) {
  if (a.subTasks.length === 0) return 0;
  return Math.round((a.subTasks.filter(t => t.completed).length / a.subTasks.length) * 100);
}

export default function Dashboard() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setAssignments(getAssignments());
    setAnalyses(getAnalyses().slice(0, 3));
    setWrongCount(getWrongAnswers().length);
    if (!hasAuth()) router.push('/settings');
  }, []);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm(t('deleteAssignment') as string)) return;
    deleteAssignment(id);
    setAssignments(getAssignments());
  }

  const filtered = assignments.filter(a => {
    const progress = getProgress(a);
    if (filter === 'done') return progress === 100;
    if (filter === 'upcoming') return progress < 100;
    return true;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const totalDone = assignments.filter(a => getProgress(a) === 100).length;
  const urgent = assignments.filter(a => daysUntil(a.deadline) <= 3 && getProgress(a) < 100).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('appTitle')}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t('appSubtitle')}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <LangToggle />
            <button onClick={() => router.push('/history')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-violet-400 hover:text-violet-600 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t('history')}
            </button>
            <button onClick={() => router.push('/analyze')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-violet-400 hover:text-violet-600 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {t('analyzeDoc')}
            </button>
            <button onClick={() => router.push('/quiz')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-violet-400 hover:text-violet-600 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t('quiz')}
            </button>
            <button onClick={() => router.push('/translate')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-violet-400 hover:text-violet-600 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              {t('translate')}
            </button>
            <button onClick={() => router.push('/settings')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-violet-400 hover:text-violet-600 transition" title={t('settings')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={() => router.push('/import')} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {t('importSyllabus')}
            </button>
          </div>
        </div>

        {assignments.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('total')}</p>
            </div>
            <div className={`bg-white rounded-xl border p-4 ${urgent > 0 ? 'border-red-200' : 'border-gray-200'}`}>
              <p className={`text-2xl font-bold ${urgent > 0 ? 'text-red-500' : 'text-gray-900'}`}>{urgent}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('dueSoon')}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-violet-600">{totalDone}</p>
              <p className="text-xs text-gray-400 mt-0.5">已完成</p>
            </div>
          </div>
        )}

        {assignments.length > 0 && (
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {(['all', 'upcoming', 'done'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f === 'all' ? t('filterAll') : f === 'upcoming' ? t('filterUpcoming') : t('filterDone')}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 && assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-gray-500 font-medium mb-1">{t('noAssignments')}</p>
            <p className="text-sm text-gray-400 mb-5">{t('noAssignmentsDesc')}</p>
            <button onClick={() => router.push('/import')} className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
              {t('importSyllabus')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">{t('noCategoryItems')}</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const days = daysUntil(a.deadline);
              const progress = getProgress(a);
              return (
                <div
                  key={a.id}
                  onClick={() => router.push(`/assignments/${a.id}`)}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-violet-300 hover:shadow-sm transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 truncate">{a.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${difficultyColor[a.difficulty]}`}>{a.difficulty}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{a.course}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={`font-medium ${days <= 0 ? 'text-red-500' : days <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                          {days > 0 ? (lang === 'zh' ? `還有 ${days} 天` : `${days}d left`) : days === 0 ? t('dueToday') : t('overdue')}
                        </span>
                        {a.subTasks.length > 0 && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-400">{a.subTasks.filter(task => task.completed).length}/{a.subTasks.length} {lang === 'zh' ? '個任務' : 'tasks'}</span>
                          </>
                        )}
                      </div>
                      {a.subTasks.length > 0 && (
                        <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-green-400' : 'bg-violet-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={e => handleDelete(e, a.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition p-1 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {(analyses.length > 0 || wrongCount > 0) && (
          <div className="mt-6 space-y-3">
            {wrongCount > 0 && (
              <button onClick={() => router.push('/review')}
                className="w-full bg-white border border-red-200 rounded-xl p-4 flex items-center gap-3 hover:border-red-300 hover:shadow-sm transition text-left">
                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('wrongAnswers')}</p>
                  <p className="text-xs text-gray-400">{lang === 'zh' ? `${wrongCount} 條題目待複習` : `${wrongCount} questions to review`}</p>
                </div>
              </button>
            )}

            {analyses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">{t('recentAnalyses')}</p>
                  <button onClick={() => router.push('/analyze')} className="text-xs text-violet-600 hover:text-violet-700">{t('newAnalysis')}</button>
                </div>
                <div className="space-y-2">
                  {analyses.map(a => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{a.title}</p>
                        <p className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString('zh-HK')} · {a.keyPoints.length} {lang === 'zh' ? '個重點' : 'key points'}</p>
                      </div>
                      <button onClick={() => router.push(`/flashcards?id=${a.id}`)}
                        className="text-xs px-2 py-1 bg-violet-100 text-violet-600 rounded-md hover:bg-violet-200 transition flex-shrink-0">
                        {t('flashcards')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
