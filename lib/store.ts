import { supabase } from './supabase';
import { Assignment } from './types';

function fromRow(row: Record<string, unknown>): Assignment {
  return {
    id: row.id as string,
    title: row.title as string,
    course: row.course as string,
    description: row.description as string,
    deadline: row.deadline as string,
    difficulty: row.difficulty as Assignment['difficulty'],
    subTasks: (row.sub_tasks as Assignment['subTasks']) ?? [],
    studyPlan: (row.study_plan as Assignment['studyPlan']) ?? [],
    createdAt: row.created_at as string,
  };
}

export async function getAssignments(): Promise<Assignment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('assignments').select('*').eq('user_id', user.id).order('deadline');
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function addAssignments(assignments: Assignment[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('assignments').insert(
    assignments.map(a => ({
      id: a.id,
      user_id: user.id,
      title: a.title,
      course: a.course,
      description: a.description,
      deadline: a.deadline,
      difficulty: a.difficulty,
      sub_tasks: a.subTasks,
      study_plan: a.studyPlan,
      created_at: a.createdAt,
    }))
  );
}

export async function updateAssignment(assignment: Assignment): Promise<void> {
  await supabase.from('assignments').update({
    title: assignment.title,
    course: assignment.course,
    description: assignment.description,
    deadline: assignment.deadline,
    difficulty: assignment.difficulty,
    sub_tasks: assignment.subTasks,
    study_plan: assignment.studyPlan,
  }).eq('id', assignment.id);
}

export async function deleteAssignment(id: string): Promise<void> {
  await supabase.from('assignments').delete().eq('id', id);
}

export function generateId(): string {
  return crypto.randomUUID();
}
