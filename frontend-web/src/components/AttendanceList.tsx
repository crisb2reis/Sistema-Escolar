import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { formatDateTime } from '../services/formatters';

interface Attendance {
  id: string;
  student_id: string;
  student_name?: string;
  matricula?: string;
  timestamp: string;
  method: string;
  status?: 'present' | 'absent';
}

interface AttendanceListProps {
  attendances: Attendance[];
  students?: Array<{ id: string; user_id?: string; user?: { name: string }; matricula: string }>;
  loading?: boolean;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ attendances, students, loading }) => {
  const getStudentInfo = (studentId: string) => {
    const student = students?.find((s) => s.id === studentId || s.user_id === studentId);
    return student ? { name: student.user?.name || 'Aluno não encontrado', matricula: student.matricula } : { name: 'Aluno não encontrado', matricula: '-' };
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        Carregando presenças...
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Matrícula</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Hora do Check-in</TableCell>
            <TableCell>Método</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attendances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Nenhuma presença registrada ainda
              </TableCell>
            </TableRow>
          ) : (
            attendances.map((attendance) => {
              const studentInfo = getStudentInfo(attendance.student_id);
              const isPresent = attendance.status === 'present' || !!attendance.timestamp;

              return (
                <TableRow key={attendance.id}>
                  <TableCell>{attendance.student_name || studentInfo.name}</TableCell>
                  <TableCell>{attendance.matricula || studentInfo.matricula}</TableCell>
                  <TableCell>
                    <Chip
                      icon={isPresent ? <CheckCircle /> : <Cancel />}
                      label={isPresent ? 'Presente' : 'Ausente'}
                      color={isPresent ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {attendance.timestamp ? formatDateTime(attendance.timestamp) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={attendance.method === 'qrcode' ? 'QR Code' : 'Manual'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AttendanceList;

