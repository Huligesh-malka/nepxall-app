import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { userAPI } from "../api/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const isSyncing = useRef(false);
  const logoutTimer = useRef(null);

  // RETRY FUNCTION
  const retryRequest = async (fn, retries = 3, delay = 2000) => {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status === 401) throw err;
      if (retries <= 0) throw err;
      console.log(`🔁 Retrying... (${retries})`);
      await new Promise((res) => setTimeout(res, delay));
      return retryRequest(fn, retries - 1, delay);
    }
  };

  // CLEAR SESSION
  const clearSession = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
  };

  // SYNC USER WITH BACKEND - 🔥 FIXED HERE
  const syncUser = async (firebaseUser) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await retryRequest(() =>
        userAPI.post("/auth/firebase", { idToken })
      );

      if (res.data.success) {
        const backendRole = res.data.role?.toLowerCase().trim();

        // 🔥🔥🔥 MAIN FIX - MERGE BACKEND DATA WITH FIREBASE USER 🔥🔥🔥
        setUser({
          ...firebaseUser,      // Keep all Firebase properties (uid, phoneNumber, etc.)
          name: res.data.name,   // Add name from backend
          id: res.data.userId    // Add user ID from backend
        });
        
        setRole(backendRole);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", backendRole);
        localStorage.setItem("user_id", res.data.userId);

        console.log("✅ Auth Synced:", backendRole);
        console.log("✅ User data:", {
          uid: firebaseUser.uid,
          name: res.data.name,
          role: backendRole
        });
      }
    } catch (err) {
      console.error("❌ Auth Sync Failed:", err);

      if (!err.response) {
        console.log("🌐 Backend unreachable → keep session");
        setUser(firebaseUser);
        return;
      }

      if (err.response.status === 401) {
        console.log("🔒 Unauthorized → clearing session");
        clearSession();
      } else {
        console.log("⚠️ Server error → keep session");
        setUser(firebaseUser);
      }
    } finally {
      isSyncing.current = false;
      setLoading(false);
    }
  };

  // FIREBASE SESSION
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase Auth:", firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        await syncUser(firebaseUser);
        setInitialized(true);
      } else {
        if (logoutTimer.current) {
          clearTimeout(logoutTimer.current);
        }
        
        console.log("⚠️ Firebase null → wait before logout");
        
        logoutTimer.current = setTimeout(() => {
          if (!auth.currentUser) {
            console.log("🔒 Confirm logout");
            clearSession();
          }
          setLoading(false);
          setInitialized(true);
        }, 2000);
        
        return;
      }
    });

    return () => {
      unsub();
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, []);

  // AUTO RECOVERY
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user && !localStorage.getItem("token") && !isSyncing.current) {
        console.log("🔄 Re-syncing user...");
        await syncUser(user);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    user,
    role,
    loading: loading || !initialized,
    isAuthenticated: !!user && !!localStorage.getItem("token"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};