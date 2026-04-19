import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Box, Typography, CircularProgress } from "@mui/material";

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

/* ================= BRAND COLORS (SAME AS SIDEBAR) ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

// Loading Component inside App.js
const LoadingSpinner = ({ message = "Loading..." }) => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      zIndex: 9999,
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        p: 4,
      }}
    >
      {/* Animated Logo Container */}
      <Box
        sx={{
          position: "relative",
          animation: "float 2s ease-in-out infinite",
          "@keyframes float": {
            "0%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(-10px)" },
            "100%": { transform: "translateY(0px)" },
          },
        }}
      >
        {/* Glow effect behind logo */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BRAND_BLUE}20, transparent)`,
            animation: "pulse 2s ease-in-out infinite",
            "@keyframes pulse": {
              "0%": { transform: "translate(-50%, -50%) scale(0.8)", opacity: 0.5 },
              "50%": { transform: "translate(-50%, -50%) scale(1.2)", opacity: 0.2 },
              "100%": { transform: "translate(-50%, -50%) scale(0.8)", opacity: 0.5 },
            },
          }}
        />
        
        {/* Logo placeholder - you can replace with your actual logo */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 16,
            position: "relative",
            zIndex: 2,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: "bold",
            color: "white",
          }}
        >
          N
        </Box>
      </Box>

      {/* Brand Name with Gradient */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          sx={{
            fontSize: { xs: 28, sm: 32 },
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            mb: 1,
          }}
        >
          <span style={{ color: BRAND_BLUE }}>Nep</span>
          <span style={{ color: BRAND_GREEN }}>xall</span>
        </Typography>
        
        <Typography
          sx={{
            fontSize: 12,
            color: "#64748b",
            letterSpacing: "0.5px",
            fontWeight: 500,
          }}
        >
          Next Places for Living
        </Typography>
      </Box>

      {/* Loading Spinner with Brand Colors */}
      <Box sx={{ position: "relative", mt: 2 }}>
        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            color: BRAND_BLUE,
            animation: "spin 1.5s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            position: "absolute",
            left: 0,
            color: BRAND_GREEN,
            animation: "spinReverse 1.5s linear infinite",
            "@keyframes spinReverse": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(-360deg)" },
            },
          }}
        />
      </Box>

      {/* Loading Message */}
      <Typography
        sx={{
          fontSize: 13,
          color: "#64748b",
          fontWeight: 500,
          mt: 1,
          animation: "fadeInOut 1.5s ease-in-out infinite",
          "@keyframes fadeInOut": {
            "0%": { opacity: 0.5 },
            "50%": { opacity: 1 },
            "100%": { opacity: 0.5 },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  </Box>
);

function App() {
  const { user, role, loading } = useAuth();

  useEffect(() => {
    testBackendConnection();
  }, []);

  // Show branded loading spinner while auth is loading
  if (loading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  const PrivateRoute = ({ children }) =>
    user ? children : <Navigate to="/login" replace />;

  const RoleRoute = ({ children, allowedRole }) =>
    user && role === allowedRole ? children : <Navigate to="/" replace />;

  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<UserPGSearch />} />
        <Route path="/pg/:id" element={<PGDetails />} />
      </Route>

      <Route path="/scan/:id" element={<ScanPG />} />

      {/* STATIC */}
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* USER */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
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
        <Route path="/public/agreement/:hash" element={<PublicAgreementPage />} />
        <Route path="/user/premium" element={<UserPremiumPlans />} />
        <Route path="/chat/private/:userId/:pgId" element={<PrivateChat />} />
      </Route>

      {/* OWNER */}
      <Route path="/owner" element={
        <PrivateRoute>
          <RoleRoute allowedRole="owner">
            <OwnerLayout />
          </RoleRoute>
        </PrivateRoute>
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

      {/* ADMIN */}
      <Route path="/admin" element={
        <PrivateRoute>
          <RoleRoute allowedRole="admin">
            <AdminLayout />
          </RoleRoute>
        </PrivateRoute>
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

      {/* VENDOR */}
      <Route path="/vendor" element={
        <PrivateRoute>
          <RoleRoute allowedRole="vendor">
            <VendorLayout />
          </RoleRoute>
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;