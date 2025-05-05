import React, { useState, useEffect } from "react";
import { useAlert } from "../components/AlertContext";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
} from "@mui/material";
import { BugReport as BugReportIcon } from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import { issueAPI, deviceAPI } from "../api/api";

const IssueReport = () => {
  const { showAlert } = useAlert();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    device_serial: "",
    description: "",
    priority: "Medium",
  });
  const [devices, setDevices] = useState([]);
  
  const [loading, setLoading] = useState({
    devices: true,
    submission: false
  });

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const assignedDevices = await deviceAPI.getAssignedDevices(userId);
        setDevices(assignedDevices);
      } catch (err) {
        showAlert("Failed to load devices. Please refresh the page.", "error");
      } finally {
        setLoading(prev => ({ ...prev, devices: false }));
      }
    };

    fetchDevices();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submission: true }));

    try {
      const serialNumber = formData.device_serial.includes(" - ") 
        ? formData.device_serial.split(" - ")[1] 
        : formData.device_serial;

      await issueAPI.createIssue({
        device_serial: serialNumber.trim(),
        description: formData.description,
        priority: formData.priority,
      });

      showAlert("Issue submitted successfully!", "success");
      setFormData({ device_serial: "", description: "", priority: "Medium" });
    } catch (err) {
      showAlert(err.message || "Failed to submit issue. Please try again.", "error");
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Report an Issue
          </Typography>
        </Box>
        
        <Card 
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
            borderRadius: '16px',
            boxShadow: theme.shadows[2],
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.text.secondary }}>Select Device</InputLabel>
                <Select
                  name="device_serial"
                  value={formData.device_serial}
                  onChange={handleChange}
                  required
                  disabled={loading.devices || devices.length === 0}
                  label="Select Device"
                  sx={{
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: theme.palette.text.secondary }}>{devices.length ? "Choose a device" : "No devices available"}</em>
                  </MenuItem>
                  {devices.map(device => (
                    <MenuItem 
                      key={device.serial_number} 
                      value={`${device.name} - ${device.serial_number}`}
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {device.name} - {device.serial_number} ({device.status})
                    </MenuItem>
                  ))}
                </Select>
                {loading.devices && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Loading devices...
                    </Typography>
                  </Box>
                )}
              </FormControl>

              <TextField
                multiline
                rows={4}
                name="description"
                label="Issue Description"
                value={formData.description}
                onChange={handleChange}
                required
                fullWidth
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              />

              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.text.secondary }}>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                  required
                  sx={{
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="Low" sx={{ color: theme.palette.text.primary }}>Low</MenuItem>
                  <MenuItem value="Medium" sx={{ color: theme.palette.text.primary }}>Medium</MenuItem>
                  <MenuItem value="High" sx={{ color: theme.palette.text.primary }}>High</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                disabled={loading.submission}
                startIcon={loading.submission ? <CircularProgress size={20} /> : <BugReportIcon />}
                sx={{
                  mt: 2,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                {loading.submission ? "Submitting..." : "Submit Issue Report"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default IssueReport;