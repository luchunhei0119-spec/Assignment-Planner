export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SubTask {
  id: string;
  title: string;
  estimatedHours: number;
  completed: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  deadline: string; // ISO date string
  difficulty: Difficulty;
  description: string;
  subTasks: SubTask[];
  studyPlan: StudySession[];
  createdAt: string;
}

export interface StudySession {
  date: string; // ISO date string
  tasks: string[];
  hours: number;
}

export interface ExtractedAssignment {
  title: string;
  course: string;
  deadline: string;
  difficulty: Difficulty;
  description: string;
}
