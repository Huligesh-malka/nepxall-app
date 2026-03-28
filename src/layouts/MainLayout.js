import React, { useEffect, useState, useCallback } from "react";
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

  /* ✅ HELPER: NORMALIZE & FETCH LOCAL DATA */
  const getSessionData = useCallback(() => {
    const r = localStorage.getItem("role");
    const uid = localStorage.getItem("user_id");
    
    // Convert string "null" or "undefined" back to actual null
    const validRole = (!r || r === "null" || r === "undefined") ? null : r;
    const validId = (!uid || uid === "null" || uid === "undefined") ? null : uid;

    return { role: validRole, userId: validId };
  }, []);

  /* ✅ SESSION RECOVERY: Fixed to handle your specific DB 'id' field */
  const recoverSession = async (currentUser) => {
    try {
      console.log("🛠️ Attempting Session Recovery...");
      const idToken = await currentUser.getIdToken(true);
      
      const res = await userAPI.post("/auth/firebase", { idToken });
      
      if (res.data.success) {
        // Look for ID in all common locations returned by Express/Sequelize
        const recoveredId = 
          res.data.user?.id || 
          res.data.userId || 
          res.data.id || 
          res.data.data?.id;

        const recoveredRole = res.data.role || res.data.user?.role;

        // CRITICAL: Only set if the ID is actually a value, not undefined
        if (recoveredId && recoveredId !== "undefined") {
          localStorage.setItem("role", recoveredRole);
          localStorage.setItem("user_id", recoveredId);
          localStorage.setItem("token", res.data.token);
          
          setRole(recoveredRole);
          console.log("✅ Session Successfully Recovered:", { recoveredRole, recoveredId });
        } else {
          console.warn("⚠️ Backend succeeded but no valid ID found in response:", res.data);
        }
      }
    } catch (err) {
      console.error("❌ Session recovery failed:", err);
      // Optional: if recovery fails repeatedly, you might want to force logout
    }
  };

  /* ✅ FIREBASE AUTH LISTENER */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      const session = getSessionData();

      if (currentUser) {
        // If Firebase is logged in but local storage is missing data, recover it
        if (!session.role || !session.userId) {
          await recoverSession(currentUser);
        } else {
          setRole(session.role);
        }
      } else {
        setRole(null);
      }
      
      setAuthReady(true);
    });

    return () => unsub();
  }, [getSessionData]);

  /* ✅ GLOBAL STATE SYNC (For Login/Logout events) */
  useEffect(() => {
    const syncUI = () => {
      const session = getSessionData();
      setRole(session.role);
    };

    window.addEventListener("role-updated", syncUI);
    window.addEventListener("storage", syncUI);

    return () => {
      window.removeEventListener("role-updated", syncUI);
      window.removeEventListener("storage", syncUI);
    };
  }, [getSessionData]);

  /* ✅ LOGOUT */
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

  if (!authReady) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center" bgcolor="#f8fafc">
        <CircularProgress thickness={5} size={50} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Sidebar role={role} />

      <div
        style={{
          marginLeft: 250,
          padding: "24px",
          width: "calc(100% - 250px)",
          transition: "margin 0.3s ease"
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
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            mb: 4
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: '1.1rem' }}>
            {location.pathname === "/" ? "DASHBOARD" : 
             location.pathname.split("/").filter(x => x).pop()?.replace(/-/g, " ").toUpperCase() || "HOME"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {user && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: "#1e293b", fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}>
                  {user.phoneNumber || user.email?.split("@")[0]}
                </Typography>
                <Typography sx={{ color: '#6366f1', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                  {role || 'Detecting Role...'}
                </Typography>
              </Box>
            )}

            {!user ? (
              <Box display="flex" gap={1}>
                <Button onClick={() => navigate("/login")} variant="outlined" size="small">Login</Button>
                <Button onClick={() => navigate("/register")} variant="contained" size="small">Join</Button>
              </Box>
            ) : (
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                onClick={handleLogout}
                sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
              >
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