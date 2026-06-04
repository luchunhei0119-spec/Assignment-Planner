import { supabase } from './supabase';

export interface KeyPoint {
  en: string;
  zh: string;
  detail: string;
  detailZh: string;
  source?: string;
}

export interface AnalysisRecord {
  id: string;
  date: string;
  title: string;
  summary: string;
  keyPoints: KeyPoint[];
  highlights: string[];
  text?: string;
}

export interface WrongAnswer {
  id: string;
  date: string;
  questionType: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer: string;
  explanation?: string;
  explanationZh?: string;
}

export async function saveAnalysis(record: Omit<AnalysisRecord, 'id' | 'date'>): Promise<AnalysisRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  const full: AnalysisRecord = { ...record, id: crypto.randomUUID(), date: new Date().toISOString() };
  if (user) {
    await supabase.from('analysis_history').insert({
      id: full.id,
      user_id: user.id,
      title: full.title,
      summary: full.summary,
      key_points: full.keyPoints,
      highlights: full.highlights,
      text: full.text ?? '',
      created_at: full.date,
    });
  }
  return full;
}

export async function getAnalyses(): Promise<AnalysisRecord[]> {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id,
    date: r.created_at,
    title: r.title,
    summary: r.summary,
    keyPoints: r.key_points ?? [],
    highlights: r.highlights ?? [],
    text: r.text,
  }));
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    date: data.created_at,
    title: data.title,
    summary: data.summary,
    keyPoints: data.key_points ?? [],
    highlights: data.highlights ?? [],
    text: data.text,
  };
}

export async function deleteAnalysis(id: string): Promise<void> {
  await supabase.from('analysis_history').delete().eq('id', id);
}

export async function saveWrongAnswers(answers: Omit<WrongAnswer, 'id'>[]): Promise<void> {
  if (!answers.length) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('wrong_answers').insert(
    answers.map(a => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      question_type: a.questionType,
      question: a.question,
      options: a.options ?? null,
      correct_answer: a.correctAnswer,
      user_answer: a.userAnswer,
      explanation: a.explanation ?? '',
      explanation_zh: a.explanationZh ?? '',
      created_at: a.date,
    }))
  );
}

export async function getWrongAnswers(): Promise<WrongAnswer[]> {
  const { data, error } = await supabase
    .from('wrong_answers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id,
    date: r.created_at,
    questionType: r.question_type,
    question: r.question,
    options: r.options ?? undefined,
    correctAnswer: r.correct_answer,
    userAnswer: r.user_answer,
    explanation: r.explanation,
    explanationZh: r.explanation_zh,
  }));
}

export async function deleteWrongAnswer(id: string): Promise<void> {
  await supabase.from('wrong_answers').delete().eq('id', id);
}

export async function clearWrongAnswers(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('wrong_answers').delete().eq('user_id', user.id);
}
