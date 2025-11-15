import React from 'react';
import {
  Typography,
  Box,
  Grid,
  Paper,
} from '@mui/material';
import {
  People,
  School,
  Assignment,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { studentsApi } from '../services/api/students';
import { classesApi } from '../services/api/classes';
import { sessionsApi } from '../services/api/sessions';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      if (user?.role === 'admin') {
        const [students, classes, sessions] = await Promise.all([
          studentsApi.getAll(0, 1),
          classesApi.getAll(0, 1),
          sessionsApi.getAll(),
        ]);

        // Contar presenças (simplificado - em produção buscar do backend)
        const attendancesCount = sessions.length * 10; // Placeholder

        return {
          studentsCount: students.length,
          classesCount: classes.length,
          sessionsCount: sessions.length,
          attendancesCount,
        };
      } else {
        // Para professores, buscar suas sessões
        const sessions = await sessionsApi.getAll();
        return {
          sessionsCount: sessions.filter((s: any) => s.status === 'open').length,
          totalSessions: sessions.length,
        };
      }
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSpinner message="Carregando estatísticas..." />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Bem-vindo, {user?.name}!
      </Typography>

      {user?.role === 'admin' ? (
        <Grid container spacing={3}>
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
      ) : (
        <Grid container spacing={3}>
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
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ações Rápidas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Em breve: gráficos e atividades recentes
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
