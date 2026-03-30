import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = () => {

  const location = useLocation();

  // 🔥 FIX: normalize role
  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole.toLowerCase().trim() : null;

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const isLoggedIn = role && role !== "null" && role !== "undefined";

  return (

    <div style={sidebar}>

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
        <Link style={linkStyle(isActive("/"))} to="/">
          🏡 Home
        </Link>

        {/* ================= TENANT ================= */}
        {isLoggedIn && (role === "tenant" || role === "user") && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>TENANT</p>

            <Link style={linkStyle(isActive("/user/my-stay"))} to="/user/my-stay">🏠 My Stay</Link>
            <Link style={linkStyle(isActive("/user/bookings"))} to="/user/bookings">📜 My Bookings</Link>
            <Link style={linkStyle(isActive("/user/aadhaar-kyc"))} to="/user/aadhaar-kyc">🛂 Aadhaar KYC</Link>
            <Link style={linkStyle(isActive("/user/digilocker"))} to="/user/digilocker">🔐 DigiLocker</Link>
            <Link style={linkStyle(isActive("/"))} to="/">🔍 Browse Properties</Link>

            <hr style={divider} />

            <Link style={linkStyle(isActive("/contact"))} to="/contact">📞 Contact</Link>
            <Link style={linkStyle(isActive("/terms"))} to="/terms">📄 Terms</Link>
            <Link style={linkStyle(isActive("/refund-policy"))} to="/refund-policy">💰 Refund</Link>
            <Link style={linkStyle(isActive("/privacy-policy"))} to="/privacy-policy">🔒 Privacy</Link>
          </>
        )}

        {/* ================= OWNER ================= */}
        {isLoggedIn && role === "owner" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>OWNER</p>

            <Link style={linkStyle(isActive("/owner/dashboard"))} to="/owner/dashboard">📊 Dashboard</Link>
            <Link style={linkStyle(isActive("/owner/bookings"))} to="/owner/bookings">📥 Booking Requests</Link>
            <Link style={linkStyle(isActive("/owner/payments"))} to="/owner/payments">💰 Payments</Link>
            <Link style={linkStyle(isActive("/owner/premium"))} to="/owner/premium">⭐ Premium</Link>
            <Link style={linkStyle(isActive("/owner/pgs"))} to="/owner/pgs">🏢 My PGs</Link>
            <Link style={linkStyle(isActive("/owner/hotels"))} to="/owner/hotels">🏨 My Hotels</Link>
            <Link style={linkStyle(isActive("/owner/add"))} to="/owner/add">➕ Add PG</Link>
            <Link style={linkStyle(isActive("/owner/add-hotel"))} to="/owner/add-hotel">➕ Add Hotel</Link>
            <Link style={linkStyle(isActive("/owner/bank"))} to="/owner/bank">🏦 Bank</Link>
            <Link style={linkStyle(isActive("/owner/verification"))} to="/owner/verification">🛂 Verification</Link>
            <Link style={linkStyle(isActive("/owner/notifications"))} to="/owner/notifications">🔔 Notifications</Link>
            <Link style={linkStyle(isActive("/owner/chats"))} to="/owner/chats">💬 Chats</Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {isLoggedIn && role === "admin" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>ADMIN</p>

            <Link style={linkStyle(isActive("/admin/finance"))} to="/admin/finance">📊 Finance</Link>
            <Link style={linkStyle(isActive("/admin/payments"))} to="/admin/payments">💳 Payments</Link>
            <Link style={linkStyle(isActive("/admin/services"))} to="/admin/services">🛠 Services</Link>
            <Link style={linkStyle(isActive("/admin/owner-verification"))} to="/admin/owner-verification">🛡️ Verify</Link>
            <Link style={linkStyle(isActive("/admin/settlements"))} to="/admin/settlements">💰 Settlements</Link>
            <Link style={linkStyle(isActive("/admin/settlement-history"))} to="/admin/settlement-history">📜 History</Link>
            <Link style={linkStyle(isActive("/admin/agreements"))} to="/admin/agreements">📄 Agreements</Link>
          </>
        )}

        {/* ================= VENDOR ================= */}
        {isLoggedIn && role === "vendor" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>VENDOR</p>

            <Link style={linkStyle(isActive("/vendor/dashboard"))} to="/vendor/dashboard">📊 Dashboard</Link>
            <Link style={linkStyle(isActive("/vendor/services"))} to="/vendor/services">🛠 Services</Link>
          </>
        )}

        {/* ================= AUTH ================= */}
        {!isLoggedIn && (
          <>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/login"))} to="/login">🔑 Login</Link>
            <Link style={linkStyle(isActive("/register"))} to="/register">📝 Register</Link>
          </>
        )}

      </nav>

      {/* ================= USER INFO ================= */}
      {isLoggedIn && (
        <div style={userInfoStyle}>
          <hr style={divider} />
          <p style={{ color: "#94a3b8", fontSize: 12 }}>
            Logged in as <b style={{ color: "#fff" }}>{role}</b>
          </p>
        </div>
      )}

    </div>
  );
};

export default Sidebar;

/* ================= STYLES ================= */

const sidebar = {
  width: 250,
  background: "#0f172a",
  color: "#fff",
  minHeight: "100vh",
  padding: 20,
  position: "fixed",
  left: 0,
  top: 0,
};

const companyHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const logoImage = {
  width: 48,
  height: 48,
};

const companyName = {
  fontSize: 20,
  fontWeight: "bold",
};

const companyTagline = {
  fontSize: 11,
  color: "#94a3b8"
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const divider = {
  borderTop: "1px solid #334155",
  margin: "12px 0"
};

const sectionLabel = {
  fontSize: 11,
  color: "#94a3b8",
};

const userInfoStyle = {
  marginTop: "auto"
};

const linkStyle = (active) => ({
  color: "#e5e7eb",
  padding: "10px",
  borderRadius: 8,
  background: active ? "#0B5ED7" : "transparent",
});