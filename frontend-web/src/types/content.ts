export interface SubjectContent {
  id: string;
  class_id: string;
  subject_id: string;
  bimester?: string;
  date: string; // ISO date
  sessions: number;
  content?: string;
  observation?: string;
}

export interface SubjectContentCreate {
  date: string;
  sessions: number;
  content?: string;
  observation?: string;
  bimester?: string;
}

export interface SubjectContentUpdate {
  date?: string;
  sessions?: number;
  content?: string;
  observation?: string;
  bimester?: string;
}
