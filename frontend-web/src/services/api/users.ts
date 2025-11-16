import api from '../api';
import type { User, UserCreate, UserUpdate } from '../../types/user';

export const usersApi = {
  getAll: async (skip = 0, limit = 100): Promise<User[]> => {
    const response = await api.get('/users', { params: { skip, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: UserCreate): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: UserUpdate): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

