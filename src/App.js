import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* 🔐 AUTH */
import { useAuth } from "./context/AuthProvider";
import { setAuthToken } from "./api/api";

/* 🔥 BACKEND WAKEUP */
import { useBackendWakeup } from "./hooks/useBackendWakeup";

/* LAYOUTS */
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import OwnerLayout from "./layouts/OwnerLayout";

/* AUTH PAGES */
import Login from "./pages/Login";
import Register from "./pages/Register";

/* USER */
import UserPGSearch from "./pages/UserPGSearch";
import PGDetails from "./pages/PGDetails";
import BookingForm from "./pages/BookingForm";
import UserBookingHistory from "./pages/UserBookingHistory";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentPage from "./pages/PaymentPage";
import NotificationBell from "./pages/NotificationBell";
import AgreementPage from "./pages/AgreementPage";
import UserActiveStay from "./pages/UserActiveStay";
import AadhaarKyc from "./pages/AadhaarKyc";
import VisitSchedulePage from "./pages/VisitSchedulePage";
import PublicAgreementPage from "./pages/PublicAgreementPage";

/* CASHFREE */
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";

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
import OwnerBankDetails from "./pages/owner/OwnerBankDetails";
import OwnerVerificationPage from "./pages/owner/OwnerVerification";
import PgAnnouncements from "./pages/PgAnnouncements";
import OwnerChatList from "./pages/OwnerChatList";
import CreatePlan from "./pages/CreatePlan";

/* HOTEL */
import AddHotel from "./pages/hotels/AddHotel";
import OwnerHotels from "./pages/hotels/OwnerHotels";

/* ADMIN */
import AdminOwnerVerification from "./pages/admin/AdminOwnerVerification";
import AdminPendingPGs from "./pages/admin/AdminPendingPGs";
import AdminPGDetails from "./pages/admin/AdminPGDetails";
import AdminSettlements from "./pages/admin/AdminSettlements";
import AdminFinanceDashboard from "./pages/admin/AdminFinanceDashboard";
import SettlementHistory from "./pages/admin/SettlementHistory";

/* ================= PROTECTED ROUTE ================= */

const ProtectedRoute = ({ children, role }) => {
  const { user, loading, userData } = useAuth();

  if (loading) return <div className="loader">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (role && userData?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { token } = useAuth();

  /* 🔥 Wake backend on app start */
  useBackendWakeup();

  /* 🔐 Attach token to API */
  useEffect(() => {
    if (token) {
      setAuthToken(token);

      // for silent refresh retry
      window.getFreshToken = async () => token;
    }
  }, [token]);

  return (
    <Routes>

      {/* ================= AUTH ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= USER ================= */}
      <Route element={<MainLayout />}>
        <Route index element={<UserPGSearch />} />
        <Route path="pg/:id" element={<PGDetails />} />

        <Route
          path="booking/:pgId"
          element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="user/bookings"
          element={
            <ProtectedRoute>
              <UserBookingHistory />
            </ProtectedRoute>
          }
        />

        <Route path="payment-success" element={<PaymentSuccess />} />

        <Route
          path="payment/:bookingId"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="agreement/:bookingId"
          element={
            <ProtectedRoute>
              <AgreementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="user/my-stay"
          element={
            <ProtectedRoute>
              <UserActiveStay />
            </ProtectedRoute>
          }
        />

        <Route
          path="user/notifications"
          element={
            <ProtectedRoute>
              <NotificationBell />
            </ProtectedRoute>
          }
        />

        <Route
          path="user/aadhaar-kyc"
          element={
            <ProtectedRoute>
              <AadhaarKyc />
            </ProtectedRoute>
          }
        />

        <Route path="public/agreement/:hash" element={<PublicAgreementPage />} />

        {/* CHAT */}
        <Route path="pg-chat/:pgId" element={<ProtectedRoute><PgChat /></ProtectedRoute>} />
        <Route path="chat/private/:userId" element={<ProtectedRoute><PrivateChat /></ProtectedRoute>} />

        {/* CASHFREE */}
        <Route path="contact" element={<Contact />} />
        <Route path="terms" element={<Terms />} />
        <Route path="refund-policy" element={<RefundPolicy />} />
      </Route>

      {/* ================= OWNER ================= */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute role="owner">
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="pgs" element={<OwnerDashboard />} />
        <Route path="bookings" element={<OwnerBookings />} />
        <Route path="verification" element={<OwnerVerificationPage />} />
        <Route path="bank" element={<OwnerBankDetails />} />
        <Route path="hotels" element={<OwnerHotels />} />
        <Route path="add-hotel" element={<AddHotel />} />
        <Route path="add" element={<OwnerAddPG />} />
        <Route path="edit/:id" element={<EditPG />} />
        <Route path="rooms/:pgId" element={<OwnerRooms />} />
        <Route path="photos/:id" element={<OwnerPGPhotos />} />
        <Route path="videos/:id" element={<OwnerPGVideos />} />
        <Route path="reviews/:pgId" element={<OwnerReviewReply />} />
        <Route path="property/:propertyId/plans" element={<CreatePlan />} />
        <Route path="notifications" element={<OwnerNotifications />} />
        <Route path="pg-announcements/:pgId" element={<PgAnnouncements />} />
        <Route path="pg-chat/:pgId" element={<PgChat />} />
        <Route path="chat/private/:userId" element={<PrivateChat />} />
        <Route path="chats" element={<OwnerChatList />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="finance" replace />} />
        <Route path="finance" element={<AdminFinanceDashboard />} />
        <Route path="settlements" element={<AdminSettlements />} />
        <Route path="settlement-history" element={<SettlementHistory />} />
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