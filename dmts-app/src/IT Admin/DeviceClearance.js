import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Table, Alert } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import { getFlaggedDevices, clearDevice, getClearanceLogs } from "../api/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { deviceAPI } from '../api/api';

const Clearance = () => {
  const [devices, setDevices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        const [devicesData, logsData] = await Promise.all([
          getFlaggedDevices(),
          getClearanceLogs()
        ]);
        
        if (isMounted) {
          setDevices(devicesData);
          setAuditLogs(logsData);
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
      const response = await clearDevice(selectedDevice);
      
      const [devicesData, logsData] = await Promise.all([
        getFlaggedDevices(),
        getClearanceLogs()
      ]);
      
      setDevices(devicesData);
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
      const [devicesData, logsData] = await Promise.all([
        getFlaggedDevices(),
        getClearanceLogs()
      ]);
      
      setDevices(devicesData);
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

  return (
    <div className="d-flex">
      <Sidebar />
      <Container className="p-4 w-100">
        <h1>Device Clearance</h1>
        {statusMessage && <Alert variant="success">{statusMessage}</Alert>}

        <Card className="p-3">
          <h5>Select a Device for Clearance</h5>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Device</Form.Label>
              <Form.Select onChange={(e) => setSelectedDevice(e.target.value)} required>
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} - {device.serial_number}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button type="submit" variant="danger">Start Clearance</Button>
          </Form>
        </Card>

        {/* Audit Log Table */}
        <Card className="mt-3">
          <Card.Header>Clearance Audit Log</Card.Header>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Device</th>
                <th>Serial Number</th>
                <th>Date</th>
                <th>Cleared By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, index) => (
                <tr key={index}>
                  <td>{log.device_name}</td>
                  <td>{log.serial_number}</td>
                  <td>{log.date_cleared}</td>
                  <td>{log.cleared_by_username}</td>
                  <td>{log.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <DeviceClearance
          open={open}
          device={device}
          onClose={handleClose}
          onClearanceComplete={handleClearanceComplete}
        />
      </Container>
    </div>
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
      await deviceAPI.clearDevice(device.id, { reason });
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
        sx: {
          backgroundColor: '#1a1a1a',
          color: 'white',
          borderRadius: '12px',
        }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: "'Poppins', sans-serif",
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        Clear Device
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2,
              fontFamily: "'Poppins', sans-serif",
              color: 'rgba(255, 255, 255, 0.7)'
            }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
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
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#2563eb',
                },
              },
            }}
          />
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleClearDevice}
          disabled={loading || !reason.trim()}
          variant="contained"
          color="error"
          sx={{
            backgroundColor: '#dc2626',
            '&:hover': {
              backgroundColor: '#b91c1c',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(220, 38, 38, 0.5)',
            },
          }}
        >
          {loading ? 'Clearing...' : 'Clear Device'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Clearance;
