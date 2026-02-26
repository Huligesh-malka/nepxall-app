import React from "react";

const Terms = () => {
  return (
    <div style={container}>
      <div style={headerSection}>
        <h1 style={mainHeading}>Terms & Conditions</h1>
        <p style={subHeading}>
          Nepxall is a smart PG & coliving booking platform that connects tenants
          with property owners.
        </p>
      </div>

      <div style={contentSection}>
        <div style={card}>
          <div style={iconWrapper}>📋</div>
          <h3 style={cardTitle}>User Responsibilities</h3>
          <ul style={list}>
            <li style={listItem}>Provide accurate personal details during booking.</li>
            <li style={listItem}>Respect PG rules and property guidelines.</li>
            <li style={listItem}>Complete payment using our secure payment gateway.</li>
          </ul>
        </div>

        <div style={card}>
          <div style={iconWrapper}>💰</div>
          <h3 style={cardTitle}>Booking & Payments</h3>
          <ul style={list}>
            <li style={listItem}>Booking is confirmed only after successful payment.</li>
            <li style={listItem}>All payments are processed securely via Cashfree.</li>
            <li style={listItem}>Prices are listed in INR (₹).</li>
          </ul>
        </div>

        <div style={card}>
          <div style={iconWrapper}>⚖️</div>
          <h3 style={cardTitle}>Platform Rights</h3>
          <p style={cardText}>
            Nepxall reserves the right to suspend accounts in case of misuse or
            fraudulent activity.
          </p>
        </div>
      </div>

      <div style={footerNote}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Terms;

const container = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "40px 20px",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const headerSection = {
  textAlign: "center",
  marginBottom: "60px",
  color: "white",
};

const mainHeading = {
  fontSize: "3rem",
  fontWeight: "800",
  marginBottom: "20px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
  letterSpacing: "-0.5px",
};

const subHeading = {
  fontSize: "1.2rem",
  maxWidth: "600px",
  margin: "0 auto",
  opacity: 0.95,
  lineHeight: "1.6",
};

const contentSection = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "30px",
  marginBottom: "50px",
};

const card = {
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  borderRadius: "20px",
  padding: "30px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
  ":hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.15)",
  },
};

const iconWrapper = {
  fontSize: "2.5rem",
  marginBottom: "20px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  display: "inline-block",
};

const cardTitle = {
  fontSize: "1.5rem",
  fontWeight: "700",
  marginBottom: "20px",
  color: "#333",
  borderBottom: "3px solid #667eea",
  paddingBottom: "10px",
  display: "inline-block",
};

const list = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const listItem = {
  padding: "12px 0",
  borderBottom: "1px solid #eef2f6",
  color: "#555",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  ":before": {
    content: '"✓"',
    color: "#667eea",
    fontWeight: "bold",
    fontSize: "1.2rem",
  },
};

const cardText = {
  color: "#555",
  lineHeight: "1.8",
  fontSize: "1rem",
  margin: 0,
};

const footerNote = {
  textAlign: "center",
  marginTop: "50px",
  padding: "20px",
  color: "rgba(255,255,255,0.8)",
  borderTop: "1px solid rgba(255,255,255,0.2)",
  fontSize: "0.9rem",
};