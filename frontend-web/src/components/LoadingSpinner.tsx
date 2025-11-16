import React from 'react';
import { Box, CircularProgress, Typography, Backdrop, Fade } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Carregando...', 
  fullScreen = false,
  size = 48,
}) => {
  const spinnerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 4,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
        }}
      >
        <CircularProgress
          size={size}
          thickness={4}
          sx={{
            color: 'primary.main',
            animationDuration: '1.2s',
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress
            variant="determinate"
            value={100}
            size={size}
            thickness={4}
            sx={{
              color: 'grey.200',
            }}
          />
        </Box>
      </Box>
      {message && (
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            textAlign: 'center',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.6,
              },
            },
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Fade in={true}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {spinnerContent}
          </Box>
        </Fade>
      </Backdrop>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        width: '100%',
      }}
    >
      {spinnerContent}
    </Box>
  );
};

export default LoadingSpinner;



