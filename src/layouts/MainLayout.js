import React from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const location = useLocation();
  const { user, role, loading } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ✅ LOADING UI */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  /* ✅ SAFE REDIRECT (NO navigate()) */
  if (!user && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={role} user={user} />

      <div style={{ marginLeft: 250, padding: 24, width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {location.pathname === "/"
              ? "DASHBOARD"
              : location.pathname.split("/").pop()?.toUpperCase()}
          </Typography>

          {user && (
            <Button color="error" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>

        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;