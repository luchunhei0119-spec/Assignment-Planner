'use client';

import { apiFetch } from '@/lib/apiFetch';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExtractedAssignment } from '@/lib/types';
import { addAssignments, generateId } from '@/lib/store';
import { useLang } from '@/lib/LangContext';
import { NavBar } from '@/app/components/NavBar';

type ReviewItem = ExtractedAssignment & { selected: boolean };

export default function ImportPage() {
  const router = useRouter();
  const { t } = useLang();
  const [syllabus, setSyllabus] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

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
      setSyllabus(results.map(r => r.text).join('\n\n---\n\n'));
      setFileNames(results.map(r => r.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file');
    } finally {
      setUploading(false);
    }
  }

  async function handleExtract() {
    if (!syllabus.trim()) return;
    setLoading(true);
    setError('');
    setItems([]);
    try {
      const res = await apiFetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setItems(data.assignments.map((a: ExtractedAssignment) => ({ ...a, selected: true })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(i: number) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, selected: !item.selected } : item));
  }

  async function handleImport() {
    const selected = items.filter(i => i.selected).map(({ selected: _, ...a }) => ({
      ...a,
      id: generateId(),
      subTasks: [],
      studyPlan: [],
      createdAt: new Date().toISOString(),
    }));
    await addAssignments(selected);
    router.push('/');
  }

  const difficultyColor: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <NavBar back="/" title={t('importTitle')} />
        <p className="text-gray-500 mb-6 -mt-2">{t('importDesc')}</p>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleFilesUpload(e.dataTransfer.files); }}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-5 mb-3 text-center hover:border-violet-400 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files?.length) handleFilesUpload(e.target.files); e.target.value = ''; }}
            />
            {uploading ? (
              <p className="text-sm text-violet-500 font-medium">正在讀取檔案...</p>
            ) : fileNames.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-1.5 justify-center mb-1">
                  {fileNames.map(n => (
                    <span key={n} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{n}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">點擊新增更多檔案</p>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <p className="text-sm text-gray-500">上載 PDF、Word 或 TXT 檔案</p>
                <p className="text-xs text-gray-400 mt-0.5">可選擇多個檔案或拖放至此</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">或貼上文字</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <textarea
            className="w-full h-48 text-sm text-gray-700 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="在此貼上課程大綱文字..."
            value={syllabus}
            onChange={e => setSyllabus(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            onClick={handleExtract}
            disabled={loading || uploading || !syllabus.trim()}
            className="mt-3 w-full py-2.5 rounded-lg bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '正在提取...' : '用 AI 提取功課'}
          </button>
        </div>

        {items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">找到 {items.length} 個功課 — 選擇要匯入的</h2>
              <span className="text-sm text-gray-500">{items.filter(i => i.selected).length} 個已選</span>
            </div>

            <div className="space-y-3 mb-5">
              {items.map((item, i) => (
                <div
                  key={i}
                  onClick={() => toggleItem(i)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition ${item.selected ? 'border-violet-400 ring-1 ring-violet-300' : 'border-gray-200 opacity-60'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center ${item.selected ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`}>
                      {item.selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[item.difficulty]}`}>{item.difficulty}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{item.course} · 截止 {item.deadline}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={items.filter(i => i.selected).length === 0}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              匯入 {items.filter(i => i.selected).length} 個功課
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
