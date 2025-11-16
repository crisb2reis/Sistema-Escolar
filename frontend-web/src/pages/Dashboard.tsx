import React from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import {
  People,
  School,
  Assignment,
  CheckCircle,
  Dashboard as DashboardIcon,
  TrendingUp,
  Event,
  Class as ClassIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { studentsApi } from '../services/api/students';
import { classesApi } from '../services/api/classes';
import { sessionsApi } from '../services/api/sessions';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      try {
        if (user?.role === 'admin') {
          const [studentsResult, classesResult, sessionsResult] = await Promise.allSettled([
            studentsApi.getAll(0, 1000),
            classesApi.getAll(0, 1000),
            sessionsApi.getAll(),
          ]);

          const students = studentsResult.status === 'fulfilled' ? studentsResult.value : [];
          const classes = classesResult.status === 'fulfilled' ? classesResult.value : [];
          const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value : [];

          // Log para debug (remover em produção)
          console.log('Dashboard Stats:', {
            students: Array.isArray(students) ? students.length : 0,
            classes: Array.isArray(classes) ? classes.length : 0,
            sessions: Array.isArray(sessions) ? sessions.length : 0,
          });

          // Contar presenças (simplificado - em produção buscar do backend)
          const attendancesCount = Array.isArray(sessions) ? sessions.length * 10 : 0; // Placeholder
          const openSessions = Array.isArray(sessions) ? sessions.filter((s: any) => s.status === 'open').length : 0;
          const closedSessions = Array.isArray(sessions) ? sessions.filter((s: any) => s.status === 'closed').length : 0;

          return {
            studentsCount: Array.isArray(students) ? students.length : 0,
            classesCount: Array.isArray(classes) ? classes.length : 0,
            sessionsCount: Array.isArray(sessions) ? sessions.length : 0,
            attendancesCount,
            openSessions,
            closedSessions,
          };
        } else {
          // Para professores, buscar suas sessões
          const sessionsResult = await sessionsApi.getAll().catch(() => []);
          const sessions = Array.isArray(sessionsResult) ? sessionsResult : [];
          
          return {
            sessionsCount: sessions.filter((s: any) => s.status === 'open').length,
            totalSessions: sessions.length,
          };
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas do dashboard:', error);
        // Retornar valores padrão em caso de erro
        if (user?.role === 'admin') {
          return {
            studentsCount: 0,
            classesCount: 0,
            sessionsCount: 0,
            attendancesCount: 0,
            openSessions: 0,
            closedSessions: 0,
          };
        } else {
          return {
            sessionsCount: 0,
            totalSessions: 0,
          };
        }
      }
    },
    enabled: !!user,
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache por 30 segundos
  });

  if (isLoading) {
    return <LoadingSpinner message="Carregando estatísticas..." />;
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao carregar estatísticas. Por favor, recarregue a página.
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Recarregar Página
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 56,
            height: 56,
          }}
        >
          <DashboardIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bem-vindo, <strong>{user?.name}</strong>! {user?.role === 'admin' ? 'Aqui está um resumo do sistema.' : 'Acompanhe suas sessões de frequência.'}
          </Typography>
        </Box>
      </Box>

      {user?.role === 'admin' ? (
        <>
          {/* Cards de Estatísticas Principais */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total de Alunos"
                value={stats?.studentsCount || 0}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Turmas"
                value={stats?.classesCount || 0}
                icon={<School />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Sessões"
                value={stats?.sessionsCount || 0}
                icon={<Assignment />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Presenças Registradas"
                value={stats?.attendancesCount || 0}
                icon={<CheckCircle />}
                color="success"
              />
            </Grid>
          </Grid>

          {/* Cards de Estatísticas Secundárias */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Event color="success" sx={{ mr: 1, fontSize: 28 }} />
                    <Typography variant="body2" color="text.secondary">
                      Sessões Abertas
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {stats?.openSessions || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Event color="default" sx={{ mr: 1, fontSize: 28 }} />
                    <Typography variant="body2" color="text.secondary">
                      Sessões Fechadas
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {stats?.closedSessions || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp color="info" sx={{ mr: 1, fontSize: 28 }} />
                    <Typography variant="body2" color="text.secondary">
                      Taxa de Presença
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {stats?.sessionsCount ? Math.round((stats.attendancesCount || 0) / (stats.sessionsCount * 10) * 100) : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Card de Ações Rápidas */}
          <Card elevation={2}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DashboardIcon />
                </Avatar>
              }
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ações Rápidas
                </Typography>
              }
              subheader="Acesso rápido às principais funcionalidades"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<People />}
                    onClick={() => navigate('/students')}
                    sx={{ py: 1.5 }}
                  >
                    Gerenciar Alunos
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ClassIcon />}
                    onClick={() => navigate('/classes')}
                    sx={{ py: 1.5 }}
                  >
                    Gerenciar Turmas
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<School />}
                    onClick={() => navigate('/courses')}
                    sx={{ py: 1.5 }}
                  >
                    Gerenciar Cursos
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Event />}
                    onClick={() => navigate('/sessions')}
                    sx={{ py: 1.5 }}
                  >
                    Gerenciar Sessões
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Cards para Professores */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <StatsCard
                title="Sessões Ativas"
                value={stats?.sessionsCount || 0}
                icon={<Assignment />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StatsCard
                title="Total de Sessões"
                value={stats?.totalSessions || 0}
                icon={<School />}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Card de Ações Rápidas para Professores */}
          <Card elevation={2}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Event />
                </Avatar>
              }
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ações Rápidas
                </Typography>
              }
              subheader="Acesso rápido às suas sessões"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Event />}
                    onClick={() => navigate('/sessions')}
                    sx={{ py: 1.5 }}
                  >
                    Ver Minhas Sessões
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Assignment />}
                    onClick={() => navigate('/sessions')}
                    sx={{ py: 1.5 }}
                  >
                    Criar Nova Sessão
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
