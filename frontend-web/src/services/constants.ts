export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export const SESSION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export const ATTENDANCE_METHOD = {
  QRCODE: 'qrcode',
  MANUAL: 'manual',
} as const;

export const PAGE_SIZES = [10, 25, 50, 100];

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-ddTHH:mm:ss',
};



