import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/api";

const ForcePasswordChange = ({ userId, onSuccess }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // For auto-generated passwords, we don't need userId
      await authAPI.changePassword({
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      // Clear the must_change_password flag
      const response = await fetch(`https://hit200project.onrender.com/api/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ must_change_password: false })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user settings');
      }

      if (onSuccess) onSuccess();
      else navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#111">
      <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 400, width: "100%" }}>
        <Typography variant="h6" mb={2} align="center">
          Change Your Password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && (
            <Typography color="error" variant="body2" mt={1} align="center">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, fontWeight: 600, borderRadius: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Change Password"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ForcePasswordChange;
