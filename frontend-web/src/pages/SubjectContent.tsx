import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { subjectsApi } from '../services/api/subjects';
import { classesApi } from '../services/api/classes';
import { classSubjectsApi } from '../services/api/subjects';

const SubjectContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Array<any>>([]);

  const { data: subject } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => subjectsApi.getById(id!),
    enabled: !!id,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll(),
  });

  useEffect(() => {
    if (!classes || !id) return;

    let mounted = true;

    const buildRows = async () => {
      const promises = classes.map(async (cls: any) => {
        try {
          const classSubjects = await classSubjectsApi.getByClass(cls.id);
          // find if this class has the requested subject
          const matched = classSubjects.find((cs: any) => cs.subject_id === id || cs.subject?.id === id);
          if (matched) {
            return {
              class_id: cls.id,
              disciplina: matched.subject?.name || subject?.name || '-',
              periodo: cls.periodo || cls.period || '-',
              turma: cls.name || '-',
              periodo_letivo: cls.periodo_letivo || cls.academic_period || '-',
              organizacao: cls.organization || cls.organizacao || '-',
            };
          }
        } catch (e) {
          // ignore per-class errors
        }
        return null;
      });

      const results = (await Promise.all(promises)).filter(Boolean) as Array<any>;
      if (mounted) setRows(results);
    };

    buildRows();

    return () => {
      mounted = false;
    };
  }, [classes, id, subject]);

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (
      (r.disciplina || '').toLowerCase().includes(f) ||
      (r.turma || '').toLowerCase().includes(f) ||
      (r.organizacao || '').toLowerCase().includes(f)
    );
  });

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Home / Conteúdo Programático</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f5f5f5', px: 1.5, py: 0.75, borderRadius: 1 }}>
          <FilterList sx={{ color: 'text.secondary' }} />
          <Typography color="text.secondary">Filtro</Typography>
        </Box>
        <TextField
          fullWidth
          placeholder="Digite o nome da disciplina, turma, curso, etc."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          variant="outlined"
          size="medium"
          InputProps={{ sx: { borderColor: '#e0e0e0' } }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '35%' }}>Disciplina</TableCell>
              <TableCell>Período</TableCell>
              <TableCell>Turma</TableCell>
              <TableCell>Período Letivo</TableCell>
              <TableCell>Organização</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.class_id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Button variant="text" onClick={() => navigate(`/subjects/${id}`)} sx={{ textTransform: 'none', p: 0 }}>
                        {row.disciplina}
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        {row.turma}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{row.periodo}</TableCell>
                  <TableCell>{row.turma}</TableCell>
                  <TableCell>{row.periodo_letivo}</TableCell>
                  <TableCell>{row.organizacao}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/subjects/${id}/classes/${row.class_id}/content`)}
                    >
                      Conteúdo
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SubjectContent;
