import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { userAPI } from "../api/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /* 🔥 SYNC USER WITH BACKEND */
  const syncUser = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken(true);

      const res = await userAPI.post("/auth/firebase", { idToken });

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

      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  /* 🔥 FIREBASE SESSION (SILENT LOGIN) */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase Auth:", firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        await syncUser(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};