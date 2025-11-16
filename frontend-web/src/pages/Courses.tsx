import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, School } from '@mui/icons-material';
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
import { coursesApi } from '../services/api/courses';
import { courseSchema } from '../services/validators';
import type { Course, CourseCreate } from '../types/course';

const Courses: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getAll(),
  });

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (!debouncedSearch) return courses;
    const search = debouncedSearch.toLowerCase();
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search)
    );
  }, [courses, debouncedSearch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseCreate>({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      code: '',
      name: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CourseCreate) => coursesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setFormOpen(false);
      reset();
      toast.success('Curso criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar curso');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseCreate> }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setFormOpen(false);
      setSelectedCourse(null);
      reset();
      toast.success('Curso atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar curso');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDeleteOpen(false);
      setSelectedCourse(null);
      toast.success('Curso deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao deletar curso');
    },
  });

  const handleOpenForm = (course?: Course) => {
    if (course) {
      setSelectedCourse(course);
      reset({
        code: course.code,
        name: course.name,
      });
    } else {
      setSelectedCourse(null);
      reset();
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedCourse(null);
    reset();
  };

  const onSubmit = (data: CourseCreate) => {
    if (selectedCourse) {
      updateMutation.mutate({ id: selectedCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (course: Course) => {
    setSelectedCourse(course);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCourse) {
      deleteMutation.mutate(selectedCourse.id);
    }
  };

  const columns: Column<Course>[] = [
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
      id: 'actions',
      label: 'Ações',
      align: 'right',
      format: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenForm(row)}
            title="Editar curso"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row)}
            title="Excluir curso"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Estatísticas
  const totalCourses = filteredCourses.length;

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
            <School sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Cursos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie os cursos do sistema
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
          Novo Curso
        </Button>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Cursos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalCourses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Cursos Cadastrados
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {totalCourses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Resultados da Busca
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {filteredCourses.length}
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
              <School />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lista de Cursos
            </Typography>
          }
          subheader={`${filteredCourses.length} curso${filteredCourses.length !== 1 ? 's' : ''} encontrado${filteredCourses.length !== 1 ? 's' : ''}`}
          action={
            <Box sx={{ mr: 2 }}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por código ou nome..."
              />
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          <DataTable columns={columns} data={filteredCourses} loading={isLoading} />
        </CardContent>
      </Card>

      <FormDialog
        open={formOpen}
        title={selectedCourse ? 'Editar Curso' : 'Novo Curso'}
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
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o curso ${selectedCourse?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedCourse(null);
        }}
        severity="error"
        confirmText="Excluir"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default Courses;

