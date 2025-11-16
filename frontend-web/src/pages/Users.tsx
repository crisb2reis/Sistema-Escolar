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
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, People, AdminPanelSettings } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { useDebounce } from '../hooks/useDebounce';
import { usersApi } from '../services/api/users';
import { userCreateSchema, userUpdateSchema } from '../services/validators';
import type { User, UserCreate, UserUpdate } from '../types/user';

const Users: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    retry: 1,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!debouncedSearch) return users;
    const search = debouncedSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
    );
  }, [users, debouncedSearch]);

  const isEditMode = !!selectedUser;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(isEditMode ? userUpdateSchema : userCreateSchema),
    context: { isEditMode },
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'teacher' as const,
      is_active: 'true',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      reset();
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      setSelectedUser(null);
      reset();
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar usuário');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteOpen(false);
      setSelectedUser(null);
      toast.success('Usuário deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao deletar usuário');
    },
  });

  const handleOpenForm = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setSelectedUser(null);
      reset({
        name: '',
        email: '',
        password: '',
        role: 'teacher',
        is_active: 'true',
      });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedUser(null);
    reset();
  };

  const onSubmit = (data: any) => {
    if (isEditMode) {
      // Validação manual para edição
      if (!data.password && !data.name && !data.email && !data.role) {
        toast.info('Nenhuma alteração detectada');
        return;
      }
      
      const updateData: UserUpdate = {};
      if (data.name && data.name !== selectedUser?.name) updateData.name = data.name;
      if (data.email && data.email !== selectedUser?.email) updateData.email = data.email;
      if (data.password) updateData.password = data.password;
      if (data.role && data.role !== selectedUser?.role) updateData.role = data.role;
      if (data.is_active !== selectedUser?.is_active) updateData.is_active = data.is_active;
      
      updateMutation.mutate({ id: selectedUser!.id, data: updateData });
    } else {
      // Validação manual para criação
      if (!data.password || data.password.length < 6) {
        toast.error('Senha é obrigatória e deve ter pelo menos 6 caracteres');
        return;
      }
      
      const createData: UserCreate = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      createMutation.mutate(createData);
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'teacher':
        return 'primary';
      case 'student':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'teacher':
        return 'Professor';
      case 'student':
        return 'Aluno';
      default:
        return role;
    }
  };

  const columns: Column<User>[] = [
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
      id: 'email',
      label: 'Email',
      format: (value) => value,
    },
    {
      id: 'role',
      label: 'Role',
      format: (value) => (
        <Chip
          label={getRoleLabel(value)}
          size="small"
          color={getRoleColor(value) as any}
          variant="outlined"
        />
      ),
    },
    {
      id: 'is_active',
      label: 'Status',
      format: (value) => (
        <Chip
          label={value === 'true' ? 'Ativo' : 'Inativo'}
          size="small"
          color={value === 'true' ? 'success' : 'default'}
          variant="outlined"
        />
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
            title="Editar usuário"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row)}
            title="Excluir usuário"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Estatísticas
  const totalUsers = filteredUsers.length;
  const adminCount = filteredUsers.filter((u) => u.role === 'admin').length;
  const teacherCount = filteredUsers.filter((u) => u.role === 'teacher').length;
  const studentCount = filteredUsers.filter((u) => u.role === 'student').length;

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
            <AdminPanelSettings sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Usuários
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie os usuários do sistema
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
          Novo Usuário
        </Button>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Usuários
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AdminPanelSettings color="error" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Administradores
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'error.main' }}>
                {adminCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Professores
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {teacherCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Alunos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {studentCount}
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
              <AdminPanelSettings />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lista de Usuários
            </Typography>
          }
          subheader={`${filteredUsers.length} usuário${filteredUsers.length !== 1 ? 's' : ''} encontrado${filteredUsers.length !== 1 ? 's' : ''}`}
          action={
            <Box sx={{ mr: 2 }}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome ou email..."
              />
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error instanceof Error ? error.message : 'Erro ao carregar usuários'}
            </Alert>
          )}
          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Formulário de Usuário */}
      <FormDialog
        open={formOpen}
        title={isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
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
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Senha"
              type="password"
              margin="normal"
              error={!!errors.password}
              helperText={
                errors.password?.message ||
                (isEditMode ? 'Deixe em branco para manter a senha atual' : '')
              }
            />
          )}
        />
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              select
              label="Role"
              margin="normal"
              error={!!errors.role}
              helperText={errors.role?.message}
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="teacher">Professor</MenuItem>
              <MenuItem value="student">Aluno</MenuItem>
            </TextField>
          )}
        />
        {isEditMode && (
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value === 'true'}
                    onChange={(e) => field.onChange(e.target.checked ? 'true' : 'false')}
                  />
                }
                label="Usuário Ativo"
                sx={{ mt: 2 }}
              />
            )}
          />
        )}
      </FormDialog>

      {/* Dialog de Confirmação de Delete */}
      <ConfirmDialog
        open={deleteOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário ${selectedUser?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedUser(null);
        }}
        severity="error"
        confirmText="Excluir"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default Users;

