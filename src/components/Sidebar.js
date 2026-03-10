import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const role = localStorage.getItem("role");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call initially

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Close sidebar on mobile when route changes
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const isLoggedIn = role && role !== "null" && role !== "undefined";

  return (
    <>
      {/* Mobile Header with Hamburger */}
      {isMobile && (
        <div style={mobileHeader}>
          <div style={mobileHeaderContent}>
            <img src={logo} alt="Nepxall logo" style={mobileLogo} />
            <h2 style={mobileCompanyName}>
              <span style={{ color: BRAND_BLUE }}>Nep</span>
              <span style={{ color: BRAND_GREEN }}>xall</span>
            </h2>
          </div>
          <button 
            onClick={toggleSidebar} 
            style={hamburgerButton}
            aria-label="Toggle menu"
          >
            <div style={hamburgerIcon(isOpen)}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div style={overlay} onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <div style={sidebar(isMobile, isOpen)}>
        {/* Logo Section - Hidden on mobile when collapsed */}
        {(!isMobile || isOpen) && (
          <>
            <div style={companyHeader}>
              <img src={logo} alt="Nepxall logo" style={logoImage} />
              <div>
                <h2 style={companyName}>
                  <span style={{ color: BRAND_BLUE }}>Nep</span>
                  <span style={{ color: BRAND_GREEN }}>xall</span>
                </h2>
                <p style={companyTagline}>
                  Next Places for Living
                </p>
              </div>
            </div>
            <hr style={divider} />
          </>
        )}

        <nav style={nav}>
          {/* ================= HOME ================= */}
          <Link style={linkStyle(isActive("/"))} to="/" onClick={() => isMobile && setIsOpen(false)}>
            🏡 Home
          </Link>

          {/* ================= TENANT ================= */}
          {isLoggedIn && (role === "tenant" || role === "user") && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>TENANT</p>

              <Link style={linkStyle(isActive("/user/my-stay"))} to="/user/my-stay" onClick={() => isMobile && setIsOpen(false)}>
                🏠 My Stay
              </Link>

              <Link style={linkStyle(isActive("/user/bookings"))} to="/user/bookings" onClick={() => isMobile && setIsOpen(false)}>
                📜 My Bookings
              </Link>

              <Link style={linkStyle(isActive("/user/aadhaar-kyc"))} to="/user/aadhaar-kyc" onClick={() => isMobile && setIsOpen(false)}>
                🛂 Aadhaar KYC
              </Link>

              <Link style={linkStyle(isActive("/"))} to="/" onClick={() => isMobile && setIsOpen(false)}>
                🔍 Browse Properties
              </Link>

              <hr style={divider} />

              <Link style={linkStyle(isActive("/contact"))} to="/contact" onClick={() => isMobile && setIsOpen(false)}>
                📞 Contact Us
              </Link>

              <Link style={linkStyle(isActive("/terms"))} to="/terms" onClick={() => isMobile && setIsOpen(false)}>
                📄 Terms & Conditions
              </Link>

              <Link style={linkStyle(isActive("/refund-policy"))} to="/refund-policy" onClick={() => isMobile && setIsOpen(false)}>
                💰 Refund Policy
              </Link>

              <Link style={linkStyle(isActive("/privacy-policy"))} to="/privacy-policy" onClick={() => isMobile && setIsOpen(false)}>
                🔒 Privacy Policy
              </Link>
            </>
          )}

          {/* ================= OWNER ================= */}
          {isLoggedIn && role === "owner" && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>OWNER</p>

              <Link style={linkStyle(isActive("/owner/dashboard"))} to="/owner/dashboard" onClick={() => isMobile && setIsOpen(false)}>
                📊 Dashboard
              </Link>

              <Link style={linkStyle(isActive("/owner/bookings"))} to="/owner/bookings" onClick={() => isMobile && setIsOpen(false)}>
                📥 Booking Requests
              </Link>

              <Link style={linkStyle(isActive("/owner/payments"))} to="/owner/payments" onClick={() => isMobile && setIsOpen(false)}>
                💰 Earnings / Payments
              </Link>

              <Link style={linkStyle(isActive("/owner/premium"))} to="/owner/premium" onClick={() => isMobile && setIsOpen(false)}>
                ⭐ Premium Plans
              </Link>

              <Link style={linkStyle(isActive("/owner/pgs"))} to="/owner/pgs" onClick={() => isMobile && setIsOpen(false)}>
                🏢 My PGs
              </Link>

              <Link style={linkStyle(isActive("/owner/hotels"))} to="/owner/hotels" onClick={() => isMobile && setIsOpen(false)}>
                🏨 My Hotels
              </Link>

              <Link style={linkStyle(isActive("/owner/add"))} to="/owner/add" onClick={() => isMobile && setIsOpen(false)}>
                ➕ Add PG
              </Link>

              <Link style={linkStyle(isActive("/owner/add-hotel"))} to="/owner/add-hotel" onClick={() => isMobile && setIsOpen(false)}>
                ➕ Add Hotel
              </Link>

              <Link style={linkStyle(isActive("/owner/bank"))} to="/owner/bank" onClick={() => isMobile && setIsOpen(false)}>
                🏦 Bank Details
              </Link>

              <Link style={linkStyle(isActive("/owner/verification"))} to="/owner/verification" onClick={() => isMobile && setIsOpen(false)}>
                🛂 Verification
              </Link>

              <Link style={linkStyle(isActive("/owner/notifications"))} to="/owner/notifications" onClick={() => isMobile && setIsOpen(false)}>
                🔔 Notifications
              </Link>

              <Link style={linkStyle(isActive("/owner/chats"))} to="/owner/chats" onClick={() => isMobile && setIsOpen(false)}>
                💬 Chats
              </Link>
            </>
          )}

          {/* ================= VENDOR ================= */}
          {isLoggedIn && role === "vendor" && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>VENDOR</p>

              <Link style={linkStyle(isActive("/vendor/dashboard"))} to="/vendor/dashboard" onClick={() => isMobile && setIsOpen(false)}>
                📊 Dashboard
              </Link>

              <Link style={linkStyle(isActive("/vendor/services"))} to="/vendor/services" onClick={() => isMobile && setIsOpen(false)}>
                🛠 My Assigned Services
              </Link>
            </>
          )}

          {/* ================= ADMIN ================= */}
          {isLoggedIn && role === "admin" && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>ADMIN</p>

              <Link style={linkStyle(isActive("/admin/finance"))} to="/admin/finance" onClick={() => isMobile && setIsOpen(false)}>
                📊 Finance Dashboard
              </Link>

              <Link style={linkStyle(isActive("/admin/payments"))} to="/admin/payments" onClick={() => isMobile && setIsOpen(false)}>
                💳 Payment Verification
              </Link>

              <Link style={linkStyle(isActive("/admin/services"))} to="/admin/services" onClick={() => isMobile && setIsOpen(false)}>
                🛠 Service Requests
              </Link>

              <Link style={linkStyle(isActive("/admin/owner-verification"))} to="/admin/owner-verification" onClick={() => isMobile && setIsOpen(false)}>
                🛡️ Verify Owners
              </Link>

              <Link style={linkStyle(isActive("/admin/settlements"))} to="/admin/settlements" onClick={() => isMobile && setIsOpen(false)}>
                💰 Settlements
              </Link>

              <Link style={linkStyle(isActive("/admin/settlement-history"))} to="/admin/settlement-history" onClick={() => isMobile && setIsOpen(false)}>
                📜 Settlement History
              </Link>
            </>
          )}

          {/* ================= AUTH ================= */}
          {!isLoggedIn && (
            <>
              <hr style={divider} />

              <Link style={linkStyle(isActive("/login"))} to="/login" onClick={() => isMobile && setIsOpen(false)}>
                🔑 Login
              </Link>

              <Link style={linkStyle(isActive("/register"))} to="/register" onClick={() => isMobile && setIsOpen(false)}>
                📝 Register
              </Link>
            </>
          )}
        </nav>

        {/* ================= USER INFO ================= */}
        {isLoggedIn && (!isMobile || isOpen) && (
          <div style={userInfoStyle}>
            <hr style={divider} />
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
              Logged in as
              <span
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  textTransform: "capitalize",
                }}
              >
                {" "} {role}
              </span>
            </p>
            <p style={{ color: "#4CAF50", fontSize: 11 }}>
              {localStorage.getItem("email")?.split("@")[0] || "User"}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;

