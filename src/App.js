import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

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
import BecomeOwner from "./pages/BecomeOwner";
import UserAgreements from "./pages/UserAgreements";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentPage from "./pages/PaymentPage";
import NotificationBell from "./pages/NotificationBell";
import AgreementPage from "./pages/AgreementPage";
import AgreementForm from "./pages/AgreementForm";        
import UserActiveStay from "./pages/UserActiveStay";
import AadhaarKyc from "./pages/AadhaarKyc";
import VisitSchedulePage from "./pages/VisitSchedulePage";
import PublicAgreementPage from "./pages/PublicAgreementPage";
import ServicesPage from "./pages/ServicesPage";
import VacateRequestPage from "./pages/VacateRequestPage";
import RefundRequestPage from "./pages/RefundRequestPage";

/* DIGILOCKER */
import DigiLockerVerify from "./pages/DigiLockerVerify";
import DigiLockerCallback from "./pages/DigiLockerCallback";

/* USER PREMIUM */
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
import OwnerActiveTenants from "./pages/owner/OwnerActiveTenants";
import OwnerVacateRequests from "./pages/owner/OwnerVacateRequests";
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
import AdminServiceBookings from "./pages/admin/AdminServiceBookings";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminAgreements from "./pages/admin/AdminAgreements";
import AdminPlanPayments from "./pages/admin/AdminPlanPayments";
import AdminAgreementDetails from "./pages/admin/AdminAgreementDetails";

/* VENDOR */
import VendorDashboard from "./pages/VendorDashboard";

/* QR */
import ScanPG from "./pages/ScanPG";

/* CONFIG */
import { testBackendConnection } from "./config";

// Brand colors
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

// Protected Route Component - FIXED
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Don't redirect while checking auth
  if (loading) {
    return null; // Let the loading screen handle this
  }
  
  // Only redirect if we're sure there's no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based Route Component - FIXED
