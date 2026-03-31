import axios from "axios";
import { auth } from "../firebase";
import { API_CONFIG } from "../config";

/* =====================================================
   🌍 BASE URL
===================================================== */

const USER_BASE_URL =
  API_CONFIG?.USER_API_URL ||
  process.env.REACT_APP_API_URL ||
  "https://nepxall-backend.onrender.com/api";

const ADMIN_BASE_URL =
  API_CONFIG?.ADMIN_API_URL ||
  process.env.REACT_APP_ADMIN_API_URL ||
  "https://nepxall-backend.onrender.com/api/admin";

console.log("🌐 API CONFIG →", { USER_BASE_URL, ADMIN_BASE_URL });

/* =====================================================
   🔥 BACKEND WAKEUP SYSTEM
===================================================== */

let backendReady = false;
let wakePromise = null;

const wakeBackend = async () => {
  if (backendReady) return;

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
  });

  /* ================= REQUEST ================= */

  api.interceptors.request.use(async (config) => {
    await wakeBackend();

    try {
      console.log("📡", `${baseURL}${config.url}`);

      const user = auth.currentUser;

      if (user) {
        // 🔥 IMPORTANT FIX → ALWAYS FRESH TOKEN
        const token = await user.getIdToken(true);
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
      if (!error.response) {
        console.error("🌐 Backend unreachable:", baseURL);
        backendReady = false;
        return Promise.reject(error);
      }

      const originalRequest = error.config;

      /* 🔁 RETRY ON 401 */
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const user = auth.currentUser;

          if (user) {
            const newToken = await user.getIdToken(true);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch {
          await auth.signOut();
          window.location.href = "/login";
        }
      }

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

export const userAPI = createApi(USER_BASE_URL);
export const adminAPI = createApi(ADMIN_BASE_URL);

/* =====================================================
   🏠 PG APIs
===================================================== */

export const pgAPI = {
  getOwnerDashboard: () => userAPI.get("/pg/owner/dashboard"),
  getOwnerProperties: () => userAPI.get("/pg/owner"),
  getProperty: (id) => userAPI.get(`/pg/${id}`),

  createProperty: (formData) =>
    userAPI.post("/pg/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateProperty: (id, data) => userAPI.put(`/pg/${id}`, data),
  deleteProperty: (id) => userAPI.delete(`/pg/${id}`),

  // 🔥 OWNER BOOKINGS (NOW WILL WORK)
  getOwnerBookings: () => userAPI.get("/owner/bookings"),

  updateBookingStatus: (bookingId, status) =>
    userAPI.put(`/bookings/${bookingId}`, { status }),

  searchProperties: (params) =>
    userAPI.get("/pg/search", { params }),
};

/* =====================================================
   👑 ADMIN APIs
===================================================== */

export const adminPGAPI = {
  getPendingPGs: () => adminAPI.get("/pgs/pending"),
  getPGById: (id) => adminAPI.get(`/pg/${id}`),
  approvePG: (id) => adminAPI.patch(`/pg/${id}/approve`),
  rejectPG: (id, reason) =>
    adminAPI.patch(`/pg/${id}/reject`, { reason }),
};

export default userAPI;