import api from '../api';
import type { Student, StudentCreate, StudentUpdate, CSVUploadResponse } from '../../types/student';

export const studentsApi = {
  getAll: async (skip = 0, limit = 100): Promise<Student[]> => {
    const response = await api.get('/students', { params: { skip, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  create: async (data: StudentCreate): Promise<Student> => {
    const response = await api.post('/students', data);
    return response.data;
  },

  update: async (id: string, data: StudentUpdate): Promise<Student> => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  uploadCSV: async (file: File): Promise<CSVUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/students/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

