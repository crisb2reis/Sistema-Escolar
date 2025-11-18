export interface Subject {
  id: string;
  code: string;
  name: string;
  course_id: string;
  course?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface SubjectCreate {
  code: string;
  name: string;
  course_id: string;
  class_ids?: string[];
}

export interface SubjectUpdate {
  code?: string;
  name?: string;
  course_id?: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  subject?: {
    id: string;
    code: string;
    name: string;
  };
}


