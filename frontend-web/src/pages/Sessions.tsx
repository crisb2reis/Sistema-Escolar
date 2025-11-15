import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import { Grid } from '@mui/material';
import { Add, QrCode, Visibility, Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { useDebounce } from '../hooks/useDebounce';
import { sessionsApi } from '../services/api/sessions';
import { classesApi } from '../services/api/classes';
import { sessionSchema } from '../services/validators';
import type { Session, SessionCreate } from '../types/session';
import { formatDateTime } from '../services/formatters';

const Sessions: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll(),
  });

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => sessionsApi.getAll(),
  });

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (!debouncedSearch) return sessions;
    const search = debouncedSearch.toLowerCase();
    return sessions.filter((s) => s.class?.name?.toLowerCase().includes(search));
  }, [sessions, debouncedSearch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionCreate & { class_id: string }>({
    resolver: yupResolver(sessionSchema),
    defaultValues: {
      class_id: '',
      start_at: new Date().toISOString().slice(0, 16),
    },
  });

  const createMutation = useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: SessionCreate }) =>
      sessionsApi.create(classId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setFormOpen(false);
      reset();
      toast.success('Sessão criada com sucesso!');
      navigate(`/sessions/${data.id}/live`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar sessão');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setCloseOpen(false);
      setSelectedSession(null);
      toast.success('Sessão encerrada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao encerrar sessão');
    },
  });

  const handleOpenForm = () => {
    reset({
      class_id: '',
      start_at: new Date().toISOString().slice(0, 16),
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    reset();
  };

  const onSubmit = (data: any) => {
    const { class_id, start_at } = data;
    if (!class_id || !start_at) return;
    createMutation.mutate({ 
      classId: class_id, 
      data: { start_at: String(start_at) } as any
    });
  };

  const handleCloseSession = (session: Session) => {
    setSelectedSession(session);
    setCloseOpen(true);
  };

  const confirmClose = () => {
    if (selectedSession) {
      closeMutation.mutate(selectedSession.id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Sessões</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenForm}>
          Nova Sessão
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por turma..."
        />
      </Box>

      {isLoading ? (
        <Typography>Carregando...</Typography>
      ) : filteredSessions.length === 0 ? (
        <Typography>Nenhuma sessão encontrada</Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredSessions.map((session) => (
            <Grid item xs={12} md={6} lg={4} key={session.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{session.class?.name || 'Turma'}</Typography>
                    <Chip
                      label={session.status === 'open' ? 'Aberta' : 'Fechada'}
                      color={session.status === 'open' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Início: {formatDateTime(session.start_at)}
                  </Typography>
                  {session.end_at && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fim: {formatDateTime(session.end_at)}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {session.status === 'open' && (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<QrCode />}
                          onClick={() => navigate(`/sessions/${session.id}/live`)}
                          fullWidth
                        >
                          Abrir Sessão
                        </Button>
                        <IconButton
                          color="error"
                          onClick={() => handleCloseSession(session)}
                        >
                          <Close />
                        </IconButton>
                      </>
                    )}
                    {session.status === 'closed' && (
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/sessions/${session.id}`)}
                        fullWidth
                      >
                        Ver Detalhes
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <FormDialog
        open={formOpen}
        title="Nova Sessão"
        onClose={handleCloseForm}
        onSubmit={handleSubmit(onSubmit as any)}
        loading={createMutation.isPending}
      >
        <Controller
          name="class_id"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              select
              label="Turma"
              margin="normal"
              error={!!errors.class_id}
              helperText={errors.class_id?.message}
            >
              <MenuItem value="">Selecione uma turma</MenuItem>
              {classes?.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="start_at"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type="datetime-local"
              label="Data e Hora de Início"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              error={!!errors.start_at}
              helperText={errors.start_at?.message}
            />
          )}
        />
      </FormDialog>

      <ConfirmDialog
        open={closeOpen}
        title="Encerrar Sessão"
        message={`Tem certeza que deseja encerrar esta sessão?`}
        onConfirm={confirmClose}
        onCancel={() => {
          setCloseOpen(false);
          setSelectedSession(null);
        }}
        severity="warning"
        confirmText="Encerrar"
        loading={closeMutation.isPending}
      />
    </Box>
  );
};

export default Sessions;

