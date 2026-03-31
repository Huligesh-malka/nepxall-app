import React from "react";

const Terms = () => {
  return (
    <div style={container}>
      <div style={headerSection}>
        <h1 style={mainHeading}>Terms & Conditions</h1>
        <p style={subHeading}>
          Nepxall is a PG, Coliving & Rental (ToLet) platform that connects tenants and property owners.
        </p>
      </div>

      <div style={contentSection}>

        {/* USER RESPONSIBILITY */}
        <div style={card}>
          <div style={iconWrapper}>📋</div>
          <h3 style={cardTitle}>User Responsibilities</h3>
          <ul style={list}>
            <li style={listItem}>Provide accurate personal details during booking.</li>
            <li style={listItem}>Provide valid identity proof (Aadhaar/PAN).</li>
            <li style={listItem}>Follow property rules and regulations.</li>
            <li style={listItem}>Avoid illegal activities on the premises.</li>
          </ul>
        </div>

        {/* PAYMENT */}
        <div style={card}>
          <div style={iconWrapper}>💰</div>
          <h3 style={cardTitle}>Booking & Payments</h3>
          <ul style={list}>
            <li style={listItem}>Booking is confirmed only after successful payment.</li>
            <li style={listItem}>Payments are processed securely via third-party gateways.</li>
            <li style={listItem}>Platform does not store card or bank details.</li>
            <li style={listItem}>All prices are in INR (₹).</li>
          </ul>
        </div>

        {/* LEGAL AGREEMENT */}
        <div style={card}>
          <div style={iconWrapper}>⚖️</div>
          <h3 style={cardTitle}>Legal Agreement</h3>
          <ul style={list}>
            <li style={listItem}>Digital agreements are legally valid under IT Act, 2000.</li>
            <li style={listItem}>Agreement is binding under Indian Contract Act, 1872.</li>
            <li style={listItem}>OTP verification acts as identity confirmation.</li>
            <li style={listItem}>Digital signature is legally enforceable.</li>
          </ul>
        </div>

        {/* PLATFORM DISCLAIMER */}
        <div style={card}>
          <div style={iconWrapper}>🛡️</div>
          <h3 style={cardTitle}>Platform Disclaimer</h3>
          <ul style={list}>
            <li style={listItem}>Nepxall is only an intermediary platform.</li>
            <li style={listItem}>We do NOT own any property listed.</li>
            <li style={listItem}>We are not responsible for disputes between users.</li>
            <li style={listItem}>Property owners and tenants are solely responsible.</li>
          </ul>
        </div>

        {/* DATA & PRIVACY */}
        <div style={card}>
          <div style={iconWrapper}>🔐</div>
          <h3 style={cardTitle}>Data & Privacy</h3>
          <ul style={list}>
            <li style={listItem}>We collect only necessary user data.</li>
            <li style={listItem}>Aadhaar is stored only as last 4 digits.</li>
            <li style={listItem}>PAN data is securely stored and protected.</li>
            <li style={listItem}>User data is protected under Indian IT laws.</li>
          </ul>
        </div>

        {/* OWNER RESPONSIBILITY */}
        <div style={card}>
          <div style={iconWrapper}>🏠</div>
          <h3 style={cardTitle}>Owner Responsibilities</h3>
          <ul style={list}>
            <li style={listItem}>Owner must be legal property holder.</li>
            <li style={listItem}>Property must be free from legal disputes.</li>
            <li style={listItem}>Owner responsible for property condition.</li>
            <li style={listItem}>Deposit must be refunded as per agreement.</li>
          </ul>
        </div>

        {/* TENANT RESPONSIBILITY */}
        <div style={card}>
          <div style={iconWrapper}>👤</div>
          <h3 style={cardTitle}>Tenant Responsibilities</h3>
          <ul style={list}>
            <li style={listItem}>Tenant must pay rent on time.</li>
            <li style={listItem}>Maintain property condition.</li>
            <li style={listItem}>Follow society and legal rules.</li>
            <li style={listItem}>No subletting without permission.</li>
          </ul>
        </div>

      </div>

      {/* FINAL NOTE */}
      <div style={footerNote}>
        <p>
          By using this platform, you agree to all terms and conditions.  
          This service is governed under Indian laws.
        </p>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Terms;

/* ================= STYLES ================= */

const container = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "40px 20px",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  fontFamily: "'Inter', sans-serif",
};

const headerSection = {
  textAlign: "center",
  marginBottom: "60px",
  color: "white",
};

const mainHeading = {
  fontSize: "3rem",
  fontWeight: "800",
};

const subHeading = {
  fontSize: "1.2rem",
  maxWidth: "600px",
  margin: "10px auto",
};

const contentSection = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "25px",
};

const card = {
  background: "#fff",
  borderRadius: "15px",
  padding: "25px",
};

const iconWrapper = {
  fontSize: "2rem",
};

const cardTitle = {
  fontSize: "1.3rem",
  fontWeight: "700",
  marginBottom: "10px",
};

const list = {
  listStyle: "none",
  padding: 0,
};

const listItem = {
  padding: "8px 0",
};

const footerNote = {
  textAlign: "center",
  marginTop: "40px",
  color: "white",
};