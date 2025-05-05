import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Divider,
  useTheme,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Build as BuildIcon,
} from "@mui/icons-material";
import { Line, Doughnut } from "react-chartjs-2";
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
import { deviceAPI, issueAPI, userAPI, maintenanceAPI } from "../api/api";
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

const EmployeeDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [issues, setIssues] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);


  const fetchData = useCallback(async () => {
    let isMounted = true;
    try {
      setLoading(true);
    const loggedInEmail = localStorage.getItem("email");

    if (!loggedInEmail) {
      setError("User not logged in. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

      // Get all data in parallel
      const [usersRes, allMaintenances] = await Promise.all([
        userAPI.getUsers(),
        maintenanceAPI.getMaintenance()
      ]);

        const loggedInUser = usersRes.find(user => user.email === loggedInEmail);

        if (!loggedInUser) {
        if (isMounted) {
          setError("User not found. Please contact IT.");
        }
        return;
      }

      // Fetch user's issues and devices
      const [assignedDevices, issuesRes] = await Promise.all([
        deviceAPI.getAssignedDevices(loggedInUser.id),
        issueAPI.getUserIssues(loggedInUser.id)
      ]);

      if (!isMounted) return;

      // Filter maintenances for user's devices
      const userMaintenances = allMaintenances.filter(maintenance => 
        assignedDevices.some(device => device.serial_number === maintenance.serial_number)
      );

      setDevices(assignedDevices);
      setIssues(issuesRes);
      setMaintenances(userMaintenances);
      setError(null);
      } catch (error) {
      if (isMounted) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
      }
      } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const getIssueStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "resolved":
        return "success";
      case "in progress":
        return "info";
      default:
        return "default";
    }
  };

  const getMaintenanceStatusColor = (status) => {
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



  const getDeviceStatusData = () => {
    // Count devices by status
    const statusCounts = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {});

    // Prepare data for chart
    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#4ade80', // green for Active
          '#f87171', // red for Inactive
          '#fbbf24', // yellow for Maintenance
          '#60a5fa'  // blue for other statuses
        ],
      }],
    };
  };

  const getIssueTrendData = () => {
    const issuesByMonth = issues.reduce((acc, issue) => {
      const month = new Date(issue.created_at).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(issuesByMonth),
      datasets: [{
        label: "Issues",
        data: Object.values(issuesByMonth),
        borderColor: "#2563eb",
        tension: 0.4,
      }],
    };
  };

  const cardStyle = {
    height: "100%",
    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
    borderRadius: "16px",
    boxShadow: theme.shadows[2],
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    transition: "transform 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)",
    },
  };

  const cardHeaderStyle = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: 2,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
            color: theme.palette.text.secondary,
          },
        },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
            color: theme.palette.text.secondary,
          },
        },
        grid: {
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
            color: theme.palette.text.secondary,
          },
        },
        grid: {
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
    <Box sx={{ display: "flex" }}>
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
            Employee Dashboard
          </Typography>

        </Box>

        

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={cardStyle}>
              <CardContent>
                <Typography variant="h6" sx={cardHeaderStyle}>
                  Device Status
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Doughnut 
                    data={getDeviceStatusData()} 
                    options={{
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
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={cardStyle}>
              <CardContent>
                <Typography variant="h6" sx={cardHeaderStyle}>
                  Issue Trends
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line 
                    data={getIssueTrendData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
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
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BuildIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" sx={cardHeaderStyle}>
                    Maintenance Schedule
                  </Typography>
                </Box>
                {maintenances.length > 0 ? (
                  <List>
                    {maintenances.map((maintenance) => (
                      <ListItem key={maintenance.id} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {maintenance.device_name}
                              </Typography>
                              <Chip
                                label={maintenance.status}
                                color={getMaintenanceStatusColor(maintenance.status)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Type: {maintenance.maintenance_type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Scheduled: {new Date(maintenance.maintenance_date).toLocaleDateString()}
                              </Typography>
                              {maintenance.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  Notes: {maintenance.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />

                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No maintenance scheduled for your devices
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={cardHeaderStyle}>
                    My Devices
                  </Typography>

                </Box>
              {devices.length > 0 ? (
                  <List>
                    {devices.map((device) => (
                      <React.Fragment key={device.id}>
                        <ListItem sx={{ 
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          }
                        }}>
                          <ListItemText
                            primary={
                              <Typography sx={{ 
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 500,
                                color: theme.palette.text.primary
                              }}>
                                {device.name}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ 
                                fontFamily: "'Poppins', sans-serif",
                                color: theme.palette.text.secondary
                              }}>
                                Type: {device.type} | Location: {device.location}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              icon={device.status === "Active" ? <CheckCircleIcon /> : <ErrorIcon />}
                              label={device.status}
                              color={device.status === "Active" ? "success" : "error"}
                              size="small"
                              sx={{ 
                                mr: 1,
                                fontFamily: "'Poppins', sans-serif",
                                borderRadius: '4px',
                              }}
                            />

                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider sx={{ my: 1, borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
  No devices assigned to you.
</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={cardStyle}>
              <CardContent>
                <Typography variant="h6" sx={cardHeaderStyle}>
                  Recent Issues
                </Typography>
              {issues.length > 0 ? (
                  <List>
                    {issues.slice(0, 5).map((issue, index) => (
                      <React.Fragment key={issue.id}>
                        <ListItem 
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box>
                                <Typography 
                                  sx={{ 
                                    color: theme.palette.text.primary,
                                    fontFamily: "'Poppins', sans-serif",
                                  }}
                                >
                                  {issue.description}
                                </Typography>
                                {issue.response && (
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontFamily: "'Poppins', sans-serif",
                                      mt: 1,
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    Response: {issue.response}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontFamily: "'Poppins', sans-serif",
                                  }}
                                >
                                  {new Date(issue.created_at).toLocaleDateString()}
                                </Typography>
                                <Chip
                                  label={issue.status}
                                  size="small"
                                  color={
                                    issue.status === "Resolved" ? "success" :
                                    issue.status === "In Progress" ? "info" :
                                    issue.status === "Pending" ? "warning" :
                                    "default"
                                  }
                                  sx={{
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 500,
                                  }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < issues.length - 1 && <Divider sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No issues reported.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box>
    </Box>
  );
};

export default EmployeeDashboard;