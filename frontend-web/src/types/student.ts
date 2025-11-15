export interface Student {
  id: string;
  user_id: string;
  matricula: string;
  curso: string | null;
  class_id: string | null;
  user?: {
    name: string;
    email: string;
  };
}

export interface StudentCreate {
  name: string;
  email: string;
  matricula: string;
  curso?: string;
  class_id?: string;
  password?: string;
}

export interface StudentUpdate {
  name?: string;
  email?: string;
  curso?: string;
  class_id?: string;
}

export interface CSVUploadResponse {
  total_processed: number;
  success_count: number;
  error_count: number;
  errors: Array<{
    line: number;
    error: string;
    data?: any;
    warning?: boolean;
  }>;
  message: string;
}



