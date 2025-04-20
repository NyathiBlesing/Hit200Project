import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  useTheme,
  styled,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Computer as ComputerIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import {
  Pie,
  Line,
  Doughnut,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { maintenanceAPI, userAPI, issueAPI, deviceAPI } from "../api/api";
import Sidebar from "../components/Sidebar";
import "../styles/style.css";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
  color: theme.palette.text.primary,
  borderRadius: '16px',
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

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

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  return (
    <StyledCard>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            backgroundColor: `${color}20`,
            borderRadius: '12px',
            p: 1,
            mr: 2,
          }}>
            {icon}
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            color: color,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </StyledCard>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalDevices: 0,
    pendingIssues: 0,
    totalUsers: 0,
    scheduledMaintenance: 0,
  });

  const [deviceTypeData, setDeviceTypeData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
      try {
      setLoading(true);
        const [devicesRes, issuesRes, usersRes, maintenanceRes] = await Promise.all([
          deviceAPI.getDevices(),
          issueAPI.getIssues(),
          userAPI.getUsers(),
        maintenanceAPI.getMaintenance(),
        ]);

        setDashboardData({
          totalDevices: devicesRes.length || 0,
          pendingIssues: issuesRes.filter((issue) => issue.status === "Pending").length || 0,
          totalUsers: usersRes.length || 0,
          scheduledMaintenance: maintenanceRes.filter((m) => m.status === "Scheduled").length || 0,
        });

      // Device Type Distribution
        const typeCounts = devicesRes.reduce((acc, device) => {
          acc[device.type] = (acc[device.type] || 0) + 1;
          return acc;
        }, {});

        setDeviceTypeData({
          labels: Object.keys(typeCounts),
          datasets: [{
            label: "Devices",
            data: Object.values(typeCounts),
            backgroundColor: ["#2563eb", "#7c3aed", "#22c55e", "#f59e0b", "#ef4444"],
            borderWidth: 0,
            hoverOffset: 4
          }],
        });

      // Device Status
        const activeCount = devicesRes.filter((d) => d.status === "Active").length;
        const inactiveCount = devicesRes.length - activeCount;

        setStatusData({
          labels: ["Active", "Inactive"],
          datasets: [{
            label: "Status",
            data: [activeCount, inactiveCount],
            backgroundColor: ["#22c55e", "#ef4444"],
            borderWidth: 0,
            hoverOffset: 4
          }],
        });

        setDevices(devicesRes);
      setError(null);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch dashboard data. Please try again later.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: "'Poppins', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: "'Poppins', sans-serif",
          },
        },
        grid: {
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: "'Poppins', sans-serif",
          },
        },
        grid: {
          display: false,
        },
      },
    },
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
      <Box sx={{ 
        flexGrow: 1, 
        p: 3, 
        ml: '250px', 
        backgroundColor: theme.palette.background.default, 
        minHeight: '100vh'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            IT Admin Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{
              backgroundColor: theme.palette.primary.main,
              fontFamily: "'Poppins', sans-serif",
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Refresh Data
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Devices"
              value={dashboardData.totalDevices}
              icon={<ComputerIcon sx={{ color: '#2563eb' }} />}
              color="#2563eb"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Issues"
              value={dashboardData.pendingIssues}
              icon={<WarningIcon sx={{ color: '#f59e0b' }} />}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={dashboardData.totalUsers}
              icon={<PeopleIcon sx={{ color: '#7c3aed' }} />}
              color="#7c3aed"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Scheduled Maintenance"
              value={dashboardData.scheduledMaintenance}
              icon={<BuildIcon sx={{ color: '#22c55e' }} />}
              color="#22c55e"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                  }}
                >
                  Device Type Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  {deviceTypeData && <Pie data={deviceTypeData} options={chartOptions} />}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                  }}
                >
                  Device Status
                </Typography>
                <Box sx={{ height: 300 }}>
                  {statusData && <Doughnut data={statusData} options={chartOptions} />}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                  }}
                >
                  Recent Devices
                </Typography>
                <TableContainer>
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
                          Name
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
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {devices.slice(0, 5).map((device) => (
                        <TableRow 
                          key={device.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
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
                            {device.type}
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
                              color={device.status === "Active" ? "success" : "error"}
                              size="small"
                              sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
              </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;