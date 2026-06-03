'use client';
import { useLang } from '@/lib/LangContext';

export function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-violet-400 hover:text-violet-600 text-gray-600 transition"
    >
      🌐 {lang === 'zh' ? 'EN' : '中文'}
    </button>
  );
}
