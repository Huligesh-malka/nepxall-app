import axios from "axios";
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

const isDev = process.env.NODE_ENV !== "production";

/* =====================================================
   🔐 GLOBAL TOKEN STORE
===================================================== */

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

/* =====================================================
   🔥 BACKEND WAKEUP (RENDER COLD START FIX)
===================================================== */

let backendWoken = false;

const wakeBackend = async () => {
  if (backendWoken) return;

  try {
    await fetch(`${USER_BASE_URL}/health`);
    backendWoken = true;
    isDev && console.log("🔥 Backend awakened");
  } catch {
    isDev && console.log("⚠️ Wakeup failed (ignored)");
  }
};

/* =====================================================
   🚀 AXIOS FACTORY
===================================================== */

const createApi = (baseURL) => {
  const api = axios.create({
    baseURL,
    timeout: 60000,
  });

  /* ================= REQUEST ================= */

  api.interceptors.request.use(async (config) => {
    await wakeBackend();

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    isDev && console.log("📡", `${baseURL}${config.url}`);

    return config;
  });

  /* ================= RESPONSE ================= */

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;

      /* 🌐 NETWORK / COLD START RETRY */
      if (!error.response && !originalRequest._retryNetwork) {
        originalRequest._retryNetwork = true;

        isDev && console.log("🔁 Retrying request after cold start...");

        await new Promise((r) => setTimeout(r, 2000));
        return api(originalRequest);
      }

      /* 🔐 TOKEN EXPIRED RETRY */
      if (error.response?.status === 401 && !originalRequest._retryAuth) {
        originalRequest._retryAuth = true;

        try {
          const newToken = await window.getFreshToken?.();

          if (newToken) {
            setAuthToken(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch {
          console.warn("🔐 Silent refresh failed");
        }

        window.location.href = "/login";
      }

      /* 🧯 ERROR LOGGING */
      if (error.response?.status >= 500) {
        console.error("🔥 Server error:", error.response.data);
      }

      if (error.response?.status === 404) {
        console.error("❌ API route not found:", originalRequest.url);
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

  getOwnerBookings: () => userAPI.get("/owner/bookings"),

  updateBookingStatus: (bookingId, status) =>
    userAPI.put(`/bookings/${bookingId}`, { status }),

  /* 🌍 PUBLIC SEARCH */
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