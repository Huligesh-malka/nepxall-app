import axios from "axios";
import { auth } from "../firebase";

/* =====================================================
   🌍 BASE URL - NO HARDCODED FALLBACKS
===================================================== */

const USER_BASE_URL = process.env.REACT_APP_API_URL;
const ADMIN_BASE_URL = process.env.REACT_APP_ADMIN_API_URL;

// Validate required environment variables
if (!USER_BASE_URL) {
  console.error("❌ REACT_APP_API_URL is not defined in environment variables");
}

if (!ADMIN_BASE_URL) {
  console.error("❌ REACT_APP_ADMIN_API_URL is not defined in environment variables");
}

/* =====================================================
   🔥 BACKEND WAKEUP SYSTEM (IMPROVED SAFE)
===================================================== */

let backendReady = false;
let wakePromise = null;

const wakeBackend = async () => {
  if (backendReady) return true;

  if (!wakePromise) {
    console.log("⏳ Waking backend...");

    wakePromise = new Promise(async (resolve) => {
      const start = Date.now();

      while (Date.now() - start < 120000) {
        try {
          await fetch(`${USER_BASE_URL}/health`);
          backendReady = true;
          console.log("✅ Backend awake");
          resolve(true);
          return;
        } catch {
          console.log("⌛ waiting for backend...");
          await new Promise((r) => setTimeout(r, 4000));
        }
      }

      console.error("❌ Backend wake failed");
      resolve(false);
    });
  }

  return wakePromise;
};

/* =====================================================
   🚀 AXIOS FACTORY
===================================================== */

const createApi = (baseURL) => {
  const api = axios.create({
    baseURL,
    timeout: 120000,
    headers: {
      "Content-Type": "application/json"  // ✅ Added default content-type
    }
  });

  /* ================= REQUEST ================= */

  api.interceptors.request.use(async (config) => {
    await wakeBackend();

    try {
      console.log("📡", `${baseURL}${config.url}`);

      const user = auth.currentUser;

      if (user) {
        // ✅ Use WITHOUT force refresh - let Firebase handle expiration
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("⚠️ Token error:", err.message);
    }

    return config;
  });

  /* ================= RESPONSE ================= */

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;

      // Initialize retry count if not exists
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      ////////////////////////////////////////////////////////
      // ✅ FIX 1: DO NOT LOGOUT ON NETWORK ERROR with retry limit
      ////////////////////////////////////////////////////////
      if (!error.response) {
        console.error("🌐 Backend unreachable:", baseURL);

        backendReady = false;

        // ✅ Retry up to 2 times maximum
        if (originalRequest._retryCount < 2) {
          originalRequest._retryCount++;
          console.log(`🔄 Retry attempt ${originalRequest._retryCount}/2...`);
          
          try {
            await wakeBackend();
            return api(originalRequest);
          } catch {
            return Promise.reject(error);
          }
        } else {
          console.error("❌ Max retry attempts reached");
          return Promise.reject(error);
        }
      }

      ////////////////////////////////////////////////////////
      // 🔁 EXISTING 401 LOGIC (WITHOUT force refresh)
      ////////////////////////////////////////////////////////
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const user = auth.currentUser;

          if (user) {
            // ✅ Use WITHOUT force refresh here too
            const newToken = await user.getIdToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch {
          await auth.signOut();
          localStorage.clear();
          window.location.href = "/login";
        }
      }

      ////////////////////////////////////////////////////////
      // ✅ FIX 2: SAFE ERROR HANDLING (NO LOGOUT)
      ////////////////////////////////////////////////////////

      if (error.response.status === 403) {
        console.error("⛔ Access denied:", error.response.data);
      }

      if (error.response.status >= 500) {
        console.error("🔥 Server error:", error.response.data);
      }

      if (error.response.status === 404) {
        console.error("❌ Route not found:", originalRequest.url);
      }

      return Promise.reject(error);
    }
  );

  return api;
};

/* =====================================================
   📦 INSTANCES
===================================================== */

// Only create APIs if URLs are defined
export const userAPI = USER_BASE_URL ? createApi(USER_BASE_URL) : null;
export const adminAPI = ADMIN_BASE_URL ? createApi(ADMIN_BASE_URL) : null;

// Add warning if APIs couldn't be created
if (!userAPI || !adminAPI) {
  console.warn("⚠️ API instances not fully initialized due to missing environment variables");
}

/* =====================================================
   🏠 PG APIs
===================================================== */

export const pgAPI = {
  getOwnerDashboard: () => userAPI?.get("/pg/owner/dashboard"),
  getOwnerProperties: () => userAPI?.get("/pg/owner"),
  getProperty: (id) => userAPI?.get(`/pg/${id}`),

  createProperty: (formData) =>
    userAPI?.post("/pg/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateProperty: (id, data) => userAPI?.put(`/pg/${id}`, data),
  deleteProperty: (id) => userAPI?.delete(`/pg/${id}`),

  getOwnerBookings: () => userAPI?.get("/owner/bookings"),

  updateBookingStatus: (bookingId, status) =>
    userAPI?.put(`/bookings/${bookingId}`, { status }),

  searchProperties: (params) =>
    userAPI?.get("/pg/search", { params }),

  getPlan: () => userAPI?.get("/pg/plan"),
};

/* =====================================================
   👑 ADMIN APIs
===================================================== */

export const adminPGAPI = {
  getPendingPGs: () => adminAPI?.get("/pgs/pending"),

  getPGById: (id) => adminAPI?.get(`/pg/${id}`),

  approvePG: (id) => adminAPI?.patch(`/pg/${id}/approve`),

  rejectPG: (id, reason) =>
    adminAPI?.patch(`/pg/${id}/reject`, { reason }),

  updatePGField: (id, field, value) =>
    adminAPI?.patch(`/pg/${id}/update-field`, {
      field,
      value,
    }),
};

export default userAPI;