import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  TextField,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Edit, Delete, Check, Close } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { classesApi } from '../services/api/classes';
import { subjectsApi } from '../services/api/subjects';
import { subjectContentsApi } from '../services/api/subjects';
import type { Class } from '../types/class';
import type { SubjectContent, SubjectContentCreate, SubjectContentUpdate } from '../types/content';

interface ContentRow {
  id: string;
  date: string;
  sessions: number;
  content: string;
  observation: string;
}

const defaultBimesters = ['Primeiro Bimestre', 'Segundo Bimestre', 'Terceiro Bimestre', 'Quarto Bimestre'];

const SubjectClassContent: React.FC = () => {
  const { subjectId, classId } = useParams<{ subjectId: string; classId: string }>();
  const { data: cls } = useQuery<Class | null>({
    queryKey: ['class', classId],
    queryFn: () => (classId ? classesApi.getById(classId) : Promise.resolve(null)),
    enabled: !!classId,
  });

  const { data: subject } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => (subjectId ? subjectsApi.getById(subjectId) : Promise.resolve(null)),
    enabled: !!subjectId,
  });

  const [bimester, setBimester] = useState(defaultBimesters[0]);
  const [rows, setRows] = useState<ContentRow[]>(() => {
    // initial empty list — UI supports adding rows
    return [];
  });
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, { date: string; sessions: number }>>({});

  useEffect(() => {
    // when subject/class/bimester change, fetch persisted contents
    // If no persisted data found, fallback to sample demo rows only on first mount
  }, []);

  // Fetch persisted contents when IDs available
  useEffect(() => {
    const load = async () => {
      if (!subjectId || !classId) return;
      try {
        const data = await subjectContentsApi.getByClassAndSubject(subjectId, classId, bimester);
        if (data && Array.isArray(data)) {
          const mapped = data.map((c: SubjectContent) => ({
            id: c.id,
            date: c.date.slice(0, 10),
            sessions: c.sessions,
            content: c.content || '',
            observation: c.observation || '',
          }));
          setRows(mapped);
          return;
        }
      } catch (err) {
        // ignore fetch errors — keep UI usable
      }

      // If no persisted data found we keep rows empty (no demo samples)
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, classId, bimester]);

  const handleAdd = () => {
    const createPayload: SubjectContentCreate = {
      date: new Date().toISOString().slice(0, 10),
      sessions: 1,
      content: '',
      observation: '',
      bimester,
    };
    // If we have subjectId/classId try to persist immediately
    if (subjectId && classId) {
      subjectContentsApi.create(subjectId, classId, createPayload).then((created: SubjectContent) => {
        const newRow: ContentRow = {
          id: created.id,
          date: created.date.slice(0, 10),
          sessions: created.sessions,
          content: created.content || '',
          observation: created.observation || '',
        };
        setRows((r) => [newRow, ...r]);
      }).catch(() => {
        // fallback to local-only if API fails
        const newRow: ContentRow = {
          id: `tmp-${Date.now()}`,
          date: createPayload.date,
          sessions: createPayload.sessions,
          content: createPayload.content || '',
          observation: createPayload.observation || '',
        };
        setRows((r) => [newRow, ...r]);
      });
    } else {
      const newRow: ContentRow = {
        id: `tmp-${Date.now()}`,
        date: createPayload.date,
        sessions: createPayload.sessions,
        content: createPayload.content || '',
        observation: createPayload.observation || '',
      };
      setRows((r) => [newRow, ...r]);
    }
  };

  const handleDelete = (id: string) => {
    const isTmp = String(id).startsWith('tmp-');
    if (!isTmp && subjectId && classId) {
      subjectContentsApi.delete(subjectId, classId, id).then(() => {
        setRows((r) => r.filter((row) => row.id !== id));
      }).catch(() => {
        // ignore error, remove locally to keep UI responsive
        setRows((r) => r.filter((row) => row.id !== id));
      });
    } else {
      setRows((r) => r.filter((row) => row.id !== id));
    }
  };

  const handleEdit = (row: ContentRow) => {
    setEditingRowId(row.id);
    setEditDrafts((d) => ({ ...d, [row.id]: { date: row.date, sessions: row.sessions } }));
  };

  const handleSaveEdit = (id: string) => {
    const draft = editDrafts[id];
    if (draft) {
      updateRow(id, { date: draft.date, sessions: draft.sessions });
      // Persist the change: if id is temporary -> create, else update
      const row = rows.find((r) => r.id === id);
      const payload: SubjectContentCreate | SubjectContentUpdate = {
        date: draft.date,
        sessions: draft.sessions,
        content: row?.content || '',
        observation: row?.observation || '',
        bimester,
      };
      const isTmp = String(id).startsWith('tmp-');
      if (subjectId && classId) {
        if (isTmp) {
          subjectContentsApi.create(subjectId, classId, payload as SubjectContentCreate).then((created: SubjectContent) => {
            // replace tmp id with real id
            setRows((r) => r.map((rr) => (rr.id === id ? { ...rr, id: created.id, date: created.date.slice(0, 10) } : rr)));
          }).catch(() => {
            // ignore
          });
        } else {
          subjectContentsApi.update(subjectId, classId, id, payload as SubjectContentUpdate).catch(() => {
            // ignore
          });
        }
      }
    }
    setEditingRowId(null);
    setEditDrafts((d) => {
      const copy = { ...d };
      delete copy[id];
      return copy;
    });
  };

  const handleCancelEdit = (id: string) => {
    setEditingRowId(null);
    setEditDrafts((d) => {
      const copy = { ...d };
      delete copy[id];
      return copy;
    });
  };


  const updateRow = (id: string, patch: Partial<ContentRow>) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const periodLabel = (cls as any)?.periodo_letivo || (cls as any)?.academic_period || '2025-02';
  const classDisplay = cls?.name || `Turma (${classId})`;
  const subjectDisplay = subject ? `${(subject as any).code} ${(subject as any).name}` : `Disciplina (${subjectId})`;

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/">Home</Link>
        <Typography color="inherit">Período Letivo ({periodLabel})</Typography>
        <Typography color="inherit">Turma ({classDisplay})</Typography>
        <Typography color="inherit">Disciplina ({subjectDisplay})</Typography>
        <Typography color="text.primary">Conteúdo Programático</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl sx={{ minWidth: 220 }} size="small">
          <Select
            value={bimester}
            onChange={(e) => setBimester(String(e.target.value))}
            sx={{ borderColor: '#e0e0e0', bgcolor: '#fff' }}
          >
            {defaultBimesters.map((b) => (
              <MenuItem key={b} value={b}>{b}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleAdd}>Adicionar Conteúdo</Button>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{bimester}</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '12%' }}>Data</TableCell>
              <TableCell sx={{ width: '50%' }}>Conteúdo</TableCell>
              <TableCell sx={{ width: '28%' }}>Observação</TableCell>
              <TableCell sx={{ width: '10%' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {editingRowId === row.id ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField
                        type="date"
                        value={editDrafts[row.id]?.date || row.date}
                        onChange={(e) => setEditDrafts((d) => ({ ...d, [row.id]: { ...(d[row.id] || { date: row.date, sessions: row.sessions }), date: e.target.value } }))}
                        size="small"
                      />
                      <TextField
                        type="number"
                        value={editDrafts[row.id]?.sessions ?? row.sessions}
                        onChange={(e) => setEditDrafts((d) => ({ ...d, [row.id]: { ...(d[row.id] || { date: row.date, sessions: row.sessions }), sessions: Number(e.target.value) } }))}
                        size="small"
                        inputProps={{ min: 1 }}
                      />
                    </Box>
                  ) : (
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{new Date(row.date).toLocaleDateString()}</Typography>
                      <Typography variant="body2" color="text.secondary"> 3 aulas</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    value={row.content}
                    onChange={(e) => updateRow(row.id, { content: e.target.value })}
                    placeholder=""
                    variant="outlined"
                    sx={{ backgroundColor: '#fff' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    value={row.observation}
                    onChange={(e) => updateRow(row.id, { observation: e.target.value })}
                    placeholder=""
                    variant="outlined"
                    sx={{ backgroundColor: '#fff' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'flex-start' }}>
                    {editingRowId === row.id ? (
                      <>
                        <IconButton size="small" color="success" onClick={() => handleSaveEdit(row.id)} title="Salvar">
                          <Check />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#555' }} onClick={() => handleCancelEdit(row.id)} title="Cancelar">
                          <Close />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" sx={{ color: '#555' }} title="Editar" onClick={() => handleEdit(row)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)} title="Excluir">
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SubjectClassContent;
