export interface Course {
  id: string;
  code: string;
  name: string;
}

export interface CourseCreate {
  code: string;
  name: string;
}

export interface CourseUpdate {
  code?: string;
  name?: string;
}



