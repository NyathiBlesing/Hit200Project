import React, { useState, useEffect } from "react";
import { useAlert } from "./AlertContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
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
  width: '100%',
  maxWidth: 400,
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    maxWidth: '100%',
    borderRadius: '8px',
  },
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
});


const Login = () => {
  const { showAlert } = useAlert();
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect if already logged in
    const accessToken = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    if (accessToken && role) {
      if (role === "Admin") {
        navigate("/admin-dashboard");
      } else if (role === "Operations") {
        navigate("/operations-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") {
      setUsername(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    

    try {
      const response = await authAPI.login({ username, password });
      
      // Store tokens
      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      
      // Store user information
      const userData = response.user;
      localStorage.setItem("role", userData.role);
      localStorage.setItem("user_id", userData.id);
      localStorage.setItem("email", userData.email);
      localStorage.setItem("username", userData.username);
      localStorage.setItem("department", userData.department);


      console.log("Login Successful! Role:", userData.role);

      if (userData.role === "Admin") {
        navigate("/admin-dashboard");
      } else if (userData.role === "Operations") {
        navigate("/operations-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      showAlert(error.response?.data?.detail || "Invalid username or password", "error");
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
              <LockOutlinedIcon sx={{ color: "#2563eb", fontSize: "1.8rem" }} />
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
              DMTS Login
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1,
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Please sign in to continue
            </Typography>
          </Box>

          

          <StyledForm onSubmit={handleSubmit}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
            value={username}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <StyledTextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handleInputChange}
              sx={{ mb: 3 }}
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
                "Log In"
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
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  style={{ 
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </StyledForm>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default Login;
