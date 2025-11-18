import api from '../api';
import type { Subject, SubjectCreate, SubjectUpdate, ClassSubject } from '../../types/subject';

export const subjectsApi = {
  getAll: async (skip = 0, limit = 100, courseId?: string): Promise<Subject[]> => {
    const params: any = { skip, limit };
    if (courseId) {
      params.course_id = courseId;
    }
    const response = await api.get('/subjects', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Subject> => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  create: async (data: SubjectCreate): Promise<Subject> => {
    const response = await api.post('/subjects', data);
    return response.data;
  },

  update: async (id: string, data: SubjectUpdate): Promise<Subject> => {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};

export const classSubjectsApi = {
  getByClass: async (classId: string): Promise<ClassSubject[]> => {
    const response = await api.get(`/subjects/classes/${classId}/subjects`);
    return response.data;
  },

  addToClass: async (classId: string, subjectId: string): Promise<ClassSubject> => {
    const response = await api.post(`/subjects/classes/${classId}/subjects`, {
      subject_id: subjectId,
    });
    return response.data;
  },

  removeFromClass: async (classId: string, subjectId: string): Promise<void> => {
    await api.delete(`/subjects/classes/${classId}/subjects/${subjectId}`);
  },
};


