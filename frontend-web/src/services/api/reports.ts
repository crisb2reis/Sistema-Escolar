import api from '../api';

export const reportsApi = {
  getSessionAttendances: async (sessionId: string) => {
    const response = await api.get(`/reports/sessions/${sessionId}/attendances`);
    return response.data;
  },

  getStudentAttendance: async (studentId: string, fromDate?: Date, toDate?: Date) => {
    const params: any = {};
    if (fromDate) params.from_date = fromDate.toISOString();
    if (toDate) params.to_date = toDate.toISOString();
    const response = await api.get(`/reports/students/${studentId}/attendance`, { params });
    return response.data;
  },

  getClassReport: async (classId: string, month?: number, year?: number) => {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get(`/reports/classes/${classId}/report`, { params });
    return response.data;
  },

  exportCSV: async (params: {
    session_id?: string;
    class_id?: string;
    student_id?: string;
    from_date?: Date;
    to_date?: Date;
  }) => {
    const queryParams: any = {};
    if (params.session_id) queryParams.session_id = params.session_id;
    if (params.class_id) queryParams.class_id = params.class_id;
    if (params.student_id) queryParams.student_id = params.student_id;
    if (params.from_date) queryParams.from_date = params.from_date.toISOString();
    if (params.to_date) queryParams.to_date = params.to_date.toISOString();

    const response = await api.get('/reports/attendance/csv', {
      params: queryParams,
      responseType: 'blob',
    });
    return response.data;
  },

  exportXLSX: async (params: {
    session_id?: string;
    class_id?: string;
    student_id?: string;
    from_date?: Date;
    to_date?: Date;
  }) => {
    const queryParams: any = {};
    if (params.session_id) queryParams.session_id = params.session_id;
    if (params.class_id) queryParams.class_id = params.class_id;
    if (params.student_id) queryParams.student_id = params.student_id;
    if (params.from_date) queryParams.from_date = params.from_date.toISOString();
    if (params.to_date) queryParams.to_date = params.to_date.toISOString();

    const response = await api.get('/reports/attendance/xlsx', {
      params: queryParams,
      responseType: 'blob',
    });
    return response.data;
  },

  exportPDF: async (params: {
    session_id?: string;
    class_id?: string;
    student_id?: string;
    from_date?: Date;
    to_date?: Date;
  }) => {
    const queryParams: any = {};
    if (params.session_id) queryParams.session_id = params.session_id;
    if (params.class_id) queryParams.class_id = params.class_id;
    if (params.student_id) queryParams.student_id = params.student_id;
    if (params.from_date) queryParams.from_date = params.from_date.toISOString();
    if (params.to_date) queryParams.to_date = params.to_date.toISOString();

    const response = await api.get('/reports/attendance/pdf', {
      params: queryParams,
      responseType: 'blob',
    });
    return response.data;
  },
};



