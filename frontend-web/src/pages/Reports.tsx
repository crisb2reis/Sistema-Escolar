import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  MenuItem,
  Alert,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { Assessment, People, School, Event } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import LoadingSpinner from '../components/LoadingSpinner';
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
      format: (_, row) => (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {row.student_name || '-'}
        </Typography>
      ),
    },
    {
      id: 'timestamp',
      label: 'Data/Hora',
      format: (value) => (
        <Typography variant="body2">
          {value ? formatDateTime(value) : '-'}
        </Typography>
      ),
    },
    {
      id: 'method',
      label: 'Método',
      format: (value) => (
        <Chip
          label={value === 'qrcode' ? 'QR Code' : value === 'manual' ? 'Manual' : value}
          size="small"
          color={value === 'qrcode' ? 'primary' : value === 'manual' ? 'default' : 'secondary'}
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
  ];

  const attendancesCount = reportData?.attendances?.length || 0;
  const hasFilters = !!(classId || studentId);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const attendances = reportData?.attendances || [];
    const qrcodeCount = attendances.filter((a: Attendance) => a.method === 'qrcode').length;
    const manualCount = attendances.filter((a: Attendance) => a.method === 'manual').length;
    const uniqueStudents = new Set(attendances.map((a: Attendance) => a.student_id)).size;
    
    return {
      total: attendancesCount,
      qrcode: qrcodeCount,
      manual: manualCount,
      uniqueStudents,
    };
  }, [reportData, attendancesCount]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
            }}
          >
            <Assessment sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Relatórios de Frequência
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualize e exporte relatórios de frequência dos alunos
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Registros
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Alunos Únicos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {stats.uniqueStudents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Via QR Code
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {stats.qrcode}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="warning" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Manual
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {stats.manual}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card Principal com Filtros e Dados */}
      <Card elevation={2}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Assessment />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Relatório de Frequência
            </Typography>
          }
          subheader={
            hasFilters
              ? `${attendancesCount} registro${attendancesCount !== 1 ? 's' : ''} encontrado${attendancesCount !== 1 ? 's' : ''}`
              : 'Selecione uma turma ou aluno para visualizar o relatório'
          }
          action={
            hasFilters && (
              <Box sx={{ mr: 2 }}>
                <ExportButtons
                  classId={classId || undefined}
                  studentId={studentId || undefined}
                  fromDate={fromDate || undefined}
                  toDate={toDate || undefined}
                />
              </Box>
            )
          }
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          {/* Filtros */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={3}>
              {/* Primeira linha: Turma e Aluno */}
              {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
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
                  variant="outlined"
                >
                  <MenuItem value="">Todas as turmas</MenuItem>
                  {classes?.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.course && `- ${cls.course.name}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
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
                  variant="outlined"
                  helperText={classId ? 'Selecione uma turma primeiro ou desmarque a turma' : ''}
                >
                  <MenuItem value="">Todos os alunos</MenuItem>
                  {students?.map((student) => (
                    <MenuItem key={student.id} value={student.user_id}>
                      {student.user?.name} - {student.matricula}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* Segunda linha: Data Inicial e Data Final */}
              {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                  <DatePicker
                    label="Data Inicial"
                    value={fromDate}
                    onChange={(newValue) => setFromDate(newValue)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        variant: 'outlined',
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              {/* @ts-ignore - Grid item prop is valid in MUI v7 */}
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                  <DatePicker
                    label="Data Final"
                    value={toDate}
                    onChange={(newValue) => setToDate(newValue)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        variant: 'outlined',
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Dados do Relatório */}
          {isLoading ? (
            <LoadingSpinner message="Carregando relatório..." />
          ) : reportData && reportData.attendances && reportData.attendances.length > 0 ? (
            <DataTable
              columns={columns}
              data={reportData.attendances}
            />
          ) : hasFilters ? (
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                '& .MuiAlert-icon': {
                  fontSize: 28,
                },
              }}
            >
              Nenhum registro encontrado com os filtros selecionados.
            </Alert>
          ) : (
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                '& .MuiAlert-icon': {
                  fontSize: 28,
                },
              }}
            >
              Selecione uma turma ou aluno para visualizar o relatório de frequência.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;

