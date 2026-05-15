import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FiHome, 
  FiLogOut, 
  FiCalendar, 
  FiSearch, 
  FiDollarSign, 
  FiFileText, 
  FiMail, 
  FiFlag, 
  FiShield, 
  FiMessageCircle, 
  FiBarChart2, 
  FiUsers, 
  FiTrendingUp, 
  FiStar, 
  FiPlusCircle, 
  FiCreditCard, 
  FiTool, 
  FiLock,
  FiLogIn,
  FiPhoneCall,
  FiInstagram,
  FiMapPin
} from "react-icons/fi";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = ({ role, user }) => {
  


  const location = useLocation();


  if (window.innerWidth <= 768) {
    return null;
  }


  // 🔐 BACKEND ROLE ONLY (SAFE)
  const safeRole = role?.toLowerCase().trim();

  // 🔐 LOGIN BASED ON FIREBASE USER
  const isLoggedIn = !!user;

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  // Modern link style with hover animation and brand colors
  const linkStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: active ? "#2563eb" : "#334155",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 10,
    background: active
      ? "linear-gradient(90deg,#0B5ED710,#4CAF5010)"
      : "transparent",
    fontWeight: active ? "600" : "500",
    transition: "all 0.2s ease",
    fontSize: 13.5,
    cursor: "pointer",
  });

  // Sidebar content (reused for desktop)
  const SidebarContent = () => (
    <>
      {/* ================= LOGO ================= */}
      <div style={companyHeader}>
        <img src={logo} alt="Nepxall logo" style={logoImage} />
        <div>
          <h2 style={companyName}>
            <span style={{ color: BRAND_BLUE }}>Nep</span>
            <span style={{ color: BRAND_GREEN }}>xall</span>
          </h2>
          <p style={companyTagline}>Premium Living</p>
        </div>
      </div>

      <hr style={divider} />

      <nav style={nav}>
        {/* ================= HOME ================= */}
        <Link 
          style={linkStyle(isActive("/"))} 
          to="/" 
          className="sidebar-link"
        >
          <FiHome size={16} /> Home
        </Link>

        {/* ================= TENANT ================= */}
        {isLoggedIn && (safeRole === "tenant" || safeRole === "user") && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>TENANT</p>
            <Link style={linkStyle(isActive("/user/my-stay"))} to="/user/my-stay" className="sidebar-link"><FiHome size={16} /> My Stay</Link>
            <Link style={linkStyle(isActive("/user/bookings"))} to="/user/bookings" className="sidebar-link"><FiCalendar size={16} /> My Bookings</Link>
            <Link style={linkStyle(isActive("/"))} to="/" className="sidebar-link"><FiSearch size={16} /> Browse Properties</Link>
            
           
            <Link 
              style={linkStyle(isActive("/become-owner"))} 
              to="/become-owner" 
              className="sidebar-link"
            >
              ⭐ Become Owner
            </Link>

            <Link style={linkStyle(isActive("/user/vacate"))} to="/user/vacate" className="sidebar-link"><FiLogOut size={16} /> Vacate Room</Link>
            <Link style={linkStyle(isActive("/user/refunds"))} to="/user/refunds" className="sidebar-link"><FiDollarSign size={16} /> Refunds</Link>
            <Link style={linkStyle(isActive("/user/agreements"))} to="/user/agreements" className="sidebar-link"><FiFileText size={16} /> My Agreements</Link>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/contact"))} to="/contact" className="sidebar-link"><FiMail size={16} /> Contact Us</Link>
            <Link style={linkStyle(isActive("/terms"))} to="/terms" className="sidebar-link"><FiFlag size={16} /> Terms & Conditions</Link>
            <Link style={linkStyle(isActive("/refund-policy"))} to="/refund-policy" className="sidebar-link"><FiShield size={16} /> Refund Policy</Link>
            <Link style={linkStyle(isActive("/privacy-policy"))} to="/privacy-policy" className="sidebar-link"><FiLock size={16} /> Privacy Policy</Link>
          </>
        )}

        {/* ================= OWNER ================= */}
        {isLoggedIn && safeRole === "owner" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>OWNER</p>
            <Link style={linkStyle(isActive("/owner/dashboard"))} to="/owner/dashboard" className="sidebar-link"><FiBarChart2 size={16} /> Dashboard</Link>
            <Link style={linkStyle(isActive("/owner/bookings"))} to="/owner/bookings" className="sidebar-link"><FiCalendar size={16} /> Booking Requests</Link>
            <Link style={linkStyle(isActive("/owner/tenants"))} to="/owner/tenants" className="sidebar-link"><FiUsers size={16} /> Active Tenants</Link>
            <Link style={linkStyle(isActive("/owner/vacate"))} to="/owner/vacate" className="sidebar-link"><FiLogOut size={16} /> Vacate Requests</Link>
            <Link style={linkStyle(isActive("/owner/payments"))} to="/owner/payments" className="sidebar-link"><FiTrendingUp size={16} /> Earnings / Payments</Link>
            <Link style={linkStyle(isActive("/owner/add"))} to="/owner/add" className="sidebar-link"><FiPlusCircle size={16} /> Add PG</Link>
            <Link style={linkStyle(isActive("/owner/bank"))} to="/owner/bank" className="sidebar-link"><FiCreditCard size={16} /> Bank Details</Link>
            <Link style={linkStyle(isActive("/owner/chats"))} to="/owner/chats" className="sidebar-link"><FiMessageCircle size={16} /> Chats</Link>
            <Link style={linkStyle(isActive("/owner/premium"))} to="/owner/premium" className="sidebar-link"><FiStar size={16} /> Premium Plans</Link>
            
            <hr style={divider} />
            <Link style={linkStyle(isActive("/contact"))} to="/contact" className="sidebar-link">
              <FiMail size={16} /> Contact Us
            </Link>
            <Link style={linkStyle(isActive("/terms"))} to="/terms" className="sidebar-link">
              <FiFlag size={16} /> Terms & Conditions
            </Link>
            <Link style={linkStyle(isActive("/refund-policy"))} to="/refund-policy" className="sidebar-link">
              <FiShield size={16} /> Refund Policy
            </Link>
            <Link style={linkStyle(isActive("/privacy-policy"))} to="/privacy-policy" className="sidebar-link">
              <FiLock size={16} /> Privacy Policy
            </Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {isLoggedIn && safeRole === "admin" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>ADMIN</p>
            <Link style={linkStyle(isActive("/admin/finance"))} to="/admin/finance" className="sidebar-link"><FiBarChart2 size={16} /> Finance Dashboard</Link>
            <Link style={linkStyle(isActive("/admin/payments"))} to="/admin/payments" className="sidebar-link"><FiCreditCard size={16} /> Payment Verification</Link>
            <Link
              style={linkStyle(isActive("/admin/all-bookings"))}
              to="/admin/all-bookings"
              className="sidebar-link"
            >
              <FiCalendar size={16} /> All Bookings
            </Link>
            <Link style={linkStyle(isActive("/admin/pgs"))} to="/admin/pgs" className="sidebar-link">
              <FiHome size={16} /> All PGs
            </Link>
            <Link style={linkStyle(isActive("/admin/services"))} to="/admin/services" className="sidebar-link"><FiTool size={16} /> Service Requests</Link>
            <Link style={linkStyle(isActive("/admin/plan-payments"))} to="/admin/plan-payments" className="sidebar-link"><FiStar size={16} /> Plan Payments</Link>
            <Link style={linkStyle(isActive("/admin/owner-verification"))} to="/admin/owner-verification" className="sidebar-link"><FiShield size={16} /> Verify Owners</Link>
            <Link style={linkStyle(isActive("/admin/settlements"))} to="/admin/settlements" className="sidebar-link"><FiDollarSign size={16} /> Settlements</Link>
            <Link style={linkStyle(isActive("/admin/settlement-history"))} to="/admin/settlement-history" className="sidebar-link"><FiFileText size={16} /> Settlement History</Link>
            <Link style={linkStyle(isActive("/admin/refunds"))} to="/admin/refunds" className="sidebar-link"><FiDollarSign size={16} /> Refund Requests</Link>
            <Link style={linkStyle(isActive("/admin/agreements"))} to="/admin/agreements" className="sidebar-link"><FiFileText size={16} /> Agreements</Link>
            <Link 
              style={linkStyle(isActive("/admin/add-pg"))} 
              to="/admin/add-pg" 
              className="sidebar-link"
            >
              <FiPlusCircle size={16} /> Add PG
            </Link>
            <Link
              style={linkStyle(isActive("/admin/ai-call"))}
              to="/admin/ai-call"
              className="sidebar-link"
            >
              <FiPhoneCall size={16} /> AI Owner Call
            </Link>
            <Link
  style={linkStyle(isActive("/admin/instagram-ai"))}
  to="/admin/instagram-ai"
  className="sidebar-link"
>
  <FiInstagram size={16} /> Instagram AI
</Link>


<Link
  style={linkStyle(isActive("/nearby-pgs"))}
  to="/nearby-pgs"
  className="sidebar-link"
>
  <FiMapPin size={16} /> Nearby PGs
</Link>
          </>
        )}

        {/* ================= VENDOR ================= */}
        {isLoggedIn && safeRole === "vendor" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>VENDOR</p>
            <Link style={linkStyle(isActive("/vendor/dashboard"))} to="/vendor/dashboard" className="sidebar-link"><FiBarChart2 size={16} /> Dashboard</Link>
            <Link style={linkStyle(isActive("/vendor/services"))} to="/vendor/services" className="sidebar-link"><FiTool size={16} /> My Assigned Services</Link>
          </>
        )}

        {/* ================= AUTH ================= */}
        {!isLoggedIn && (
          <>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/login"))} to="/login" className="sidebar-link"><FiLogIn size={16} /> Login</Link>
          </>
        )}
      </nav>

      {/* ================= USER INFO ================= */}
      {isLoggedIn && (
        <div style={userInfoStyle}>
          <hr style={divider} />
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
            Logged in as
            <span style={{
              color: "#1e293b",
              fontWeight: "bold",
              textTransform: "capitalize",
            }}>
              {" "}{safeRole}
            </span>
          </p>
          <p style={{ color: "#4CAF50", fontSize: 11, fontWeight: 500 }}>
            {user?.email?.split("@")[0] || "User"}
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - always visible on desktop */}
      <div style={desktopSidebar}>
        <SidebarContent />
      </div>

      {/* Global styles for hover effects */}
      <style>{`
        .sidebar-link:hover {
          background: #e2e8f0 !important;
          transform: translateX(3px);
        }
      `}</style>
    </>
  );
};

