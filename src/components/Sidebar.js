import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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

  // Sidebar content (reused for both mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Close button (mobile only) */}
      {isMobile && (
        <button onClick={closeSidebar} style={closeBtn}>
          ✖
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
        <Link style={linkStyle(isActive("/"))} to="/" onClick={closeSidebar}>
          🏡 Home
        </Link>

        {/* ================= TENANT ================= */}
        {isLoggedIn && (safeRole === "tenant" || safeRole === "user") && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>TENANT</p>
            <Link style={linkStyle(isActive("/user/my-stay"))} to="/user/my-stay" onClick={closeSidebar}>🏠 My Stay</Link>
            <Link style={linkStyle(isActive("/user/bookings"))} to="/user/bookings" onClick={closeSidebar}>📜 My Bookings</Link>
            <Link style={linkStyle(isActive("/"))} to="/" onClick={closeSidebar}>🔍 Browse Properties</Link>
            <Link style={linkStyle(isActive("/user/vacate"))} to="/user/vacate" onClick={closeSidebar}>🚪 Vacate Room</Link>
            <Link style={linkStyle(isActive("/user/refunds"))} to="/user/refunds" onClick={closeSidebar}>💰 Refunds</Link>
            <Link style={linkStyle(isActive("/user/agreements"))} to="/user/agreements" onClick={closeSidebar}>📄 My Agreements</Link>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/contact"))} to="/contact" onClick={closeSidebar}>📞 Contact Us</Link>
            <Link style={linkStyle(isActive("/terms"))} to="/terms" onClick={closeSidebar}>📄 Terms & Conditions</Link>
            <Link style={linkStyle(isActive("/refund-policy"))} to="/refund-policy" onClick={closeSidebar}>💰 Refund Policy</Link>
            <Link style={linkStyle(isActive("/privacy-policy"))} to="/privacy-policy" onClick={closeSidebar}>🔒 Privacy Policy</Link>
          </>
        )}

        {/* ================= OWNER ================= */}
        {isLoggedIn && safeRole === "owner" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>OWNER</p>
            <Link style={linkStyle(isActive("/owner/dashboard"))} to="/owner/dashboard" onClick={closeSidebar}>📊 Dashboard</Link>
            <Link style={linkStyle(isActive("/owner/bookings"))} to="/owner/bookings" onClick={closeSidebar}>📥 Booking Requests</Link>
            <Link style={linkStyle(isActive("/owner/tenants"))} to="/owner/tenants" onClick={closeSidebar}>👥 Active Tenants</Link>
            <Link style={linkStyle(isActive("/owner/vacate"))} to="/owner/vacate" onClick={closeSidebar}>🚪 Vacate Requests</Link>
            <Link style={linkStyle(isActive("/owner/payments"))} to="/owner/payments" onClick={closeSidebar}>💰 Earnings / Payments</Link>
            <Link style={linkStyle(isActive("/owner/premium"))} to="/owner/premium" onClick={closeSidebar}>⭐ Premium Plans</Link>
            <Link style={linkStyle(isActive("/owner/pgs"))} to="/owner/pgs" onClick={closeSidebar}>🏢 My PGs</Link>
            <Link style={linkStyle(isActive("/owner/hotels"))} to="/owner/hotels" onClick={closeSidebar}>🏨 My Hotels</Link>
            <Link style={linkStyle(isActive("/owner/add"))} to="/owner/add" onClick={closeSidebar}>➕ Add PG</Link>
            <Link style={linkStyle(isActive("/owner/add-hotel"))} to="/owner/add-hotel" onClick={closeSidebar}>➕ Add Hotel</Link>
            <Link style={linkStyle(isActive("/owner/bank"))} to="/owner/bank" onClick={closeSidebar}>🏦 Bank Details</Link>
            <Link style={linkStyle(isActive("/owner/verification"))} to="/owner/verification" onClick={closeSidebar}>🛂 Verification</Link>
            <Link style={linkStyle(isActive("/owner/notifications"))} to="/owner/notifications" onClick={closeSidebar}>🔔 Notifications</Link>
            <Link style={linkStyle(isActive("/owner/chats"))} to="/owner/chats" onClick={closeSidebar}>💬 Chats</Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {isLoggedIn && safeRole === "admin" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>ADMIN</p>
            <Link style={linkStyle(isActive("/admin/finance"))} to="/admin/finance" onClick={closeSidebar}>📊 Finance Dashboard</Link>
            <Link style={linkStyle(isActive("/admin/payments"))} to="/admin/payments" onClick={closeSidebar}>💳 Payment Verification</Link>
            <Link style={linkStyle(isActive("/admin/services"))} to="/admin/services" onClick={closeSidebar}>🛠 Service Requests</Link>
            <Link style={linkStyle(isActive("/admin/plan-payments"))} to="/admin/plan-payments" onClick={closeSidebar}>⭐ Plan Payments</Link>
            <Link style={linkStyle(isActive("/admin/owner-verification"))} to="/admin/owner-verification" onClick={closeSidebar}>🛡️ Verify Owners</Link>
            <Link style={linkStyle(isActive("/admin/settlements"))} to="/admin/settlements" onClick={closeSidebar}>💰 Settlements</Link>
            <Link style={linkStyle(isActive("/admin/settlement-history"))} to="/admin/settlement-history" onClick={closeSidebar}>📜 Settlement History</Link>
            <Link style={linkStyle(isActive("/admin/refunds"))} to="/admin/refunds" onClick={closeSidebar}>💸 Refund Requests</Link>
            <Link style={linkStyle(isActive("/admin/agreements"))} to="/admin/agreements" onClick={closeSidebar}>📄 Agreements</Link>
          </>
        )}

        {/* ================= VENDOR ================= */}
        {isLoggedIn && safeRole === "vendor" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>VENDOR</p>
            <Link style={linkStyle(isActive("/vendor/dashboard"))} to="/vendor/dashboard" onClick={closeSidebar}>📊 Dashboard</Link>
            <Link style={linkStyle(isActive("/vendor/services"))} to="/vendor/services" onClick={closeSidebar}>🛠 My Assigned Services</Link>
          </>
        )}

        {/* ================= AUTH ================= */}
        {!isLoggedIn && (
          <>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/login"))} to="/login" onClick={closeSidebar}>🔑 Login</Link>
            <Link style={linkStyle(isActive("/register"))} to="/register" onClick={closeSidebar}>📝 Register</Link>
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
          ☰
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
    </>
  );
};

