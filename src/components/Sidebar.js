import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = () => {

  const location = useLocation();
  const role = localStorage.getItem("role");

  /* ⭐ NEW STATES (for responsive) */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [open, setOpen] = useState(window.innerWidth >= 768);

  /* ⭐ SCREEN SIZE DETECTOR */
  useEffect(() => {

    const handleResize = () => {

      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (!mobile) {
        setOpen(true);
      } else {
        setOpen(false);
      }

    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);

  }, []);

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const isLoggedIn = role && role !== "null" && role !== "undefined";

  /* ⭐ CLOSE SIDEBAR ON MOBILE CLICK */
  const closeMobile = () => {
    if (isMobile) setOpen(false);
  };

  return (

    <>

      {/* ⭐ MOBILE MENU BUTTON */}
      {isMobile && (
        <button style={mobileToggle} onClick={() => setOpen(!open)}>
          ☰
        </button>
      )}

      {/* ⭐ MOBILE OVERLAY */}
      {isMobile && open && (
        <div style={overlay} onClick={() => setOpen(false)} />
      )}

      <div
        style={{
          ...sidebar,
          left: open ? 0 : "-260px"
        }}
      >

        {/* ================= LOGO ================= */}
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

        <nav style={nav}>

          {/* ================= HOME ================= */}
          <Link onClick={closeMobile} style={linkStyle(isActive("/"))} to="/">
            🏡 Home
          </Link>

          {/* ================= TENANT ================= */}
          {isLoggedIn && (role === "tenant" || role === "user") && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>TENANT</p>

              <Link onClick={closeMobile} style={linkStyle(isActive("/user/my-stay"))} to="/user/my-stay">
                🏠 My Stay
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/user/bookings"))} to="/user/bookings">
                📜 My Bookings
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/user/aadhaar-kyc"))} to="/user/aadhaar-kyc">
                🛂 Aadhaar KYC
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/"))} to="/">
                🔍 Browse Properties
              </Link>

              <hr style={divider} />

              <Link onClick={closeMobile} style={linkStyle(isActive("/contact"))} to="/contact">
                📞 Contact Us
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/terms"))} to="/terms">
                📄 Terms & Conditions
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/refund-policy"))} to="/refund-policy">
                💰 Refund Policy
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/privacy-policy"))} to="/privacy-policy">
                🔒 Privacy Policy
              </Link>
            </>
          )}

          {/* ================= OWNER ================= */}
          {isLoggedIn && role === "owner" && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>OWNER</p>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/dashboard"))} to="/owner/dashboard">
                📊 Dashboard
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/bookings"))} to="/owner/bookings">
                📥 Booking Requests
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/payments"))} to="/owner/payments">
                💰 Earnings / Payments
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/premium"))} to="/owner/premium">
                ⭐ Premium Plans
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/pgs"))} to="/owner/pgs">
                🏢 My PGs
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/hotels"))} to="/owner/hotels">
                🏨 My Hotels
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/add"))} to="/owner/add">
                ➕ Add PG
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/add-hotel"))} to="/owner/add-hotel">
                ➕ Add Hotel
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/bank"))} to="/owner/bank">
                🏦 Bank Details
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/verification"))} to="/owner/verification">
                🛂 Verification
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/notifications"))} to="/owner/notifications">
                🔔 Notifications
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/chats"))} to="/owner/chats">
                💬 Chats
              </Link>
            </>
          )}

          {/* ================= VENDOR ================= */}
          {isLoggedIn && role === "vendor" && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>VENDOR</p>

              <Link onClick={closeMobile} style={linkStyle(isActive("/vendor/dashboard"))} to="/vendor/dashboard">
                📊 Dashboard
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/vendor/services"))} to="/vendor/services">
                🛠 My Assigned Services
              </Link>
            </>
          )}

          {/* ================= ADMIN ================= */}
          {isLoggedIn && role === "admin" && (
            <>
              <hr style={divider} />
              <p style={sectionLabel}>ADMIN</p>

              <Link onClick={closeMobile} style={linkStyle(isActive("/admin/finance"))} to="/admin/finance">
                📊 Finance Dashboard
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/admin/payments"))} to="/admin/payments">
                💳 Payment Verification
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/admin/services"))} to="/admin/services">
                🛠 Service Requests
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/admin/owner-verification"))} to="/admin/owner-verification">
                🛡️ Verify Owners
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/admin/settlements"))} to="/admin/settlements">
                💰 Settlements
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/admin/settlement-history"))} to="/admin/settlement-history">
                📜 Settlement History
              </Link>
            </>
          )}

        </nav>

        {/* ================= USER INFO ================= */}
        {isLoggedIn && (
          <div style={userInfoStyle}>

            <hr style={divider} />

            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
              Logged in as
              <span style={{ color: "#fff", fontWeight: "bold", textTransform: "capitalize" }}>
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
/* ================= EXISTING STYLES ================= */

const sidebar = {
  width: 250,
  background: "#0f172a",
  color: "#fff",
  minHeight: "100vh",
  padding: 20,
  position: "fixed",
  left: 0,
  top: 0,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
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
  borderRadius: 8
};

const companyName = {
  fontSize: 20,
  fontWeight: "bold",
  margin: 0
};

const companyTagline = {
  fontSize: 11,
  color: "#94a3b8"
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  flex: 1
};

const divider = {
  borderTop: "1px solid #334155",
  margin: "12px 0"
};

const sectionLabel = {
  fontSize: 11,
  color: "#94a3b8",
  letterSpacing: 1
};

const userInfoStyle = {
  marginTop: "auto"
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