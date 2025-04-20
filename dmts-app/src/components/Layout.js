import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const Layout = ({ children }) => {
  const location = useLocation();
  const isPublicPage = [
    '/login',
    '/',
    '/signup',
  ].includes(location.pathname) || location.pathname.startsWith('/setup-account/');

  if (isPublicPage) {
    return children;
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <NotificationBell />
      </Box>
    </Box>
  );
};

export default Layout;