export default Sidebar;

/* ================= STYLES - MODERN GLASS LIGHT THEME ================= */

// Desktop sidebar - glass morphism effect
const desktopSidebar = {
  width: 260,
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(12px)",
  borderRight: "1px solid rgba(229, 231, 235, 0.6)",
  color: "#1e293b",
  minHeight: "100vh",
  padding: "24px 20px",
  position: "fixed",
  left: 0,
  top: 0,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  zIndex: 100,
  boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
};

// Mobile drawer sidebar - glass effect with slide animation
const drawerSidebar = (isOpen) => ({
  width: 280,
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(16px)",
  borderRight: "1px solid rgba(229, 231, 235, 0.8)",
  color: "#1e293b",
  minHeight: "100vh",
  padding: "24px 20px",
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
  fontSize: 22,
  background: "linear-gradient(135deg, #2563eb, #10b981)",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 12,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  transition: "all 0.2s ease",
  backdropFilter: "blur(4px)",
};

// Close button inside mobile sidebar
const closeBtn = {
  background: "rgba(0, 0, 0, 0.05)",
  border: "none",
  color: "#64748b",
  fontSize: 18,
  position: "absolute",
  right: 16,
  top: 20,
  cursor: "pointer",
  padding: 8,
  borderRadius: 40,
  width: 32,
  height: 32,
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
  gap: 12,
  marginBottom: 24,
  paddingBottom: 8,
  borderBottom: "1px solid #e2e8f0",
};

const logoImage = {
  width: 44,
  height: 44,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const companyName = {
  fontSize: 20,
  fontWeight: "bold",
  margin: 0,
  letterSpacing: "-0.3px",
};

const companyTagline = {
  fontSize: 10,
  color: "#64748b",
  marginTop: 2,
  letterSpacing: "0.2px",
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  flex: 1,
};

const divider = {
  borderTop: "1px solid #e2e8f0",
  margin: "16px 0",
};

const sectionLabel = {
  fontSize: 11,
  color: "#64748b",
  letterSpacing: 1,
  fontWeight: 600,
  marginTop: 4,
  marginBottom: 4,
  paddingLeft: 8,
};

const userInfoStyle = {
  marginTop: "auto",
  paddingTop: 16,
};




const linkStyle = (active) => ({
  color: "#e5e7eb",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  background: active
    ? "linear-gradient(90deg,#0B5ED7,#4CAF50)"
    : "transparent",
  fontWeight: active ? "600" : "normal",
  transition: "0.3s",
});