import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = ({ role }) => {
  const location = useLocation();

  const email = localStorage.getItem("email");

  const isLoggedIn = !!role;

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

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
        {/* 🏡 HOME */}
        <Link style={linkStyle(isActive("/"))} to="/">
          🏡 Home
        </Link>

        {/* ================= TENANT ================= */}
        {isLoggedIn && (role === "tenant" || role === "user") && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>TENANT</p>

            <Link style={linkStyle(isActive("/user/my-stay"))} to="/user/my-stay">
              🏠 My Stay
            </Link>

            <Link style={linkStyle(isActive("/user/bookings"))} to="/user/bookings">
              📜 My Bookings
            </Link>

            <Link style={linkStyle(isActive("/user/favorites"))} to="/user/favorites">
              ❤️ Favorites
            </Link>

            <Link style={linkStyle(isActive("/user/profile"))} to="/user/profile">
              👤 Profile
            </Link>

            <Link style={linkStyle(isActive("/user/aadhaar-kyc"))} to="/user/aadhaar-kyc">
              🛂 Aadhaar KYC
            </Link>
          </>
        )}

        {/* ================= OWNER ================= */}
        {isLoggedIn && role === "owner" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>OWNER</p>

            <Link style={linkStyle(isActive("/owner/dashboard"))} to="/owner/dashboard">
              📊 Dashboard
            </Link>

            <Link style={linkStyle(isActive("/owner/bookings"))} to="/owner/bookings">
              📥 Booking Requests
            </Link>

            <Link style={linkStyle(isActive("/owner/pgs"))} to="/owner/pgs">
              🏢 My PGs
            </Link>

            <Link style={linkStyle(isActive("/owner/add-pg"))} to="/owner/add-pg">
              ➕ Add PG
            </Link>

            <Link style={linkStyle(isActive("/owner/verification"))} to="/owner/verification">
              🛂 Verification
            </Link>
          </>
        )}

        {/* ================= ADMIN ================= */}
        {isLoggedIn && role === "admin" && (
          <>
            <hr style={divider} />
            <p style={sectionLabel}>ADMIN</p>

            <Link style={linkStyle(isActive("/admin/owner-verification"))} to="/admin/owner-verification">
              🛡️ Verify Owners
            </Link>

            <Link style={linkStyle(isActive("/admin/users"))} to="/admin/users">
              👥 Manage Users
            </Link>

            <Link style={linkStyle(isActive("/admin/properties"))} to="/admin/properties">
              🏘️ All Properties
            </Link>

            <Link style={linkStyle(isActive("/admin/dashboard"))} to="/admin/dashboard">
              📊 Admin Dashboard
            </Link>
          </>
        )}

        {/* ================= PUBLIC ================= */}
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

      {/* ================= USER INFO ================= */}
      {isLoggedIn && (
        <div style={userInfoStyle}>
          <hr style={divider} />

          <p style={{ color: "#94a3b8", fontSize: 12 }}>
            Logged in as{" "}
            <span style={{ color: "#fff", fontWeight: "bold" }}>
              {role}
            </span>
          </p>

          <p style={{ color: "#4CAF50", fontSize: 11 }}>
            {email?.split("@")[0] || "User"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;