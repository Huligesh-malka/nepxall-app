import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  /* ================= CHECK MOBILE ================= */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();

      // ✅ Smooth navigation (no reload)
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  /* ================= AUTH PROTECTION ================= */
  if (!user && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" replace />;
  }

  /* ================= TITLE ================= */
  const getTitle = () => {
    if (location.pathname === "/") return "DASHBOARD";

    const path = location.pathname.split("/").pop();
    return path ? path.replace("-", " ").toUpperCase() : "PAGE";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* 🔥 SIDEBAR */}
      <Sidebar role={role} user={user} />

      {/* 🔥 MAIN CONTENT - FIXED MARGIN FOR MOBILE */}
      <div
        style={{
          marginLeft: isMobile ? 0 : 250, // ✅ FIX: No margin on mobile
          padding: "24px",
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          overflowX: "hidden", // 🔥 IMPORTANT: Prevents horizontal scroll
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {getTitle()}
          </Typography>

          {user && (
            <Button variant="contained" color="error" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>

        {/* PAGE CONTENT */}
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;