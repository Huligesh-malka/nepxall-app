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

  // 🔥 NEW: prevent multiple sync calls
  const isSyncing = useRef(false);

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
  // 🔐 CLEAN LOGOUT (NEW - CENTRALIZED)
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
      const idToken = await firebaseUser.getIdToken(true);

      const res = await retryRequest(() =>
        userAPI.post("/auth/firebase", { idToken })
      );

      if (res.data.success) {
        const backendRole = res.data.role?.toLowerCase().trim();

        setUser(firebaseUser);
        setRole(backendRole);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", backendRole);
        localStorage.setItem("user_id", res.data.userId);

        console.log("✅ Auth Synced:", backendRole);
      }
    } catch (err) {
      console.error("❌ Auth Sync Failed:", err);

      ////////////////////////////////////////////////////////
      // ✅ NETWORK ERROR → KEEP USER
      ////////////////////////////////////////////////////////
      if (!err.response) {
        console.log("🌐 Backend unreachable → keep session");
        setUser(firebaseUser);
        return;
      }

      ////////////////////////////////////////////////////////
      // 🔐 ONLY LOGOUT ON 401
      ////////////////////////////////////////////////////////
      if (err.response.status === 401) {
        console.log("🔒 Unauthorized → clearing session");
        clearSession();
      } else {
        ////////////////////////////////////////////////////////
        // ⚠️ SERVER ERROR → KEEP USER
        ////////////////////////////////////////////////////////
        console.log("⚠️ Server error → keep session");
        setUser(firebaseUser);
      }
    } finally {
      isSyncing.current = false;
      setLoading(false);
    }
  };

  ////////////////////////////////////////////////////////
  // 🔥 FIREBASE SESSION (AUTO LOGIN)
  ////////////////////////////////////////////////////////
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase Auth:", firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        await syncUser(firebaseUser);
      } else {
        clearSession();
        setLoading(false);
      }
    });

    return () => unsub();
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
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  ////////////////////////////////////////////////////////
  // 📦 CONTEXT VALUE (STABLE)
  ////////////////////////////////////////////////////////
  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user, // 🔥 NEW
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};