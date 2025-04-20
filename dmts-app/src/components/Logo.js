import React from 'react';
import { Box, Typography } from '@mui/material';
import { DevicesOther as DevicesIcon } from '@mui/icons-material';

const Logo = ({ size = 'medium' }) => {
  const sizes = {
    small: {
      iconSize: 24,
      fontSize: '1.25rem',
      spacing: 1,
    },
    medium: {
      iconSize: 32,
      fontSize: '1.5rem',
      spacing: 1.5,
    },
    large: {
      iconSize: 40,
      fontSize: '2rem',
      spacing: 2,
    },
  };

  const currentSize = sizes[size];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: currentSize.spacing,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: currentSize.iconSize * 1.5,
          height: currentSize.iconSize * 1.5,
          backgroundColor: '#2563eb',
          borderRadius: '12px',
          transform: 'rotate(-10deg)',
          boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
        }}
      >
        <DevicesIcon
          sx={{
            fontSize: currentSize.iconSize,
            color: 'white',
            transform: 'rotate(10deg)',
          }}
        />
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontSize: currentSize.fontSize,
          fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: 'white',
          letterSpacing: '-0.02em',
          '& span': {
            color: '#2563eb',
          },
        }}
      >
        <span>DM</span>TS
      </Typography>
    </Box>
  );
};

export default Logo; 