import React, { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button, Box, CircularProgress } from "@mui/material";

const MainLayout = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  /* ✅ HELPER: NORMALIZE SESSION DATA */
  const getSessionData = useCallback(() => {
    const r = localStorage.getItem("role");
    const uid = localStorage.getItem("user_id");
    
    // Safety check for common "null" string issues
    const validRole = (!r || r === "null" || r === "undefined") ? null : r;
    const validId = (!uid || uid === "null" || uid === "undefined") ? null : uid;

    return { role: validRole, userId: validId };
  }, []);

  /* ✅ FIREBASE AUTH LISTENER */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      const session = getSessionData();
      
      setUser(currentUser);
      setRole(session.role);
      setAuthReady(true);

      // DEBUGGING: Log session state every time auth state flickers
      if (currentUser) {
        console.log("🛡️ Auth Active:", {
          firebaseUser: currentUser.email || currentUser.phoneNumber,
          storedRole: session.role,
          storedUserId: session.userId
        });
      } else {
        console.log("🛡️ Auth: No Firebase user detected.");
      }
    });

    return () => unsub();
  }, [getSessionData]);

  /* ✅ LISTEN FOR SESSION UPDATES (across tabs or same-tab events) */
  useEffect(() => {
    const syncUI = () => {
      const session = getSessionData();
      console.log("🔄 Session Synced:", session);
      setRole(session.role);
    };

    window.addEventListener("role-updated", syncUI);
    window.addEventListener("storage", syncUI); // Captures changes from other tabs

    return () => {
      window.removeEventListener("role-updated", syncUI);
      window.removeEventListener("storage", syncUI);
    };
  }, [getSessionData]);

  /* ✅ LOGOUT */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear(); // Wipe everything on logout
      setUser(null);
      setRole(null);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  /* ⏳ LOADING STATE */
  if (!authReady) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      {/* Passing role to Sidebar ensures the menu updates immediately */}
      <Sidebar role={role} />

      <div
        style={{
          marginLeft: 250,
          padding: 20,
          width: "calc(100% - 250px)",
          background: "#f8fafc",
          minHeight: "100vh",
          transition: "margin 0.3s"
        }}
      >
        {/* TOP NAVBAR */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mb: 3,
            alignItems: "center",
            backgroundColor: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}
        >
          {user && (
            <span style={{ marginRight: "auto", color: "#475569", fontSize: "14px" }}>
              Logged in as: <strong>{user.email?.split("@")[0] || user.phoneNumber}</strong> 
              <span style={{ marginLeft: '10px', color: '#6366f1', textTransform: 'uppercase', fontSize: '11px' }}>
                ({role || 'No Role'})
              </span>
            </span>
          )}

          {!user ? (
            <>
              <Button onClick={() => navigate("/login")} variant="outlined" size="small">
                Login
              </Button>
              <Button onClick={() => navigate("/register")} variant="contained" size="small">
                Register
              </Button>
            </>
          ) : (
            <Button variant="contained" color="error" size="small" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>

        {/* PAGE CONTENT */}
        <Box component="main">
          <Outlet />
        </Box>
      </div>
    </div>
  );
};

export default MainLayout;