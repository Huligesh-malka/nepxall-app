import React from "react";
import { FaRegClock, FaRegCreditCard, FaRegCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const RefundPolicy = () => {
  const policies = [
    {
      icon: <FaExclamationTriangle size={24} />,
      title: "Tenant Cancellation",
      description: "Once a booking is confirmed, the advance payment is non-refundable.",
      type: "warning"
    },
    {
      icon: <FaRegCheckCircle size={24} />,
      title: "Owner Rejection",
      description: "If the PG owner rejects your booking, the full amount will be refunded within 5–7 working days to the original payment method.",
      type: "success"
    },
    {
      icon: <FaRegCreditCard size={24} />,
      title: "Duplicate Payment",
      description: "Any extra amount paid due to technical error will be refunded automatically. No action required from your side.",
      type: "info"
    },
    {
      icon: <FaRegClock size={24} />,
      title: "Refund Processing Time",
      description: "All eligible refunds are processed within 5–7 business days. The actual credit to your account depends on your bank's processing time.",
      type: "info"
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>Refund & Cancellation Policy</h1>
        <p style={styles.subtitle}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <div style={styles.headerLine}></div>
      </div>

      {/* Policy Cards Grid */}
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

      {/* Additional Information */}
      <div style={styles.additionalInfo}>
        <h3 style={styles.infoTitle}>Important Notes:</h3>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <span style={styles.bullet}>•</span>
            Refunds are processed only to the original payment method used during booking
          </li>
          <li style={styles.listItem}>
            <span style={styles.bullet}>•</span>
            International transactions may take additional 2-3 business days
          </li>
          <li style={styles.listItem}>
            <span style={styles.bullet}>•</span>
            For any refund-related queries, contact our support team
          </li>
        </ul>
      </div>

      {/* Contact Section */}
      <div style={styles.contactSection}>
        <h3 style={styles.contactTitle}>Need Help?</h3>
        <p style={styles.contactText}>
          If you have any questions about our refund policy, please contact us at:
        </p>
        <div style={styles.contactDetails}>
          <p style={styles.contactEmail}>📧 huligeshmalka@gmail.com</p>
          <p style={styles.contactPhone}>📞 7483090510</p>
        </div>
      </div>

      {/* Footer Note */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          *This policy is applicable for all bookings made through our platform.
        </p>
      </div>
    </div>
  );
};

export default RefundPolicy;

const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  
  header: {
    textAlign: "center",
    marginBottom: 48,
  },
  
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 8,
    letterSpacing: "-0.02em",
  },
  
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    marginBottom: 24,
  },
  
  headerLine: {
    width: 100,
    height: 4,
    backgroundColor: "#3b82f6",
    margin: "0 auto",
    borderRadius: 2,
  },
  
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 24,
    marginBottom: 48,
  },
  
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "transform 0.2s ease, boxShadow 0.2s ease",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
  },
  
  cardWarning: {
    borderLeft: "4px solid #f59e0b",
  },
  
  cardSuccess: {
    borderLeft: "4px solid #10b981",
  },
  
  cardInfo: {
    borderLeft: "4px solid #3b82f6",
  },
  
  cardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: 16,
  },
  
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    color: "#3b82f6",
  },
  
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
  },
  
  cardDescription: {
    fontSize: "1rem",
    color: "#475569",
    lineHeight: 1.6,
    margin: 0,
  },
  
  additionalInfo: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  
  infoTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 24,
  },
  
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  
  listItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    fontSize: "1rem",
    color: "#475569",
  },
  
  bullet: {
    color: "#3b82f6",
    marginRight: 12,
    fontSize: "1.25rem",
  },
  
  contactSection: {
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    padding: 32,
    textAlign: "center",
    color: "#ffffff",
    marginBottom: 24,
  },
  
  contactTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: 12,
  },
  
  contactText: {
    fontSize: "1rem",
    opacity: 0.9,
    marginBottom: 20,
  },
  
  contactDetails: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    flexWrap: "wrap",
  },
  
  contactEmail: {
    fontSize: "1.125rem",
    fontWeight: 500,
    margin: 0,
  },
  
  contactPhone: {
    fontSize: "1.125rem",
    fontWeight: 500,
    margin: 0,
  },
  
  footer: {
    textAlign: "center",
    padding: "24px 0 8px",
    borderTop: "1px solid #e2e8f0",
  },
  
  footerText: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: 0,
  },
};

// Add hover effect using JavaScript (optional)
// You can also add this with CSS modules or styled-components