import React, { useState } from "react";
import { 
  Box, TextField, Button, Typography, Paper, MenuItem, 
  CircularProgress, Divider, Stack 
} from "@mui/material";
import { Google as GoogleIcon } from "@mui/icons-material";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper to translate Firebase technical errors into friendly messages
  const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/email-already-in-use": return "This email is already registered. Try logging in.";
      case "auth/weak-password": return "Password should be at least 6 characters long.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/popup-closed-by-user": return "Google login was cancelled.";
      case "auth/network-request-failed": return "Check your internet connection.";
      default: return "Something went wrong. Please try again.";
    }
  };

  const saveUserToFirestore = async (user, userRole) => {
    const userRef = doc(db, "users", user.uid);
    // Check if user already exists (important for Google users)
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email.toLowerCase(),
        role: userRole,
        createdAt: new Date(),
      });
    }
    
    localStorage.setItem("uid", user.uid);
    localStorage.setItem("role", snap.exists() ? snap.data().role : userRole);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await saveUserToFirestore(res.user, role);
      navigate(role === "owner" ? "/owner/dashboard" : "/", { replace: true });
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const res = await signInWithPopup(auth, provider);
      await saveUserToFirestore(res.user, role);
      
      // Navigate based on the role selected at the time of clicking Google button
      navigate(role === "owner" ? "/owner/dashboard" : "/", { replace: true });
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      bgcolor: "#f0f2f5",
      p: 2 
    }}>
      <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 400, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight="800" align="center" mb={1} color="primary">
          Join Us
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" mb={3}>
          Create an account to get started
        </Typography>
        
        {error && (
          <Box sx={{ bgcolor: "#ffebee", p: 1, borderRadius: 1, mb: 2 }}>
            <Typography color="error" align="center" sx={{ fontSize: '0.85rem', fontWeight: '500' }}>
              {error}
            </Typography>
          </Box>
        )}

        <form onSubmit={handleRegister}>
          <TextField 
            label="Email Address" fullWidth required margin="normal" 
            variant="outlined" onChange={(e) => setEmail(e.target.value)} 
            disabled={loading}
          />
          <TextField 
            label="Password" type="password" fullWidth required margin="normal" 
            variant="outlined" onChange={(e) => setPassword(e.target.value)} 
            disabled={loading}
          />
          <TextField 
            select label="I am a..." fullWidth margin="normal" value={role} 
            onChange={(e) => setRole(e.target.value)} disabled={loading}
          >
            <MenuItem value="user">Looking for PG (User)</MenuItem>
            <MenuItem value="owner">PG Owner / Manager</MenuItem>
          </TextField>
          
          <Button 
            type="submit" fullWidth variant="contained" size="large" 
            sx={{ mt: 3, py: 1.5, fontWeight: 'bold', borderRadius: 2 }} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "CREATE ACCOUNT"}
          </Button>
        </form>

        <Box sx={{ my: 3 }}>
          <Divider sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>OR</Divider>
        </Box>

        <Button 
          fullWidth variant="outlined" size="large" 
          startIcon={<GoogleIcon />} 
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ 
            py: 1.2, 
            borderRadius: 2, 
            borderColor: '#ddd', 
            color: '#444',
            '&:hover': { borderColor: '#bbb', bgcolor: '#f8f8f8' }
          }}
        >
          Continue with Google
        </Button>

        <Typography align="center" mt={4} sx={{ color: 'text.secondary' }}>
          Already have an account?{" "}
          <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: '700' }}>
            Login here
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;