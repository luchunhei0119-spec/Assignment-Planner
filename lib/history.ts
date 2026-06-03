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
  text?: string; // truncated original text for search
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

export function saveAnalysis(record: Omit<AnalysisRecord, 'id' | 'date'>): AnalysisRecord {
  const full: AnalysisRecord = { ...record, id: Date.now().toString(), date: new Date().toISOString() };
  const existing = getAnalyses();
  localStorage.setItem('analysis-history', JSON.stringify([full, ...existing].slice(0, 20)));
  return full;
}

export function getAnalyses(): AnalysisRecord[] {
  try { return JSON.parse(localStorage.getItem('analysis-history') || '[]'); }
  catch { return []; }
}

export function getAnalysis(id: string): AnalysisRecord | null {
  return getAnalyses().find(a => a.id === id) ?? null;
}

export function deleteAnalysis(id: string) {
  localStorage.setItem('analysis-history', JSON.stringify(getAnalyses().filter(a => a.id !== id)));
}

export function saveWrongAnswers(answers: Omit<WrongAnswer, 'id'>[]) {
  if (!answers.length) return;
  const existing = getWrongAnswers();
  const newOnes = answers.map((a, i) => ({ ...a, id: `${Date.now()}-${i}` }));
  localStorage.setItem('wrong-answers', JSON.stringify([...newOnes, ...existing].slice(0, 200)));
}

export function getWrongAnswers(): WrongAnswer[] {
  try { return JSON.parse(localStorage.getItem('wrong-answers') || '[]'); }
  catch { return []; }
}

export function deleteWrongAnswer(id: string) {
  localStorage.setItem('wrong-answers', JSON.stringify(getWrongAnswers().filter(a => a.id !== id)));
}

export function clearWrongAnswers() {
  localStorage.removeItem('wrong-answers');
}
