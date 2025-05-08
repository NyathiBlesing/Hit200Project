import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { deviceDistributionAPI } from '../api/api';

const DeviceDistributionChart = () => {
  const [data, setData] = useState({
    status_distribution: {},
    department_distribution: {},
    type_distribution: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const distribution = await deviceDistributionAPI.getDistribution();
        setData(distribution);
      } catch (error) {
        console.error('Error fetching distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistribution();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const renderPieChart = (data, title) => {
    const chartData = Object.entries(data).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderBarChart = (data, title) => {
    const chartData = Object.entries(data).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box>
        <Typography>Loading distribution data...</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        {renderPieChart(data.status_distribution, 'Device Status Distribution')}
      </Grid>
      <Grid item xs={12} md={4}>
        {renderBarChart(data.department_distribution, 'Department Distribution')}
      </Grid>
      <Grid item xs={12} md={4}>
        {renderPieChart(data.type_distribution, 'Device Type Distribution')}
      </Grid>
    </Grid>
  );
};

export default DeviceDistributionChart;
