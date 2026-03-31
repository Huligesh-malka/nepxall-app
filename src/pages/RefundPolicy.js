import React from "react";
import { FaRegClock, FaRegCreditCard, FaRegCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const RefundPolicy = () => {
  const policies = [
    {
      icon: <FaExclamationTriangle size={24} />,
      title: "Tenant Cancellation",
      description: "Once a booking is confirmed, the advance payment is non-refundable unless specified otherwise by the property owner.",
      type: "warning"
    },
    {
      icon: <FaRegCheckCircle size={24} />,
      title: "Owner Rejection",
      description: "If the property owner rejects your booking, the full amount will be refunded within 5–7 working days.",
      type: "success"
    },
    {
      icon: <FaRegCreditCard size={24} />,
      title: "Duplicate Payment",
      description: "Any duplicate or extra payment due to technical error will be refunded automatically.",
      type: "info"
    },
    {
      icon: <FaRegClock size={24} />,
      title: "Refund Processing Time",
      description: "Refunds are processed within 5–7 business days. Bank processing time may vary.",
      type: "info"
    }
  ];

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Refund & Cancellation Policy</h1>
        <p style={styles.subtitle}>
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div style={styles.headerLine}></div>
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

      {/* IMPORTANT LEGAL NOTES */}
      <div style={styles.additionalInfo}>
        <h3 style={styles.infoTitle}>Important Legal Notes:</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            • Refunds are processed only to the original payment method
          </li>
          <li style={styles.listItem}>
            • International transactions may take additional time
          </li>
          <li style={styles.listItem}>
            • Platform does not control owner refund decisions
          </li>
          <li style={styles.listItem}>
            • Any disputes must be resolved between owner and tenant
          </li>
        </ul>
      </div>

      {/* PLATFORM DISCLAIMER (VERY IMPORTANT) */}
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
        </ul>
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
        </ul>
      </div>

      {/* CONTACT */}
      <div style={styles.contactSection}>
        <h3 style={styles.contactTitle}>Need Help?</h3>
        <p style={styles.contactText}>
          Contact us for any refund-related queries:
        </p>
        <p>📧 huligeshmalka@gmail.com</p>
        <p>📞 7483090510</p>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          *This policy applies to all bookings made through our platform.
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
  },

  subtitle: {
    color: "#666",
  },

  headerLine: {
    width: 80,
    height: 4,
    background: "#3b82f6",
    margin: "10px auto",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
    marginBottom: 40,
  },

  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
  },

  cardWarning: { borderLeft: "4px solid orange" },
  cardSuccess: { borderLeft: "4px solid green" },
  cardInfo: { borderLeft: "4px solid blue" },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  iconWrapper: {
    color: "#3b82f6",
  },

  cardTitle: {
    fontWeight: 600,
  },

  cardDescription: {
    marginTop: 10,
  },

  additionalInfo: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },

  disclaimer: {
    background: "#fff3cd",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },

  disclaimerTitle: {
    fontWeight: 700,
  },

  legal: {
    background: "#e0f2fe",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },

  contactSection: {
    background: "#3b82f6",
    color: "#fff",
    padding: 20,
    borderRadius: 10,
    textAlign: "center",
  },

  footer: {
    textAlign: "center",
    marginTop: 20,
  },

  list: {
    listStyle: "none",
    padding: 0,
  },

  listItem: {
    margin: "5px 0",
  },
};