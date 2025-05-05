import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Laptop as LaptopIcon,
  BugReport as BugReportIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import { useAlert } from '../components/AlertContext';

const Reports = () => {
  const theme = useTheme();
  const { showAlert } = useAlert();

  const handleDownload = async (reportType) => {
    try {
      let url = '';
      let filename = '';

      switch (reportType) {
        case 'Device':
          url = 'http://127.0.0.1:8000/api/reports/devices/';
          filename = 'device_report.csv';
          break;
        case 'Issue':
          url = 'http://127.0.0.1:8000/api/reports/issues/';
          filename = 'issue_report.csv';
          break;
        case 'Maintenance':
          url = 'http://127.0.0.1:8000/api/reports/maintenance/';
          filename = 'maintenance_report.csv';
          break;
        default:
          throw new Error('Invalid report type');
      }

      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      if (typeof showAlert === 'function') {
        showAlert(`${reportType} report downloaded successfully!`, 'success');
      }
    } catch (error) {
      console.error(`Error downloading ${reportType} report:`, error);
      if (typeof showAlert === 'function') {
        showAlert(`Failed to download ${reportType} report. Please try again.`, 'error');
      }
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
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <DescriptionIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Reports
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                backgroundColor: theme.palette.background.paper,
                borderRadius: '16px',
                boxShadow: theme.shadows[2],
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ 
                  color: theme.palette.text.primary,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  mb: 2 
                }}>
                  Device Status Report
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<LaptopIcon />}
                  onClick={() => handleDownload('Device')}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Download Report
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                backgroundColor: theme.palette.background.paper,
                borderRadius: '16px',
                boxShadow: theme.shadows[2],
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ 
                  color: theme.palette.text.primary,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  mb: 2 
                }}>
                  Maintenance Report
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<BuildIcon />}
                  onClick={() => handleDownload('Maintenance')}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Download Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Reports;