import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  MenuItem,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import { authAPI } from '../api/api';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  borderRadius: "16px",
  backgroundColor: "#1a1a1a",
  color: "white",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
}));

const StyledForm = styled("form")(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(1),
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
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});




const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Admin",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
    if (!usernameRegex.test(formData.username)) {
      setError("Username must be at least 4 characters and contain only letters, numbers, or underscores.");
      setLoading(false);
      return;
    }
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.");
      setLoading(false);
      return;
    }
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // First create the account
      await authAPI.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,

        role: formData.role,
      });

      // After signup, login with the credentials
      const loginResponse = await authAPI.login({
        username: formData.username,
        password: formData.password
      });
      
      // Store tokens
      localStorage.setItem("access_token", loginResponse.access);
      localStorage.setItem("refresh_token", loginResponse.refresh);
      
      // Store user information
      const userData = loginResponse.user;
      localStorage.setItem("role", userData.role);
      localStorage.setItem("user_id", userData.id);
      localStorage.setItem("email", userData.email);
      localStorage.setItem("username", userData.username);
      localStorage.setItem("department", userData.department);


      // Show success message and redirect based on role
      setError("");
      if (userData.role === "Admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (error) {
      console.error("Signup Error:", error.response?.data || error.message);
      setError(
        error.response?.data?.error || 
        (Array.isArray(error.response?.data) ? error.response.data[0] : "Failed to create account")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 4,
      }}
    >
      <Container component="main" maxWidth="xs">
        <StyledPaper elevation={3}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                backgroundColor: "#2563eb20",
                borderRadius: "50%",
                p: 1.5,
                mb: 2,
              }}
            >
              <PersonAddOutlinedIcon sx={{ color: "#2563eb", fontSize: "1.8rem" }} />
            </Box>
            <Typography 
              component="h1" 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: "white",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Create Account
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1,
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Please fill in your information
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: "100%", 
                mb: 2,
                borderRadius: "12px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                '& .MuiAlert-icon': {
                  color: "#ef4444"
                }
              }}
            >
              {error}
            </Alert>
          )}

          <StyledForm onSubmit={handleSubmit}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Register as an IT Admin
            </Typography>
            <StyledTextField
              required
              fullWidth
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <StyledTextField
              required
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <StyledTextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    tabIndex={-1}
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            <StyledTextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    edge="end"
                    tabIndex={-1}
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: "#2563eb",
                borderRadius: "8px",
                '&:hover': {
                  backgroundColor: "#1d4ed8",
                },
                '&.Mui-disabled': {
                  backgroundColor: "rgba(37, 99, 235, 0.5)",
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Sign Up"
              )}
            </Button>
            <Box 
              sx={{ 
                mt: 2, 
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <Typography 
                variant="body2"
                sx={{ 
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Log in
                </Link>
              </Typography>
            </Box>
          </StyledForm>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default Signup;