/* ================= STYLES ================= */

const mobileHeader = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 60,
  background: "#0f172a",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 20px",
  zIndex: 1000,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const mobileHeaderContent = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const mobileLogo = {
  width: 32,
  height: 32,
  borderRadius: 4,
};

const mobileCompanyName = {
  fontSize: 18,
  fontWeight: "bold",
  margin: 0,
};

const hamburgerButton = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 10,
  zIndex: 1001,
};

const hamburgerIcon = (isOpen) => ({
  width: 24,
  height: 18,
  position: "relative",
  transform: isOpen ? "rotate(90deg)" : "none",
  transition: "transform 0.3s ease",
  "& span": {
    display: "block",
    position: "absolute",
    height: 2,
    width: "100%",
    background: "#fff",
    borderRadius: 2,
    transition: "all 0.3s ease",
  },
  "& span:nth-child(1)": {
    top: isOpen ? 8 : 0,
    transform: isOpen ? "rotate(45deg)" : "none",
  },
  "& span:nth-child(2)": {
    top: 8,
    opacity: isOpen ? 0 : 1,
  },
  "& span:nth-child(3)": {
    top: isOpen ? 8 : 16,
    transform: isOpen ? "rotate(-45deg)" : "none",
  },
});

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  zIndex: 998,
};

const sidebar = (isMobile, isOpen) => ({
  width: isMobile ? 280 : 250,
  background: "#0f172a",
  color: "#fff",
  minHeight: "100vh",
  padding: isMobile ? "20px" : 20,
  position: "fixed",
  left: isMobile ? (isOpen ? 0 : -280) : 0,
  top: isMobile ? 60 : 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  transition: "left 0.3s ease",
  zIndex: 999,
  boxShadow: isMobile && isOpen ? "2px 0 8px rgba(0,0,0,0.2)" : "none",
});

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
  borderTop: "1px solid #334155",
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
    ? "linear-gradient(90deg,#0B5ED7,#4CAF50)"
    : "transparent",
  fontWeight: active ? "600" : "normal",
  transition: "0.3s",
  fontSize: 14,
  display: "block",
});