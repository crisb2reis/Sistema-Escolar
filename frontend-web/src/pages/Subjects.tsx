import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Add, Edit, Delete, MenuBook } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { useDebounce } from '../hooks/useDebounce';
import { subjectsApi } from '../services/api/subjects';
import { coursesApi } from '../services/api/courses';
import { classesApi } from '../services/api/classes';
import { subjectSchema } from '../services/validators';
import type { Subject, SubjectCreate } from '../types/subject';
import type { Class } from '../types/class';

const Subjects: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getAll(),
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll(),
  });

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects', courseFilter],
    queryFn: () => subjectsApi.getAll(0, 1000, courseFilter || undefined),
  });

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!debouncedSearch) return subjects;
    const search = debouncedSearch.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search) ||
        s.course?.name.toLowerCase().includes(search)
    );
  }, [subjects, debouncedSearch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SubjectCreate>({
    resolver: yupResolver(subjectSchema),
    defaultValues: {
      code: '',
      name: '',
      course_id: '',
      class_ids: [],
    },
  });

  const watchedCourseId = watch('course_id');
  
  // Filtrar turmas do curso selecionado
  const filteredClasses = useMemo(() => {
    if (!classes || !watchedCourseId) return [];
    return classes.filter((cls) => cls.course_id === watchedCourseId);
  }, [classes, watchedCourseId]);

  const createMutation = useMutation({
    mutationFn: (data: SubjectCreate) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setFormOpen(false);
      reset();
      toast.success('Disciplina criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar disciplina');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubjectCreate> }) =>
      subjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setFormOpen(false);
      setSelectedSubject(null);
      reset();
      toast.success('Disciplina atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar disciplina');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setDeleteOpen(false);
      setSelectedSubject(null);
      toast.success('Disciplina deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao deletar disciplina');
    },
  });

  const handleOpenForm = (subject?: Subject) => {
    if (subject) {
      setSelectedSubject(subject);
      reset({
        code: subject.code,
        name: subject.name,
        course_id: subject.course_id,
        class_ids: [],
      });
    } else {
      setSelectedSubject(null);
      reset({
        code: '',
        name: '',
        course_id: '',
        class_ids: [],
      });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedSubject(null);
    reset();
  };

  const onSubmit = (data: SubjectCreate) => {
    // Garantir que class_ids seja um array ou undefined
    const submitData: SubjectCreate = {
      ...data,
      class_ids: data.class_ids && data.class_ids.length > 0 ? data.class_ids : undefined,
    };
    
    if (selectedSubject) {
      updateMutation.mutate({ id: selectedSubject.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSubject) {
      deleteMutation.mutate(selectedSubject.id);
    }
  };

  const subjectsByCourse = useMemo(() => {
    if (!subjects) return {};
    return subjects.reduce((acc, subject) => {
      const courseId = subject.course_id;
      if (!acc[courseId]) {
        acc[courseId] = 0;
      }
      acc[courseId]++;
      return acc;
    }, {} as Record<string, number>);
  }, [subjects]);

  const columns: Column<Subject>[] = [
    {
      id: 'code',
      label: 'Código',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      id: 'name',
      label: 'Nome',
      format: (value) => (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'course',
      label: 'Curso',
      format: (_, row) =>
        row.course ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={row.course.code}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
            <Typography variant="body2" color="text.secondary">
              {row.course.name}
            </Typography>
          </Box>
        ) : (
          <Chip label="Sem curso" size="small" color="warning" variant="outlined" />
        ),
    },
    {
      id: 'actions',
      label: 'Ações',
      align: 'right',
      format: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenForm(row)}
            title="Editar disciplina"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row)}
            title="Excluir disciplina"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Estatísticas
  const totalSubjects = filteredSubjects.length;
  const uniqueCourses = new Set(filteredSubjects.map((s) => s.course_id)).size;

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
            <MenuBook sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Disciplinas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie as disciplinas do sistema
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenForm()}
          size="large"
          sx={{ px: 3 }}
        >
          Nova Disciplina
        </Button>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MenuBook color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Disciplinas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalSubjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MenuBook color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Cursos com Disciplinas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {uniqueCourses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MenuBook color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Resultados da Busca
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {filteredSubjects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card da Tabela */}
      <Card elevation={2}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <MenuBook />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lista de Disciplinas
            </Typography>
          }
          subheader={`${filteredSubjects.length} disciplina${filteredSubjects.length !== 1 ? 's' : ''} encontrada${filteredSubjects.length !== 1 ? 's' : ''}`}
          action={
            <Box sx={{ display: 'flex', gap: 2, mr: 2, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Filtrar por Curso"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todos os cursos</MenuItem>
                {courses?.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </MenuItem>
                ))}
              </TextField>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por código, nome ou curso..."
              />
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          <DataTable columns={columns} data={filteredSubjects} loading={isLoading} />
        </CardContent>
      </Card>

      <FormDialog
        open={formOpen}
        title={selectedSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
        onClose={handleCloseForm}
        onSubmit={handleSubmit(onSubmit)}
        loading={createMutation.isPending || updateMutation.isPending}
      >
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Código"
              margin="normal"
              error={!!errors.code}
              helperText={errors.code?.message}
            />
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nome"
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
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
                // Limpar seleção de turmas quando curso mudar
                setValue('class_ids', []);
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
          name="class_ids"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth margin="normal">
              <InputLabel id="class-ids-label">Turmas (Opcional)</InputLabel>
              <Select
                {...field}
                labelId="class-ids-label"
                label="Turmas (Opcional)"
                multiple
                input={<OutlinedInput label="Turmas (Opcional)" />}
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) return 'Nenhuma turma selecionada';
                  const selectedClasses = filteredClasses.filter((cls) => selected.includes(cls.id));
                  return selectedClasses.map((cls) => cls.name).join(', ');
                }}
                disabled={!watchedCourseId || filteredClasses.length === 0}
              >
                {filteredClasses.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    <Checkbox checked={field.value?.includes(cls.id) || false} />
                    <ListItemText primary={cls.name} />
                  </MenuItem>
                ))}
              </Select>
              {errors.class_ids && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {errors.class_ids.message}
                </Typography>
              )}
              {!watchedCourseId && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                  Selecione um curso primeiro
                </Typography>
              )}
              {watchedCourseId && filteredClasses.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                  Este curso não possui turmas cadastradas
                </Typography>
              )}
            </FormControl>
          )}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a disciplina ${selectedSubject?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedSubject(null);
        }}
        severity="error"
        confirmText="Excluir"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default Subjects;


