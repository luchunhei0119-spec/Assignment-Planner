import { Assignment } from './types';

const KEY = 'ai-planner-assignments';

export function getAssignments(): Assignment[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveAssignments(assignments: Assignment[]): void {
  localStorage.setItem(KEY, JSON.stringify(assignments));
}

export function addAssignments(incoming: Assignment[]): void {
  const existing = getAssignments();
  saveAssignments([...existing, ...incoming]);
}

export function updateAssignment(updated: Assignment): void {
  const all = getAssignments();
  saveAssignments(all.map(a => (a.id === updated.id ? updated : a)));
}

export function deleteAssignment(id: string): void {
  saveAssignments(getAssignments().filter(a => a.id !== id));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
