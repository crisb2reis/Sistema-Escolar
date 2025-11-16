import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  School,
  People,
  Event,
  Class as ClassIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { classesApi } from '../services/api/classes';
import { studentsApi } from '../services/api/students';
import { sessionsApi } from '../services/api/sessions';
import { formatDateTime } from '../services/formatters';
import type { Student } from '../types/student';
import type { Session } from '../types/session';

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: classData, isLoading: classLoading, error: classError } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesApi.getById(id!),
    enabled: !!id,
  });

  const { data: allStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(0, 1000), // Aumentar limite para buscar todos os alunos
  });

  const { data: allSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsApi.getAll(),
  });

  // Filtrar alunos e sessões da turma
  const classStudents = React.useMemo(() => {
    if (!allStudents || !id) return [];
    // Normalizar comparação: converter ambos para string e remover espaços
    // Garantir que ambos sejam comparados como strings (UUIDs são case-sensitive)
    const normalizedId = String(id).trim();
    const filtered = allStudents.filter((student) => {
      // Verificar se o aluno tem class_id
      if (!student.class_id) return false;
      // Comparar normalizando ambos os valores (remover espaços e converter para string)
      const studentClassId = String(student.class_id).trim();
      return studentClassId === normalizedId;
    });
    return filtered;
  }, [allStudents, id]);

  const classSessions = React.useMemo(() => {
    if (!allSessions || !id) return [];
    // Normalizar comparação: converter ambos para string e remover espaços
    const normalizedId = String(id).trim();
    return allSessions.filter((session) => {
      if (!session.class_id) return false;
      return String(session.class_id).trim() === normalizedId;
    });
  }, [allSessions, id]);

  if (classLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (classError || !classData) {
    return (
      <Box>
        <Alert severity="error">Turma não encontrada</Alert>
        <Button onClick={() => navigate('/classes')} sx={{ mt: 2 }} startIcon={<ArrowBack />}>
          Voltar para Turmas
        </Button>
      </Box>
    );
  }

  const studentColumns: Column<Student>[] = [
    {
      id: 'matricula',
      label: 'Matrícula',
    },
    {
      id: 'name',
      label: 'Nome',
      format: (_, row) => row.user?.name || '-',
    },
    {
      id: 'email',
      label: 'Email',
      format: (_, row) => row.user?.email || '-',
    },
    {
      id: 'curso',
      label: 'Curso',
      format: (value) => value || '-',
    },
  ];

  const sessionColumns: Column<Session>[] = [
    {
      id: 'start_at',
      label: 'Data/Hora Início',
      format: (value) => (value ? formatDateTime(value) : '-'),
    },
    {
      id: 'end_at',
      label: 'Data/Hora Fim',
      format: (value) => (value ? formatDateTime(value) : '-'),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => (
        <Chip
          label={value === 'open' ? 'Aberta' : 'Fechada'}
          color={value === 'open' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Ações',
      align: 'right',
      format: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate(`/sessions/${row.id}/live`)}
          disabled={row.status !== 'open'}
        >
          Ver Detalhes
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/classes')}
          sx={{ mr: 2 }}
          variant="outlined"
        >
          Voltar
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Detalhes da Turma
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Card de Informações Principais */}
        <Grid item xs={12}>
          <Card
            elevation={2}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 64,
                    height: 64,
                    mr: 2,
                  }}
                >
                  <ClassIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {classData.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School sx={{ fontSize: 20, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ opacity: 0.95 }}>
                      {classData.course?.name || 'Curso não informado'}
                    </Typography>
                  </Box>
                  {classData.course?.code && (
                    <Chip
                      label={`Código: ${classData.course.code}`}
                      sx={{
                        mt: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 500,
                      }}
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Estatísticas Rápidas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Alunos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {classStudents.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Sessões
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {classSessions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Sessões Abertas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {classSessions.filter((s) => s.status === 'open').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="default" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Sessões Fechadas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {classSessions.filter((s) => s.status === 'closed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Alunos */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
              }
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Alunos
                </Typography>
              }
              subheader={`${classStudents.length} aluno${classStudents.length !== 1 ? 's' : ''} cadastrado${classStudents.length !== 1 ? 's' : ''}`}
            />
            <Divider />
            <CardContent sx={{ flexGrow: 1, pt: 2 }}>
              <DataTable
                columns={studentColumns}
                data={classStudents}
                loading={studentsLoading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Card de Sessões */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Event />
                </Avatar>
              }
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Sessões
                </Typography>
              }
              subheader={`${classSessions.length} sessão${classSessions.length !== 1 ? 'ões' : ''} registrada${classSessions.length !== 1 ? 's' : ''}`}
            />
            <Divider />
            <CardContent sx={{ flexGrow: 1, pt: 2 }}>
              <DataTable
                columns={sessionColumns}
                data={classSessions}
                loading={sessionsLoading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClassDetail;

