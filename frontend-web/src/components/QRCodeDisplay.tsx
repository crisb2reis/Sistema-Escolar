import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Refresh, Download } from '@mui/icons-material';

interface QRCodeDisplayProps {
  qrImageBase64: string | null;
  expiresAt: string | null;
  onRegenerate: () => void;
  loading?: boolean;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrImageBase64,
  expiresAt,
  onRegenerate,
  loading = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleDownload = () => {
    if (!qrImageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrImageBase64}`;
    link.download = 'qrcode.png';
    link.click();
  };

  return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        QR Code da Sessão
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : qrImageBase64 ? (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
              mb: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
            }}
          >
            <img
              src={`data:image/png;base64,${qrImageBase64}`}
              alt="QR Code"
              style={{ maxWidth: '100%', height: 'auto', maxHeight: '400px' }}
            />
          </Box>

          {expiresAt && (
            <Alert severity={timeRemaining === 'Expirado' ? 'error' : 'info'} sx={{ mb: 2 }}>
              Expira em: {timeRemaining}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRegenerate}
              disabled={loading}
            >
              Regenerar QR
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={handleDownload}>
              Download
            </Button>
          </Box>
        </>
      ) : (
        <Alert severity="warning">Nenhum QR Code gerado. Clique em "Gerar QR Code" para criar.</Alert>
      )}
    </Paper>
  );
};

export default QRCodeDisplay;



