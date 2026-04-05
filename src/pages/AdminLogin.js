import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // ✅ Integrated Auth Context
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined, PersonOutline } from "@mui/icons-material";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Using login function from context

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ Calls your real backend via the AuthContext login function
      const success = await login(credentials.email, credentials.password);
      
      if (success) {
        navigate("/admin/dashboard");
      } else {
        setError("Invalid admin credentials. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f4f7fe 0%, #e0e5f2 100%)",
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: "20px",
            textAlign: "center",
            border: "1px solid #E0E5F2",
            boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
          }}
        >
          <Box
            sx={{
              width: 50,
              height: 50,
              bgcolor: "#0B5ED7",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: "white"
            }}
          >
            <LockOutlined />
          </Box>

          <Typography variant="h5" fontWeight="800" color="#1B2559" gutterBottom>
            Admin Portal
          </Typography>
          <Typography variant="body2" color="#A3AED0" mb={4}>
            Enter your credentials to access the Nepxall dashboard.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              name="email"
              placeholder="Email Address"
              variant="outlined"
              margin="normal"
              value={credentials.email}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline sx={{ color: "#A3AED0" }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" }
              }}
            />

            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              variant="outlined"
              margin="normal"
              value={credentials.password}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: "#A3AED0" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" }
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mt: 4,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: "700",
                fontSize: "16px",
                backgroundColor: "#0B5ED7",
                "&:hover": { backgroundColor: "#084ab2" },
                boxShadow: "0 4px 14px rgba(11, 94, 215, 0.39)"
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>
          </form>

          <Typography variant="caption" display="block" mt={4} color="#A3AED0">
            © {new Date().getFullYear()} Nepxall Property Management
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin;