import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Typography,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Computer as DevicesIcon,
  People as UsersIcon,
  Warning as IssuesIcon,
  Assignment as AuditIcon,
  Build as MaintenanceIcon,
  Assessment as ReportsIcon,
  BugReport as IssueReportIcon,
  Feedback as FeedbackIcon,
  AccountCircle as ProfileIcon,
  ExitToApp as LogoutIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,

} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Logo from './Logo';

const StyledSidebar = styled(Box)(({ theme }) => ({
  width: '250px',
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  backgroundColor: '#1a1a1a',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 1200,
  [theme.breakpoints.down('sm')]: {
    width: '60px',
    minWidth: '60px',
    '& .MuiListItemText-root': {
      display: 'none',
    },
    '& .MuiTypography-root': {
      display: 'none',
    },
  },
}));

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  marginBottom: '4px',
  borderRadius: '8px',
  color: active ? 'white' : 'rgba(255, 255, 255, 0.6)',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
  },
  '& .MuiListItemIcon-root': {
    color: 'inherit',
    minWidth: '40px',
  },
  '& .MuiTypography-root': {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: active ? 500 : 400,
  },
}));

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("email");
    localStorage.removeItem("username");
    localStorage.removeItem("department");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // Common menu items for both roles
  const commonMenuItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Employee menu items
  const employeeMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/employee-dashboard' },
    { text: 'Issue Report', icon: <IssueReportIcon />, path: '/issue-report' },

    { text: 'Feedback', icon: <FeedbackIcon />, path: '/feedback' },
  ];

  // Admin menu items
  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin-dashboard' },
    { text: 'User Management', icon: <UsersIcon />, path: '/users' },
    { text: 'Device Management', icon: <DevicesIcon />, path: '/devices' },
    { text: 'Issue Management', icon: <IssuesIcon />, path: '/issues' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Audit Logs', icon: <AuditIcon />, path: '/audit-logs' },
  ];

  // Operations menu items
  const operationsMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/operations-dashboard' },
    { text: 'Maintenance Management', icon: <MaintenanceIcon />, path: '/maintenance' },
    { text: 'Device Clearance', icon: <DevicesIcon />, path: '/device-clearance' },
  ];

  // Combine menu items based on role
  let menuItems;
  if (userRole === 'Admin') {
    menuItems = [...adminMenuItems, ...commonMenuItems];
  } else if (userRole === 'Operations') {
    menuItems = [...operationsMenuItems, ...commonMenuItems];
  } else {
    menuItems = [...employeeMenuItems, ...commonMenuItems];
  }

  return (
    <StyledSidebar>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Logo size="medium" />
      </Box>

      <Divider sx={{ 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        my: 2 
      }} />

      <List sx={{ flexGrow: 1, px: 2 }}>
        {menuItems.map((item) => (
          <StyledListItem
            key={item.path}
            button
            component={Link}
            to={item.path}
            active={isActive(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.875rem',
              }}
            />
          </StyledListItem>
        ))}
      </List>

      <Box sx={{ p: 2 }}>
        <Divider sx={{ 
          borderColor: 'rgba(255, 255, 255, 0.1)',
          mb: 2 
        }} />
        
        <Button
          fullWidth
          variant="contained"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{
            mt: 2,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            textTransform: 'none',
            fontFamily: "'Poppins', sans-serif",
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
            },
          }}
        >
          Log Out
        </Button>
      </Box>
    </StyledSidebar>
  );
};

export default Sidebar;