import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider, 
  useTheme, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { notificationAPI } from '../api/api';

const NotificationBell = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response);
      setUnreadCount(response.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await notificationAPI.markAsRead(notification.id);
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    setSelectedNotification(notification);
    setDetailsOpen(true);
    handleClose();
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedNotification(null);
  };

  const handleNavigate = () => {
    if (selectedNotification?.link) {
      window.location.href = selectedNotification.link;
    }
    handleDetailsClose();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          borderRadius: '50%',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <IconButton
          onClick={handleClick}
          sx={{
            color: theme.palette.text.primary,
            p: 1.5,
          }}
        >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
        </IconButton>
      </Paper>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            width: 360,
            maxHeight: 400,
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
            boxShadow: theme.shadows[3],
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                py: 2,
                px: 3,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: notification.read ? 'transparent' : theme.palette.action.hover,
                '&:hover': {
                  backgroundColor: theme.palette.action.selected,
                },
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {!notification.read && (
                    <CircleIcon
                      sx={{
                        fontSize: 8,
                        color: theme.palette.primary.main,
                        mr: 1,
                      }}
                    />
                  )}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 600,
                      flex: 1,
                    }}
                  >
                    {notification.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      ml: 2,
                    }}
                  >
                    {formatTimestamp(notification.created_at)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    pl: notification.read ? 0 : 2.5,
                  }}
                >
                  {notification.message}
                  {notification.admin_response && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.primary.main,
                        pl: notification.read ? 0 : 2.5,
                        mt: 1,
                        fontStyle: 'italic'
                      }}
                    >
                      Admin Response: {notification.admin_response}
                    </Typography>
                  )}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      <Dialog 
        open={detailsOpen} 
        onClose={handleDetailsClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: "'Poppins', sans-serif",
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          {selectedNotification?.title}
          <Chip 
            label={selectedNotification?.type.replace('_', ' ')} 
            size="small" 
            color="primary"
            sx={{ ml: 'auto' }}
          />
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            {selectedNotification?.message}
          </Typography>
          {selectedNotification?.device && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: theme.palette.action.hover,
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Related Device
              </Typography>
              <Typography variant="body2">
                Name: {selectedNotification.device.name}
              </Typography>
              <Typography variant="body2">
                Serial Number: {selectedNotification.device.serial_number}
              </Typography>
              <Typography variant="body2">
                Status: {selectedNotification.device.status}
              </Typography>
            </Box>
          )}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              mt: 2,
              color: theme.palette.text.secondary 
            }}
          >
            {formatTimestamp(selectedNotification?.created_at)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: `1px solid ${theme.palette.divider}`, 
          p: 2 
        }}>
          <Button onClick={handleDetailsClose}>
            Close
          </Button>
          {selectedNotification?.link && (
            <Button variant="contained" onClick={handleNavigate}>
              View Details
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationBell;
