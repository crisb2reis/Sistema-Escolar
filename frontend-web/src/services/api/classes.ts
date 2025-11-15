import api from '../api';
import type { Class, ClassCreate, ClassUpdate } from '../../types/class';

export const classesApi = {
  getAll: async (skip = 0, limit = 100): Promise<Class[]> => {
    const response = await api.get('/classes', { params: { skip, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<Class> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  create: async (data: ClassCreate): Promise<Class> => {
    const response = await api.post('/classes', data);
    return response.data;
  },

  update: async (id: string, data: ClassUpdate): Promise<Class> => {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
};

