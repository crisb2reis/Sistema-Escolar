import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export const getTodayRange = () => {
  const today = new Date();
  return {
    start: startOfDay(today),
    end: endOfDay(today),
  };
};

export const getWeekRange = () => {
  const today = new Date();
  return {
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 }),
  };
};

export const getMonthRange = () => {
  const today = new Date();
  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
  };
};

export const formatDateForAPI = (date: Date): string => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

export const formatDateRangeForAPI = (start: Date, end: Date): { from: string; to: string } => {
  return {
    from: formatDateForAPI(start),
    to: formatDateForAPI(end),
  };
};

