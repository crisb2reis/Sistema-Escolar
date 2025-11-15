import api from '../api';
import type { Session, SessionCreate, QRCodeResponse } from '../../types/session';

export const sessionsApi = {
  getAll: async (): Promise<Session[]> => {
    const response = await api.get('/sessions');
    return response.data;
  },

  getById: async (id: string): Promise<Session> => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  create: async (classId: string, data: SessionCreate): Promise<Session> => {
    const response = await api.post(`/sessions/classes/${classId}/sessions`, data);
    return response.data;
  },

  close: async (id: string): Promise<Session> => {
    const response = await api.put(`/sessions/${id}/close`);
    return response.data;
  },

  generateQR: async (id: string, expiresInMinutes?: number): Promise<QRCodeResponse> => {
    const params = expiresInMinutes ? { expires_in_minutes: expiresInMinutes } : {};
    const response = await api.post(`/sessions/${id}/qrcode`, null, { params });
    return response.data;
  },

  getAttendances: async (id: string): Promise<any[]> => {
    const response = await api.get(`/reports/sessions/${id}/attendances`);
    return response.data;
  },
};

