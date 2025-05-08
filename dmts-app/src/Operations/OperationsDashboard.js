import React from "react";
import { Box, Grid, Typography, useTheme, CardContent, Avatar } from "@mui/material";
import { styled } from "@mui/material/styles";
import BuildIcon from '@mui/icons-material/Build';
import DevicesIcon from '@mui/icons-material/Devices';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import Sidebar from "../components/Sidebar";
import { deviceAPI, maintenanceAPI, deviceDistributionAPI } from "../api/api";
import { Pie, Doughnut } from "react-chartjs-2";
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
import DeviceDistributionChart from "../components/DeviceDistributionChart";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const StyledCard = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
  color: theme.palette.text.primary,
  borderRadius: '16px',
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

const StatCard = ({ title, description, icon, color }) => {
  const theme = useTheme();
  return (
    <StyledCard>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}20`, color: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: theme.palette.text.primary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontFamily: 'Century, Century Gothic, Arial, sans-serif' }}>
        {description}
      </Typography>
    </StyledCard>
  );
};

const OperationsDashboard = () => {
  const theme = useTheme();
  const [devices, setDevices] = React.useState([]);
  const [maintenances, setMaintenances] = React.useState([]);
  const [deviceTypeData, setDeviceTypeData] = React.useState({
    labels: ["Desktop", "Laptop", "Projector", "Printer"],
    datasets: [
      {
        data: [2, 3, 1, 1],
        backgroundColor: ["#2563eb", "#a78bfa", "#22c55e", "#fbbf24"],
      },
    ],
  });
  const [deviceStatusData, setDeviceStatusData] = React.useState({
    labels: ["Active", "Inactive", "Flagged", "Cleared"],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ["#22c55e", "#ef4444", "#f59e42", "#6366f1"], // green, red, orange, purple
      },
    ],
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const devicesRes = await deviceAPI.getDevices();
        setDevices(devicesRes);
        const maintenancesRes = await maintenanceAPI.getMaintenance();
        setMaintenances(maintenancesRes);
        // Count statuses
        const statusLabels = ["Active", "Inactive", "Flagged", "Cleared"];
        const statusCounts = statusLabels.map(status =>
          devicesRes.filter(device => device.status === status).length
        );
        setDeviceStatusData({
          labels: statusLabels,
          datasets: [{
            data: statusCounts,
            backgroundColor: ["#22c55e", "#ef4444", "#f59e42", "#6366f1"],
          }],
        });
      } catch (err) {
        // fallback to placeholder data
        setDeviceStatusData({
          labels: ["Active", "Inactive", "Flagged", "Cleared"],
          datasets: [{
            data: [2, 1, 2, 0], // Placeholder
            backgroundColor: ["#22c55e", "#ef4444", "#f59e42", "#6366f1"],
          }],
        });
      }
    }
    fetchData();
  }, []);

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 14,
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 4, ml: '250px' }}>
        <Typography variant="h4" sx={{ fontFamily: 'Century, Century Gothic, Arial, sans-serif', mb: 4, color: theme.palette.text.primary, fontWeight: 600 }}>
          Welcome to Operations Dashboard
        </Typography>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Maintenance Tasks"
              description="View, schedule, and manage all device maintenance activities here."
              icon={<BuildIcon />}
              color="#2563eb"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Device Clearance"
              description="Oversee device clearance process and approvals."
              icon={<AssignmentTurnedInIcon />}
              color="#10b981"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Maintenance Scheduled"
              description={`There are ${maintenances.filter(m => m.status === 'Scheduled').length} maintenance tasks scheduled.`}
              icon={<BuildIcon />}
              color="#f59e42"
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mb: 3, color: theme.palette.text.primary, fontWeight: 600 }}>
          Device Distribution Overview
        </Typography>
        
        <DeviceDistributionChart />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, background: theme.palette.background.paper, borderRadius: 3, boxShadow: 1, height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, alignSelf: 'flex-start' }}>Device Type Distribution</Typography>
              <Pie data={deviceTypeData} options={chartOptions} width={260} height={260} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, background: theme.palette.background.paper, borderRadius: 3, boxShadow: 1, height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, alignSelf: 'flex-start' }}>Device Status</Typography>
              <Doughnut data={deviceStatusData} options={chartOptions} width={260} height={260} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default OperationsDashboard;
