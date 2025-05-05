import React, { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, Button, Select, MenuItem, InputLabel, FormControl, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Sidebar from "../components/Sidebar";
// Use deviceAPI and auditLogAPI for device and audit log actions
import { deviceAPI, auditLogAPI, clearanceAPI } from "../api/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Laptop as LaptopIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  VideoSettings as ProjectorIcon,
  Print as PrinterIcon
} from '@mui/icons-material';


const getDeviceIcon = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'desktop':
      return <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />;
    case 'laptop':
      return <LaptopIcon sx={{ mr: 1, verticalAlign: 'middle' }} />;
    case 'phone':
      return <SmartphoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />;
    case 'tablet':
      return <TabletIcon sx={{ mr: 1, verticalAlign: 'middle' }} />;
    case 'projector':
      return <ProjectorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />;
    case 'printer':
      return <PrinterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />;
    default:
      return <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />;
  }
};

const Clearance = () => {
  const [devices, setDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState(null);
  const [viewMode, setViewMode] = useState('Flagged'); // 'Flagged' or 'Cleared'

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        // Fetch all devices and clearance logs
        const [allDevices, logsData] = await Promise.all([
          deviceAPI.getDevices(),
          clearanceAPI.getLogs()
        ]);
        if (isMounted) {
          setAllDevices(allDevices);
          setAuditLogs(logsData);
          // Default to flagged devices
          setDevices(allDevices.filter(device => device.status === viewMode));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    
    fetchData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDevice) return;

    try {
      const deviceObj = devices.find(d => d.id === selectedDevice);
      if (!deviceObj) throw new Error('Device not found');
      const response = await deviceAPI.clearDevice(deviceObj.serial_number, { device: deviceObj.id, clearance_reason: 'Cleared via UI' });
      // Refresh all devices and logs
      const [allDevices, logsData] = await Promise.all([
        deviceAPI.getDevices(),
        auditLogAPI.getLogs({ actionType: 'clearance' })
      ]);
      setAllDevices(allDevices);
      // Update device list according to current view mode
      setDevices(allDevices.filter(device => device.status === viewMode));
      setAuditLogs(logsData);
      setStatusMessage(response.message);
    } catch (error) {
      console.error('Error in submission:', error);
      setStatusMessage("Error processing clearance");
    }
  };

  const handleClearDevice = async (device) => {
    setDevice(device);
    setOpen(true);
  };

  const handleClearanceComplete = async () => {
    try {
      const [allDevices, logsData] = await Promise.all([
        deviceAPI.getDevices(),
        auditLogAPI.getLogs({ actionType: 'clearance' })
      ]);
      setAllDevices(allDevices);
      setDevices(allDevices.filter(device => device.status === viewMode));
      setAuditLogs(logsData);
      setStatusMessage("Device cleared successfully");
      setDevice(null);
      setOpen(false);
    } catch (error) {
      console.error('Error updating data:', error);
      setStatusMessage("Error updating device list");
    }
  };

  const handleClose = () => {
    setDevice(null);
    setOpen(false);
  };

  const theme = require('@mui/material/styles').useTheme();
  // Toggle between flagged and cleared devices
  const handleViewModeChange = (e) => {
    const mode = e.target.value;
    setViewMode(mode);
    setDevices(allDevices.filter(device => device.status === mode));
    setSelectedDevice(""); // reset selected device
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 4, ml: '250px' }}>
        <Typography variant="h4" sx={{ fontFamily: 'Poppins', mb: 3, color: theme.palette.text.primary, fontWeight: 600 }}>
          Device Clearance
        </Typography>
        {/* Toggle for flagged/cleared devices */}
        <Box sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="view-mode-label">View Devices</InputLabel>
            <Select
              labelId="view-mode-label"
              value={viewMode}
              label="View Devices"
              onChange={handleViewModeChange}
            >
              <MenuItem value="Flagged">Flagged for Clearance</MenuItem>
              <MenuItem value="Cleared">Cleared Devices</MenuItem>
            </Select>
          </FormControl>
        </Box>
        

        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Poppins' }}>Select a Device for Clearance</Typography>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="device-select-label">Device</InputLabel>
                <Select
                  labelId="device-select-label"
                  value={selectedDevice}
                  label="Device"
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  required
                >
                  <MenuItem value="">Select a device</MenuItem>
                  {devices.length === 0 ? (
                    <MenuItem disabled>No devices available</MenuItem>
                  ) : (
                    devices.map((device) => (
                      <MenuItem key={device.id} value={device.id}>
                        {device.type ? `[${device.type}] ` : ''}{device.name} - {device.serial_number}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" color="error" sx={{ fontFamily: 'Poppins', borderRadius: 2 }}>
                Start Clearance
              </Button>
            </form>
          </CardContent>
        </Card>



        {/* Audit Log Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', mb: 2 }}>Clearance Audit Log</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Device</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Cleared By</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(viewMode === 'Cleared'
                    ? allDevices.filter(device => device.status === 'Cleared')
                    : auditLogs
                  ).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {/* Show icon in device log if device_type is available */}
                        {item.device_type && getDeviceIcon(item.device_type)}
                        {item.device_name || item.name}
                      </TableCell>
                      <TableCell>{item.serial_number}</TableCell>
                      <TableCell>{item.date_cleared ? new Date(item.date_cleared).toLocaleString() : (item.cleared_at ? new Date(item.cleared_at).toLocaleString() : '')}</TableCell>
                      <TableCell>{item.cleared_by_username || (item.cleared_by && item.cleared_by.username)}</TableCell>
                      <TableCell>{item.status}</TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

{/* Device Clearance Dialog */}
<DeviceClearance
  open={open}
  device={device}
  onClose={handleClose}
  onClearanceComplete={handleClearanceComplete}
/>
</Box>
</Box>
  );
};

const DeviceClearance = ({ open, device, onClose, onClearanceComplete }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClearDevice = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for clearance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deviceAPI.clearDevice(device.serial_number, { device: device.id, clearance_reason: reason });
      onClearanceComplete();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to clear device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: (theme) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRadius: '12px',
        })
      }}
    >
      <DialogTitle sx={(theme) => ({
        fontFamily: "'Poppins', sans-serif",
        borderBottom: `1px solid ${theme.palette.divider}`
      })}>
        Clear Device
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography 
            variant="subtitle1" 
            sx={(theme) => ({
              mb: 2,
              fontFamily: "'Poppins', sans-serif",
              color: theme.palette.text.secondary
            })}
          >
            You are about to clear the following device:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 1,
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Name: {device?.name}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2,
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Serial Number: {device?.serial_number}
          </Typography>
          <TextField
            fullWidth
            label="Clearance Reason"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            sx={(theme) => ({
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.light,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: theme.palette.primary.main,
                },
              },
            })}
          />
          
        </Box>
      </DialogContent>
      <DialogActions sx={(theme) => ({ borderTop: `1px solid ${theme.palette.divider}`, p: 2 })}>
        <Button 
          onClick={onClose}
          sx={(theme) => ({
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          })}
        >
          Cancel
        </Button>
        <Button
          onClick={handleClearDevice}
          disabled={loading || !reason.trim()}
          variant="contained"
          color="error"
          sx={(theme) => ({
            backgroundColor: theme.palette.error.main,
            '&:hover': {
              backgroundColor: theme.palette.error.dark,
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.error.light,
            },
          })}
        >
          {loading ? 'Clearing...' : 'Clear Device'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Clearance;
