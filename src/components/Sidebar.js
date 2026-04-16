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
          <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
            Logged in as
            <span style={{
              color: "#fff",
              fontWeight: "bold",
              textTransform: "capitalize",
            }}>
              {" "}{safeRole}
            </span>
          </p>
          <p style={{ color: "#4CAF50", fontSize: 11 }}>
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

/* ================= STYLES ================= */

// Desktop sidebar - always visible, static positioning
const desktopSidebar = {
  width: 250,
  background: "#020617", // 🔥 premium dark navy
  color: "#fff",
  minHeight: "100vh",
  padding: 20,
  position: "fixed",
  left: 0,
  top: 0,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  zIndex: 100,
};

// Mobile drawer sidebar - slides in from left
const drawerSidebar = (isOpen) => ({
  width: 280,
  background: "#020617", // 🔥 premium dark navy
  color: "#fff",
  minHeight: "100vh",
  padding: 20,
  position: "fixed",
  left: 0,
  top: 0,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  zIndex: 1000,
  transform: isOpen ? "translateX(0)" : "translateX(-100%)",
  transition: "transform 0.3s ease-in-out",
  boxShadow: isOpen ? "2px 0 20px rgba(0,0,0,0.3)" : "none",
});

// Mobile menu button (hamburger)
const menuButton = {
  position: "fixed",
  top: 15,
  left: 15,
  zIndex: 1100,
  fontSize: 22,
  background: "#2563eb", // 🔥 upgraded blue
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  transition: "all 0.2s",
};

// Close button inside mobile sidebar
const closeBtn = {
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 20,
  position: "absolute",
  right: 15,
  top: 15,
  cursor: "pointer",
  padding: 5,
  borderRadius: 4,
  zIndex: 1001,
};

// Overlay when mobile sidebar is open
const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  zIndex: 999,
  transition: "all 0.3s ease",
};

const companyHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 20,
};

const logoImage = {
  width: 48,
  height: 48,
  borderRadius: 8,
};

const companyName = {
  fontSize: 20,
  fontWeight: "bold",
  margin: 0,
};

const companyTagline = {
  fontSize: 11,
  color: "#94a3b8",
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  flex: 1,
};

const divider = {
  borderTop: "1px solid #1e293b", // 🔥 improved divider color
  margin: "12px 0",
};

const sectionLabel = {
  fontSize: 11,
  color: "#94a3b8",
  letterSpacing: 1,
};

const userInfoStyle = {
  marginTop: "auto",
};

const linkStyle = (active) => ({
  color: "#e5e7eb",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  background: active
    ? "linear-gradient(90deg,#2563eb,#10b981)" // 🔥 premium gradient active tab
    : "transparent",
  borderLeft: active ? "4px solid #10b981" : "4px solid transparent", // 🔥 left border indicator
  fontWeight: active ? "600" : "normal",
  transition: "0.3s",
  display: "block",
  fontSize: 14,
  cursor: "pointer", // 🔥 added hover cursor
});