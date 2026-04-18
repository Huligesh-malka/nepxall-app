import React from "react";
import { 
  FaRegClock, 
  FaRegCreditCard, 
  FaRegCheckCircle, 
  FaShieldAlt, 
  FaRegHandshake, 
  FaBan,
  FaShieldVirus,
  FaGavel
} from "react-icons/fa";

const RefundPolicy = () => {

  const policies = [
    {
      icon: <FaRegCheckCircle size={24} />,
      title: "Before Check-In",
      description: "100% refund is available if cancellation is done BEFORE QR scan or physical check-in.",
      type: "success"
    },
    {
      icon: <FaBan size={24} />,
      title: "After Check-In (Strict Policy)",
      description: "Once you scan the QR code or check into the property, NO REFUND will be provided under any circumstances.",
      type: "danger"
    },
    {
      icon: <FaRegCheckCircle size={24} />,
      title: "Owner Rejection",
      description: "If the owner rejects your booking before check-in, full refund will be processed within 5–7 business days.",
      type: "success"
    },
    {
      icon: <FaRegCreditCard size={24} />,
      title: "Duplicate Payment",
      description: "Any duplicate or extra payment will be automatically refunded within 3–5 business days.",
      type: "info"
    },
    {
      icon: <FaRegClock size={24} />,
      title: "Refund Processing Time",
      description: "Eligible refunds are processed within 5–7 business days.",
      type: "info"
    },
    {
      icon: <FaShieldAlt size={24} />,
      title: "Bank Data Security",
      description: "All payment data is encrypted (AES-256) and handled securely.",
      type: "security"
    },
    {
      icon: <FaRegHandshake size={24} />,
      title: "Dispute Resolution",
      description: "Platform can assist in disputes but cannot enforce refunds after check-in.",
      type: "legal"
    }
  ];

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Refund & Cancellation Policy</h1>
        <p style={styles.subtitle}>
          Last updated: {new Date().toLocaleDateString('en-IN')}
        </p>
        <div style={styles.headerLine}></div>
        <p style={styles.version}>Version 3.0 - Strict Non-Refundable Policy</p>
      </div>

      {/* 1️⃣ UPDATED CRITICAL ALERT */}
      <div style={styles.criticalAlert}>
        <FaBan size={32} />
        <div>
          <h3 style={styles.criticalTitle}>⚠️ NO REFUND AFTER CHECK-IN ⚠️</h3>
          <p style={styles.criticalText}>
            Once you scan the PG QR code or physically check into the property, 
            the booking becomes <strong>FINAL and NON-REFUNDABLE</strong>. 
            Please confirm all details before check-in.
          </p>
        </div>
      </div>

      {/* 2️⃣ POLICY CARDS GRID */}
      <div style={styles.grid}>
        {policies.map((policy, index) => (
          <div 
            key={index} 
            style={{
              ...styles.card,
              ...styles[`card${policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}`]
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.iconWrapper}>{policy.icon}</div>
              <h3 style={styles.cardTitle}>{policy.title}</h3>
            </div>
            <p style={styles.cardDescription}>{policy.description}</p>
          </div>
        ))}
      </div>

      {/* ENCRYPTION & DATA SECURITY */}
      <div style={styles.encryptionSection}>
        <h3 style={styles.sectionTitleWhite}>🔐 Data Security & Encryption</h3>
        <p style={styles.encryptionText}>
          We store bank details in encrypted format for payout purposes. Sensitive data such as account numbers and IFSC 
          are protected using AES-256 encryption. Only authorized administrators can access decrypted data for 
          settlement processing. All access is logged and monitored.
        </p>
      </div>

      {/* PLATFORM DISCLAIMER */}
      <div style={styles.disclaimer}>
        <h3 style={styles.disclaimerTitle}>Platform Disclaimer</h3>
        <p style={styles.disclaimerText}>
          Nepxall acts only as an intermediary platform between property owners and tenants. 
          We do not own, manage, or control any property listed.
        </p>
        <p style={styles.disclaimerText}>
          <strong>Note:</strong> By booking, you agree that the amount becomes non-refundable after check-in.
        </p>
      </div>

      {/* GRIEVANCE REDRESSAL */}
      <div style={styles.grievanceSection}>
        <h3 style={styles.sectionTitle}>⚖️ Grievance Redressal</h3>
        <p style={styles.grievanceText}>For refund disputes or technical issues:</p>
        <p style={styles.grievanceContact}>
          <strong>Grievance Officer:</strong> Huligesh Malka<br />
          <strong>Email:</strong> huligeshmalka@gmail.com<br />
          <strong>Response Time:</strong> Within 48 hours
        </p>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          *By using our platform, you agree to this Refund Policy.
        </p>
        <p style={styles.footerSmall}>
          Nepxall Rental Services © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default RefundPolicy;

/* ================= STYLES ================= */

const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 20px",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
  },
  header: { textAlign: "center", marginBottom: 40 },
  title: { fontSize: "2.5rem", fontWeight: 700, color: "#1e293b", marginBottom: 8 },
  subtitle: { color: "#64748b", fontSize: "0.9rem" },
  headerLine: { width: 80, height: 4, background: "#3b82f6", margin: "10px auto", borderRadius: 2 },
  version: { color: "#3b82f6", fontSize: "0.8rem", marginTop: 4 },

  criticalAlert: {
    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    color: "white",
    padding: "24px",
    borderRadius: 12,
    marginBottom: 30,
    display: "flex",
    gap: 20,
    alignItems: "center",
    boxShadow: "0 10px 15px -3px rgba(220, 38, 38, 0.2)",
  },
  criticalTitle: { fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 },
  criticalText: { fontSize: "1rem", opacity: 0.95, lineHeight: 1.5 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
    marginBottom: 30,
  },
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderLeft: "4px solid #e2e8f0",
  },
  cardSuccess: { borderLeftColor: "#10b981" },
  cardDanger: { borderLeftColor: "#dc2626", backgroundColor: "#fff1f2" },
  cardInfo: { borderLeftColor: "#3b82f6" },
  cardSecurity: { borderLeftColor: "#8b5cf6" },
  cardLegal: { borderLeftColor: "#f59e0b" },

  cardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  iconWrapper: { color: "#475569" },
  cardTitle: { fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" },
  cardDescription: { color: "#475569", lineHeight: 1.6, fontSize: "0.9rem" },

  encryptionSection: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    color: "#fff",
  },
  sectionTitleWhite: { fontWeight: 700, marginBottom: 12, fontSize: "1.2rem" },
  encryptionText: { fontSize: "0.95rem", lineHeight: 1.6, opacity: 0.9 },

  disclaimer: {
    background: "#fef3c7",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeft: "4px solid #f59e0b",
  },
  disclaimerTitle: { fontWeight: 700, color: "#92400e", marginBottom: 8 },
  disclaimerText: { color: "#78350f", fontSize: "0.9rem", marginBottom: 4 },

  grievanceSection: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    border: "1px solid #e2e8f0",
  },
  sectionTitle: { fontWeight: 700, marginBottom: 12, fontSize: "1.1rem" },
  grievanceText: { fontSize: "0.9rem", color: "#475569" },
  grievanceContact: { 
    fontSize: "0.9rem", 
    backgroundColor: "#f1f5f9", 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 10,
    lineHeight: 1.6 
  },

  footer: { textAlign: "center", marginTop: 40, paddingTop: 20, borderTop: "1px solid #e2e8f0" },
  footerText: { fontSize: "0.85rem", color: "#64748b", fontWeight: 500 },
  footerSmall: { fontSize: "0.75rem", color: "#94a3b8", marginTop: 8 },
};