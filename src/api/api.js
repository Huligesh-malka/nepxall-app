import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { API_CONFIG, testBackendConnection } from "../config";

/* =====================================================
   🌍 BASE URLS
===================================================== */

const USER_BASE_URL = API_CONFIG.USER_API_URL;
const ADMIN_BASE_URL = API_CONFIG.ADMIN_API_URL;

console.log("🌐 API Service Initialized:", {
  userApi: USER_BASE_URL,
  adminApi: ADMIN_BASE_URL,
  environment: API_CONFIG.ENV,
});

/* =====================================================
   🔐 WAIT FOR FIREBASE USER (ON REFRESH)
===================================================== */

const getCurrentUser = () =>
  new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });

/* =====================================================
   🚀 CREATE AXIOS INSTANCE
===================================================== */

const createApi = (baseURL, isAdmin = false) => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  /* ================= REQUEST INTERCEPTOR ================= */

  instance.interceptors.request.use(async (config) => {
    try {
      let user = auth.currentUser;

      if (!user) user = await getCurrentUser();

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        
        // Log in development only
        if (!API_CONFIG.IS_PRODUCTION) {
          console.log(`🔑 Token attached for ${config.method.toUpperCase()} ${config.url}`);
        }
      } else {
        console.log("⚠️ No user found, proceeding without token");
      }
    } catch (err) {
      console.warn("⚠️ Token attach failed:", err.message);
    }

    return config;
  });

  /* ================= RESPONSE INTERCEPTOR ================= */

  instance.interceptors.response.use(
    (res) => {
      // Log successful responses in development
      if (!API_CONFIG.IS_PRODUCTION) {
        console.log(`✅ ${res.status} ${res.config.url}`, res.data);
      }
      return res;
    },
    async (error) => {
      // Handle network errors (backend not reachable)
      if (!error.response) {
        console.error("🌐 Backend not reachable at:", baseURL);
        
        if (error.code === 'ECONNABORTED') {
          console.error("⏱️ Request timeout - server took too long to respond");
        } else if (error.message.includes('Network Error')) {
          console.error("🔌 Network error - CORS or server not accessible");
          
          // Auto-test connection
          const test = await testBackendConnection();
          if (!test.success) {
            console.error("💡 Tip: Make sure your backend is running at:", USER_BASE_URL);
          }
        }
        
        return Promise.reject(error);
      }

      const { status, data } = error.response;

      // Log error details
      console.error(`❌ API Error ${status}:`, {
        url: error.config.url,
        method: error.config.method,
        data: data,
      });

      // Handle specific status codes
      switch (status) {
        case 401:
          console.warn("⚠️ Session expired or unauthorized → logging out");
          await auth.signOut();
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = "/login";
          }
          break;
          
        case 403:
          console.warn("⛔ Forbidden - insufficient permissions");
          // You could redirect to a forbidden page
          if (isAdmin) {
            window.location.href = "/admin/unauthorized";
          }
          break;
          
        case 404:
          console.warn("🔍 Resource not found:", error.config.url);
          break;
          
        case 422:
          console.warn("📋 Validation error:", data);
          break;
          
        case 429:
          console.warn("⏳ Rate limited - too many requests");
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          console.error("🔥 Server error:", data);
          // Show user-friendly message (optional)
          if (!API_CONFIG.IS_PRODUCTION) {
            alert("Server is experiencing issues. Please try again later.");
          }
          break;
          
        default:
          console.warn(`⚠️ Unhandled status code: ${status}`);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/* =====================================================
   📦 EXPORT APIs
===================================================== */

export const userAPI = createApi(USER_BASE_URL, false);
export const adminAPI = createApi(ADMIN_BASE_URL, true);

// Test function to verify connection
export const testConnection = async () => {
  return await testBackendConnection();
};

// Health check function
export const checkHealth = async () => {
  try {
    const response = await userAPI.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* ✅ DEFAULT EXPORT FOR OLD FILES */
export default userAPI;