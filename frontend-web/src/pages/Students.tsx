import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, Upload } from '@mui/icons-material';
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
import { studentsApi } from '../services/api/students';
import { classesApi } from '../services/api/classes';
import { studentSchema } from '../services/validators';
import type { Student, StudentCreate } from '../types/student';

const Students: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll(),
  });

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(),
  });

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!debouncedSearch) return students;
    const search = debouncedSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.user?.name?.toLowerCase().includes(search) ||
        s.user?.email?.toLowerCase().includes(search) ||
        s.matricula?.toLowerCase().includes(search)
    );
  }, [students, debouncedSearch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(studentSchema),
    defaultValues: {
      name: '',
      email: '',
      matricula: '',
      curso: '',
      class_id: '',
      password: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: StudentCreate) => studentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setFormOpen(false);
      reset();
      toast.success('Aluno criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar aluno');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentCreate> }) =>
      studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setFormOpen(false);
      setSelectedStudent(null);
      reset();
      toast.success('Aluno atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar aluno');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteOpen(false);
      setSelectedStudent(null);
      toast.success('Aluno deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao deletar aluno');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => studentsApi.uploadCSV(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setUploadOpen(false);
      setSelectedFile(null);
      toast.success(
        `Importação concluída! ${data.success_count} sucessos, ${data.error_count} erros.`
      );
      if (data.error_count > 0) {
        console.log('Erros:', data.errors);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao importar CSV');
    },
  });

  const handleOpenForm = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      reset({
        name: student.user?.name || '',
        email: student.user?.email || '',
        matricula: student.matricula,
        curso: student.curso || '',
        class_id: student.class_id || '',
      });
    } else {
      setSelectedStudent(null);
      reset();
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedStudent(null);
    reset();
  };

  const onSubmit = (data: any) => {
    const submitData: StudentCreate = {
      name: data.name,
      email: data.email,
      matricula: data.matricula,
      curso: data.curso || undefined,
      class_id: data.class_id || undefined,
      password: data.password || undefined,
    };
    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedStudent) {
      deleteMutation.mutate(selectedStudent.id);
    }
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const columns: Column<Student>[] = [
    {
      id: 'user',
      label: 'Nome',
      format: (_, row) => row.user?.name || '-',
    },
    {
      id: 'user',
      label: 'Email',
      format: (_, row) => row.user?.email || '-',
    },
    {
      id: 'matricula',
      label: 'Matrícula',
    },
    {
      id: 'curso',
      label: 'Curso',
      format: (value) => value || '-',
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
        <Typography variant="h4">Alunos</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setUploadOpen(true)}
          >
            Upload CSV
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
            Novo Aluno
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nome, email ou matrícula..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={filteredStudents}
        loading={isLoading}
      />

      {/* Formulário de Aluno */}
      <FormDialog
        open={formOpen}
        title={selectedStudent ? 'Editar Aluno' : 'Novo Aluno'}
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
          name="matricula"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Matrícula"
              margin="normal"
              error={!!errors.matricula}
              helperText={errors.matricula?.message}
            />
          )}
        />
        <Controller
          name="curso"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Curso"
              margin="normal"
            />
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
            >
              <MenuItem value="">Nenhuma</MenuItem>
              {classes?.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {!selectedStudent && (
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
                helperText={errors.password?.message || 'Deixe em branco para senha padrão'}
              />
            )}
          />
        )}
      </FormDialog>

      {/* Dialog de Upload CSV */}
      <FormDialog
        open={uploadOpen}
        title="Upload de Alunos via CSV"
        onClose={() => {
          setUploadOpen(false);
          setSelectedFile(null);
        }}
        onSubmit={handleFileUpload}
        submitText="Importar"
        loading={uploadMutation.isPending}
      >
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          style={{ marginTop: '16px' }}
        />
        {selectedFile && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Arquivo selecionado: {selectedFile.name}
          </Alert>
        )}
        <Alert severity="info" sx={{ mt: 2 }}>
          O arquivo CSV deve conter as colunas: name, email, matricula, curso (opcional), class (opcional)
        </Alert>
      </FormDialog>

      {/* Dialog de Confirmação de Delete */}
      <ConfirmDialog
        open={deleteOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o aluno ${selectedStudent?.user?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedStudent(null);
        }}
        severity="error"
        confirmText="Excluir"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default Students;

