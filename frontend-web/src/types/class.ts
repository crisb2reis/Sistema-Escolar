export interface Class {
  id: string;
  course_id: string;
  name: string;
  course?: {
    code: string;
    name: string;
  };
}

export interface ClassCreate {
  name: string;
  course_id: string;
}

export interface ClassUpdate {
  name?: string;
  course_id?: string;
}



