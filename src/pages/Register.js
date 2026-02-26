import React, { useState } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  MenuItem, CircularProgress, Divider
} from "@mui/material";
import { Google as GoogleIcon } from "@mui/icons-material";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = process.env.REACT_APP_API;

const Register = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  /* 🔀 REDIRECT BY ROLE */
  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/");
  };

  /* 🔗 BACKEND SYNC */
  const syncUser = async (user) => {
    const idToken = await user.getIdToken();

    const res = await axios.post(`${API}/auth/firebase`, {
      idToken,
      role
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.role);

    redirect(res.data.role);
  };

  /* 📧 EMAIL REGISTER */
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await syncUser(res.user);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  /* 🔵 GOOGLE LOGIN */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);

      await syncUser(res.user);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "#f0f2f5"
    }}>
      <Paper sx={{ p: 4, width: 400 }}>

        <Typography variant="h5" align="center" mb={2}>
          Create Account
        </Typography>

        {error && <Typography color="error">{error}</Typography>}

        <form onSubmit={handleRegister}>

          <TextField
            fullWidth
            label="Email"
            margin="normal"
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            onChange={(e) => setPassword(e.target.value)}
          />

          <TextField
            select
            fullWidth
            label="Register as"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            margin="normal"
          >
            <MenuItem value="tenant">Tenant</MenuItem>
            <MenuItem value="owner">Owner</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Register"}
          </Button>

        </form>

        <Divider sx={{ my: 2 }}>OR</Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Continue with Google
        </Button>

        <Typography align="center" mt={2}>
          Already have an account? <Link to="/login">Login</Link>
        </Typography>

      </Paper>
    </Box>
  );
};

export default Register;