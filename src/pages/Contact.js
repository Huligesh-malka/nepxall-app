import React from "react";
import { Phone, Mail, MapPin, Building2, Clock, MessageSquare } from 'lucide-react';

const Contact = () => {
  const contactInfo = [
    {
      icon: <Building2 size={24} />,
      label: "Company",
      value: "Nepxall",
      color: "#4f46e5"
    },
    {
      icon: <Mail size={24} />,
      label: "Support Email",
      value: "huligeshmalka@gmail.com",
      link: "mailto:huligeshmalka@gmail.com",
      color: "#059669"
    },
    {
      icon: <Phone size={24} />,
      label: "Phone",
      value: "+91 7483090510",
      link: "tel:+917483090510",
      color: "#dc2626"
    },
    {
      icon: <MapPin size={24} />,
      label: "Address",
      value: "Karnataka, India",
      color: "#7c3aed"
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>Get in Touch</h1>
        <p style={styles.subtitle}>
          We're here to help with any questions about bookings, payments, or refunds
        </p>
      </div>

      {/* Contact Info Grid */}
      <div style={styles.grid}>
        {contactInfo.map((info, index) => (
          <div key={index} style={styles.card}>
            <div style={{...styles.iconWrapper, backgroundColor: `${info.color}15`}}>
              <div style={{...styles.icon, color: info.color}}>
                {info.icon}
              </div>
            </div>
            <div style={styles.cardContent}>
              <span style={styles.cardLabel}>{info.label}</span>
              {info.link ? (
                <a 
                  href={info.link} 
                  style={{...styles.cardValue, color: info.color}}
                  className="hover-link"
                >
                  {info.value}
                </a>
              ) : (
                <span style={styles.cardValue}>{info.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Support Note */}
      <div style={styles.noteWrapper}>
        <div style={styles.noteIcon}>
          <MessageSquare size={24} color="#2563eb" />
        </div>
        <div style={styles.noteContent}>
          <h3 style={styles.noteTitle}>Need Assistance?</h3>
          <p style={styles.noteText}>
            For any booking, payment, or refund related queries, our support team is 
            available 24/7 to assist you. Don't hesitate to reach out!
          </p>
        </div>
      </div>

      {/* Business Hours */}
      <div style={styles.hoursSection}>
        <h3 style={styles.hoursTitle}>Business Hours</h3>
        <div style={styles.hoursGrid}>
          <div style={styles.hoursItem}>
            <Clock size={20} color="#4b5563" />
            <span>Monday - Friday: 9:00 AM - 6:00 PM</span>
          </div>
          <div style={styles.hoursItem}>
            <Clock size={20} color="#4b5563" />
            <span>Saturday: 10:00 AM - 4:00 PM</span>
          </div>
          <div style={styles.hoursItem}>
            <Clock size={20} color="#4b5563" />
            <span>Sunday: Closed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#111827",
    marginBottom: 16,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "1.125rem",
    color: "#6b7280",
    maxWidth: 600,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 24,
    marginBottom: 48,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
    border: "1px solid #f3f4f6",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#111827",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
  noteWrapper: {
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    padding: 32,
    marginBottom: 48,
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
    border: "1px solid #dbeafe",
  },
  noteIcon: {
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#1e40af",
    marginBottom: 8,
  },
  noteText: {
    fontSize: "1rem",
    color: "#1e3a8a",
    lineHeight: 1.6,
    margin: 0,
  },
  hoursSection: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 24,
  },
  hoursTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#111827",
    marginBottom: 16,
  },
  hoursGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  hoursItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: "1rem",
    color: "#4b5563",
  },
};

// Add hover effects with CSS
const style = document.createElement('style');
style.textContent = `
  .hover-link:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
  
  div[style*="card"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important;
  }
`;
document.head.appendChild(style);

export default Contact;