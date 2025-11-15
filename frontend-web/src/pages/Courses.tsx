import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, IconButton, TextField } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
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
    },
    {
      id: 'name',
      label: 'Nome',
    },
    {
      id: 'actions',
      label: 'Ações',
      align: 'right',
      format: (_, row) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => handleOpenForm(row)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Cursos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
          Novo Curso
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por código ou nome..."
        />
      </Box>

      <DataTable columns={columns} data={filteredCourses} loading={isLoading} />

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