const RoleBasedRoute = ({ children, allowedRole }) => {
  const { user, role, loading } = useAuth();
  
  // Don't redirect while checking auth
  if (loading) {
    return null;
  }
  
  // Redirect to home if not authenticated or wrong role
  if (!user || role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const { user, role, loading } = useAuth();

  useEffect(() => {
    testBackendConnection();
  }, []);

  // Beautiful brand loading screen - FIXED to show properly
  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Animated background circles */}
        <div style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND_BLUE}10 0%, transparent 70%)`,
          top: "-150px",
          right: "-150px",
          animation: "pulse 3s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND_GREEN}10 0%, transparent 70%)`,
          bottom: "-200px",
          left: "-200px",
          animation: "pulse 4s ease-in-out infinite reverse"
        }} />
        
        <div style={{ textAlign: "center", zIndex: 1 }}>
          {/* Logo animation */}
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 25px",
            background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "bounce 1s ease-in-out infinite",
            boxShadow: `0 10px 30px ${BRAND_BLUE}40`
          }}>
            <span style={{ fontSize: "40px", fontWeight: "bold", color: "white" }}>N</span>
          </div>
          
          {/* Brand name with gradient */}
          <h1 style={{
            fontSize: "32px",
            fontWeight: "bold",
            margin: "0 0 8px 0",
            background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px"
          }}>
            Nepxall
          </h1>
          <p style={{
            color: "#64748b",
            fontSize: "14px",
            margin: "0 0 30px 0",
            fontWeight: 500
          }}>
            Next Places for Living
          </p>
          
          {/* Loading spinner with brand colors */}
          <div style={{
            width: "40px",
            height: "40px",
            margin: "0 auto",
            border: `3px solid ${BRAND_BLUE}20`,
            borderTop: `3px solid ${BRAND_BLUE}`,
            borderRight: `3px solid ${BRAND_GREEN}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
          
          <p style={{
            color: "#94a3b8",
            fontSize: "13px",
            marginTop: "15px",
            fontWeight: 500
          }}>
            Loading your experience...
          </p>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      {/* 🌍 PUBLIC ROUTES - NO AUTH REQUIRED */}
      <Route path="/" element={<UserPGSearch />} />
      <Route path="/pg/:id" element={<PGDetails />} />
      <Route path="/scan/:id" element={<ScanPG />} />
      <Route path="/public/agreement/:hash" element={<PublicAgreementPage />} />

      {/* STATIC PAGES */}
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      {/* AUTH PAGES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 🔐 PROTECTED ROUTES - WITH MainLayout */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/booking/:pgId" element={<BookingForm />} />
        <Route path="/user/bookings" element={<UserBookingHistory />} />
        <Route path="/become-owner" element={<BecomeOwner />} />
        <Route path="/user/agreements" element={<UserAgreements />} />
        <Route path="/user/services/:bookingId" element={<ServicesPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/agreement/:bookingId" element={<AgreementPage />} />
        <Route path="/agreement-form/:bookingId" element={<AgreementForm />} />
        <Route path="/user/my-stay" element={<UserActiveStay />} />
        <Route path="/user/vacate" element={<VacateRequestPage />} />
        <Route path="/user/refunds" element={<RefundRequestPage />} />
        <Route path="/user/notifications" element={<NotificationBell />} />
        <Route path="/user/aadhaar-kyc" element={<AadhaarKyc />} />
        <Route path="/user/digilocker" element={<DigiLockerVerify />} />
        <Route path="/digilocker/callback" element={<DigiLockerCallback />} />
        <Route path="/user/visit-schedule/:bookingId" element={<VisitSchedulePage />} />
        <Route path="/user/premium" element={<UserPremiumPlans />} />
        <Route path="/chat/private/:userId/:pgId" element={<PrivateChat />} />
      </Route>

      {/* 👑 OWNER ROUTES */}
      <Route path="/owner" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRole="owner">
            <OwnerLayout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="payments" element={<OwnerPayments />} />
        <Route path="vacate" element={<OwnerVacateRequests />} />
        <Route path="premium" element={<OwnerPremiumPlans />} />
        <Route path="bookings" element={<OwnerBookings />} />
        <Route path="tenants" element={<OwnerActiveTenants />} />
        <Route path="bank" element={<OwnerBankDetails />} />
        <Route path="verification" element={<OwnerVerificationPage />} />
        <Route path="notifications" element={<OwnerNotifications />} />
        <Route path="chats" element={<OwnerChatList />} />
        <Route path="hotels" element={<OwnerHotels />} />
        <Route path="add-hotel" element={<AddHotel />} />
        <Route path="add" element={<OwnerAddPG />} />
        <Route path="edit/:id" element={<EditPG />} />
        <Route path="rooms/:pgId" element={<OwnerRooms />} />
        <Route path="photos/:id" element={<OwnerPGPhotos />} />
        <Route path="videos/:id" element={<OwnerPGVideos />} />
        <Route path="reviews/:pgId" element={<OwnerReviewReply />} />
        <Route path="property/:propertyId/plans" element={<CreatePlan />} />
      </Route>

      {/* 🛡️ ADMIN ROUTES */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRole="admin">
            <AdminLayout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="finance" replace />} />
        <Route path="finance" element={<AdminFinanceDashboard />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="settlements" element={<AdminSettlements />} />
        <Route path="settlement-history" element={<SettlementHistory />} />
        <Route path="pending-pgs" element={<AdminPendingPGs />} />
        <Route path="pg/:id" element={<AdminPGDetails />} />
        <Route path="owner-verification" element={<AdminOwnerVerification />} />
        <Route path="services" element={<AdminServiceBookings />} />
        <Route path="refunds" element={<AdminRefunds />} />
        <Route path="agreements" element={<AdminAgreements />} />
        <Route path="plan-payments" element={<AdminPlanPayments />} />
        <Route path="agreement/:id" element={<AdminAgreementDetails />} />
      </Route>

      {/* 🔧 VENDOR ROUTES */}
      <Route path="/vendor" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRole="vendor">
            <VendorLayout />
          </RoleBasedRoute>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
      </Route>

      {/* 404 FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;