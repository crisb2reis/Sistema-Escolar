import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, IconButton, TextField, MenuItem } from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { useDebounce } from '../hooks/useDebounce';
import { classesApi } from '../services/api/classes';
import { coursesApi } from '../services/api/courses';
import { classSchema } from '../services/validators';
import type { Class, ClassCreate } from '../types/class';

const Classes: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getAll(),
  });

  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll(),
  });

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (!debouncedSearch) return classes;
    const search = debouncedSearch.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.course?.name.toLowerCase().includes(search)
    );
  }, [classes, debouncedSearch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassCreate>({
    resolver: yupResolver(classSchema),
    defaultValues: {
      name: '',
      course_id: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ClassCreate) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setFormOpen(false);
      reset();
      toast.success('Turma criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar turma');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassCreate> }) =>
      classesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setFormOpen(false);
      setSelectedClass(null);
      reset();
      toast.success('Turma atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar turma');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setDeleteOpen(false);
      setSelectedClass(null);
      toast.success('Turma deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao deletar turma');
    },
  });

  const handleOpenForm = (classItem?: Class) => {
    if (classItem) {
      setSelectedClass(classItem);
      reset({
        name: classItem.name,
        course_id: classItem.course_id,
      });
    } else {
      setSelectedClass(null);
      reset();
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedClass(null);
    reset();
  };

  const onSubmit = (data: ClassCreate) => {
    if (selectedClass) {
      updateMutation.mutate({ id: selectedClass.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (classItem: Class) => {
    setSelectedClass(classItem);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClass) {
      deleteMutation.mutate(selectedClass.id);
    }
  };

  const columns: Column<Class>[] = [
    {
      id: 'name',
      label: 'Nome',
    },
    {
      id: 'course',
      label: 'Curso',
      format: (_, row) => row.course?.name || '-',
    },
    {
      id: 'actions',
      label: 'Ações',
      align: 'right',
      format: (_, row) => (
        <Box>
          <IconButton
            size="small"
            color="info"
            onClick={() => navigate(`/classes/${row.id}`)}
          >
            <Visibility />
          </IconButton>
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
        <Typography variant="h4">Turmas</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
          Nova Turma
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nome ou curso..."
        />
      </Box>

      <DataTable columns={columns} data={filteredClasses} loading={isLoading} />

      <FormDialog
        open={formOpen}
        title={selectedClass ? 'Editar Turma' : 'Nova Turma'}
        onClose={handleCloseForm}
        onSubmit={handleSubmit(onSubmit)}
        loading={createMutation.isPending || updateMutation.isPending}
      >
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
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a turma ${selectedClass?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedClass(null);
        }}
        severity="error"
        confirmText="Excluir"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default Classes;

