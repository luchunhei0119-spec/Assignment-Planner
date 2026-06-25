'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAnalysis, type KeyPoint } from '@/lib/history';
import { Suspense } from 'react';
import { useLang } from '@/lib/LangContext';
import { LangToggle } from '@/app/components/LangToggle';
import { NavBar } from '@/app/components/NavBar';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function FlashcardsContent() {
  const router = useRouter();
  const { t } = useLang();
  const params = useSearchParams();
  const id = params.get('id');

  const [cards, setCards] = useState<KeyPoint[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!id) return;
    getAnalysis(id).then(record => {
      if (record) {
        setCards(shuffle(record.keyPoints));
        setTitle(record.title);
      }
    });
  }, [id]);

  function handleKnow() {
    const next = new Set(known).add(index);
    setKnown(next);
    advance(next);
  }

  function handleReview() {
    advance(known);
  }

  function advance(currentKnown: Set<number>) {
    setFlipped(false);
    if (index + 1 >= cards.length) {
      setFinished(true);
    } else {
      setTimeout(() => setIndex(i => i + 1), 150);
    }
  }

  function handleRestart(onlyWrong = false) {
    const remaining = onlyWrong ? cards.filter((_, i) => !known.has(i)) : shuffle(cards);
    setCards(remaining);
    setIndex(0);
    setKnown(new Set());
    setFlipped(false);
    setFinished(false);
  }

  if (!id || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No flashcards found. Analyze a document first.</p>
          <button onClick={() => router.push('/analyze')} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg">
            Go to Analyze
          </button>
        </div>
      </div>
    );
  }

  const card = cards[index];
  const knownCount = known.size;

  if (finished) {
    const reviewCount = cards.length - knownCount;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-sm">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Done!</h2>
            <div className="flex justify-center gap-4 mb-8 text-sm">
              <span className="text-green-600 font-medium">{knownCount} known</span>
              <span className="text-gray-300">·</span>
              <span className="text-orange-500 font-medium">{reviewCount} to review</span>
            </div>
            <div className="space-y-2.5">
              {reviewCount > 0 && (
                <button onClick={() => handleRestart(true)}
                  className="w-full py-3 bg-violet-600 text-white text-sm font-semibold rounded-2xl hover:bg-violet-700 transition">
                  Review {reviewCount} again
                </button>
              )}
              <button onClick={() => handleRestart(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-2xl hover:bg-gray-200 transition">
                {t('shuffleAll')}
              </button>
              <button onClick={() => router.push('/')}
                className="w-full py-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition">
                {t('backToDashboard')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition">
          ← {t('back')}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{index + 1} / {cards.length}</span>
          <LangToggle />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-1">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-violet-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${((index) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex gap-1.5 justify-center py-3">
        {cards.map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i === index ? 'w-4 h-2 bg-violet-500' :
            known.has(i) ? 'w-2 h-2 bg-green-400' : 'w-2 h-2 bg-gray-300'
          }`} />
        ))}
      </div>

      {/* Card area — fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        {title && <p className="text-xs text-gray-400 mb-4 max-w-sm w-full truncate text-center">{title}</p>}

        <p className="text-xs text-gray-400 mb-3 text-center">
          {flipped ? '↑ Tap card to flip back' : '↓ Tap card to reveal explanation'}
        </p>

        {/* Flashcard */}
        <div className="flashcard-scene w-full max-w-sm" style={{ height: 340 }}>
          <div
            className={`flashcard-card w-full cursor-pointer select-none ${flipped ? 'flipped' : ''}`}
            style={{ height: 340 }}
            onClick={() => setFlipped(f => !f)}
          >
            {/* Front */}
            <div className="flashcard-front bg-white rounded-3xl border-2 border-violet-100 shadow-sm flex flex-col items-center justify-center p-8 text-center">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                <span className="text-violet-600 text-xs font-bold">{index + 1}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 leading-relaxed">{card.en}</p>
              <p className="text-sm text-violet-400 mt-3 leading-relaxed">{card.zh}</p>
            </div>

            {/* Back */}
            <div className="flashcard-back bg-violet-600 rounded-3xl shadow-sm flex flex-col justify-center p-8 overflow-y-auto">
              <p className="text-sm text-white leading-relaxed opacity-90">{card.detail}</p>
              {card.detailZh && (
                <p className="text-sm text-violet-200 leading-relaxed mt-3 pt-3 border-t border-violet-500">
                  {card.detailZh}
                </p>
              )}
              {card.source && (
                <p className="text-xs text-violet-300 mt-3 italic opacity-75">"{card.source}"</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons — always visible at bottom */}
      <div className="px-6 pb-8">
        <div className="flex gap-3 max-w-sm mx-auto">
          <button
            onClick={handleReview}
            disabled={!flipped}
            className={`flex-1 py-4 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              flipped
                ? 'bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 active:scale-95'
                : 'bg-white border-2 border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            Still learning
          </button>
          <button
            onClick={handleKnow}
            disabled={!flipped}
            className={`flex-1 py-4 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              flipped
                ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-sm'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            Got it! ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense>
      <FlashcardsContent />
    </Suspense>
  );
}
