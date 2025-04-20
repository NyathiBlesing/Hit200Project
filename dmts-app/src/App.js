import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./styles/theme";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AccountSetup from "./components/AccountSetup";
import AdminDashboard from "./IT Admin/Dashboard";
import DeviceManagement from "./IT Admin/DeviceManagement";
import UserManagement from "./IT Admin/UserManagement";
import IssueManagement from "./IT Admin/IssueManagement";
import MaintenanceManagement from "./IT Admin/MaintenanceManagement";
import Reports from "./IT Admin/Reports";
import EmployeeDashboard from "./employees/EmployeeDashboard";
import Feedback from "./employees/Feedback";
import IssueReport from "./employees/IssueReport";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditLogs from './IT Admin/AuditLogs';
import Settings from './components/Settings';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup-account/:token" element={<AccountSetup />} />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <DeviceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <IssueManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <MaintenanceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issue-report"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <IssueReport />
            </ProtectedRoute>
          }
        />

        {/* Profile Page for Both */}
        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Employee"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Login />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
