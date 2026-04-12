import React from "react";

const Terms = () => {
  return (
    <div style={container}>
      <div style={headerSection}>
        <h1 style={mainHeading}>Terms & Conditions</h1>
        <p style={subHeading}>
          Nepxall is a PG, Coliving & Rental (ToLet) platform that connects tenants and property owners.
        </p>
        <p style={version}>Version 2.1 - Updated {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <div style={contentSection}>

        {/* CRITICAL REFUND RULE */}
        <div style={criticalCard}>
          <div style={criticalIcon}>🚫</div>
          <h3 style={criticalTitle}>⚠️ NO FULL REFUND AFTER CHECK-IN ⚠️</h3>
          <p style={criticalText}>
            Once you have scanned the PG QR code or physically checked into the property, 
            you are NOT eligible for a full refund. Only partial refunds based on stay duration apply.
          </p>
        </div>

        {/* REFUND POLICY SECTION */}
        <div style={card}>
          <div style={iconWrapper}>💰</div>
          <h3 style={cardTitle}>Refund & Cancellation Rules</h3>
          <ul style={list}>
            <li style={listItem}>• <strong>Before check-in:</strong> 100% refund available</li>
            <li style={listItem}>• <strong>After check-in (1-3 days):</strong> Rent deducted from deposit</li>
            <li style={listItem}>• <strong>After check-in (4-7 days):</strong> 50% of deposit refunded</li>
            <li style={listItem}>• <strong>After check-in (8-15 days):</strong> 25% of deposit refunded</li>
            <li style={listItem}>• <strong>After check-in (16-30 days):</strong> 10% of deposit refunded</li>
            <li style={listItem}>• <strong>After check-in (30+ days):</strong> NO REFUND</li>
            <li style={listItem}>• Refunds processed within 5-7 business days</li>
          </ul>
        </div>

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

        {/* PAYMENT & BANK DATA */}
        <div style={card}>
          <div style={iconWrapper}>🔐</div>
          <h3 style={cardTitle}>Payment & Bank Data Security</h3>
          <ul style={list}>
            <li style={listItem}>Booking is confirmed only after successful payment.</li>
            <li style={listItem}>Payments are processed securely via third-party gateways.</li>
            <li style={listItem}>Bank details are stored in encrypted format (AES-256).</li>
            <li style={listItem}>Only authorized admins can access decrypted bank data.</li>
            <li style={listItem}>All access to financial data is logged and monitored.</li>
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
            <li style={listItem}>Platform not liable for refund disputes after check-in.</li>
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
            <li style={listItem}>Users have right to access, correct, or delete data.</li>
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
            <li style={listItem}>Deposit must be refunded as per agreement rules.</li>
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

        {/* DATA RETENTION */}
        <div style={card}>
          <div style={iconWrapper}>📁</div>
          <h3 style={cardTitle}>Data Retention</h3>
          <ul style={list}>
            <li style={listItem}>Transaction records retained for 7 years (tax compliance).</li>
            <li style={listItem}>Personal data can be deleted upon request.</li>
            <li style={listItem}>Logs retained for 1 year for security.</li>
            <li style={listItem}>Inactive accounts archived after 2 years.</li>
          </ul>
        </div>

        {/* USER RIGHTS */}
        <div style={card}>
          <div style={iconWrapper}>✅</div>
          <h3 style={cardTitle}>Your Rights</h3>
          <ul style={list}>
            <li style={listItem}>✓ Right to access your personal data</li>
            <li style={listItem}>✓ Right to request corrections</li>
            <li style={listItem}>✓ Right to request deletion (subject to legal limits)</li>
            <li style={listItem}>✓ Right to withdraw consent</li>
            <li style={listItem}>✓ Right to lodge a complaint</li>
          </ul>
        </div>

      </div>

      {/* FINAL NOTE */}
      <div style={footerNote}>
        <p>
          By using this platform, you agree to all terms and conditions including the refund rules stated above.
          This service is governed under Indian laws.
        </p>
        <p style={footerSmall}>Last updated: {new Date().toLocaleDateString('en-IN')}</p>
        <p style={footerSmall}>For grievances: huligeshmalka@gmail.com | Response within 48 hours</p>
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
  marginBottom: "40px",
  color: "white",
};

const mainHeading = {
  fontSize: "3rem",
  fontWeight: "800",
  marginBottom: "10px",
};

const subHeading = {
  fontSize: "1.2rem",
  maxWidth: "600px",
  margin: "10px auto",
};

const version = {
  fontSize: "0.8rem",
  opacity: 0.8,
  marginTop: "8px",
};

const contentSection = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "25px",
};

const card = {
  background: "#fff",
  borderRadius: "15px",
  padding: "25px",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
};

const criticalCard = {
  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  borderRadius: "15px",
  padding: "25px",
  color: "white",
  textAlign: "center",
  gridColumn: "1 / -1",
};

const criticalIcon = {
  fontSize: "3rem",
  marginBottom: "10px",
};

const criticalTitle = {
  fontSize: "1.5rem",
  fontWeight: "700",
  marginBottom: "10px",
};

const criticalText = {
  fontSize: "0.95rem",
  opacity: 0.95,
};

const iconWrapper = {
  fontSize: "2rem",
  marginBottom: "10px",
};

const cardTitle = {
  fontSize: "1.3rem",
  fontWeight: "700",
  marginBottom: "15px",
  color: "#1e293b",
};

const list = {
  listStyle: "none",
  padding: 0,
};

const listItem = {
  padding: "8px 0",
  color: "#475569",
  lineHeight: "1.5",
  fontSize: "0.9rem",
  borderBottom: "1px solid #e2e8f0",
};

const footerNote = {
  textAlign: "center",
  marginTop: "40px",
  color: "white",
  padding: "20px",
  background: "rgba(0,0,0,0.2)",
  borderRadius: "15px",
};

const footerSmall = {
  fontSize: "0.8rem",
  opacity: 0.8,
  marginTop: "10px",
};