export default Sidebar;

/* ================= STYLES - MODERN GLASS LIGHT THEME ================= */

// Desktop sidebar - glass morphism effect with REDUCED WIDTH (220px)
const desktopSidebar = {
  width: 220,
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(12px)",
  borderRight: "1px solid rgba(229, 231, 235, 0.6)",
  color: "#1e293b",
  minHeight: "100vh",
  padding: "18px 14px",
  position: "fixed",
  left: 0,
  top: 0,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  zIndex: 100,
  boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
};

const companyHeader = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 16,
  paddingBottom: 6,
  borderBottom: "1px solid #e2e8f0",
};

const logoImage = {
  width: 38,
  height: 38,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

const companyName = {
  fontSize: 18,
  fontWeight: "bold",
  margin: 0,
  letterSpacing: "-0.3px",
};

const companyTagline = {
  fontSize: 9,
  color: "#64748b",
  marginTop: 2,
  letterSpacing: "0.2px",
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  flex: 1,
};

const divider = {
  borderTop: "1px solid #e2e8f0",
  margin: "12px 0",
};

const sectionLabel = {
  fontSize: 10,
  color: "#64748b",
  letterSpacing: 0.5,
  fontWeight: 600,
  marginTop: 4,
  marginBottom: 6,
  paddingLeft: 8,
};

const userInfoStyle = {
  marginTop: "auto",
  paddingTop: 12,
};