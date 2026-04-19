// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FiHome, 
  FiUser, 
  FiLogOut, 
  FiCalendar, 
  FiSearch, 
  FiDollarSign, 
  FiFileText, 
  FiMail, 
  FiFlag, 
  FiShield, 
  FiBell, 
  FiMessageCircle, 
  FiBarChart2, 
  FiUsers, 
  FiTrendingUp, 
  FiStar, 
  FiHome as FiBuilding, 
  FiPlusCircle, 
  FiCreditCard, 
  FiCheckCircle, 
  FiTool, 
  FiLock,
  FiMapPin,
  FiMenu,
  FiX,
  FiLogIn,
  FiUserPlus,
  FiSettings,
  FiHelpCircle
} from "react-icons/fi";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = ({ role, user }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 🔐 BACKEND ROLE ONLY (SAFE)
  const safeRole = role?.toLowerCase().trim();

  // 🔐 LOGIN BASED ON FIREBASE USER
  const isLoggedIn = !!user;

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when screen becomes desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const closeSidebar = () => setIsOpen(false);
  const openSidebar = () => setIsOpen(true);

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

  // Sidebar content (reused for both mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Close button (mobile only) */}
      {isMobile && (
        <button onClick={closeSidebar} style={closeBtn}>
          <FiX size={18} />
        </button>
      )}

      {/* ================= LOGO ================= */}
      <div style={companyHeader}>
        <img src={logo} alt="Nepxall logo" style={logoImage} />
        <div>
          <h2 style={companyName}>
            <span style={{ color: BRAND_BLUE }}>Nep</span>
            <span style={{ color: BRAND_GREEN }}>xall</span>
          </h2>
          <p style={companyTagline}>Next Places for Living</p>
        </div>
      </div>

      <hr style={divider} />

      <nav style={nav}>
        {/* ================= HOME ================= */}
        <Link 
          style={linkStyle(isActive("/"))} 
          to="/" 
          onClick={closeSidebar}
          className="sidebar-link"
        >
          <FiHome size={16} /> Home
        </Link>

        {/* ================= TENANT ================= */}
        {isLoggedIn && (safeRole === "tenant" || safeRole === "user") && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>TENANT</p>
            <Link style={linkStyle(isActive("/user/my-stay"))} to="/user/my-stay" onClick={closeSidebar} className="sidebar-link"><FiHome size={16} /> My Stay</Link>
            <Link style={linkStyle(isActive("/user/bookings"))} to="/user/bookings" onClick={closeSidebar} className="sidebar-link"><FiCalendar size={16} /> My Bookings</Link>
            <Link style={linkStyle(isActive("/"))} to="/" onClick={closeSidebar} className="sidebar-link"><FiSearch size={16} /> Browse Properties</Link>
                {/* 🔥 ADD HERE */}
    <Link 
      style={linkStyle(isActive("/become-owner"))} 
      to="/become-owner" 
      onClick={closeSidebar} 
      className="sidebar-link"
    >
      ⭐ Become Owner
    </Link>

            <Link style={linkStyle(isActive("/user/vacate"))} to="/user/vacate" onClick={closeSidebar} className="sidebar-link"><FiLogOut size={16} /> Vacate Room</Link>
            <Link style={linkStyle(isActive("/user/refunds"))} to="/user/refunds" onClick={closeSidebar} className="sidebar-link"><FiDollarSign size={16} /> Refunds</Link>
            <Link style={linkStyle(isActive("/user/agreements"))} to="/user/agreements" onClick={closeSidebar} className="sidebar-link"><FiFileText size={16} /> My Agreements</Link>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/contact"))} to="/contact" onClick={closeSidebar} className="sidebar-link"><FiMail size={16} /> Contact Us</Link>
            <Link style={linkStyle(isActive("/terms"))} to="/terms" onClick={closeSidebar} className="sidebar-link"><FiFlag size={16} /> Terms & Conditions</Link>
            <Link style={linkStyle(isActive("/refund-policy"))} to="/refund-policy" onClick={closeSidebar} className="sidebar-link"><FiShield size={16} /> Refund Policy</Link>
            <Link style={linkStyle(isActive("/privacy-policy"))} to="/privacy-policy" onClick={closeSidebar} className="sidebar-link"><FiLock size={16} /> Privacy Policy</Link>
          </>
        )}

        {/* ================= OWNER ================= */}
        {isLoggedIn && safeRole === "owner" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>OWNER</p>
            <Link style={linkStyle(isActive("/owner/dashboard"))} to="/owner/dashboard" onClick={closeSidebar} className="sidebar-link"><FiBarChart2 size={16} /> Dashboard</Link>
            <Link style={linkStyle(isActive("/owner/bookings"))} to="/owner/bookings" onClick={closeSidebar} className="sidebar-link"><FiCalendar size={16} /> Booking Requests</Link>
            <Link style={linkStyle(isActive("/owner/tenants"))} to="/owner/tenants" onClick={closeSidebar} className="sidebar-link"><FiUsers size={16} /> Active Tenants</Link>
            <Link style={linkStyle(isActive("/owner/vacate"))} to="/owner/vacate" onClick={closeSidebar} className="sidebar-link"><FiLogOut size={16} /> Vacate Requests</Link>
            <Link style={linkStyle(isActive("/owner/payments"))} to="/owner/payments" onClick={closeSidebar} className="sidebar-link"><FiTrendingUp size={16} /> Earnings / Payments</Link>
            <Link style={linkStyle(isActive("/owner/premium"))} to="/owner/premium" onClick={closeSidebar} className="sidebar-link"><FiStar size={16} /> Premium Plans</Link>
            <Link style={linkStyle(isActive("/owner/pgs"))} to="/owner/pgs" onClick={closeSidebar} className="sidebar-link"><FiBuilding size={16} /> My PGs</Link>
            <Link style={linkStyle(isActive("/owner/hotels"))} to="/owner/hotels" onClick={closeSidebar} className="sidebar-link"><FiMapPin size={16} /> My Hotels</Link>
            <Link style={linkStyle(isActive("/owner/add"))} to="/owner/add" onClick={closeSidebar} className="sidebar-link"><FiPlusCircle size={16} /> Add PG</Link>
            <Link style={linkStyle(isActive("/owner/add-hotel"))} to="/owner/add-hotel" onClick={closeSidebar} className="sidebar-link"><FiPlusCircle size={16} /> Add Hotel</Link>
            <Link style={linkStyle(isActive("/owner/bank"))} to="/owner/bank" onClick={closeSidebar} className="sidebar-link"><FiCreditCard size={16} /> Bank Details</Link>
            <Link style={linkStyle(isActive("/owner/verification"))} to="/owner/verification" onClick={closeSidebar} className="sidebar-link"><FiCheckCircle size={16} /> Verification</Link>
            <Link style={linkStyle(isActive("/owner/notifications"))} to="/owner/notifications" onClick={closeSidebar} className="sidebar-link"><FiBell size={16} /> Notifications</Link>
            <Link style={linkStyle(isActive("/owner/chats"))} to="/owner/chats" onClick={closeSidebar} className="sidebar-link"><FiMessageCircle size={16} /> Chats</Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {isLoggedIn && safeRole === "admin" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>ADMIN</p>
            <Link style={linkStyle(isActive("/admin/finance"))} to="/admin/finance" onClick={closeSidebar} className="sidebar-link"><FiBarChart2 size={16} /> Finance Dashboard</Link>
            <Link style={linkStyle(isActive("/admin/payments"))} to="/admin/payments" onClick={closeSidebar} className="sidebar-link"><FiCreditCard size={16} /> Payment Verification</Link>
            <Link style={linkStyle(isActive("/admin/services"))} to="/admin/services" onClick={closeSidebar} className="sidebar-link"><FiTool size={16} /> Service Requests</Link>
            <Link style={linkStyle(isActive("/admin/plan-payments"))} to="/admin/plan-payments" onClick={closeSidebar} className="sidebar-link"><FiStar size={16} /> Plan Payments</Link>
            <Link style={linkStyle(isActive("/admin/owner-verification"))} to="/admin/owner-verification" onClick={closeSidebar} className="sidebar-link"><FiShield size={16} /> Verify Owners</Link>
            <Link style={linkStyle(isActive("/admin/settlements"))} to="/admin/settlements" onClick={closeSidebar} className="sidebar-link"><FiDollarSign size={16} /> Settlements</Link>
            <Link style={linkStyle(isActive("/admin/settlement-history"))} to="/admin/settlement-history" onClick={closeSidebar} className="sidebar-link"><FiFileText size={16} /> Settlement History</Link>
            <Link style={linkStyle(isActive("/admin/refunds"))} to="/admin/refunds" onClick={closeSidebar} className="sidebar-link"><FiDollarSign size={16} /> Refund Requests</Link>
            <Link style={linkStyle(isActive("/admin/agreements"))} to="/admin/agreements" onClick={closeSidebar} className="sidebar-link"><FiFileText size={16} /> Agreements</Link>
          </>
        )}

        {/* ================= VENDOR ================= */}
        {isLoggedIn && safeRole === "vendor" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>VENDOR</p>
            <Link style={linkStyle(isActive("/vendor/dashboard"))} to="/vendor/dashboard" onClick={closeSidebar} className="sidebar-link"><FiBarChart2 size={16} /> Dashboard</Link>
            <Link style={linkStyle(isActive("/vendor/services"))} to="/vendor/services" onClick={closeSidebar} className="sidebar-link"><FiTool size={16} /> My Assigned Services</Link>
          </>
        )}

        {/* ================= AUTH ================= */}
        {!isLoggedIn && (
          <>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/login"))} to="/login" onClick={closeSidebar} className="sidebar-link"><FiLogIn size={16} /> Login</Link>
            <Link style={linkStyle(isActive("/register"))} to="/register" onClick={closeSidebar} className="sidebar-link"><FiUserPlus size={16} /> Register</Link>
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
      {/* Mobile Menu Button - only visible on mobile */}
      {isMobile && (
        <button onClick={openSidebar} style={menuButton}>
          <FiMenu size={20} />
        </button>
      )}

      {/* Desktop Sidebar - always visible on desktop */}
      {!isMobile && (
        <div style={desktopSidebar}>
          <SidebarContent />
        </div>
      )}

      {/* Mobile Drawer Sidebar - slides in from left */}
      {isMobile && (
        <>
          <div style={drawerSidebar(isOpen)}>
            <SidebarContent />
          </div>
          {isOpen && <div style={overlay} onClick={closeSidebar} />}
        </>
      )}

      {/* Add global styles for hover effects */}
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

// Mobile drawer sidebar - glass effect with slide animation and REDUCED WIDTH (240px)
const drawerSidebar = (isOpen) => ({
  width: 240,
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(16px)",
  borderRight: "1px solid rgba(229, 231, 235, 0.8)",
  color: "#1e293b",
  minHeight: "100vh",
  padding: "18px 14px",
  position: "fixed",
  left: 0,
  top: 0,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  zIndex: 1000,
  transform: isOpen ? "translateX(0)" : "translateX(-100%)",
  transition: "transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
  boxShadow: isOpen ? "4px 0 25px rgba(0, 0, 0, 0.15)" : "none",
});

// Mobile menu button (hamburger) - modern style
const menuButton = {
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 1100,
  background: "linear-gradient(135deg, #2563eb, #10b981)",
  color: "#fff",
  border: "none",
  padding: "10px 12px",
  borderRadius: 12,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  transition: "all 0.2s ease",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// Close button inside mobile sidebar
const closeBtn = {
  background: "rgba(0, 0, 0, 0.05)",
  border: "none",
  color: "#64748b",
  position: "absolute",
  right: 14,
  top: 18,
  cursor: "pointer",
  padding: 6,
  borderRadius: 40,
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1001,
  transition: "background 0.2s",
};

// Overlay when mobile sidebar is open
const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0, 0, 0, 0.3)",
  backdropFilter: "blur(2px)",
  zIndex: 999,
  transition: "all 0.3s ease",
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