import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/nepxall-logo.png";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const Sidebar = () => {

  const location = useLocation();
  const role = localStorage.getItem("role");

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [open, setOpen] = useState(window.innerWidth >= 768);

  /* DETECT SCREEN SIZE */
  useEffect(() => {

    const handleResize = () => {

      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);
      setOpen(!mobile);

    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);

  }, []);

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const isLoggedIn = role && role !== "null" && role !== "undefined";

  const closeMobile = () => {
    if (isMobile) setOpen(false);
  };

  return (

    <>

      {/* MOBILE MENU BUTTON */}
      {isMobile && (
        <button style={mobileToggle} onClick={() => setOpen(!open)}>
          ☰
        </button>
      )}

      {/* OVERLAY */}
      {isMobile && open && (
        <div style={overlay} onClick={() => setOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div
        style={{
          ...sidebar,
          left: open ? 0 : "-260px"
        }}
      >

        {/* LOGO */}
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

          {/* HOME */}
          <Link onClick={closeMobile} style={linkStyle(isActive("/"))} to="/">
            🏡 Home
          </Link>

          {/* TENANT */}
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

              <Link onClick={closeMobile} style={linkStyle(isActive("/user/premium"))} to="/user/premium">
                💎 Premium
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/user/aadhaar-kyc"))} to="/user/aadhaar-kyc">
                🛂 Aadhaar KYC
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/"))} to="/">
                🔍 Browse Properties
              </Link>
            </>
          )}

          {/* OWNER */}
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

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/add"))} to="/owner/add">
                ➕ Add PG
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/hotels"))} to="/owner/hotels">
                🏨 My Hotels
              </Link>

              <Link onClick={closeMobile} style={linkStyle(isActive("/owner/bank"))} to="/owner/bank">
                🏦 Bank Details
              </Link>
            </>
          )}

          {/* ADMIN */}
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
            </>
          )}

        </nav>

        {/* USER INFO */}
        {isLoggedIn && (
          <div style={userInfoStyle}>

            <hr style={divider} />

            <p style={{ color: "#94a3b8", fontSize: 12 }}>
              Logged in as
              <span style={{ color: "#fff", fontWeight: "bold" }}>
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

const sidebar = {
  width: 250,
  background: "#0f172a",
  color: "#fff",
  minHeight: "100vh",
  padding: 20,
  position: "fixed",
  top: 0,
  transition: "0.3s",
  zIndex: 1000
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 900
};

const mobileToggle = {
  position: "fixed",
  top: 15,
  left: 15,
  fontSize: 22,
  background: "#0B5ED7",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
  zIndex: 1200
};

const companyHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 20
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
  fontWeight: active ? "600" : "normal"
});