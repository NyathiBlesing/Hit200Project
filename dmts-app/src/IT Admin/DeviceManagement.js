import React, { useState, useEffect } from "react";
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
  CircularProgress,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import FlagIcon from "./FlagIcon";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Laptop as LaptopIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  VideoSettings as ProjectorIcon,
  Print as PrinterIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import { deviceAPI, userAPI } from "../api/api";
import { useTheme } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontFamily: "'Poppins', sans-serif",
    color: theme.palette.text.primary,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.action.hover,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: "'Poppins', sans-serif",
    color: theme.palette.text.secondary,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.action.hover,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  color: theme.palette.text.primary,
  '& .MuiSelect-icon': {
    color: theme.palette.text.secondary,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: '16px',
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.divider}`,
}));

const DeviceManagement = () => {
  // ...existing state and hooks
  // Add the flag handler
  const handleFlagDevice = async (serial_number) => {
    try {
      await deviceAPI.updateDevice(serial_number, { status: "Flagged" });
      const devicesRes = await deviceAPI.getDevices();
      setDevices(devicesRes);
    } catch (error) {
      setError("Failed to flag device for clearance.");
    }
  };

  const theme = useTheme();
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    assigned: '',
    search: ''
  });
  const [form, setForm] = useState({
    name: "",
    assigned_to_id: null,
    serial_number: "",
    type: "Laptop",
    status: "Active",
    location: "",
    picture: null,
  });

  // Helper to get 3-letter type code
  const getTypeCode = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'laptop': return 'LAP';
      case 'desktop': return 'DES';
      case 'tablet': return 'TAB';
      case 'phone': return 'PHN';
      case 'projector': return 'PRO';
      case 'printer': return 'PRI';
      default: return 'OTH';
    }
  };

  // Auto-generate serial number for new device
  const generateSerialNumber = (type) => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000); // random 4-digit
    return `DEV-${getTypeCode(type)}-${yy}${mm}-${rand}`;
  };
  const [editingDevice, setEditingDevice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch devices and users from the backend
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [devicesRes, usersRes] = await Promise.all([
          deviceAPI.getDevices(),
          userAPI.getUsers()
        ]);

        if (isMounted) {
        setDevices(devicesRes);
        setUsers(usersRes);
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
        setError("Failed to fetch data. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleShow = () => {
    const defaultType = "Laptop";
    setForm({
      name: "",
      assigned_to_id: null,
      serial_number: generateSerialNumber(defaultType),
      type: defaultType,
      status: "Active",
      location: "",
      picture: null,
    });
    setEditingDevice(null);
    setShowModal(true);
  };

  // When device type changes in form, update serial number if not editing
  useEffect(() => {
    if (!editingDevice && form.type) {
      setForm((prev) => ({
        ...prev,
        serial_number: generateSerialNumber(form.type)
      }));
    }
    // Only run when type changes and not editing
    // eslint-disable-next-line
  }, [form.type, editingDevice]);

  const handleEditShow = (device) => {
    console.log('Editing device:', device); // Debug log
    setForm({
      ...device,
      assigned_to_id: device.assigned_to ? device.assigned_to.id : '',
    });
    setEditingDevice(device);
    setShowEditModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setShowEditModal(false);
    setError(null);
  };

  const handleChange = (e) => {
    if (e.target.name === "assigned_to_id") {
      setForm({ ...form, assigned_to_id: e.target.value || null });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = {
        ...form,
        assigned_to_id: form.assigned_to_id === '' ? null : form.assigned_to_id,
      };

      console.log('Submitting form data:', formData); // Debug log

      let updatedDevice;
      if (editingDevice) {
        updatedDevice = await deviceAPI.updateDevice(editingDevice.serial_number, formData);
      } else {
        updatedDevice = await deviceAPI.addDevice(formData);
      }

      console.log('Response from server:', updatedDevice); // Debug log

      // Refresh the devices list to ensure we have the latest data
      const devicesRes = await deviceAPI.getDevices();
      console.log('Updated devices list:', devicesRes); // Debug log
      setDevices(devicesRes);
      handleClose();
    } catch (error) {
      console.error('Error saving device:', error); // Debug log
      setError(error.response?.data?.error || "Failed to save device. Please try again.");
    }
  };

  const handleDelete = async (serial_number) => {
    try {
      await deviceAPI.deleteDevice(serial_number);
      setDevices(devices.filter((device) => device.serial_number !== serial_number));
    } catch (error) {
      setError(error.response?.data?.error || "Failed to delete device. Please try again.");
    }
  };

  // Add filter function
  const filteredDevices = devices.filter(device => {
    const matchesType = !filters.type || device.type === filters.type;
    const matchesStatus = !filters.status || device.status === filters.status;
    const matchesAssigned = !filters.assigned || 
      (filters.assigned === 'assigned' && device.assigned_to) ||
      (filters.assigned === 'unassigned' && !device.assigned_to);
    const matchesSearch = !filters.search || 
      device.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.serial_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.location.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesType && matchesStatus && matchesAssigned && matchesSearch;
  });

  // Add filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      assigned: '',
      search: ''
    });
  };

  // Add debug logging for device rendering
  const renderDeviceRow = (device) => {
    console.log('Rendering device:', device); // Debug log
    return (
                <TableRow 
                  key={device.serial_number}
                  sx={(theme) => ({
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  })}
                >
                  <TableCell 
                    sx={theme => ({ 
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    {device.name}
                  </TableCell>
                  <TableCell 
                    sx={theme => ({ 
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
          {device.assigned_to ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Chip
      label={device.assigned_to.username}
      color="primary"
      size="small"
      sx={{
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 500,
      }}
    />
  </Box>
) : (
  <Chip
    label="Unassigned"
    color="default"
    size="small"
    sx={{
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 500,
    }}
  />
)}
                  </TableCell>
                  <TableCell 
                    sx={theme => ({ 
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    {device.serial_number}
                  </TableCell>
                  <TableCell 
                    sx={theme => ({ 
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    {device.type}
                  </TableCell>
                  <TableCell 
                    sx={theme => ({ 
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    <Chip
                      label={device.status}
                      color={
                        device.status === "Active" ? "success" :
                        device.status === "Inactive" ? "error" :
                        "warning"
                      }
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    sx={theme => ({ 
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    {device.location}
                  </TableCell>
                  <TableCell 
                    sx={theme => ({ 
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    <IconButton
                      onClick={() => handleEditShow(device)}
                      sx={(theme) => ({
                        color: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.light,
                        },
                      })}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(device.serial_number)}
                      sx={(theme) => ({
                        color: theme.palette.error.main,
                        '&:hover': {
                          backgroundColor: theme.palette.error.light,
                        },
                      })}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            onClick={() => handleFlagDevice(device.serial_number)}
            sx={(theme) => ({
              color: theme.palette.warning.main,
              '&:hover': {
                backgroundColor: theme.palette.warning.light,
              },
            })}
            title="Flag for Clearance"
          >
            <FlagIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  const getDeviceIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'desktop':
        return <ComputerIcon />;
      case 'laptop':
        return <LaptopIcon />;
      case 'phone':
        return <SmartphoneIcon />;
      case 'tablet':
        return <TabletIcon />;
      case 'projector':
        return <ProjectorIcon />;
      case 'printer':
        return <PrinterIcon />;
      default:
        return <ComputerIcon />;
    }
  };


  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'flagged':
        return 'warning';
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
            <LaptopIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Manage Devices
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleShow}
            sx={{
              backgroundColor: theme.palette.primary.main,
              fontFamily: "'Poppins', sans-serif",
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Register New Device
          </Button>
        </Box>

        

        <StyledCard>
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <StyledTextField
                placeholder="Search devices..."
                value={filters.search}
                onChange={handleSearchChange}
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Device Type</InputLabel>
                <StyledSelect
                  name="type"
                  value={filters.type}
                  label="Device Type"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Desktop">Desktop</MenuItem>
                  <MenuItem value="Laptop">Laptop</MenuItem>
                  <MenuItem value="Tablet">Tablet</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                </StyledSelect>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <StyledSelect
                  name="status"
                  value={filters.status}
                  label="Status"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Flagged">Flagged</MenuItem>
<MenuItem value="Cleared">Cleared</MenuItem>
                </StyledSelect>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Assignment</InputLabel>
                <StyledSelect
                  name="assigned"
                  value={filters.assigned}
                  label="Assignment"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="unassigned">Unassigned</MenuItem>
                </StyledSelect>
              </FormControl>
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                sx={{
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.text.primary,
                    color: theme.palette.text.primary,
                  },
                }}
              >
                Clear Filters
              </Button>
            </Box>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Device
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Assigned To
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Type
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Serial Number
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Location
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.serial_number}>
                      <TableCell 
                        sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        {device.name}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        {device.assigned_to ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={device.assigned_to.username}
                              color="primary"
                              size="small"
                              sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 500,
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {device.assigned_to.role} • {device.assigned_to.department || 'No Department'}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip
                            label="Unassigned"
                            color="default"
                            size="small"
                            sx={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 500,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getDeviceIcon(device.type)}
                          {device.type}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        {device.serial_number}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        {device.location}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        <Chip
                          label={device.status}
                          color={getStatusColor(device.status)}
                          size="small"
                          sx={{ fontFamily: "'Poppins', sans-serif" }}
                        />
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        <IconButton
                          onClick={() => handleEditShow(device)}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <EditIcon />
                        </IconButton>
                        {!device.assigned_to && (
                          <Tooltip title="Assign Device">
                            <IconButton
                              color="success"
                              onClick={() => handleEditShow(device)}
                              sx={{ ml: 1 }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          onClick={() => handleDelete(device.serial_number)}
                          sx={{ color: theme.palette.error.main }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Add/Edit Device Modal */}
        <Dialog 
          open={showModal || showEditModal} 
          onClose={handleClose}
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
            {editingDevice ? 'Edit Device' : 'Register New Device'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <StyledTextField
                  fullWidth
                  label="Device Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel 
                    id="user-select-label"
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&.Mui-focused': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    Assign User
                  </InputLabel>
                  <StyledSelect
                    labelId="user-select-label"
                    name="assigned_to_id"
                    value={form.assigned_to_id || ''}
                    label="Assign User"
                    onChange={handleChange}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id} sx={{ color: theme.palette.text.primary }}>
                        {user.username}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </FormControl>
                <StyledTextField
                  fullWidth
                  label="Serial Number"
                  name="serial_number"
                  value={form.serial_number}
                  onChange={handleChange}
                  required
                  disabled
                  helperText="Auto-generated in format DEV-TYPE-YYMM-XXXX"
                />
                <FormControl fullWidth>
                  <InputLabel 
                    id="type-select-label"
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&.Mui-focused': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    Device Type
                  </InputLabel>
                  <StyledSelect
                    labelId="type-select-label"
                    name="type"
                    value={form.type}
                    label="Device Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="Laptop" sx={{ color: theme.palette.text.primary }}>Laptop</MenuItem>
                    <MenuItem value="Desktop" sx={{ color: theme.palette.text.primary }}>Desktop</MenuItem>
                    <MenuItem value="Tablet" sx={{ color: theme.palette.text.primary }}>Tablet</MenuItem>
                    <MenuItem value="Phone" sx={{ color: theme.palette.text.primary }}>Phone</MenuItem>
                    <MenuItem value="Projector" sx={{ color: theme.palette.text.primary }}>Projector</MenuItem>
                    <MenuItem value="Printer" sx={{ color: theme.palette.text.primary }}>Printer</MenuItem>
                  </StyledSelect>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel 
                    id="status-select-label"
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&.Mui-focused': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    Status
                  </InputLabel>
                  <StyledSelect
                    labelId="status-select-label"
                    name="status"
                    value={form.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    <MenuItem value="Active" sx={{ color: theme.palette.text.primary }}>Active</MenuItem>
                    <MenuItem value="Inactive" sx={{ color: theme.palette.text.primary }}>Inactive</MenuItem>
                    <MenuItem value="Flagged" sx={{ color: theme.palette.text.primary }}>Flagged</MenuItem>
                  </StyledSelect>
                </FormControl>
                <StyledTextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                />

              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={handleClose}
                sx={{
                  color: theme.palette.text.secondary,
                  fontFamily: "'Poppins', sans-serif",
                  '&:hover': {
                    color: theme.palette.text.primary,
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={editingDevice ? <EditIcon /> : <AddIcon />}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  fontFamily: "'Poppins', sans-serif",
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                {editingDevice ? 'Save Changes' : 'Register Device'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
};

export default DeviceManagement;