'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Assignment, SubTask } from '@/lib/types';
import { getAssignments, updateAssignment } from '@/lib/store';
import { apiFetch } from '@/lib/apiFetch';

type Tab = 'tasks' | 'plan';

const difficultyColor: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [tab, setTab] = useState<Tab>('tasks');
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    const found = getAssignments().find(a => a.id === id);
    if (!found) { router.push('/'); return; }
    setAssignment(found);
  }, [id, router]);

  function save(updated: Assignment) {
    setAssignment(updated);
    updateAssignment(updated);
  }

  async function handleBreakdown() {
    if (!assignment) return;
    setLoadingBreakdown(true);
    try {
      const res = await apiFetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignment.title,
          description: assignment.description,
          difficulty: assignment.difficulty,
          deadline: assignment.deadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      save({ ...assignment, subTasks: data.subTasks });
    } finally {
      setLoadingBreakdown(false);
    }
  }

  async function handleStudyPlan() {
    if (!assignment || assignment.subTasks.length === 0) return;
    setLoadingPlan(true);
    try {
      const res = await apiFetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignment.title,
          subTasks: assignment.subTasks,
          deadline: assignment.deadline,
          difficulty: assignment.difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      save({ ...assignment, studyPlan: data.studyPlan });
      setTab('plan');
    } finally {
      setLoadingPlan(false);
    }
  }

  function toggleTask(taskId: string) {
    if (!assignment) return;
    const updated = {
      ...assignment,
      subTasks: assignment.subTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    };
    save(updated);
  }

  if (!assignment) return null;

  const completedCount = assignment.subTasks.filter(t => t.completed).length;
  const totalTasks = assignment.subTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const days = daysUntil(assignment.deadline);
  const totalHours = assignment.subTasks.reduce((s, t) => s + t.estimatedHours, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{assignment.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{assignment.course}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${difficultyColor[assignment.difficulty]}`}>
              {assignment.difficulty}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-4">{assignment.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <span className={`font-medium ${days <= 3 ? 'text-red-600' : days <= 7 ? 'text-orange-500' : 'text-gray-600'}`}>
              {days > 0 ? `${days} days left` : days === 0 ? 'Due today!' : 'Overdue'}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">Due {assignment.deadline}</span>
            {totalTasks > 0 && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{totalHours}h estimated</span>
              </>
            )}
          </div>

          {totalTasks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{completedCount}/{totalTasks} tasks done</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          {(['tasks', 'plan'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'tasks' ? 'Sub-Tasks' : 'Study Plan'}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div>
            {assignment.subTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-400 text-sm mb-4">No sub-tasks yet. Let AI break down this assignment for you.</p>
                <button
                  onClick={handleBreakdown}
                  disabled={loadingBreakdown}
                  className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition"
                >
                  {loadingBreakdown ? 'Generating...' : 'AI Breakdown'}
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-2 mb-4">
                  {assignment.subTasks.map((task: SubTask) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`bg-white border rounded-xl p-4 cursor-pointer flex items-start gap-3 transition hover:border-violet-300 ${task.completed ? 'opacity-60' : 'border-gray-200'}`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition ${task.completed ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`}>
                        {task.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{task.estimatedHours}h estimated</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBreakdown}
                    disabled={loadingBreakdown}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    {loadingBreakdown ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={handleStudyPlan}
                    disabled={loadingPlan}
                    className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition"
                  >
                    {loadingPlan ? 'Generating Plan...' : 'Generate Study Plan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Study Plan Tab */}
        {tab === 'plan' && (
          <div>
            {assignment.studyPlan.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-400 text-sm mb-4">
                  {assignment.subTasks.length === 0
                    ? 'Generate sub-tasks first, then create a study plan.'
                    : 'Let AI schedule your study sessions based on your tasks and deadline.'}
                </p>
                {assignment.subTasks.length > 0 && (
                  <button
                    onClick={handleStudyPlan}
                    disabled={loadingPlan}
                    className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition"
                  >
                    {loadingPlan ? 'Generating...' : 'Generate Study Plan'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {assignment.studyPlan.map((session, i) => {
                  const date = new Date(session.date);
                  const isToday = session.date === new Date().toISOString().split('T')[0];
                  return (
                    <div key={i} className={`bg-white border rounded-xl p-4 ${isToday ? 'border-violet-400 ring-1 ring-violet-300' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-800">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          {isToday && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Today</span>}
                        </div>
                        <span className="text-xs text-gray-400">{session.hours}h</span>
                      </div>
                      <ul className="space-y-1">
                        {session.tasks.map((task, j) => (
                          <li key={j} className="text-sm text-gray-600 flex items-start gap-1.5">
                            <span className="text-violet-400 mt-0.5">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                <button
                  onClick={handleStudyPlan}
                  disabled={loadingPlan}
                  className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  {loadingPlan ? 'Regenerating...' : 'Regenerate Plan'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
