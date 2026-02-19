/* =====================================================
   🔧 CONFIGURATION FILE
   Manages API URLs and environment settings
===================================================== */

// Debug logging - this will show in production too
console.log("🔥 CONFIG.JS LOADED");
console.log("📋 Environment info:", {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL
});

// Log all Vite environment variables (safe ones only)
const viteKeys = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
console.log("📋 Vite env vars found:", viteKeys);

// Get the base API URL from environment or use localhost default
const getApiUrl = () => {
  console.log("🔍 Checking for VITE_API_URL...");
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  
  if (envUrl) {
    console.log("✅ Found VITE_API_URL:", envUrl);
    // Validate it's a proper URL
    try {
      new URL(envUrl);
      console.log("✅ URL is valid");
    } catch (e) {
      console.warn("⚠️ VITE_API_URL is not a valid URL:", envUrl);
    }
    return envUrl;
  }
  
  console.warn("⚠️ VITE_API_URL not found, using fallback: http://localhost:5000/api");
  return "http://localhost:5000/api";
};

// Get the backend URL (without /api suffix)
const getBackendUrl = () => {
  const apiUrl = getApiUrl();
  const backendUrl = apiUrl.replace("/api", "");
  console.log("🔧 Backend URL derived:", backendUrl);
  return backendUrl;
};

// Create config object
export const API_CONFIG = {
  API_URL: getApiUrl(),
  BACKEND_URL: getBackendUrl(),
  
  // App info
  APP_NAME: "Nepxall",
  APP_VERSION: "1.0.0",
  ENV: import.meta.env.MODE,
  
  // Helper to check if using production URLs
  IS_PRODUCTION: import.meta.env.PROD && import.meta.env.VITE_API_URL?.includes('render.com'),
  IS_DEVELOPMENT: import.meta.env.DEV
};

// Always log the final config in both dev and prod
console.log("🔧 Final API_CONFIG:", {
  API_URL: API_CONFIG.API_URL,
  BACKEND_URL: API_CONFIG.BACKEND_URL,
  IS_PRODUCTION: API_CONFIG.IS_PRODUCTION,
  ENV: API_CONFIG.ENV
});

// Add to window for easy debugging in console
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  console.log("✅ API_CONFIG attached to window for debugging");
}

// Export a test function
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