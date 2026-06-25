'use client';
import { useLang } from '@/lib/LangContext';
import { LangToggle } from './LangToggle';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavBarProps {
  title?: string;
  back?: string;
  right?: ReactNode;
}

export function NavBar({ title, back, right }: NavBarProps) {
  const router = useRouter();
  const { t } = useLang();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1 min-w-0">
        {back && (
          <button onClick={() => router.push(back)}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 transition mb-1">
            ← {t('backToDashboard')}
          </button>
        )}
        {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {right}
        <LangToggle />
      </div>
    </div>
  );
}
