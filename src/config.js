/* =====================================================
   🔧 CONFIGURATION FILE (CRA VERSION)
   Uses REACT_APP_* environment variables
===================================================== */

console.log("🔥 CONFIG.JS LOADED");

/* ================= ENV DEBUG ================= */
console.log("📋 Environment info:", {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API: process.env.REACT_APP_API
});

/* ================= GET API URL ================= */
const getApiUrl = () => {
  console.log("🔍 Checking for REACT_APP_API...");

  const envUrl = process.env.REACT_APP_API?.trim();

  if (envUrl) {
    console.log("✅ Found REACT_APP_API:", envUrl);

    try {
      new URL(envUrl);
      console.log("✅ URL is valid");
    } catch {
      console.warn("⚠️ Invalid REACT_APP_API URL:", envUrl);
    }

    return envUrl;
  }

  console.warn("⚠️ REACT_APP_API not found, using localhost fallback");
  return "http://localhost:5000/api";
};

/* ================= BACKEND URL ================= */
const getBackendUrl = () => {
  const apiUrl = getApiUrl();
  const backendUrl = apiUrl.replace("/api", "");
  console.log("🔧 Backend URL derived:", backendUrl);
  return backendUrl;
};

/* ================= CONFIG OBJECT ================= */
export const API_CONFIG = {
  API_URL: getApiUrl(),
  BACKEND_URL: getBackendUrl(),

  APP_NAME: "Nepxall",
  APP_VERSION: "1.0.0",

  ENV: process.env.NODE_ENV,

  IS_PRODUCTION:
    process.env.NODE_ENV === "production" &&
    process.env.REACT_APP_API?.includes("render.com"),

  IS_DEVELOPMENT: process.env.NODE_ENV === "development"
};

/* ================= FINAL LOG ================= */
console.log("🔧 Final API_CONFIG:", API_CONFIG);

/* ================= WINDOW DEBUG ================= */
if (typeof window !== "undefined") {
  window.API_CONFIG = API_CONFIG;
  console.log("✅ API_CONFIG attached to window for debugging");
}

/* ================= BACKEND TEST ================= */
export const testBackendConnection = async () => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/health`);
    const data = await response.json();

    console.log("✅ Backend connection test successful:", data);

    return { success: true, data };
  } catch (error) {
    console.error("❌ Backend connection test failed:", error.message);

    return { success: false, error: error.message };
  }
};