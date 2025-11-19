import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Chip, Alert, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import AttendanceList from '../components/AttendanceList';
import { sessionsApi } from '../services/api/sessions';
import { classesApi } from '../services/api/classes';
import { studentsApi } from '../services/api/students';
import { classSubjectsApi } from '../services/api/subjects';
import { formatDateTime } from '../services/formatters';

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.getById(id!),
    enabled: !!id,
  });

  const { data: classData } = useQuery({
    queryKey: ['class', session?.class_id],
    queryFn: () => classesApi.getById(session?.class_id!),
    enabled: !!session?.class_id,
  });

  const { data: classSubjects } = useQuery({
    queryKey: ['classSubjects', session?.class_id],
    queryFn: () => classSubjectsApi.getByClass(session?.class_id!),
    enabled: !!session?.class_id,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(),
  });

  const { data: attendances, isLoading: attendancesLoading } = useQuery({
    queryKey: ['attendances', id],
    queryFn: () => sessionsApi.getAttendances(id!),
    enabled: !!id,
  });

  if (sessionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box>
        <Alert severity="error">Sessão não encontrada</Alert>
        <Button onClick={() => navigate('/sessions')} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  const presentCount = attendances?.length || 0;
  const totalStudents = students?.filter((s) => s.class_id === session.class_id).length || 0;
  const absentCount = totalStudents - presentCount;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/sessions')} sx={{ mb: 1 }}>
            Voltar
          </Button>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {classData?.name || 'Sessão'} - {formatDateTime(session.start_at)}
          </Typography>
          {classData?.course && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
              <strong>Curso:</strong> {classData.course.name} {classData.course.code && `(${classData.course.code})`}
            </Typography>
          )}
          {session.subject ? (
            <Typography variant="body1" color="text.secondary">
              <strong>Disciplina:</strong> {session.subject.name} ({session.subject.code})
            </Typography>
          ) : classSubjects && classSubjects.length > 0 ? (
            <Typography variant="body1" color="text.secondary">
              <strong>Disciplinas da Turma:</strong>{' '}
              {classSubjects.map((cs, index) => (
                <span key={cs.id}>
                  {cs.subject?.name || 'N/A'}
                  {index < classSubjects.length - 1 && ', '}
                </span>
              ))}
            </Typography>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip label={session.status === 'open' ? 'Sessão Ativa' : 'Sessão Encerrada'} color={session.status === 'open' ? 'success' : 'default'} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Estatísticas
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Chip label={`Presentes: ${presentCount}`} color="success" sx={{ fontSize: '1rem', p: 2 }} />
            <Chip label={`Ausentes: ${absentCount}`} color="error" sx={{ fontSize: '1rem', p: 2 }} />
            <Chip label={`Total: ${totalStudents}`} sx={{ fontSize: '1rem', p: 2 }} />
          </Box>
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>
            Lista de Presenças
          </Typography>
          <AttendanceList
            attendances={
              attendances?.map((att: any) => ({
                ...att,
                status: 'present',
              })) || []
            }
            students={students}
            loading={attendancesLoading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SessionDetail;
