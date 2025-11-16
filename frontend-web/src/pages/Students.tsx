import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
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
import { Add, Edit, Delete, Upload, People } from '@mui/icons-material';
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
import { coursesApi } from '../services/api/courses';
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

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getAll(),
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
    mutationFn: (data: StudentCreate) => {
      console.log('Enviando dados:', data);
      return studentsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setFormOpen(false);
      reset();
      toast.success('Aluno criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar aluno:', error);
      const errorDetail = error.response?.data?.detail;
      let errorMessage = 'Erro ao criar aluno';
      
      if (errorDetail) {
        if (Array.isArray(errorDetail)) {
          // FastAPI retorna array de erros de validação
          errorMessage = errorDetail.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
        } else if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        } else {
          errorMessage = JSON.stringify(errorDetail);
        }
      }
      
      toast.error(errorMessage);
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
    console.log('Dados do formulário:', data);
    
    // Função auxiliar para tratar valores vazios
    const cleanValue = (value: any): string | undefined => {
      if (!value) return undefined;
      const str = String(value).trim();
      return str !== '' ? str : undefined;
    };

    const submitData: StudentCreate = {
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      matricula: data.matricula?.trim(),
      curso: cleanValue(data.curso),
      class_id: cleanValue(data.class_id),
      password: cleanValue(data.password),
    };
    
    console.log('Dados processados para envio:', submitData);
    
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
      id: 'name',
      label: 'Nome',
      format: (_, row) => (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {row.user?.name || '-'}
        </Typography>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      format: (_, row) => row.user?.email || '-',
    },
    {
      id: 'matricula',
      label: 'Matrícula',
      format: (value) => (
        <Chip label={value} size="small" variant="outlined" color="primary" />
      ),
    },
    {
      id: 'curso',
      label: 'Curso',
      format: (value) => value ? (
        <Chip label={value} size="small" color="info" variant="outlined" />
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
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
            title="Editar aluno"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row)}
            title="Excluir aluno"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Estatísticas
  const totalStudents = filteredStudents.length;
  const studentsWithClass = filteredStudents.filter((s) => s.class_id).length;
  const studentsWithCourse = filteredStudents.filter((s) => s.curso).length;

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
            <People sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Alunos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie os alunos do sistema
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setUploadOpen(true)}
            size="large"
          >
            Upload CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenForm()}
            size="large"
            sx={{ px: 3 }}
          >
            Novo Aluno
          </Button>
        </Box>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Total de Alunos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {totalStudents}
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
                  Com Turma
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                {studentsWithClass}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Com Curso
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                {studentsWithCourse}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People color="warning" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Resultados da Busca
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {filteredStudents.length}
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
              <People />
            </Avatar>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lista de Alunos
            </Typography>
          }
          subheader={`${filteredStudents.length} aluno${filteredStudents.length !== 1 ? 's' : ''} encontrado${filteredStudents.length !== 1 ? 's' : ''}`}
          action={
            <Box sx={{ mr: 2 }}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, email ou matrícula..."
              />
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          <DataTable
            columns={columns}
            data={filteredStudents}
            loading={isLoading}
          />
        </CardContent>
      </Card>

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
              select
              label="Curso"
              margin="normal"
              error={!!errors.curso}
              helperText={errors.curso?.message}
            >
              <MenuItem value="">Selecione um curso</MenuItem>
              {courses?.map((course) => (
                <MenuItem key={course.id} value={course.name}>
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

