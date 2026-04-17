import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

const MainLayout = () => {
  const { installable, installApp } = useInstallPrompt();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  /* ================= MOBILE CHECK ================= */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ================= INSTALL SUCCESS ================= */
  useEffect(() => {
    window.addEventListener("appinstalled", () => {
      console.log("🎉 App installed successfully");
    });
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

  /* ================= AUTH ================= */
  if (!user && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" replace />;
  }

  /* ================= TITLE ================= */
  const getTitle = () => {
    if (location.pathname === "/") return "DASHBOARD";
    const path = location.pathname.split("/").pop();
    return path ? path.replace("-", " ").toUpperCase() : "PAGE";
  };

  /* ================= INSTALL CLICK ================= */
  const handleInstallClick = async () => {
    if (installable) {
      await installApp();
    } else {
      // ❌ NO ALERT — CLEAN UX
      console.log("Install not ready yet");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* SIDEBAR */}
      <Sidebar role={role} user={user} />

      {/* MAIN */}
      <div
        style={{
          marginLeft: isMobile ? 0 : 250,
          padding: "24px",
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
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
            <div style={{ display: "flex", gap: "10px" }}>

              {/* ✅ ALWAYS VISIBLE INSTALL BUTTON */}
              <button
                onClick={handleInstallClick}
                style={{
                  background: installable ? "#2563eb" : "#94a3b8",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: installable ? "pointer" : "not-allowed"
                }}
              >
                📲 {installable ? "Install App" : "Preparing..."}
              </button>

              {/* LOGOUT */}
              <Button variant="contained" color="error" onClick={handleLogout}>
                Logout
              </Button>

            </div>
          )}
        </Box>

        {/* CONTENT */}
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;