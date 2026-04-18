import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { userAPI } from "../api/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Keep original Firebase user object
  const [userData, setUserData] = useState(null); // Store backend data separately
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // prevent multiple sync calls
  const isSyncing = useRef(false);
  const logoutTimer = useRef(null);

  ////////////////////////////////////////////////////////
  // RETRY FUNCTION
  ////////////////////////////////////////////////////////
  const retryRequest = async (fn, retries = 3, delay = 2000) => {
    try {
      return await fn();
    } catch (err) {
      // Don't retry for 401 (invalid user)
      if (err.response?.status === 401) throw err;

      if (retries <= 0) throw err;

      console.log(`🔁 Retrying... (${retries})`);
      await new Promise((res) => setTimeout(res, delay));
      return retryRequest(fn, retries - 1, delay);
    }
  };

  ////////////////////////////////////////////////////////
  // CLEAN LOGOUT (CENTRALIZED)
  ////////////////////////////////////////////////////////
  const clearSession = () => {
    setUser(null);
    setUserData(null);
    setRole(null);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
  };

  ////////////////////////////////////////////////////////
  // SYNC USER WITH BACKEND (KEEP FIREBASE OBJECT INTACT)
  ////////////////////////////////////////////////////////
  const syncUser = async (firebaseUser) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      // Firebase user object still has all its methods
      const idToken = await firebaseUser.getIdToken();

      const res = await retryRequest(() =>
        userAPI.post("/auth/firebase", { idToken })
      );

      if (res.data.success) {
        const backendRole = res.data.role?.toLowerCase().trim();

        // ✅ CORRECT: Keep original Firebase user object
        setUser(firebaseUser);
        
        // ✅ Store backend data separately
        setUserData({
          name: res.data.name,
          id: res.data.userId
        });
        
        setRole(backendRole);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", backendRole);
        localStorage.setItem("user_id", res.data.userId);
        localStorage.setItem("user_name", res.data.name);

        console.log("✅ Auth Synced:", backendRole);
      }
    } catch (err) {
      console.error("❌ Auth Sync Failed:", err);

      // Network error → keep user
      if (!err.response) {
        console.log("🌐 Backend unreachable → keep session");
        setUser(firebaseUser);
        return;
      }

      // Only logout on 401
      if (err.response.status === 401) {
        console.log("🔒 Unauthorized → clearing session");
        clearSession();
      } else {
        // Server error → keep user
        console.log("⚠️ Server error → keep session");
        setUser(firebaseUser);
      }
    } finally {
      isSyncing.current = false;
      setLoading(false);
    }
  };

  ////////////////////////////////////////////////////////
  // FIREBASE SESSION (AUTO LOGIN)
  ////////////////////////////////////////////////////////
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase Auth:", firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        await syncUser(firebaseUser);
        setInitialized(true);
      } else {
        // Clear existing timer
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

  ////////////////////////////////////////////////////////
  // AUTO RECOVERY (SMART VERSION)
  ////////////////////////////////////////////////////////
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only retry if: user exists + token missing + not already syncing
      if (user && !localStorage.getItem("token") && !isSyncing.current) {
        console.log("🔄 Re-syncing user...");
        await syncUser(user);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [user]);

  ////////////////////////////////////////////////////////
  // CONTEXT VALUE
  ////////////////////////////////////////////////////////
  const value = {
    user,           // Original Firebase user object (has getIdToken, etc.)
    userData,       // Backend data (name, id)
    role,
    loading: loading || !initialized,
    isAuthenticated: !!user && !!localStorage.getItem("token"),
    
    // Helper getters for common properties
    getUserName: () => userData?.name || localStorage.getItem("user_name"),
    getUserId: () => userData?.id || localStorage.getItem("user_id"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};