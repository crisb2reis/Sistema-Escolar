export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  is_active: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
}

export interface UserUpdate {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'teacher' | 'student';
  is_active?: string;
}

