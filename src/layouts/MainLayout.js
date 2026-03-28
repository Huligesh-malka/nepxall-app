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
    
    // Clean up string-based "null"/"undefined" artifacts
    const validRole = (!r || r === "null" || r === "undefined") ? null : r;
    const validId = (!uid || uid === "null" || uid === "undefined") ? null : uid;

    return { role: validRole, userId: validId };
  }, []);

  /* ✅ SESSION RECOVERY: High-Resilience Extraction */
  const recoverSession = async (currentUser) => {
    try {
      console.log("🛠️ Attempting Session Recovery...");
      const idToken = await currentUser.getIdToken(true);
      
      const res = await userAPI.post("/auth/firebase", { idToken });
      
      if (res.data.success) {
        // 1. Try body extraction (Common keys based on your DB schema)
        let recoveredId = 
          res.data.user?.id || 
          res.data.userId || 
          res.data.id || 
          res.data.data?.id;

        // 2. BACKUP: Extract from JWT Payload if body extraction failed
        // Your logs show res.data.token exists, we can use it.
        if (!recoveredId && res.data.token) {
          try {
            const base64Url = res.data.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            recoveredId = payload.id || payload.userId || payload.sub;
            console.log("🔑 ID extracted from JWT Payload:", recoveredId);
          } catch (e) {
            console.error("JWT Decode failed", e);
          }
        }

        const recoveredRole = res.data.role || res.data.user?.role || "tenant";

        // 3. FINAL VALIDATION & STORAGE
        if (recoveredId && String(recoveredId) !== "undefined") {
          localStorage.setItem("role", recoveredRole);
          localStorage.setItem("user_id", String(recoveredId));
          localStorage.setItem("token", res.data.token);
          
          setRole(recoveredRole);
          console.log("✅ Session Fully Recovered:", { recoveredRole, recoveredId });
        } else {
          console.error("❌ CRITICAL: No ID found in API response. Response Data:", res.data);
        }
      }
    } catch (err) {
      console.error("❌ Session recovery failed:", err);
    }
  };

  /* ✅ FIREBASE AUTH LISTENER */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      const session = getSessionData();

      if (currentUser) {
        // If Firebase is active but local data is missing or corrupted, recover it
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

  /* ✅ GLOBAL STATE SYNC */
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