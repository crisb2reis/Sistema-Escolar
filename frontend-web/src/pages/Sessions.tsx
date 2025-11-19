import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  Grid,
  Avatar,
  Divider,
} from '@mui/material';
import { Add, QrCode, Visibility, Close, Event } from '@mui/icons-material';
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
import { coursesApi } from '../services/api/courses';
import { classSubjectsApi } from '../services/api/subjects';
import { sessionSchema } from '../services/validators';
import * as yup from 'yup';
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

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getAll(),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll(),
  });

  // CORREÇÃO: Renomear para sessions (minúsculo)
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => sessionsApi.getAll(),
  });

  // Filtrar turmas por curso selecionado
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (!selectedCourseId) return classes;
    return classes.filter((cls) => cls.course_id === selectedCourseId);
  }, [classes, selectedCourseId]);

  // Extend the schema to include course_id
  const sessionFormSchema = sessionSchema.shape({
    course_id: yup.string().required('Curso é obrigatório'),
    class_id: yup.string().required('Turma é obrigatória'),
    subject_id: yup.string().optional(),
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SessionCreate & { course_id: string; class_id: string; subject_id: string }>({
    resolver: yupResolver(sessionFormSchema),
    defaultValues: {
      course_id: '',
      class_id: '',
      subject_id: '',
      start_at: new Date().toISOString().slice(0, 16),
    },
  });

  // Declarar watch ANTES das queries que os utilizam
  const watchedCourseId = watch('course_id');
  const watchedClassId = watch('class_id');

  // Buscar disciplinas da turma selecionada
  const { data: classSubjects, isLoading: classSubjectsLoading, error: classSubjectsError } = useQuery({
    queryKey: ['classSubjects', watchedClassId],
    queryFn: () => classSubjectsApi.getByClass(watchedClassId),
    enabled: !!watchedClassId,
  });

  // CORREÇÃO: Usar sessions (minúsculo) em vez de Sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (!debouncedSearch) return sessions;
    const search = debouncedSearch.toLowerCase();
    return sessions.filter((s) => s.class?.name?.toLowerCase().includes(search));
  }, [sessions, debouncedSearch]);

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
      course_id: '',
      class_id: '',
      subject_id: '',
      start_at: new Date().toISOString().slice(0, 16),
    });
    setSelectedCourseId('');
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    reset();
  };

  const onSubmit = (data: any) => {
    const { class_id, start_at, subject_id } = data;
    if (!class_id || !start_at) return;
    createMutation.mutate({ 
      classId: class_id, 
      data: { 
        start_at: String(start_at),
        subject_id: subject_id || undefined
      } as SessionCreate
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

  // Estatísticas
  const totalSessions = filteredSessions.length;
  const openSessions = filteredSessions.filter((s) => s.status === 'open').length;
  const closedSessions = filteredSessions.filter((s) => s.status === 'closed').length;

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
            <Event sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Sessões
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie as sessões de frequência
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenForm}
          size="large"
          sx={{ px: 3 }}
        >
          Nova Sessão
        </Button>
      </Box>

      {/* Cards de Estatísticas */}
      {/* CORREÇÃO: Remover a propriedade 'component' problemática */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Sessões
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Sessões Abertas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {openSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="default" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Sessões Fechadas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {closedSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Resultados da Busca
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {filteredSessions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card com Lista de Sessões */}
      <Card elevation={2}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Event />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lista de Sessões
            </Typography>
          }
          subheader={`${filteredSessions.length} sessão${filteredSessions.length !== 1 ? 'ões' : ''} encontrada${filteredSessions.length !== 1 ? 's' : ''}`}
          action={
            <Box sx={{ mr: 2 }}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por turma..."
              />
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>Carregando...</Typography>
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography color="text.secondary">Nenhuma sessão encontrada</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredSessions.map((session) => (
                <Grid item xs={12} md={6} lg={4} key={session.id}>
                  <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {session.class?.name || 'Turma'}
                        </Typography>
                        <Chip
                          label={session.status === 'open' ? 'Aberta' : 'Fechada'}
                          color={session.status === 'open' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Início:</strong> {formatDateTime(session.start_at)}
                      </Typography>
                      {session.end_at && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Fim:</strong> {formatDateTime(session.end_at)}
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
                              size="small"
                            >
                              Abrir Sessão
                            </Button>
                            <IconButton
                              color="error"
                              onClick={() => handleCloseSession(session)}
                              title="Encerrar sessão"
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
                            size="small"
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
        </CardContent>
      </Card>

      <FormDialog
        open={formOpen}
        title="Nova Sessão"
        onClose={handleCloseForm}
        onSubmit={handleSubmit(onSubmit as any)}
        loading={createMutation.isPending}
      >
        <Controller
          name="course_id"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              select
              label="Curso"
              margin="normal"
              error={!!errors.course_id}
              helperText={errors.course_id?.message}
              onChange={(e) => {
                field.onChange(e);
                setSelectedCourseId(e.target.value);
                // Limpar turma e disciplina quando curso mudar
                setValue('class_id', '');
                setValue('subject_id', '');
              }}
            >
              <MenuItem value="">Selecione um curso</MenuItem>
              {courses?.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
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
              disabled={!!watchedCourseId && !filteredClasses.length}
              onChange={(e) => {
                field.onChange(e);
                // Limpar disciplina quando turma mudar
                setValue('subject_id', '');
              }}
            >
              <MenuItem value="">Selecione uma turma</MenuItem>
              {filteredClasses?.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.course && `- ${cls.course.name}`}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="subject_id"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              select
              label="Disciplina"
              margin="normal"
              error={!!errors.subject_id}
              helperText={
                errors.subject_id?.message ||
                (classSubjectsLoading ? 'Carregando disciplinas...' :
                 classSubjectsError ? 'Erro ao carregar disciplinas' :
                 !watchedClassId ? 'Selecione uma turma primeiro' :
                 classSubjects && classSubjects.length === 0 ? 'Esta turma não possui disciplinas associadas' :
                 'Opcional - selecione a disciplina da sessão')
              }
              disabled={!watchedClassId || classSubjectsLoading}
            >
              <MenuItem value="">Nenhuma disciplina (opcional)</MenuItem>
              {classSubjects && classSubjects.length > 0 && classSubjects.map((cs) => (
                <MenuItem key={cs.id} value={cs.subject_id}>
                  {cs.subject?.code} - {cs.subject?.name}
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