import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import { classesApi } from '../services/api/classes';
import { studentsApi } from '../services/api/students';
import { reportsApi } from '../services/api/reports';
import { formatDateTime } from '../services/formatters';

interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  timestamp: string;
  method: string;
}

const Reports: React.FC = () => {
  const [classId, setClassId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll(),
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(),
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', classId, studentId, fromDate, toDate],
    queryFn: async () => {
      if (classId) {
        return reportsApi.getClassReport(classId);
      }
      if (studentId) {
        return reportsApi.getStudentAttendance(studentId, fromDate || undefined, toDate || undefined);
      }
      return null;
    },
    enabled: !!classId || !!studentId,
  });


  const columns: Column<Attendance>[] = [
    {
      id: 'student_name',
      label: 'Aluno',
      format: (_, row) => row.student_name || '-',
    },
    {
      id: 'timestamp',
      label: 'Data/Hora',
      format: (value) => (value ? formatDateTime(value) : '-'),
    },
    {
      id: 'method',
      label: 'Método',
      format: (value) => (value === 'qrcode' ? 'QR Code' : 'Manual'),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Relatórios de Frequência
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Turma"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setStudentId('');
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {classes?.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Aluno"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setClassId('');
              }}
              disabled={!!classId}
            >
              <MenuItem value="">Todos</MenuItem>
              {students?.map((student) => (
                <MenuItem key={student.id} value={student.user_id}>
                  {student.user?.name} - {student.matricula}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Inicial"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Final"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Dados do Relatório</Typography>
        <ExportButtons
          classId={classId || undefined}
          studentId={studentId || undefined}
          fromDate={fromDate || undefined}
          toDate={toDate || undefined}
        />
      </Box>

      {isLoading ? (
        <Typography>Carregando...</Typography>
      ) : reportData && reportData.attendances ? (
        <DataTable
          columns={columns}
          data={reportData.attendances}
        />
      ) : (
        <Alert severity="info">
          Selecione uma turma ou aluno para visualizar o relatório
        </Alert>
      )}
    </Box>
  );
};

export default Reports;

