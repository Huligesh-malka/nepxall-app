import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* LAYOUTS */
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import OwnerLayout from "./layouts/OwnerLayout";

/* AUTH */
import Login from "./pages/Login";
import Register from "./pages/Register";

/* USER */
import UserPGSearch from "./pages/UserPGSearch";
import PGDetails from "./pages/PGDetails";
import BookingForm from "./pages/BookingForm";
import UserBookingHistory from "./pages/UserBookingHistory";
import PaymentPage from "./pages/PaymentPage";
import NotificationBell from "./pages/NotificationBell";
import AgreementPage from "./pages/AgreementPage";
import UserActiveStay from "./pages/UserActiveStay";
import AadhaarKyc from "./pages/AadhaarKyc";

/* CHAT */
import PgChat from "./pages/PgChat";
import PrivateChat from "./pages/PrivateChat";

/* OWNER */
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerAddPG from "./pages/OwnerAddPG";
import EditPG from "./pages/EditPG";
import OwnerRooms from "./pages/OwnerRooms";
import OwnerBookings from "./pages/OwnerBookings";
import OwnerPGPhotos from "./pages/OwnerPGPhotos";
import OwnerPGVideos from "./pages/OwnerPGVideos";
import OwnerReviewReply from "./pages/OwnerReviewReply";
import OwnerNotifications from "./pages/OwnerNotifications";
import OwnerVerification from "./pages/owner/OwnerVerification";
import PgAnnouncements from "./pages/PgAnnouncements";
import OwnerChatList from "./pages/OwnerChatList";

/* 🏨 HOTEL */
import AddHotel from "./pages/hotels/AddHotel";
import OwnerHotels from "./pages/hotels/OwnerHotels";

/* ADMIN */
import AdminOwnerVerification from "./pages/admin/AdminOwnerVerification";
import AdminPendingPGs from "./pages/admin/AdminPendingPGs";
import AdminPGDetails from "./pages/admin/AdminPGDetails";

/* ================= DEBUG CONFIG ================= */
import { API_CONFIG, testBackendConnection } from "./config";

// This will run once when the app starts
console.log("🚀 APP STARTING");
console.log("📊 Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

console.log("🔧 API Configuration:", API_CONFIG);

// Test backend connection on app start
testBackendConnection().then(result => {
  if (result.success) {
    console.log("✅ Backend connection verified");
  } else {
    console.error("❌ Backend connection failed:", result.error);
    console.error("📡 Check if backend is running at:", API_CONFIG.API_URL);
  }
});

function App() {
  // Add a useEffect to log when routes change
  useEffect(() => {
    console.log("🔄 App mounted, current path:", window.location.pathname);
  }, []);

  return (
    <Routes>
      {/* ================= AUTH ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= USER ================= */}
      <Route element={<MainLayout />}>
        <Route index element={<UserPGSearch />} />
        <Route path="pg/:id" element={<PGDetails />} />
        <Route path="booking/:pgId" element={<BookingForm />} />

        <Route path="user/bookings" element={<UserBookingHistory />} />
        <Route path="user/my-stay" element={<UserActiveStay />} />
        <Route path="user/notifications" element={<NotificationBell />} />

        {/* ✅ USER AADHAAR KYC */}
        <Route path="user/aadhaar-kyc" element={<AadhaarKyc />} />

        <Route path="payment/:bookingId" element={<PaymentPage />} />
        <Route path="agreement/:bookingId" element={<AgreementPage />} />

        <Route path="pg-chat/:pgId" element={<PgChat />} />
        <Route path="user/pg-announcements/:pgId" element={<PgAnnouncements />} />
        <Route path="chat/private/:userId" element={<PrivateChat />} />
      </Route>

      {/* ================= OWNER ================= */}
      <Route path="/owner" element={<OwnerLayout />}>
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="pgs" element={<OwnerDashboard />} />
        <Route path="bookings" element={<OwnerBookings />} />

        {/* ✅ OWNER AADHAAR KYC */}
        <Route path="aadhaar-kyc" element={<AadhaarKyc />} />

        {/* 🏨 HOTEL */}
        <Route path="hotels" element={<OwnerHotels />} />
        <Route path="add-hotel" element={<AddHotel />} />

        {/* PG */}
        <Route path="add" element={<OwnerAddPG />} />
        <Route path="edit/:id" element={<EditPG />} />
        <Route path="rooms/:pgId" element={<OwnerRooms />} />
        <Route path="photos/:id" element={<OwnerPGPhotos />} />
        <Route path="videos/:id" element={<OwnerPGVideos />} />
        <Route path="reviews/:pgId" element={<OwnerReviewReply />} />

        {/* SYSTEM */}
        <Route path="notifications" element={<OwnerNotifications />} />
        <Route path="verification" element={<OwnerVerification />} />

        {/* COMMUNITY */}
        <Route path="pg-announcements/:pgId" element={<PgAnnouncements />} />
        <Route path="pg-chat/:pgId" element={<PgChat />} />
        <Route path="chat/private/:userId" element={<PrivateChat />} />
        <Route path="chats" element={<OwnerChatList />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="pending-pgs" element={<AdminPendingPGs />} />
        <Route path="pg/:id" element={<AdminPGDetails />} />
        <Route path="owner-verification" element={<AdminOwnerVerification />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;