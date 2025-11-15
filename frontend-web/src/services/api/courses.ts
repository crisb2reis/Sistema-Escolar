import api from '../api';
import type { Course, CourseCreate, CourseUpdate } from '../../types/course';

export const coursesApi = {
  getAll: async (skip = 0, limit = 100): Promise<Course[]> => {
    const response = await api.get('/courses', { params: { skip, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data: CourseCreate): Promise<Course> => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  update: async (id: string, data: CourseUpdate): Promise<Course> => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

