import React, { useState } from "react";
import { 
  FaRegClock, 
  FaRegCreditCard, 
  FaRegCheckCircle, 
  FaExclamationTriangle, 
  FaShieldAlt, 
  FaRegBuilding, 
  FaRegHandshake, 
  FaGavel,
  FaCalculator,
  FaInfoCircle,
  FaBan
} from "react-icons/fa";

const RefundPolicy = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [deposit, setDeposit] = useState(10000);
  const [daysStayed, setDaysStayed] = useState(5);
  const [monthlyRent, setMonthlyRent] = useState(8000);

  const calculateRefund = () => {
    const dailyRent = monthlyRent / 30;
    let refundAmount = deposit;
    let reason = "";

    if (daysStayed === 0) {
      refundAmount = deposit;
      reason = "Full refund (not moved in yet)";
    } else if (daysStayed <= 3) {
      refundAmount = deposit - (dailyRent * daysStayed);
      reason = `Deducted ${daysStayed} day(s) rent (${Math.round(dailyRent * daysStayed)} INR)`;
    } else if (daysStayed <= 7) {
      refundAmount = deposit * 0.5;
      reason = "50% refund - Stayed less than 7 days";
    } else if (daysStayed <= 15) {
      refundAmount = deposit * 0.25;
      reason = "25% refund - Stayed between 7-15 days";
    } else if (daysStayed <= 30) {
      refundAmount = deposit * 0.1;
      reason = "10% refund - Stayed more than 15 days";
    } else {
      refundAmount = 0;
      reason = "No refund - Stayed more than 30 days";
    }

    // Additional deductions for damages would go here
    refundAmount = Math.max(0, refundAmount);
    
    return { refundAmount: Math.round(refundAmount), reason };
  };

  const result = calculateRefund();

  const policies = [
    {
      icon: <FaExclamationTriangle size={24} />,
      title: "Before Move-In (Not Joined)",
      description: "Full refund available if cancellation is requested BEFORE checking into the property (QR scan or physical check-in).",
      type: "warning"
    },
    {
      icon: <FaBan size={24} />,
      title: "AFTER JOINING PG - NO FULL REFUND",
      description: "⚠️ IMPORTANT: Once a tenant has scanned the QR code or physically checked into the property, full refunds are NOT applicable. Only partial refunds based on stay duration will be considered.",
      type: "danger"
    },
    {
      icon: <FaRegCheckCircle size={24} />,
      title: "Owner Rejection",
      description: "If the property owner rejects your booking BEFORE check-in, the full amount will be refunded within 5–7 working days.",
      type: "success"
    },
    {
      icon: <FaCalculator size={24} />,
      title: "Stay-Based Refund Calculation",
      description: "Refunds are calculated based on duration of stay: 0 days=100%, 1-3 days=rent deducted, 4-7 days=50%, 8-15 days=25%, 16-30 days=10%, 30+ days=0%.",
      type: "info"
    },
    {
      icon: <FaRegCreditCard size={24} />,
      title: "Duplicate Payment",
      description: "Any duplicate or extra payment due to technical error will be refunded automatically within 3-5 business days.",
      type: "info"
    },
    {
      icon: <FaRegClock size={24} />,
      title: "Refund Processing Time",
      description: "Refunds are processed within 5–7 business days after approval. Bank processing time may vary (additional 2-5 days depending on bank).",
      type: "info"
    },
    {
      icon: <FaShieldAlt size={24} />,
      title: "Bank Data Security",
      description: "Bank details are stored in encrypted format (AES-256). Refunds are issued only to the original payment method or verified bank account.",
      type: "security"
    },
    {
      icon: <FaRegHandshake size={24} />,
      title: "Dispute Resolution",
      description: "Any disputes regarding refunds must first be attempted to resolve between owner and tenant. Platform can mediate but not enforce refunds.",
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
        <p style={styles.version}>Version 2.1 - Stay-Based Refund Rules</p>
      </div>

      {/* CRITICAL ANNOUNCEMENT */}
      <div style={styles.criticalAlert}>
        <FaBan size={28} />
        <div>
          <h3 style={styles.criticalTitle}>⚠️ NO FULL REFUND AFTER CHECK-IN ⚠️</h3>
          <p style={styles.criticalText}>
            Once you have scanned the PG QR code or physically checked into the property, 
            you are NOT eligible for a full refund. Only partial refunds based on stay duration apply.
          </p>
        </div>
      </div>

      {/* REFUND CALCULATOR */}
      <div style={styles.calculatorSection}>
        <div style={styles.calculatorHeader} onClick={() => setShowCalculator(!showCalculator)}>
          <FaCalculator size={20} />
          <h3 style={styles.calculatorTitle}>Refund Calculator Tool</h3>
          <span style={styles.calculatorToggle}>{showCalculator ? "▲" : "▼"}</span>
        </div>
        
        {showCalculator && (
          <div style={styles.calculatorBody}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Deposit Amount (₹)</label>
              <input 
                type="number" 
                value={deposit} 
                onChange={(e) => setDeposit(Number(e.target.value))}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Monthly Rent (₹)</label>
              <input 
                type="number" 
                value={monthlyRent} 
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Days Stayed</label>
              <input 
                type="number" 
                value={daysStayed} 
                onChange={(e) => setDaysStayed(Number(e.target.value))}
                style={styles.input}
                min="0"
              />
            </div>
            
            <div style={styles.resultBox}>
              <p style={styles.resultLabel}>Estimated Refund:</p>
              <p style={styles.resultAmount}>₹{result.refundAmount.toLocaleString()}</p>
              <p style={styles.resultReason}>Reason: {result.reason}</p>
            </div>
            
            <p style={styles.calculatorNote}>
              * This is an estimate. Final refund may include damage deductions and pending dues.
            </p>
          </div>
        )}
      </div>

      {/* POLICY CARDS */}
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

      {/* REFUND RULES TABLE */}
      <div style={styles.tableSection}>
        <h3 style={styles.sectionTitle}>📊 Refund Rules Based on Stay Duration</h3>
        <table style={styles.table}>
          <thead>
            <tr><th style={styles.th}>Duration Stayed</th><th style={styles.th}>Refund Percentage</th><th style={styles.th}>Notes</th></tr>
          </thead>
          <tbody>
            <tr><td style={styles.td}>0 days (Not checked in)</td><td style={styles.td}>100%</td><td style={styles.td}>Full refund available</td></tr>
            <tr style={styles.warningRow}><td style={styles.td}>1-3 days</td><td style={styles.td}>Deposit - (daily rent × days)</td><td style={styles.td}>Rent deducted only</td></tr>
            <tr><td style={styles.td}>4-7 days</td><td style={styles.td}>50% of deposit</td><td style={styles.td}>Partial refund</td></tr>
            <tr><td style={styles.td}>8-15 days</td><td style={styles.td}>25% of deposit</td><td style={styles.td}>Limited refund</td></tr>
            <tr><td style={styles.td}>16-30 days</td><td style={styles.td}>10% of deposit</td><td style={styles.td}>Minimal refund</td></tr>
            <tr style={styles.dangerRow}><td style={styles.td}>30+ days</td><td style={styles.td}>0%</td><td style={styles.td}>NO REFUND</td></tr>
          </tbody>
        </table>
      </div>

      {/* ENCRYPTION & DATA SECURITY SECTION */}
      <div style={styles.encryptionSection}>
        <h3 style={styles.sectionTitleWhite}>🔐 Data Security & Encryption</h3>
        <p style={styles.encryptionText}>
          We store bank details in encrypted format for payout purposes. Sensitive data such as account number and IFSC 
          are protected using AES-256 encryption and strict access controls. Only authorized administrators can access 
          decrypted data for settlement processing. All access is logged and monitored.
        </p>
      </div>

      {/* USER RIGHTS SECTION */}
      <div style={styles.userRightsSection}>
        <h3 style={styles.sectionTitle}>👤 Your Rights Regarding Refunds</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>• Right to dispute any unauthorized transaction</li>
          <li style={styles.listItem}>• Right to request refund status at any time</li>
          <li style={styles.listItem}>• Right to escalate unresolved refund issues to platform admin</li>
          <li style={styles.listItem}>• Right to withdraw consent for automatic payment processing</li>
          <li style={styles.listItem}>• Right to receive written explanation for any deduction</li>
        </ul>
      </div>

      {/* PLATFORM DISCLAIMER */}
      <div style={styles.disclaimer}>
        <h3 style={styles.disclaimerTitle}>Platform Disclaimer</h3>
        <p style={styles.disclaimerText}>
          Nepxall acts only as an intermediary platform between property owners and tenants.
          We do not own, manage, or control any property listed.
        </p>
        <p style={styles.disclaimerText}>
          The platform is not responsible for:
        </p>
        <ul style={styles.list}>
          <li style={styles.listItem}>• Property condition or availability</li>
          <li style={styles.listItem}>• Refund disputes between owner and tenant</li>
          <li style={styles.listItem}>• Payment-related conflicts</li>
          <li style={styles.listItem}>• Misuse of information once shared between parties</li>
        </ul>
        <p style={styles.disclaimerText}>
          Users are responsible for verifying property and payment details before making any transaction.
        </p>
      </div>

      {/* DATA RETENTION */}
      <div style={styles.dataRetention}>
        <h3 style={styles.sectionTitle}>📋 Data Retention for Refunds</h3>
        <p style={styles.retentionText}>
          Transaction and refund records are retained for 7 years as required by Indian tax laws and audit compliance.
          Users may request deletion of personal data after this period, subject to legal requirements.
        </p>
      </div>

      {/* LEGAL COMPLIANCE */}
      <div style={styles.legal}>
        <h3 style={styles.legalTitle}>Legal Compliance</h3>
        <p style={styles.legalText}>
          This platform operates under Indian laws including:
        </p>
        <ul style={styles.list}>
          <li style={styles.listItem}>• Information Technology Act, 2000</li>
          <li style={styles.listItem}>• Indian Contract Act, 1872</li>
          <li style={styles.listItem}>• Consumer Protection Act, 2019</li>
          <li style={styles.listItem}>• Digital Personal Data Protection Act, 2023</li>
        </ul>
      </div>

      {/* GRIEVANCE OFFICER */}
      <div style={styles.grievanceSection}>
        <h3 style={styles.sectionTitle}>⚖️ Grievance Redressal</h3>
        <p style={styles.grievanceText}>
          For any refund-related complaints or grievances, please contact our Grievance Officer:
        </p>
        <p style={styles.grievanceContact}>
          Name: Huligesh Malka<br />
          Email: huligeshmalka@gmail.com<br />
          Phone: 7483090510<br />
          Response Time: Within 48 hours
        </p>
      </div>

      {/* CONTACT */}
      <div style={styles.contactSection}>
        <h3 style={styles.contactTitle}>Need Help?</h3>
        <p style={styles.contactText}>
          Contact us for any refund-related queries:
        </p>
        <p style={styles.contactDetail}>📧 huligeshmalka@gmail.com</p>
        <p style={styles.contactDetail}>📞 7483090510</p>
        <p style={styles.contactDetail}>🌐 nepxall-app.vercel.app</p>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          *This policy applies to all bookings made through our platform. By using our platform, you agree to this Refund Policy.
        </p>
        <p style={styles.footerSmall}>
          Last policy review: {new Date().toLocaleDateString('en-IN')}
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
  },

  header: {
    textAlign: "center",
    marginBottom: 40,
  },

  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 8,
  },

  subtitle: {
    color: "#64748b",
    fontSize: "0.9rem",
  },

  version: {
    color: "#3b82f6",
    fontSize: "0.8rem",
    marginTop: 4,
  },

  headerLine: {
    width: 80,
    height: 4,
    background: "#3b82f6",
    margin: "10px auto",
    borderRadius: 2,
  },

  criticalAlert: {
    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    color: "white",
    padding: "20px 24px",
    borderRadius: 12,
    marginBottom: 24,
    display: "flex",
    gap: 16,
    alignItems: "center",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },

  criticalTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: 4,
  },

  criticalText: {
    fontSize: "0.9rem",
    opacity: 0.95,
  },

  calculatorSection: {
    background: "#fff",
    borderRadius: 12,
    marginBottom: 30,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },

  calculatorHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
    backgroundColor: "#f1f5f9",
    cursor: "pointer",
    userSelect: "none",
  },

  calculatorTitle: {
    fontWeight: 600,
    flex: 1,
  },

  calculatorToggle: {
    fontSize: "1.2rem",
    color: "#64748b",
  },

  calculatorBody: {
    padding: 20,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    display: "block",
    marginBottom: 6,
    fontWeight: 500,
    fontSize: "0.9rem",
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: "1rem",
  },

  resultBox: {
    backgroundColor: "#dbeafe",
    padding: 16,
    borderRadius: 8,
    textAlign: "center",
    marginTop: 16,
  },

  resultLabel: {
    fontSize: "0.9rem",
    color: "#1e40af",
  },

  resultAmount: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1e3a8a",
  },

  resultReason: {
    fontSize: "0.8rem",
    color: "#3b82f6",
    marginTop: 8,
  },

  calculatorNote: {
    fontSize: "0.7rem",
    color: "#64748b",
    marginTop: 12,
    textAlign: "center",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 20,
    marginBottom: 30,
  },

  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  cardWarning: { borderLeft: "4px solid #f59e0b" },
  cardSuccess: { borderLeft: "4px solid #10b981" },
  cardInfo: { borderLeft: "4px solid #3b82f6" },
  cardSecurity: { borderLeft: "4px solid #8b5cf6" },
  cardLegal: { borderLeft: "4px solid #ef4444" },
  cardDanger: { borderLeft: "4px solid #dc2626", backgroundColor: "#fef2f2" },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  iconWrapper: {
    color: "#3b82f6",
  },

  cardTitle: {
    fontWeight: 600,
    fontSize: "1rem",
    color: "#1e293b",
  },

  cardDescription: {
    marginTop: 12,
    color: "#475569",
    lineHeight: 1.5,
    fontSize: "0.85rem",
  },

  tableSection: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    overflowX: "auto",
  },

  sectionTitle: {
    fontWeight: 700,
    marginBottom: 16,
    fontSize: "1.1rem",
    color: "#1e293b",
  },

  sectionTitleWhite: {
    fontWeight: 700,
    marginBottom: 12,
    fontSize: "1.1rem",
    color: "#fff",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "12px",
    textAlign: "left",
    backgroundColor: "#f1f5f9",
    fontWeight: 600,
    borderBottom: "2px solid #e2e8f0",
  },

  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
  },

  warningRow: {
    backgroundColor: "#fef3c7",
  },

  dangerRow: {
    backgroundColor: "#fee2e2",
  },

  encryptionSection: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    color: "#fff",
  },

  userRightsSection: {
    background: "#e0e7ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeft: "4px solid #3b82f6",
  },

  additionalInfo: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  disclaimer: {
    background: "#fef3c7",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeft: "4px solid #f59e0b",
  },

  disclaimerTitle: {
    fontWeight: 700,
    color: "#92400e",
    marginBottom: 12,
  },

  disclaimerText: {
    color: "#78350f",
    marginBottom: 8,
    fontSize: "0.9rem",
  },

  dataRetention: {
    background: "#dbeafe",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  retentionText: {
    fontSize: "0.9rem",
    color: "#1e40af",
  },

  legal: {
    background: "#dcfce7",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeft: "4px solid #10b981",
  },

  legalTitle: {
    fontWeight: 700,
    color: "#166534",
    marginBottom: 8,
  },

  legalText: {
    color: "#14532d",
    fontSize: "0.9rem",
    marginBottom: 8,
  },

  grievanceSection: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },

  encryptionText: {
    fontSize: "0.9rem",
    lineHeight: 1.6,
    opacity: 0.95,
  },

  grievanceText: {
    fontSize: "0.9rem",
    marginBottom: 8,
  },

  grievanceContact: {
    fontSize: "0.9rem",
    fontWeight: 500,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },

  contactSection: {
    background: "#3b82f6",
    color: "#fff",
    padding: 24,
    borderRadius: 12,
    textAlign: "center",
    marginBottom: 20,
  },

  contactTitle: {
    fontWeight: 700,
    fontSize: "1.3rem",
    marginBottom: 8,
  },

  contactText: {
    marginBottom: 12,
    opacity: 0.95,
  },

  contactDetail: {
    margin: "4px 0",
  },

  footer: {
    textAlign: "center",
    marginTop: 30,
    paddingTop: 20,
    borderTop: "1px solid #e2e8f0",
  },

  footerText: {
    fontSize: "0.8rem",
    color: "#64748b",
  },

  footerSmall: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    marginTop: 8,
  },

  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  listItem: {
    margin: "6px 0",
    fontSize: "0.9rem",
    color: "#334155",
  },
};