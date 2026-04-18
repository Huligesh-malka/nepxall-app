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
  const [initialized, setInitialized] = useState(false); // 🔥 IMPROVEMENT 1

  // 🔥 prevent multiple sync calls
  const isSyncing = useRef(false);
  const logoutTimer = useRef(null); // 🔥 ISSUE 1 FIX

  ////////////////////////////////////////////////////////
  // 🔁 RETRY FUNCTION (IMPROVED)
  ////////////////////////////////////////////////////////
  const retryRequest = async (fn, retries = 3, delay = 2000) => {
    try {
      return await fn();
    } catch (err) {
      // ❌ do not retry for 401 (invalid user)
      if (err.response?.status === 401) throw err;

      if (retries <= 0) throw err;

      console.log(`🔁 Retrying... (${retries})`);
      await new Promise((res) => setTimeout(res, delay));
      return retryRequest(fn, retries - 1, delay);
    }
  };

  ////////////////////////////////////////////////////////
  // 🔐 CLEAN LOGOUT (CENTRALIZED)
  ////////////////////////////////////////////////////////
  const clearSession = () => {
    setUser(null);
    setRole(null);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
  };

  ////////////////////////////////////////////////////////
  // 🔥 SYNC USER WITH BACKEND (IMPROVED SAFE)
  ////////////////////////////////////////////////////////
  const syncUser = async (firebaseUser) => {
    if (isSyncing.current) return; // 🔥 prevent duplicate calls
    isSyncing.current = true;

    try {
      // 🔥 ISSUE 2 FIX: Don't force refresh every time
      const idToken = await firebaseUser.getIdToken();

      const res = await retryRequest(() =>
        userAPI.post("/auth/firebase", { idToken })
      );

      if (res.data.success) {
        const backendRole = res.data.role?.toLowerCase().trim();

        // 🔥🔥🔥 ONLY CHANGE - ADD NAME AND ID FROM BACKEND 🔥🔥🔥
        setUser({
          ...firebaseUser,
          name: res.data.name,
          id: res.data.userId
        });
        
        setRole(backendRole);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", backendRole);
        localStorage.setItem("user_id", res.data.userId);

        console.log("✅ Auth Synced:", backendRole);
      }
    } catch (err) {
      console.error("❌ Auth Sync Failed:", err);

      // ✅ NETWORK ERROR → KEEP USER
      if (!err.response) {
        console.log("🌐 Backend unreachable → keep session");
        setUser(firebaseUser);
        return;
      }

      // 🔐 ONLY LOGOUT ON 401
      if (err.response.status === 401) {
        console.log("🔒 Unauthorized → clearing session");
        clearSession();
      } else {
        // ⚠️ SERVER ERROR → KEEP USER
        console.log("⚠️ Server error → keep session");
        setUser(firebaseUser);
      }
    } finally {
      isSyncing.current = false;
      setLoading(false); // ✅ ensure loading stops
    }
  };

  ////////////////////////////////////////////////////////
  // 🔥 FIREBASE SESSION (AUTO LOGIN - FIXED)
  ////////////////////////////////////////////////////////
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase Auth:", firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        await syncUser(firebaseUser);
        setInitialized(true); // 🔥 IMPROVEMENT 1
      } else {
        // 🔥 ISSUE 1 FIX: Clear existing timer
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
          setInitialized(true); // 🔥 IMPROVEMENT 1
        }, 2000);
        
        return;
      }
    });

    return () => {
      unsub();
      // 🔥 Cleanup timer on unmount
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, []);

  ////////////////////////////////////////////////////////
  // 🔄 AUTO RECOVERY (SMART VERSION)
  ////////////////////////////////////////////////////////
  useEffect(() => {
    const interval = setInterval(async () => {
      // 🔥 only retry if:
      // user exists + token missing + not already syncing
      if (user && !localStorage.getItem("token") && !isSyncing.current) {
        console.log("🔄 Re-syncing user...");
        await syncUser(user);
      }
    }, 20000); // 🔥 IMPROVEMENT 2: Reduced from 10s to 20s

    return () => clearInterval(interval);
  }, [user]);

  ////////////////////////////////////////////////////////
  // 📦 CONTEXT VALUE (STABLE)
  ////////////////////////////////////////////////////////
  const value = {
    user,
    role,
    loading: loading || !initialized, // 🔥 IMPROVEMENT 1: Prevent flicker
    isAuthenticated: !!user && !!localStorage.getItem("token"), // ✅ FIXED
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};