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
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Class as ClassIcon, School } from '@mui/icons-material';
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
            <School sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body1">{row.course.name}</Typography>
            {row.course.code && (
              <Chip
                label={row.course.code}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
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
            color="info"
            onClick={() => navigate(`/classes/${row.id}`)}
            title="Visualizar detalhes"
          >
            <Visibility />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenForm(row)}
            title="Editar turma"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row)}
            title="Excluir turma"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Estatísticas
  const totalClasses = filteredClasses.length;
  const classesWithCourse = filteredClasses.filter((c) => c.course).length;

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
            <ClassIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Turmas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie as turmas do sistema
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
          Nova Turma
        </Button>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ClassIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Turmas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalClasses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Com Curso
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {classesWithCourse}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="warning" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Sem Curso
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {totalClasses - classesWithCourse}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Resultados da Busca
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {filteredClasses.length}
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
              <ClassIcon />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lista de Turmas
            </Typography>
          }
          subheader={`${filteredClasses.length} turma${filteredClasses.length !== 1 ? 's' : ''} encontrada${filteredClasses.length !== 1 ? 's' : ''}`}
          action={
            <Box sx={{ mr: 2 }}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome ou curso..."
              />
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          <DataTable columns={columns} data={filteredClasses} loading={isLoading} />
        </CardContent>
      </Card>

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

