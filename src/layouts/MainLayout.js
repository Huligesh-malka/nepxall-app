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
  const [authReady, setAuthReady] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true); // 🔥 NEW

  /* ================= FETCH ROLE ================= */
  const fetchUserFromBackend = async (currentUser) => {
    try {
      const idToken = await currentUser.getIdToken(true);

      const res = await userAPI.post("/auth/firebase", { idToken });

      if (res.data.success) {
        setRole(res.data.role);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user_id", res.data.userId);

        console.log("✅ Role:", res.data.role);
      }
    } catch (err) {
      console.error("❌ Backend sync failed:", err);
      handleLogout();
    } finally {
      setLoadingRole(false); // 🔥 IMPORTANT
    }
  };

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await fetchUserFromBackend(currentUser);
      } else {
        setRole(null);
        setLoadingRole(false);
      }

      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      setUser(null);
      setRole(null);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  /* ================= LOADING SCREEN ================= */
  if (!authReady || loadingRole) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* 🔥 ONLY SHOW SIDEBAR WHEN ROLE READY */}
      {role && <Sidebar role={role} />}

      <div
        style={{
          marginLeft: role ? 250 : 0,
          padding: "24px",
          width: "100%"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "white",
            padding: "14px 28px",
            borderRadius: "16px",
            mb: 4
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {location.pathname === "/" ? "DASHBOARD" :
              location.pathname.split("/").filter(x => x).pop()?.replace(/-/g, " ").toUpperCase()}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {user && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
                  {user.phoneNumber || user.email?.split("@")[0]}
                </Typography>
                <Typography sx={{ fontSize: '11px', fontWeight: 800 }}>
                  {role}
                </Typography>
              </Box>
            )}

            {!user ? (
              <Box display="flex" gap={1}>
                <Button onClick={() => navigate("/login")} variant="outlined">Login</Button>
                <Button onClick={() => navigate("/register")} variant="contained">Join</Button>
              </Box>
            ) : (
              <Button variant="outlined" color="error" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </Box>
        </Box>

        <Box component="main">
          <Outlet context={{ user, role }} />
        </Box>
      </div>
    </div>
  );
};

export default MainLayout;