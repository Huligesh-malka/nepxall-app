import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { API_CONFIG } from "../config";

/* =====================================================
   🌍 BASE URLS - WITH PRODUCTION FALLBACK
===================================================== */

// Force production URL if in production environment
const isProduction = process.env.NODE_ENV === 'production';

const USER_BASE_URL = isProduction 
  ? "https://nepxall-backend.onrender.com/api"  // Hardcoded production URL as fallback
  : API_CONFIG.USER_API_URL;

const ADMIN_BASE_URL = isProduction
  ? "https://nepxall-backend.onrender.com/api/admin"
  : API_CONFIG.ADMIN_API_URL;

console.log("🌐 API Service Initialized:", {
  environment: isProduction ? "PRODUCTION" : "DEVELOPMENT",
  userBaseURL: USER_BASE_URL,
  adminBaseURL: ADMIN_BASE_URL,
  configURL: API_CONFIG.USER_API_URL
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

const createApi = (baseURL) => {
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
      // Log the full URL being called (helpful for debugging)
      console.log(`📡 API Request: ${config.baseURL}${config.url}`);
      
      let user = auth.currentUser;

      if (!user) user = await getCurrentUser();

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("⚠️ Token attach failed:", err.message);
    }

    return config;
  });

  /* ================= RESPONSE INTERCEPTOR ================= */

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (!error.response) {
        console.error("🌐 Backend not reachable:", error.config?.baseURL);
        console.error("❌ Failed URL:", error.config?.url);
        return Promise.reject(error);
      }

      if (error.response.status === 401) {
        console.warn("⚠️ Session expired → logout");
        await auth.signOut();
        window.location.href = "/login";
      }

      if (error.response.status === 403) {
        console.warn("⛔ Forbidden");
      }

      if (error.response.status >= 500) {
        console.error("🔥 Server error:", error.response.data);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/* =====================================================
   📦 EXPORT APIs
===================================================== */

export const userAPI = createApi(USER_BASE_URL);
export const adminAPI = createApi(ADMIN_BASE_URL);

/* =====================================================
   📦 PG/Property Endpoints (Convenience Methods)
===================================================== */

export const pgAPI = {
  // Owner endpoints
  getOwnerDashboard: () => {
    console.log("📡 Calling getOwnerDashboard");
    return userAPI.get("/pg/owner/dashboard");
  },
  getOwnerProperties: () => userAPI.get("/pg/owner"),
  getProperty: (id) => userAPI.get(`/pg/${id}`),
  createProperty: (formData) => {
    console.log("📡 Calling createProperty with baseURL:", userAPI.defaults.baseURL);
    return userAPI.post("/pg/add", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  updateProperty: (id, data) => userAPI.put(`/pg/${id}`, data),
  deleteProperty: (id) => userAPI.delete(`/pg/${id}`),
  
  // Booking endpoints
  getOwnerBookings: () => userAPI.get("/owner/bookings"),
  updateBookingStatus: (bookingId, status) => userAPI.put(`/bookings/${bookingId}`, { status }),
  
  // Public endpoints
  searchProperties: (params) => userAPI.get("/pg/search", { params }),
};

/* ✅ DEFAULT EXPORT FOR OLD FILES */
export default userAPI;