import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { userAPI } from "../api/api";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USER ================= */
  const fetchUser = async (currentUser) => {
    try {
      const idToken = await currentUser.getIdToken(true);

      const res = await userAPI.post("/auth/firebase", { idToken });

      if (res.data.success) {
        const backendRole = res.data.role?.toLowerCase().trim();

        setRole(backendRole);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user_id", res.data.userId);
        localStorage.setItem("role", backendRole);

        console.log("✅ Role:", backendRole);
      } else {
        throw new Error("Invalid backend");
      }
    } catch (err) {
      console.error("❌ Auth Error:", err);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔥 Auth Changed:", currentUser);

      if (currentUser) {
        setUser(currentUser);
        setLoading(true);
        await fetchUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);

        if (
          location.pathname !== "/login" &&
          location.pathname !== "/register"
        ) {
          navigate("/login");
        }
      }
    });

    return () => unsub();
  }, [navigate, location.pathname]);

  /* ================= 🔥 LISTEN STORAGE EVENTS ================= */
  useEffect(() => {
    const updateAuthState = () => {
      const token = localStorage.getItem("token");
      const savedRole = localStorage.getItem("role");

      if (token && savedRole) {
        setRole(savedRole);
        setUser(auth.currentUser);
      }
    };

    window.addEventListener("storage", updateAuthState);
    window.addEventListener("role-updated", updateAuthState);

    return () => {
      window.removeEventListener("storage", updateAuthState);
      window.removeEventListener("role-updated", updateAuthState);
    };
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();

    setUser(null);
    setRole(null);

    // 🔥 FORCE RESET
    window.location.href = "/login";
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
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

        <Outlet context={{ user, role }} />
      </div>
    </div>
  );
};

export default MainLayout;