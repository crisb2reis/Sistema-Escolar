import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Stop } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import QRCodeDisplay from '../components/QRCodeDisplay';
import AttendanceList from '../components/AttendanceList';
import ConfirmDialog from '../components/ConfirmDialog';
import { sessionsApi } from '../services/api/sessions';
import { classesApi } from '../services/api/classes';
import { studentsApi } from '../services/api/students';
import { classSubjectsApi } from '../services/api/subjects';
import { formatDateTime } from '../services/formatters';

const SessionLive: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qrData, setQrData] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.getById(id!),
    enabled: !!id,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  const { data: classData } = useQuery({
    queryKey: ['class', session?.class_id],
    queryFn: () => classesApi.getById(session?.class_id!),
    enabled: !!session?.class_id,
  });

  const { data: classSubjects } = useQuery({
    queryKey: ['classSubjects', session?.class_id],
    queryFn: () => classSubjectsApi.getByClass(session?.class_id!),
    enabled: !!session?.class_id,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(),
  });

  const { data: attendances, isLoading: attendancesLoading } = useQuery({
    queryKey: ['attendances', id],
    queryFn: () => sessionsApi.getAttendances(id!),
    enabled: !!id,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  });

  const generateQRMutation = useMutation({
    mutationFn: () => sessionsApi.generateQR(id!),
    onSuccess: (data) => {
      console.log('QR Code gerado:', { 
        hasImage: !!data.qr_image_base64, 
        imageLength: data.qr_image_base64?.length,
        expiresAt: data.expires_at 
      });
      if (data.qr_image_base64) {
        setQrData(data.qr_image_base64);
        setExpiresAt(data.expires_at);
        toast.success('QR Code gerado com sucesso!');
      } else {
        toast.error('QR Code gerado mas imagem não foi retornada');
      }
    },
    onError: (error: any) => {
      console.error('Erro ao gerar QR Code:', error);
      toast.error(error.response?.data?.detail || 'Erro ao gerar QR Code');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => sessionsApi.close(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Sessão encerrada com sucesso!');
      navigate('/sessions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Erro ao encerrar sessão');
    },
  });

  useEffect(() => {
    if (session?.status === 'open' && !qrData && !generateQRMutation.isPending && id) {
      console.log('Gerando QR Code automaticamente para sessão:', id);
      generateQRMutation.mutate();
    }
  }, [session?.status, qrData, id]);

  if (sessionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box>
        <Alert severity="error">Sessão não encontrada</Alert>
        <Button onClick={() => navigate('/sessions')} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  if (session.status === 'closed') {
    return (
      <Box>
        <Alert severity="warning">Esta sessão já foi encerrada</Alert>
        <Button onClick={() => navigate('/sessions')} sx={{ mt: 2 }}>
          Voltar para Sessões
        </Button>
      </Box>
    );
  }

  const presentCount = attendances?.length || 0;
  const totalStudents = students?.filter((s) => s.class_id === session.class_id).length || 0;
  const absentCount = totalStudents - presentCount;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/sessions')}
            sx={{ mb: 1 }}
          >
            Voltar
          </Button>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {classData?.name || 'Sessão'} - {formatDateTime(session.start_at)}
          </Typography>
          {classData?.course && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
              <strong>Curso:</strong> {classData.course.name} {classData.course.code && `(${classData.course.code})`}
            </Typography>
          )}
          {session.subject ? (
            <Typography variant="body1" color="text.secondary">
              <strong>Disciplina:</strong> {session.subject.name} ({session.subject.code})
            </Typography>
          ) : classSubjects && classSubjects.length > 0 ? (
            <Typography variant="body1" color="text.secondary">
              <strong>Disciplinas da Turma:</strong>{' '}
              {classSubjects.map((cs, index) => (
                <span key={cs.id}>
                  {cs.subject?.name || 'N/A'}
                  {index < classSubjects.length - 1 && ', '}
                </span>
              ))}
            </Typography>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip label="Sessão Ativa" color="success" />
          <Button
            variant="outlined"
            color="error"
            startIcon={<Stop />}
            onClick={() => setCloseOpen(true)}
          >
            Encerrar Sessão
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <QRCodeDisplay
            qrImageBase64={qrData}
            expiresAt={expiresAt}
            onRegenerate={() => {
              setQrData(null);
              setExpiresAt(null);
              generateQRMutation.mutate();
            }}
            loading={generateQRMutation.isPending || (session?.status === 'open' && !qrData)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estatísticas
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip
                label={`Presentes: ${presentCount}`}
                color="success"
                sx={{ fontSize: '1rem', p: 2 }}
              />
              <Chip
                label={`Ausentes: ${absentCount}`}
                color="error"
                sx={{ fontSize: '1rem', p: 2 }}
              />
              <Chip
                label={`Total: ${totalStudents}`}
                sx={{ fontSize: '1rem', p: 2 }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Lista de Presenças
          </Typography>
          <AttendanceList
            attendances={
              attendances?.map((att: any) => ({
                ...att,
                status: 'present',
              })) || []
            }
            students={students}
            loading={attendancesLoading}
          />
        </Grid>
      </Grid>

      <ConfirmDialog
        open={closeOpen}
        title="Encerrar Sessão"
        message="Tem certeza que deseja encerrar esta sessão? Não será possível gerar novos QR Codes."
        onConfirm={() => {
          closeMutation.mutate();
          setCloseOpen(false);
        }}
        onCancel={() => setCloseOpen(false)}
        severity="warning"
        confirmText="Encerrar"
        loading={closeMutation.isPending}
      />
    </Box>
  );
};

export default SessionLive;

