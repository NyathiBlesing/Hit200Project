import React, { useState, useEffect } from "react";
import {
  Box,
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  CircularProgress,
  styled,
  InputAdornment,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import { userAPI } from "../api/api";
import { useAlert } from "../components/AlertContext";

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
  color: theme.palette.text.primary,
  borderRadius: '16px',
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const UserManagement = () => {
  const { showAlert } = useAlert();
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'Employee',
    department: '',
    phone_number: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers();
      setUsers(response);
      setError(null);
    } catch (err) {
      if (typeof showAlert === 'function') {
        showAlert('Failed to fetch users. Please try again later.', 'error');
      }
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department || '',
        phone_number: user.phone_number || '',
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        role: 'Employee',
        department: '',
        phone_number: '',
      });
    }
    setSuccessMessage('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      role: 'Employee',
      department: '',
      phone_number: '',
    });
  };

  const handleSubmit = async () => {
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        phone_number: formData.phone_number,
      };

      if (selectedUser) {
        await userAPI.updateUser(selectedUser.id, userData);
        if (typeof showAlert === 'function') {
          showAlert('User updated successfully', 'success');
        }
      } else {
        const response = await userAPI.createUser(userData);
        if (typeof showAlert === 'function') {
          showAlert('User created successfully. A setup email has been sent to ' + userData.email, 'success');
        }
        setSuccessMessage('User created successfully. A setup email has been sent to ' + userData.email);
      }
      fetchUsers();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving user:', err);
      if (typeof showAlert === 'function') {
        showAlert(err.response?.data?.error || 'Failed to save user. Please try again.', 'error');
      }
      setError(err.response?.data?.error || 'Failed to save user. Please try again.');
    }
  };

  const handleDelete = async (userId) => {
    // Replace window.confirm with a showAlert for confirmation (requires custom dialog for true async confirm)
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (confirmed) {
      try {
        await userAPI.deleteUser(userId);
        if (typeof showAlert === 'function') {
          showAlert('User deleted successfully', 'success');
        }
        fetchUsers();
      } catch (err) {
        if (typeof showAlert === 'function') {
          showAlert('Failed to delete user. Please try again.', 'error');
        }
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'employee':
        return 'success';
      default:
        return 'default';
    }
  };

  // Add filter function
  const filteredUsers = users.filter(user => {
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesDepartment = !filters.department || user.department === filters.department;
    const matchesSearch = !filters.search || 
      user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.department?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesRole && matchesDepartment && matchesSearch;
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
      role: '',
      department: '',
      search: ''
    });
  };

  // Get unique departments for filter
  const departments = [...new Set(users.map(user => user.department).filter(Boolean))];

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ color: theme.palette.primary.main, mr: 2, fontSize: 32 }} />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
                color: theme.palette.text.primary,
              fontFamily: 'Century, Century Gothic, Arial, sans-serif',
            }}
          >
              User Management
          </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: theme.palette.primary.main,
              fontFamily: 'Century, Century Gothic, Arial, sans-serif',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Add User
          </Button>
        </Box>

        

        <StyledCard>
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search users..."
                value={filters.search}
                onChange={handleSearchChange}
                sx={{ 
                  minWidth: 200,
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
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={filters.role}
                  label="Role"
                  onChange={handleFilterChange}
                  sx={{
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& .MuiSelect-icon': {
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Employee">Employee</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={filters.department}
                  label="Department"
                  onChange={handleFilterChange}
                  sx={{
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& .MuiSelect-icon': {
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
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
                    fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                    fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  }}
                >
                  Username
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                    fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  }}
                >
                  Email
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                    fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  }}
                >
                  Role
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                    fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Department
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      Phone Number
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                  <TableCell 
                    sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    {user.username}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    {user.email}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    }}
                  >
                    <Chip
                      label={user.role}
                          color={getRoleColor(user.role)}
                      size="small"
                          sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}
                    />
                  </TableCell>
                      <TableCell 
                        sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        {user.department || 'N/A'}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: theme.palette.text.primary,
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        }}
                      >
                        {user.phone_number || 'N/A'}
                      </TableCell>
                      <TableCell 
                      sx={{
                          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                      >
                        <IconButton
                          onClick={() => handleOpenDialog(user)}
                          sx={{ color: theme.palette.primary.main }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(user.id)}
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
          <DialogTitle sx={{ color: theme.palette.text.primary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
            {selectedUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />
              <TextField
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                type="email"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />
              <TextField
                select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Employee">Employee</MenuItem>
              </TextField>
              <TextField
                select
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                fullWidth
                  sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    },
                    },
                  }}
                >
                <MenuItem value="Academic Affairs">Academic Affairs</MenuItem>
                <MenuItem value="Administration">Administration</MenuItem>
                <MenuItem value="Admissions">Admissions</MenuItem>
                <MenuItem value="Alumni Relations">Alumni Relations</MenuItem>
                <MenuItem value="Business School">Business School</MenuItem>
                <MenuItem value="Campus Security">Campus Security</MenuItem>
                <MenuItem value="Computer Science">Computer Science</MenuItem>
                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="Software Engineering">Software Engineering</MenuItem>
                <MenuItem value="Information Technology">Information Technology</MenuItem>
                <MenuItem value="Library">Library</MenuItem>
                <MenuItem value="Research">Research</MenuItem>
                <MenuItem value="Student Affairs">Student Affairs</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
              <TextField
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                fullWidth
                  sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog}
              sx={{
                color: theme.palette.text.secondary,
                fontFamily: 'Century, Century Gothic, Arial, sans-serif',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: theme.palette.primary.main,
                fontFamily: 'Century, Century Gothic, Arial, sans-serif',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default UserManagement;
 