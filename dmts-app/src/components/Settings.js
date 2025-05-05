import React, { useState, useEffect } from 'react';
import { useAlert } from "./AlertContext";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { userAPI } from '../api/api';

const Settings = () => {
  const { showAlert } = useAlert();
  const theme = useMuiTheme();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    deviceAlerts: true,
    maintenanceReminders: true,
  });
  

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const userData = await userAPI.getUserById(userId);
      setUser(userData);
      setFormData({
        username: userData.username,
        email: userData.email,
        phone_number: userData.phone_number || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      showAlert('Failed to fetch user data', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (setting) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          showAlert('New passwords do not match', 'error');
          return;
        }
      }

      const updateData = {
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        ...(formData.new_password && { password: formData.new_password }),
      };

      await userAPI.updateUser(user.id, updateData);
      showAlert('Settings updated successfully', 'success');
      setIsEditing(false);
      fetchUserData();
    } catch (err) {
      showAlert('Failed to update settings', 'error');
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box sx={{ 
          flexGrow: 1, 
          p: 3, 
          ml: '250px', 
          backgroundColor: theme.palette.background.default, 
          minHeight: '100vh' 
        }}>
          <Typography color="textPrimary">Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ 
        flexGrow: 1, 
        p: 3, 
        ml: '250px', 
        backgroundColor: theme.palette.background.default, 
        minHeight: '100vh' 
      }}>
        <Typography
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            mb: 4,
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon /> Profile Settings
                  </Typography>
                  <IconButton onClick={() => setIsEditing(!isEditing)}>
                    <EditIcon />
                  </IconButton>
                </Box>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    sx={{ mb: 2 }}
                  />
                  {isEditing && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>Change Password</Typography>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="current_password"
                        type="password"
                        value={formData.current_password}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="New Password"
                        name="new_password"
                        type="password"
                        value={formData.new_password}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirm_password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                      />
                    </>
                  )}
                  {isEditing && (
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      sx={{ mt: 2 }}
                    >
                      Save Changes
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <NotificationsIcon /> Notification Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                      color="primary"
                    />
                  }
                  label="Email Notifications"
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.deviceAlerts}
                      onChange={() => handleNotificationChange('deviceAlerts')}
                      color="primary"
                    />
                  }
                  label="Device Alerts"
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications.maintenanceReminders}
                      onChange={() => handleNotificationChange('maintenanceReminders')}
                      color="primary"
                    />
                  }
                  label="Maintenance Reminders"
                  sx={{ mb: 2 }}
                />
              </CardContent>
            </Card>

            {/* Security Settings (Admin Only) */}
            {user.role === 'Admin' && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <SecurityIcon /> Security Settings
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Two-Factor Authentication"
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Login Activity Notifications"
                    sx={{ mb: 2 }}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Audit Log Alerts"
                    sx={{ mb: 2 }}
                  />
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Settings; 