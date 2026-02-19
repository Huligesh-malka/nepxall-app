import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /* 🔐 FINAL REDIRECT HANDLER */
  const redirectByRole = async (user) => {
    try {
      const firebaseToken = await user.getIdToken(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/google",
        { idToken: firebaseToken }
      );

      /* ✅ STORE DATA */
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", user.email);

      console.log("Login successful - Role:", res.data.role); // Debug log

      /* ✅ 🔥 TRIGGER SIDEBAR RE-RENDER */
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("role-updated"));

      /* ✅ REDIRECT BY ROLE */
      if (res.data.role === "admin") {
        navigate("/admin/owner-verification", { replace: true });
      } else if (res.data.role === "owner") {
        navigate("/owner/dashboard", { replace: true });
      } else if (res.data.role === "tenant" || res.data.role === "user") {
        // Handle both tenant and user roles
        navigate("/", { replace: true });
      } else {
        // Default fallback
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Backend Auth Error:", err);
      setError(err.response?.data?.message || "Server error: Could not verify user role.");
      setLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      await redirectByRole(result.user);
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  /* ================= EMAIL LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation before calling Firebase
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      
      await redirectByRole(res.user);
    } catch (err) {
      console.error("Firebase Auth Error:", err.code);
      
      // Handle specific Firebase error codes
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("Account not found. Please register first.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection.");
      } else {
        setError("Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <Box 
      minHeight="100vh" 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      bgcolor="#f1f5f9"
      sx={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Paper sx={{ 
        p: 4, 
        width: 380, 
        borderRadius: 3, 
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(255, 255, 255, 0.95)"
      }}>
        <Typography variant="h5" mb={1} fontWeight="bold" color="#0B5ED7" align="center">
          Welcome Back
        </Typography>
        
        <Typography variant="body2" color="text.secondary" mb={3} align="center">
          Login to access your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Button 
          fullWidth 
          variant="outlined" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          sx={{ 
            height: 45,
            borderColor: "#dadce0",
            color: "#3c4043",
            backgroundColor: "white",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "16px",
            fontWeight: 500,
            "&:hover": {
              borderColor: "#0B5ED7",
              backgroundColor: "#f8f9fa",
              boxShadow: "0 2px 8px rgba(11, 94, 215, 0.2)"
            }
          }}
          startIcon={
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              style={{ width: 20, height: 20 }}
            />
          }
        >
          {loading ? <CircularProgress size={24} /> : "Continue with Google"}
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">OR</Typography>
        </Divider>

        <form onSubmit={handleLogin}>
          <TextField 
            fullWidth 
            label="Email" 
            margin="normal"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            disabled={loading}
            autoComplete="email" 
            required
            type="email"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&:hover fieldset": {
                  borderColor: "#0B5ED7",
                },
              },
            }}
          />
          <TextField 
            fullWidth 
            label="Password" 
            type="password" 
            margin="normal"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            disabled={loading}
            autoComplete="current-password" 
            required
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&:hover fieldset": {
                  borderColor: "#0B5ED7",
                },
              },
            }}
          />

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            sx={{ 
              mt: 3, 
              height: 45,
              background: "linear-gradient(90deg, #0B5ED7, #4CAF50)",
              borderRadius: 2,
              textTransform: "none",
              fontSize: "16px",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(90deg, #0B5ED7, #4CAF50)",
                opacity: 0.9,
                boxShadow: "0 4px 12px rgba(11, 94, 215, 0.3)"
              }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>
        </form>

        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link 
              to="/register" 
              style={{ 
                color: "#0B5ED7", 
                fontWeight: "bold", 
                textDecoration: 'none',
                borderBottom: "2px solid transparent",
                transition: "border-color 0.3s"
              }}
              onMouseEnter={(e) => e.target.style.borderBottomColor = "#0B5ED7"}
              onMouseLeave={(e) => e.target.style.borderBottomColor = "transparent"}
            >
              Register
            </Link>
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            By logging in, you agree to our Terms and Privacy Policy
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;