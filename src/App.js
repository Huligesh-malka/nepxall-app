import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

/* LAYOUTS */
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import OwnerLayout from "./layouts/OwnerLayout";
import VendorLayout from "./layouts/VendorLayout";

/* AUTH */
import Login from "./pages/Login";
import Register from "./pages/Register";

/* STATIC */
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";

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
import ServicesPage from "./pages/ServicesPage";

/* ⭐ USER PREMIUM */
import UserPremiumPlans from "./pages/UserPremiumPlans";

/* CHAT */
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
import OwnerChatList from "./pages/OwnerChatList";
import CreatePlan from "./pages/CreatePlan";
import OwnerPayments from "./pages/owner/OwnerPayments";

/* ⭐ OWNER PREMIUM */
import OwnerPremiumPlans from "./pages/owner/OwnerPremiumPlans";

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
import AdminPayments from "./pages/admin/AdminPayments";

/* ADMIN SERVICE */
import AdminServiceBookings from "./pages/admin/AdminServiceBookings";

/* VENDOR */
import VendorDashboard from "./pages/VendorDashboard";

/* QR */
import ScanPG from "./pages/ScanPG";

/* CONFIG */
import { testBackendConnection } from "./config";

function App() {

  const [user, setUser] = useState(undefined);

  useEffect(() => {

    testBackendConnection();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return unsub;

  }, []);

  if (user === undefined) return null;

  const PrivateRoute = ({ children }) =>
    user ? children : <Navigate to="/login" replace />;

  const RoleRoute = ({ children, allowedRole }) => {

    const role = localStorage.getItem("role");

    return user && role === allowedRole
      ? children
      : <Navigate to="/" replace />;

  };

  return (

    <Routes>

      {/* PUBLIC */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<UserPGSearch />} />
        <Route path="/pg/:id" element={<PGDetails />} />
        <Route path="/scan/:id" element={<ScanPG />} />
      </Route>

      {/* STATIC */}
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* USER ROUTES */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/booking/:pgId" element={<BookingForm />} />
        <Route path="/user/bookings" element={<UserBookingHistory />} />
        <Route path="/user/services/:bookingId" element={<ServicesPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/agreement/:bookingId" element={<AgreementPage />} />
        <Route path="/user/my-stay" element={<UserActiveStay />} />
        <Route path="/user/notifications" element={<NotificationBell />} />
        <Route path="/user/aadhaar-kyc" element={<AadhaarKyc />} />
        <Route path="/user/visit-schedule/:bookingId" element={<VisitSchedulePage />} />
        <Route path="/public/agreement/:hash" element={<PublicAgreementPage />} />

        {/* ⭐ USER PREMIUM PAGE */}
        <Route path="/user/premium" element={<UserPremiumPlans />} />

        <Route path="/chat/private/:userId" element={<PrivateChat />} />
      </Route>

      {/* OWNER ROUTES */}
      <Route
        path="/owner"
        element={
          <PrivateRoute>
            <RoleRoute allowedRole="owner">
              <OwnerLayout />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="payments" element={<OwnerPayments />} />

        {/* ⭐ OWNER PREMIUM PAGE */}
        <Route path="premium" element={<OwnerPremiumPlans />} />

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
        <Route path="chats" element={<OwnerChatList />} />
        <Route path="chat/private/:userId" element={<PrivateChat />} />
      </Route>

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <RoleRoute allowedRole="admin">
              <AdminLayout />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="finance" replace />} />
        <Route path="finance" element={<AdminFinanceDashboard />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="settlements" element={<AdminSettlements />} />
        <Route path="settlement-history" element={<SettlementHistory />} />
        <Route path="pending-pgs" element={<AdminPendingPGs />} />
        <Route path="pg/:id" element={<AdminPGDetails />} />
        <Route path="owner-verification" element={<AdminOwnerVerification />} />
        <Route path="services" element={<AdminServiceBookings />} />
      </Route>

      {/* VENDOR */}
      <Route
        path="/vendor"
        element={
          <PrivateRoute>
            <RoleRoute allowedRole="vendor">
              <VendorLayout />
            </RoleRoute>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>

  );

}

export default App;