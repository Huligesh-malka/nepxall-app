// MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

// ✅ Sync with Sidebar width
const SIDEBAR_WIDTH = 220;

const MainLayout = () => {
  const { installable, installApp } = useInstallPrompt();
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
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
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
  if (!user && !loading && location.pathname !== "/login" && location.pathname !== "/register") {
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
      {/* SIDEBAR */}
      <Sidebar role={role} user={user} />

      {/* MAIN CONTENT - AUTO SYNC WITH SIDEBAR WIDTH */}
      <div
        style={{
          marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
          padding: isMobile ? "12px" : "24px",
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          overflowX: "hidden",
        }}
      >
        {/* RESPONSIVE HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
            width: "100%"
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {getTitle()}
          </Typography>

          {/* SINGLE LOGOUT + INSTALL BUTTON (NO DUPLICATE) */}
          {user && (
            <div style={{ display: "flex", gap: "10px" }}>
              {installable && (
                <button
                  onClick={installApp}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  📲 Install App
                </button>
              )}
              <Button variant="contained" color="error" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Box>

        {/* PAGE CONTENT */}
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;