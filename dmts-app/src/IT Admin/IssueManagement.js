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

  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  styled,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Reply as ReplyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
  BugReport as BugReportIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,

  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import { issueAPI, userAPI } from "../api/api";
import { useTheme } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontFamily: 'Century, Century Gothic, Arial, sans-serif',
    color: theme.palette.text.primary,
    '& fieldset': {
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Century, Century Gothic, Arial, sans-serif',
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  color: theme.palette.text.primary,
  '& .MuiSelect-icon': {
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: '16px',
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const IssueManagement = () => {
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [responseForm, setResponseForm] = useState({
    response: "",
    status: "Pending",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [users, setUsers] = useState([]);


  // Update status options to match backend
  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
  ];

  // Update priority options
  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ];

  // Fetch issues and users
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [issuesData, usersData] = await Promise.all([
          issueAPI.getIssues(),
          userAPI.getUsers(),
        ]);
        
        if (!isMounted) return;

        // Transform issues data with correct nested data access
        const formattedIssues = issuesData.map(issue => {
          return {
          ...issue,
            device_name: issue.device_info?.name || 'N/A',
            device_serial: issue.device_info?.serial_number || 'N/A',
            username: issue.user || 'N/A',
          };
        });
        
        console.log('Formatted Issues:', formattedIssues); // Debug log
        setIssues(formattedIssues);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error); // Debug log
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter and sort issues
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(issue => issue.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(issue => issue.priority === filterPriority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [issues, filterStatus, filterPriority, sortBy, sortOrder]);

  const handleShow = (issue) => {
    setCurrentIssue(issue);
    setResponseForm({ 
      response: issue.response || "", 
      status: issue.status || "Pending",
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentIssue(null);
    setResponseForm({
      response: "",
      status: "Pending",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const updatedIssue = await issueAPI.updateIssue(currentIssue.id, {
        response: responseForm.response,
        status: responseForm.status
      });
      
      // Update the issues list with the updated issue
      setIssues(prevIssues => 
        prevIssues.map(issue => 
        issue.id === currentIssue.id ? { 
          ...issue, 
          response: updatedIssue.response, 
            status: updatedIssue.status,
            resolved_at: updatedIssue.resolved_at,
            updated_at: new Date().toISOString() // Add timestamp for real-time updates
        } : issue
        )
      );

      // Show success message with more details
      setSuccess(`Issue ${currentIssue.id} updated successfully! Status: ${responseForm.status}`);
      setShowModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating issue:', error);
      setError(error.message || "Failed to update issue. Please try again.");
    }
  };

  // Update refresh function to include more details
  const refreshIssues = async () => {
    try {
      setLoading(true);
      const issuesData = await issueAPI.getIssues();
      
      // Transform issues data with correct nested data access and add timestamps
      const formattedIssues = issuesData.map(issue => ({
        ...issue,
        device_name: issue.device_info?.name || 'N/A',
        device_serial: issue.device_info?.serial_number || 'N/A',
        username: issue.user || 'N/A',
        updated_at: issue.updated_at || new Date().toISOString(),
        resolved_at: issue.resolved_at || null
      }));
      
      setIssues(formattedIssues);
      setError(null);
    } catch (error) {
      console.error('Error refreshing issues:', error);
      setError("Failed to refresh issues. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to use the refresh function
  useEffect(() => {
    refreshIssues();
    // Set up polling for real-time updates
    const interval = setInterval(refreshIssues, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);



  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);

  const handleDeleteRequest = (issueId) => {
    setIssueToDelete(issueId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) return;
    try {
      await issueAPI.deleteIssue(issueToDelete);
      setSuccess('Issue deleted successfully!');
      refreshIssues();
    } catch (err) {
      setError('Failed to delete issue. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setIssueToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIssueToDelete(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'In Progress':
        return 'info';
      case 'Resolved':
        return 'success';
      case 'Closed':
        return 'default';
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
    <>
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, p: 3, ml: '250px', backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BugReportIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                }}
              >
                Issue Management
              </Typography>
            </Box>

        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>Priority</InputLabel>
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <MenuItem value="created_at">Created Date</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </Select>
          </FormControl>

          <IconButton
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            sx={{ color: theme.palette.text.primary }}
          >
            {sortOrder === "asc" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
          </IconButton>
        </Box>

        

        

        <StyledCard>
          <CardContent>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    Issue Details
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    Device Info
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    Priority
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontFamily: 'Century, Century Gothic, Arial, sans-serif',
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
                {filteredIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell 
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                          {issue.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                          {issue.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                          Reported by: {issue.username} • {new Date(issue.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                      {issue.device_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                          SN: {issue.device_serial}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      <Chip
                        label={issue.priority}
                        color={getPriorityColor(issue.priority)}
                        size="small"
                        sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}
                      />
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      <Chip
                        label={issue.status}
                        color={getStatusColor(issue.status)}
                        size="small"
                        sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}
                      />
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      <Tooltip title="Respond to Issue">
                        <IconButton
                          onClick={() => handleShow(issue)}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <ReplyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Issue">
                        <IconButton
                          onClick={() => handleDeleteRequest(issue.id)}
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
          open={showModal} 
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
              borderRadius: '16px',
            }
          }}
        >
          <DialogTitle sx={{ 
            color: theme.palette.text.primary,
            fontFamily: 'Century, Century Gothic, Arial, sans-serif',
            fontWeight: 600,
          }}>
            Respond to Issue
          </DialogTitle>
            <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.text.primary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                Issue Details:
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                Device: {currentIssue?.device_name}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                Reported by: {currentIssue?.username}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                Priority: {currentIssue?.priority}
              </Typography>
            </Box>
                <StyledTextField
                  fullWidth
                  multiline
                  rows={4}
              label="Response"
                  value={responseForm.response}
                  onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })}
              sx={{ mb: 2 }}
                />
                <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>Status</InputLabel>
                  <StyledSelect
                    value={responseForm.status}
                onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                    label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
                  </StyledSelect>
                </FormControl>
            </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
                Cancel
              </Button>
              <Button
              onClick={handleSubmit} 
                variant="contained"
              disabled={!responseForm.response}
              >
                Submit Response
              </Button>
            </DialogActions>
        </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif', fontWeight: 600 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description" sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
            Are you sure you want to delete this issue? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
       </Dialog>
      </Box>
    </Box>
    </>
  );
}


export default IssueManagement;