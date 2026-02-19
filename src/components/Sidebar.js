import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = () => {
  const location = useLocation();
  const role = localStorage.getItem("role");

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  // Better check for logged in status
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
          <p style={companyTagline}>Next Places for Living</p>
        </div>
      </div>

      <hr style={divider} />

      <nav style={nav}>
        {/* 🏡 HOME - Always visible */}
        <Link style={linkStyle(isActive("/"))} to="/">
          🏡 Home
        </Link>

        {/* Show tenant/user section if role is tenant or user */}
        {isLoggedIn && (role === "tenant" || role === "user") && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>TENANT</p>

            <Link
              style={linkStyle(isActive("/user/my-stay"))}
              to="/user/my-stay"
            >
              🏠 My Stay
            </Link>

            <Link
              style={linkStyle(isActive("/user/bookings"))}
              to="/user/bookings"
            >
              📜 My Bookings
            </Link>

            <Link
              style={linkStyle(isActive("/user/favorites"))}
              to="/user/favorites"
            >
              ❤️ Favorites
            </Link>

            <Link
              style={linkStyle(isActive("/user/profile"))}
              to="/user/profile"
            >
              👤 Profile
            </Link>

            <Link
  style={linkStyle(isActive("/user/aadhaar-kyc"))}
  to="/user/aadhaar-kyc"
>
  🛂 Aadhaar KYC
</Link>


            <Link
              style={linkStyle(isActive("/"))}
              to="/"
            >
              🔍 Browse Properties
            </Link>
          </>
        )}

        {/* ================= OWNER ================= */}
        {isLoggedIn && role === "owner" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>OWNER</p>

            <Link
              style={linkStyle(isActive("/owner/dashboard"))}
              to="/owner/dashboard"
            >
              📊 Dashboard
            </Link>

            <Link
              style={linkStyle(isActive("/owner/bookings"))}
              to="/owner/bookings"
            >
              📥 Booking Requests
            </Link>

            {/* MY PROPERTIES SECTION */}
            <Link
              style={linkStyle(isActive("/owner/pgs"))}
              to="/owner/pgs"
            >
              🏢 My PGs
            </Link>

            <Link
              style={linkStyle(isActive("/owner/hotels"))}
              to="/owner/hotels"
            >
              
            </Link>

            {/* ADD PROPERTY SECTION */}
            <Link
              style={linkStyle(isActive("/owner/add-pg"))}
              to="/owner/add-pg"
            >
              ➕ Add PG
            </Link>

            <Link
              style={linkStyle(isActive("/owner/add-hotel"))}
              to="/owner/add-hotel"
            >
              
            </Link>

            <Link
              style={linkStyle(isActive("/owner/verification"))}
              to="/owner/verification"
            >
              🛂 Verification
            </Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {isLoggedIn && role === "admin" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>ADMIN</p>

            <Link
              style={linkStyle(isActive("/admin/owner-verification"))}
              to="/admin/owner-verification"
            >
              🛡️ Verify Owners
            </Link>

            <Link
              style={linkStyle(isActive("/admin/users"))}
              to="/admin/users"
            >
              👥 Manage Users
            </Link>

            <Link
              style={linkStyle(isActive("/admin/properties"))}
              to="/admin/properties"
            >
              🏘️ All Properties
            </Link>

            <Link
              style={linkStyle(isActive("/admin/dashboard"))}
              to="/admin/dashboard"
            >
              📊 Admin Dashboard
            </Link>
          </>
        )}

        {/* Show login/register links when not logged in */}
        {!isLoggedIn && (
          <>
            <hr style={divider} />
            <Link style={linkStyle(isActive("/login"))} to="/login">
              🔑 Login
            </Link>
            <Link style={linkStyle(isActive("/register"))} to="/register">
              📝 Register
            </Link>
          </>
        )}
      </nav>

      {/* Show user info if logged in */}
      {isLoggedIn && (
        <div style={userInfoStyle}>
          <hr style={divider} />
          <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
            Logged in as:{" "}
            <span style={{ color: "#fff", fontWeight: "bold", textTransform: "capitalize" }}>
              {role}
            </span>
          </p>
          <p style={{ color: "#4CAF50", fontSize: 11, margin: "5px 0 0 0" }}>
            {localStorage.getItem("email")?.split('@')[0] || 'User'}
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
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  zIndex: 1000,
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
  lineHeight: 1.1,
};

const companyTagline = {
  fontSize: 11,
  margin: 0,
  color: "#94a3b8",
  letterSpacing: "0.4px",
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  flex: 1,
};

const divider = {
  borderTop: "1px solid #334155",
  opacity: 0.4,
  margin: "12px 0",
};

const sectionLabel = {
  fontSize: 11,
  color: "#94a3b8",
  marginBottom: 6,
  marginTop: 6,
  letterSpacing: "1px",
  textTransform: "uppercase",
};

const userInfoStyle = {
  marginTop: "auto",
  paddingTop: 10,
};

const linkStyle = (active) => ({
  color: "#e5e7eb",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  background: active
    ? "linear-gradient(90deg, #0B5ED7, #4CAF50)"
    : "transparent",
  fontWeight: active ? "600" : "normal",
  transition: "0.2s ease",
  display: "block",
  fontSize: 14,
  "&:hover": {
    background: active ? "linear-gradient(90deg, #0B5ED7, #4CAF50)" : "#1e293b",
  },
});