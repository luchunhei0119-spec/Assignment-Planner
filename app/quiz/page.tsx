'use client';

import { apiFetch } from '@/lib/apiFetch';
import { saveWrongAnswers, saveAnalysis } from '@/lib/history';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { NavBar } from '@/app/components/NavBar';
import { BottomNav } from '@/app/components/BottomNav';

type QuestionType = 'mc' | 'short' | 'long';

interface MCQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  explanationZh: string;
}

interface OpenQuestion {
  question: string;
  modelAnswer: string;
}

interface GradeResult {
  score: number;
  feedback: string;
  feedbackZh: string;
  modelAnswer: string;
  modelAnswerZh: string;
}

type Question = MCQuestion | OpenQuestion;

function isMC(q: Question): q is MCQuestion {
  return 'options' in q;
}

export default function QuizPage() {
  const router = useRouter();
  const { t } = useLang();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('mc');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeType, setActiveType] = useState<QuestionType>('mc');
  const [contentLang, setContentLang] = useState<'zh' | 'en'>('en');
  const [current, setCurrent] = useState(0);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MC state
  const [mcAnswers, setMcAnswers] = useState<(string | null)[]>([]);
  const [mcSelected, setMcSelected] = useState<string | null>(null);

  // Open question state
  const [openAnswers, setOpenAnswers] = useState<string[]>([]);
  const [gradeResults, setGradeResults] = useState<(GradeResult | null)[]>([]);
  const [grading, setGrading] = useState(false);

  const [finished, setFinished] = useState(false);
  const [savedFlashcardsId, setSavedFlashcardsId] = useState<string | null>(null);
  const [savingFlashcards, setSavingFlashcards] = useState(false);

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

  async function handleGenerate() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setQuestions([]);
    setCurrent(0);
    setMcAnswers([]);
    setMcSelected(null);
    setOpenAnswers([]);
    setGradeResults([]);
    setFinished(false);
    try {
      const res = await apiFetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, questionType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setQuestions(data.questions);
      setActiveType(questionType);
      setContentLang(data.lang ?? 'en');
      setMcAnswers(new Array(data.questions.length).fill(null));
      setOpenAnswers(new Array(data.questions.length).fill(''));
      setGradeResults(new Array(data.questions.length).fill(null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // MC handlers
  function handleMcSelect(letter: string) {
    if (mcSelected) return;
    setMcSelected(letter);
    setMcAnswers(prev => prev.map((a, i) => i === current ? letter : a));
  }

  // Open question handlers
  async function handleGrade() {
    const q = questions[current] as OpenQuestion;
    const answer = openAnswers[current];
    if (!answer.trim()) return;
    setGrading(true);
    try {
      const res = await apiFetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, modelAnswer: q.modelAnswer, userAnswer: answer, questionType: activeType, lang: contentLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setGradeResults(prev => prev.map((r, i) => i === current ? data : r));
    } catch {
      // silently fail
    } finally {
      setGrading(false);
    }
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      // Save wrong answers before finishing
      if (activeType === 'mc') {
        const wrongs = questions.map((q, i) => {
          const mc = q as MCQuestion;
          if (mcAnswers[i] !== mc.answer) {
            return { date: new Date().toISOString(), questionType: 'mc', question: mc.question, options: mc.options, correctAnswer: mc.answer, userAnswer: mcAnswers[i] ?? '', explanation: mc.explanation, explanationZh: mc.explanationZh };
          }
          return null;
        }).filter(Boolean) as Parameters<typeof saveWrongAnswers>[0];
        saveWrongAnswers(wrongs);
      } else {
        const wrongs = questions.map((q, i) => {
          const oq = q as OpenQuestion;
          const grade = gradeResults[i];
          if (grade && grade.score < 7) {
            return { date: new Date().toISOString(), questionType: activeType, question: oq.question, correctAnswer: grade.modelAnswer, userAnswer: openAnswers[i] ?? '' };
          }
          return null;
        }).filter(Boolean) as Parameters<typeof saveWrongAnswers>[0];
        saveWrongAnswers(wrongs);
      }
      setFinished(true);
    } else {
      const next = current + 1;
      setCurrent(next);
      if (activeType === 'mc') setMcSelected(mcAnswers[next]);
    }
  }

  function handleBack() {
    if (current === 0) return;
    const prev = current - 1;
    setCurrent(prev);
    if (activeType === 'mc') setMcSelected(mcAnswers[prev]);
  }

  async function handleSaveAsFlashcards() {
    setSavingFlashcards(true);
    try {
      const wrongKeyPoints = activeType === 'mc'
        ? questions.flatMap((q, i) => {
            const mc = q as MCQuestion;
            if (mcAnswers[i] === mc.answer) return [];
            return [{
              en: mc.question,
              zh: '',
              detail: mc.explanation || `Correct answer: ${mc.answer}`,
              detailZh: mc.explanationZh || '',
              source: `Correct: ${mc.answer}`,
            }];
          })
        : questions.flatMap((q, i) => {
            const oq = q as OpenQuestion;
            const grade = gradeResults[i];
            if (!grade || grade.score >= 7) return [];
            return [{
              en: oq.question,
              zh: '',
              detail: grade.modelAnswer || oq.modelAnswer,
              detailZh: grade.modelAnswerZh || '',
              source: '',
            }];
          });
      if (wrongKeyPoints.length === 0) return;
      const record = await saveAnalysis({
        title: `Quiz Review — ${new Date().toLocaleDateString()}`,
        summary: `Flashcards from ${wrongKeyPoints.length} wrong answer${wrongKeyPoints.length !== 1 ? 's' : ''} in your quiz.`,
        keyPoints: wrongKeyPoints,
        highlights: [],
      });
      setSavedFlashcardsId(record.id);
    } finally {
      setSavingFlashcards(false);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setMcSelected(null);
    setMcAnswers(new Array(questions.length).fill(null));
    setOpenAnswers(new Array(questions.length).fill(''));
    setGradeResults(new Array(questions.length).fill(null));
    setFinished(false);
  }

  const mcScore = activeType === 'mc'
    ? mcAnswers.filter((a, i) => a === (questions[i] as MCQuestion)?.answer).length
    : 0;
  const openScore = activeType !== 'mc'
    ? Math.round(gradeResults.filter(Boolean).reduce((s, r) => s + (r?.score ?? 0), 0) / Math.max(gradeResults.filter(Boolean).length, 1))
    : 0;

  const q = questions[current];

  const mcOptionStyle = (letter: string) => {
    if (!mcSelected) return 'border-gray-200 hover:border-violet-400 hover:bg-violet-50 cursor-pointer';
    const correct = (q as MCQuestion).answer;
    if (letter === correct) return 'border-green-400 bg-green-50 text-green-800';
    if (letter === mcSelected && letter !== correct) return 'border-red-400 bg-red-50 text-red-800';
    return 'border-gray-200 opacity-50';
  };

  const canProceed = activeType === 'mc'
    ? !!mcSelected
    : !!gradeResults[current];

  const typeOptions: { type: QuestionType; label: string; desc: string }[] = [
    { type: 'mc',    label: t('mcLabel'),    desc: t('mcDesc') },
    { type: 'short', label: t('shortLabel'), desc: t('shortDesc') },
    { type: 'long',  label: t('longLabel'),  desc: t('longDesc') },
  ];

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <NavBar back="/" title={t('quizTitle')} />
          <p className="text-gray-500 mb-6 -mt-2">{t('quizDesc')}</p>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('questionType')}</p>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map(({ type, label, desc }) => (
                <button key={type} onClick={() => setQuestionType(type)}
                  className={`p-3 rounded-lg border text-left transition ${questionType === type ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-medium ${questionType === type ? 'text-violet-700' : 'text-gray-800'}`}>{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

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
              placeholder={t('pasteNotesHere')}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button onClick={handleGenerate} disabled={loading || uploading || !text.trim()}
              className="mt-3 w-full py-2.5 rounded-lg bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {loading ? t('generating') : t('generateQuiz')}
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (finished) {
    const ratio = activeType === 'mc' ? mcScore / questions.length : openScore / 10;
    const wrongCount = activeType === 'mc'
      ? mcAnswers.filter((a, i) => a !== (questions[i] as MCQuestion)?.answer).length
      : gradeResults.filter(r => r && r.score < 7).length;
    return (
      <div className="min-h-screen bg-gray-50 p-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${ratio >= 0.8 ? 'bg-green-100' : ratio >= 0.5 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <span className={`text-2xl font-bold ${ratio >= 0.8 ? 'text-green-600' : ratio >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {activeType === 'mc' ? `${mcScore}/${questions.length}` : `${openScore}/10`}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {ratio >= 0.8 ? t('excellent') : ratio >= 0.5 ? t('goodEffort') : t('keepStudying')}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {activeType === 'mc'
                ? `${t('youGot')} ${mcScore} ${t('outOf')} ${questions.length} ${t('correct2')} (${Math.round(ratio * 100)}%)`
                : `${t('averageScore')} ${openScore}/10`}
            </p>
            <div className="flex gap-3 justify-center mb-4">
              <button onClick={handleRestart} className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                {t('tryAgain')}
              </button>
              <button onClick={() => setQuestions([])} className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
                {t('newQuiz')}
              </button>
            </div>
            {wrongCount > 0 && (
              <div className="border-t border-gray-100 pt-4">
                {savedFlashcardsId ? (
                  <button
                    onClick={() => router.push(`/flashcards?id=${savedFlashcardsId}`)}
                    className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                  >
                    {t('openFlashcards')} →
                  </button>
                ) : (
                  <button
                    onClick={handleSaveAsFlashcards}
                    disabled={savingFlashcards}
                    className="w-full py-2.5 border border-violet-200 text-violet-600 text-sm font-medium rounded-lg hover:bg-violet-50 disabled:opacity-50 transition"
                  >
                    {savingFlashcards ? t('saving') : `${t('saveWrongAsFlashcards')} (${wrongCount})`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const activeLabel = typeOptions.find(o => o.type === activeType)?.label ?? activeType;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <NavBar back="/" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm text-gray-500">{t('question')} {current + 1} {t('questionOf')} {questions.length}</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">{activeLabel}</span>
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => {
              const done = activeType === 'mc' ? mcAnswers[i] !== null : gradeResults[i] !== null;
              const correct = activeType === 'mc' && mcAnswers[i] === (questions[i] as MCQuestion).answer;
              return (
                <div key={i} className={`w-2 h-2 rounded-full ${
                  !done ? 'bg-gray-200' :
                  activeType === 'mc' ? (correct ? 'bg-green-400' : 'bg-red-400') : 'bg-violet-400'
                }`} />
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <p className="font-medium text-gray-900 mb-5 leading-relaxed">{q.question}</p>

          {activeType === 'mc' && isMC(q) && (
            <>
              <div className="space-y-2.5">
                {q.options.map(opt => {
                  const letter = opt[0];
                  return (
                    <div key={letter} onClick={() => handleMcSelect(letter)}
                      className={`border rounded-lg px-4 py-3 text-sm transition ${mcOptionStyle(letter)}`}>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {mcSelected && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${mcSelected === q.answer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span className="font-semibold">{mcSelected === q.answer ? t('correct') : t('incorrect')} </span>
                  {q.explanation}
                  {q.explanationZh && (
                    <p className="mt-1.5 pt-1.5 border-t border-current border-opacity-20 text-xs opacity-80">{q.explanationZh}</p>
                  )}
                </div>
              )}
            </>
          )}

          {(activeType === 'short' || activeType === 'long') && !isMC(q) && (
            <>
              <textarea
                className={`w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 ${activeType === 'long' ? 'h-40' : 'h-24'}`}
                placeholder={activeType === 'short' ? t('writeShort') : t('writeLong')}
                value={openAnswers[current]}
                onChange={e => setOpenAnswers(prev => prev.map((a, i) => i === current ? e.target.value : a))}
                disabled={!!gradeResults[current]}
              />
              {!gradeResults[current] && (
                <button
                  onClick={handleGrade}
                  disabled={grading || !openAnswers[current].trim()}
                  className="mt-3 w-full py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {grading ? t('grading') : t('submitAnswer')}
                </button>
              )}
              {gradeResults[current] && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${gradeResults[current]!.score >= 7 ? 'text-green-600' : gradeResults[current]!.score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {gradeResults[current]!.score}/10
                    </span>
                    <p className="text-sm text-gray-700">{gradeResults[current]!.feedback}</p>
                  </div>
                  <p className="text-sm text-violet-600">{gradeResults[current]!.feedbackZh}</p>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">{t('modelAnswer')}</p>
                    <p className="text-sm text-gray-700">{gradeResults[current]!.modelAnswer}</p>
                    <p className="text-sm text-violet-600 mt-1">{gradeResults[current]!.modelAnswerZh}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={handleBack} disabled={current === 0}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            ← Back
          </button>
          <button onClick={handleNext} disabled={!canProceed}
            className="flex-1 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            {current + 1 === questions.length ? t('finish') : t('next')}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
