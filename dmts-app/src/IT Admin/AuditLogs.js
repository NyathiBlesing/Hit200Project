import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  styled,
  Chip,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  History as HistoryIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { auditLogAPI } from '../api/api';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
  color: theme.palette.text.primary,
  borderRadius: '16px',
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const AuditLogs = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupStatus, setCleanupStatus] = useState({ message: '', severity: 'success' });
  const [showCleanupStatus, setShowCleanupStatus] = useState(false);

  const handleCleanup = async () => {
    try {
      setLoading(true);
      const response = await auditLogAPI.cleanup({
        days: cleanupDays,
        action_type: filters.actionType || undefined,
        resource_type: filters.resourceType || undefined
      });
      
      setCleanupStatus({
        message: response.message,
        severity: 'success'
      });
      setShowCleanupStatus(true);
      
      // Refresh the logs list
      fetchLogs();
    } catch (error) {
      setCleanupStatus({
        message: error.message || 'Error cleaning up logs',
        severity: 'error'
      });
      setShowCleanupStatus(true);
    } finally {
      setLoading(false);
    }
  };

  const [filters, setFilters] = useState({
    actionType: '',
    resourceType: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditLogAPI.getLogs(filters);
      setLogs(response);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to fetch audit logs. Please try again later.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await auditLogAPI.exportLogs(filters);
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      setError(err.message || 'Failed to export audit logs. Please try again later.');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircleIcon color="success" />;
      case 'FAILURE':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatChanges = (changes) => {
    if (!changes) return null;
    
    try {
      const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes;
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Changes:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="error">
                Old:
              </Typography>
              <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                {JSON.stringify(parsed.old, null, 2)}
              </pre>
            </Box>
            <Box>
              <Typography variant="caption" color="success">
                New:
              </Typography>
              <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                {JSON.stringify(parsed.new, null, 2)}
              </pre>
            </Box>
          </Box>
        </Box>
      );
    } catch (e) {
      return null;
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, p: 3, ml: '250px', backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                type="number"
                label="Days to Keep"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(e.target.value)}
                sx={{ width: 150 }}
                size="small"
              />
              <Button
                variant="contained"
                color="error"
                onClick={handleCleanup}
                disabled={loading}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  '&:hover': {
                    backgroundColor: theme.palette.error.dark,
                  },
                }}
              >
                Delete Old Logs
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Audit Logs
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{
                backgroundColor: theme.palette.primary.main,
                fontFamily: "'Poppins', sans-serif",
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Export Logs
            </Button>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              onClose={() => setError(null)}
              action={
                <Button color="inherit" size="small" onClick={fetchLogs}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <StyledCard sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: theme.palette.text.primary,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Filters
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  select
                  label="Action Type"
                  value={filters.actionType}
                  onChange={(e) => handleFilterChange('actionType', e.target.value)}
                  sx={{ minWidth: 200 }}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="CREATE">Create</MenuItem>
                  <MenuItem value="UPDATE">Update</MenuItem>
                  <MenuItem value="DELETE">Delete</MenuItem>
                  <MenuItem value="LOGIN">Login</MenuItem>
                  <MenuItem value="LOGOUT">Logout</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="ISSUE">Issue</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Resource Type"
                  value={filters.resourceType}
                  onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                  sx={{ minWidth: 200 }}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DEVICE">Device</MenuItem>
                  <MenuItem value="USER">User</MenuItem>
                  <MenuItem value="ISSUE">Issue</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="CLEARANCE">Clearance</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ minWidth: 200 }}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="SUCCESS">Success</MenuItem>
                  <MenuItem value="FAILURE">Failure</MenuItem>
                </TextField>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(newValue) => handleFilterChange('startDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{ minWidth: 200 }}
                    />
                  )}
                />
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(newValue) => handleFilterChange('endDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{ minWidth: 200 }}
                    />
                  )}
                />
              </Box>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.user?.username || 'System'}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {log.resource_type}
                            </Typography>
                            {log.resource_name && (
                              <Typography variant="caption" color="text.secondary">
                                {log.resource_name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(log.status)}
                            <Chip
                              label={log.status}
                              size="small"
                              color={log.status === 'SUCCESS' ? 'success' : 'error'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {log.description}
                            </Typography>
                            {log.error_message && (
                              <Typography variant="caption" color="error">
                                {log.error_message}
                              </Typography>
                            )}
                            {formatChanges(log.changes)}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StyledCard>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs; 