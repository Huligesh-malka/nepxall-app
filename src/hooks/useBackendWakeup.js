import { useEffect } from "react";

const BACKEND = "https://nepxall-backend.onrender.com/api/health";

export const useBackendWakeup = () => {
  useEffect(() => {
    const wake = async () => {
      try {
        await fetch(BACKEND);
        console.log("🔥 Backend awakened");
      } catch {
        console.log("⚠️ Wakeup failed (will retry on API call)");
      }
    };

    wake();
  }, []);
};