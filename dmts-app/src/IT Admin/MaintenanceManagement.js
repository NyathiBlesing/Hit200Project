import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Paper,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  styled,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import { maintenanceAPI, deviceAPI, userAPI } from "../api/api";
import { useTheme } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontFamily: "'Poppins', sans-serif",
    color: 'white',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2563eb',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Poppins', sans-serif",
    color: 'rgba(255, 255, 255, 0.6)',
    '&.Mui-focused': {
      color: '#2563eb',
    },
  },
});

const StyledSelect = styled(Select)({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.23)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2563eb',
  },
  color: 'white',
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
  color: theme.palette.text.primary,
  borderRadius: '16px',
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const MaintenanceManagement = () => {
  const theme = useTheme();
  const [maintenances, setMaintenances] = useState([]);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [formData, setFormData] = useState({
    serial_number: '',
    maintenance_date: null,
    maintenance_type: 'Routine',
    status: 'Scheduled',
    assigned_to_id: '',
    notes: '',
    cost: '',
    parts_replaced: '',
    next_maintenance_date: null,
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [maintenancesData, devicesData, usersData] = await Promise.all([
          maintenanceAPI.getMaintenance(),
          deviceAPI.getDevices(),
          userAPI.getUsers(),
        ]);
        
        setMaintenances(maintenancesData);
        setDevices(devicesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenDialog = (maintenance = null) => {
    if (maintenance) {
      setSelectedMaintenance(maintenance);
      setFormData({
        serial_number: maintenance.serial_number,
        maintenance_date: new Date(maintenance.maintenance_date),
        maintenance_type: maintenance.maintenance_type,
        status: maintenance.status,
        assigned_to_id: maintenance.assigned_to?.id || '',
        notes: maintenance.notes || '',
        cost: maintenance.cost || '',
        parts_replaced: maintenance.parts_replaced || '',
        next_maintenance_date: maintenance.next_maintenance_date ? new Date(maintenance.next_maintenance_date) : null,
      });
    } else {
      setSelectedMaintenance(null);
      setFormData({
        serial_number: '',
        maintenance_date: null,
        maintenance_type: 'Routine',
        status: 'Scheduled',
        assigned_to_id: '',
        notes: '',
        cost: '',
        parts_replaced: '',
        next_maintenance_date: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMaintenance(null);
    setFormData({
      serial_number: '',
      maintenance_date: null,
      maintenance_type: 'Routine',
      status: 'Scheduled',
      assigned_to_id: '',
      notes: '',
      cost: '',
      parts_replaced: '',
      next_maintenance_date: null,
    });
  };

  const handleSubmit = async () => {
    try {
      // Format dates to YYYY-MM-DD
      const formattedData = {
        ...formData,
        maintenance_date: formData.maintenance_date ? formData.maintenance_date.toISOString().split('T')[0] : null,
        next_maintenance_date: formData.next_maintenance_date ? formData.next_maintenance_date.toISOString().split('T')[0] : null,
        cost: formData.cost || null,
        assigned_to_id: formData.assigned_to_id || null
      };

      if (selectedMaintenance) {
        await maintenanceAPI.updateMaintenance(selectedMaintenance.id, formattedData);
        setSuccess("Maintenance record updated successfully!");
      } else {
        await maintenanceAPI.scheduleMaintenance(formattedData);
        setSuccess("Maintenance record created successfully!");
      }
      handleCloseDialog();
      // Refresh data
      const maintenancesData = await maintenanceAPI.getMaintenance();
      setMaintenances(maintenancesData);
    } catch (error) {
      console.error('Error saving maintenance:', error);
      setError(error.message || "Failed to save maintenance record. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await maintenanceAPI.deleteMaintenance(id);
        setSuccess("Maintenance record deleted successfully!");
        // Refresh data
        const maintenancesData = await maintenanceAPI.getMaintenance();
        setMaintenances(maintenancesData);
      } catch (error) {
        console.error('Error deleting maintenance:', error);
        setError(error.message || "Failed to delete maintenance record. Please try again.");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'info';
      case 'In Progress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMaintenanceTypeColor = (type) => {
    switch (type) {
      case 'Emergency':
        return 'error';
      case 'Corrective':
        return 'warning';
      case 'Preventive':
        return 'success';
      case 'Routine':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3, ml: '250px', backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BuildIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Maintenance Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: theme.palette.primary.main,
              fontFamily: "'Poppins', sans-serif",
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Schedule Maintenance
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              borderRadius: "12px",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              color: "#22c55e",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <StyledCard>
          <CardContent>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Device</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Type</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Date</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Status</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Assigned To</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Cost</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenances.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2">{maintenance.device_name}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            SN: {maintenance.serial_number}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={maintenance.maintenance_type}
                          color={getMaintenanceTypeColor(maintenance.maintenance_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2">
                            {new Date(maintenance.maintenance_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={maintenance.status}
                          color={getStatusColor(maintenance.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2">
                            {maintenance.assigned_to_name || 'Unassigned'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2">
                            {maintenance.cost ? `$${maintenance.cost}` : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Maintenance">
                          <IconButton
                            onClick={() => handleOpenDialog(maintenance)}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Maintenance">
                          <IconButton
                            onClick={() => handleDelete(maintenance.id)}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
              backgroundImage: 'none',
            }
          }}
        >
          <DialogTitle sx={{ color: theme.palette.text.primary, fontFamily: "'Poppins', sans-serif" }}>
            {selectedMaintenance ? 'Edit Maintenance' : 'Schedule Maintenance'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Device</InputLabel>
                  <Select
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    label="Device"
                  >
                    {devices.map((device) => (
                      <MenuItem key={device.id} value={device.serial_number}>
                        {device.name} ({device.serial_number})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Maintenance Type</InputLabel>
                  <Select
                    value={formData.maintenance_type}
                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                    label="Maintenance Type"
                  >
                    <MenuItem value="Preventive">Preventive</MenuItem>
                    <MenuItem value="Corrective">Corrective</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="Routine">Routine</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Maintenance Date"
                    value={formData.maintenance_date}
                    onChange={(newValue) => setFormData({ ...formData, maintenance_date: newValue })}
                    renderInput={(params) => <StyledTextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="Scheduled">Scheduled</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={formData.assigned_to_id}
                    onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                    label="Assigned To"
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <StyledTextField
                  fullWidth
                  label="Cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Parts Replaced"
                  value={formData.parts_replaced}
                  onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Next Maintenance Date"
                    value={formData.next_maintenance_date}
                    onChange={(newValue) => setFormData({ ...formData, next_maintenance_date: newValue })}
                    renderInput={(params) => <StyledTextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                color: theme.palette.text.secondary,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: theme.palette.primary.main,
                fontFamily: "'Poppins', sans-serif",
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {selectedMaintenance ? 'Update' : 'Schedule'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MaintenanceManagement; 