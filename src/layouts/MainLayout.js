import React, { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button, Box, CircularProgress } from "@mui/material";
import { userAPI } from "../api/api"; // Ensure this points to your axios instance

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  /* ✅ HELPER: GET & CLEAN DATA */
  const getSessionData = useCallback(() => {
    const r = localStorage.getItem("role");
    const uid = localStorage.getItem("user_id");
    
    const validRole = (!r || r === "null" || r === "undefined") ? null : r;
    const validId = (!uid || uid === "null" || uid === "undefined") ? null : uid;

    return { role: validRole, userId: validId };
  }, []);

  /* ✅ BACKGROUND RECOVERY: If localStorage is empty but Firebase is active */
  const recoverSession = async (currentUser) => {
    try {
      const idToken = await currentUser.getIdToken();
      // Hit your auth endpoint to get the DB user details again
      const res = await userAPI.post("/auth/firebase", { idToken });
      
      if (res.data.success) {
        console.log("🛠️ Session Recovered from Backend");
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("user_id", res.data.user?.id || res.data.userId);
        localStorage.setItem("token", res.data.token);
        setRole(res.data.role);
      }
    } catch (err) {
      console.error("Session recovery failed:", err);
    }
  };

  /* ✅ FIREBASE AUTH LISTENER */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      const session = getSessionData();
      
      setUser(currentUser);
      
      if (currentUser) {
        // If we have a user but no role/id in storage, trigger recovery
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

  /* ✅ LISTEN FOR STORAGE EVENTS (Sync across components) */
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
    <div style={{ display: "flex", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Sidebar hidden on login/register pages if they use the layout */}
      <Sidebar role={role} />

      <div
        style={{
          marginLeft: 250,
          padding: "24px",
          width: "calc(100% - 250px)",
          transition: "all 0.3s ease"
        }}
      >
        {/* HEADER / NAVBAR */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "white",
            padding: "16px 28px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            mb: 4
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontSize: '1.1rem' }}>
              {location.pathname === "/" ? "Dashboard" : 
               location.pathname.split("/").pop().replace("-", " ").toUpperCase()}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {user && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: "#1e293b", fontSize: "14px", fontWeight: 700 }}>
                  {user.email?.split("@")[0] || user.phoneNumber}
                </Typography>
                <Typography sx={{ color: '#6366f1', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  {role || 'Syncing...'}
                </Typography>
              </Box>
            )}

            {!user ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => navigate("/login")} variant="text" sx={{ fontWeight: 700 }}>Login</Button>
                <Button onClick={() => navigate("/register")} variant="contained" sx={{ borderRadius: '8px', boxShadow: 'none' }}>Join</Button>
              </Box>
            ) : (
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                onClick={handleLogout}
                sx={{ borderRadius: '8px', fontWeight: 700, px: 2 }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Box>

        {/* MAIN PAGE CONTENT */}
        <Box component="main" sx={{ animation: "fadeIn 0.5s ease-in" }}>
          <Outlet context={{ user, role }} />
        </Box>
      </div>
    </div>
  );
};

export default MainLayout;