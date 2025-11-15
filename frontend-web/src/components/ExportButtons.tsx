import React from 'react';
import { Button, ButtonGroup, Box } from '@mui/material';
import { FileDownload, PictureAsPdf, TableChart } from '@mui/icons-material';
import api from '../services/api';

interface ExportButtonsProps {
  sessionId?: string;
  classId?: string;
  studentId?: string;
  fromDate?: Date;
  toDate?: Date;
  disabled?: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  sessionId,
  classId,
  studentId,
  fromDate,
  toDate,
  disabled = false,
}) => {
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (classId) params.append('class_id', classId);
    if (studentId) params.append('student_id', studentId);
    if (fromDate) params.append('from_date', fromDate.toISOString());
    if (toDate) params.append('to_date', toDate.toISOString());
    return params.toString();
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const params = buildQueryParams();
      const response = await api.get(`/reports/attendance/${format}?${params}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_frequencia.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Erro ao exportar ${format}:`, error);
    }
  };

  return (
    <Box>
      <ButtonGroup variant="outlined" disabled={disabled}>
        <Button
          startIcon={<FileDownload />}
          onClick={() => handleExport('csv')}
        >
          CSV
        </Button>
        <Button
          startIcon={<TableChart />}
          onClick={() => handleExport('xlsx')}
        >
          Excel
        </Button>
        <Button
          startIcon={<PictureAsPdf />}
          onClick={() => handleExport('pdf')}
        >
          PDF
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default ExportButtons;



