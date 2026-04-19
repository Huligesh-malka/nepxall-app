import React from "react";
import { Phone, Mail, MapPin, Building2, Clock, MessageSquare, ChevronRight, Headphones } from 'lucide-react';

const Contact = () => {
  const contactInfo = [
    {
      icon: <Building2 size={24} />,
      label: "Legal Name",
      value: "HULIGESH",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)"
    },
    {
      icon: <Mail size={24} />,
      label: "Support Email",
      value: "huligeshmalka@gmail.com",
      link: "mailto:huligeshmalka@gmail.com",
      gradient: "linear-gradient(135deg, #10b981, #059669)"
    },
    {
      icon: <Phone size={24} />,
      label: "Phone",
      value: "+91 7483090510",
      link: "tel:+917483090510",
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)"
    }
  ];

  return (
    <div style={styles.container}>
      {/* Decorative Elements */}
      <div style={styles.decorCircle1} />
      <div style={styles.decorCircle2} />
      <div style={styles.decorBlur1} />
      <div style={styles.decorBlur2} />
      
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.badge}>
            <Headphones size={14} style={styles.badgeIcon} />
            CONTACT US
          </span>
          <h1 style={styles.title}>
            Get in <span style={styles.titleHighlight}>Touch</span>
          </h1>
          <p style={styles.subtitle}>
            We're here to help with any questions about bookings, payments, or refunds
          </p>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div style={styles.grid}>
        {contactInfo.map((info, index) => (
          <div key={index} style={styles.cardWrapper}>
            <div style={styles.card}>
              <div style={{...styles.iconContainer, background: info.gradient}}>
                <div style={styles.icon}>
                  {info.icon}
                </div>
              </div>
              <div style={styles.cardContent}>
                <span style={styles.cardLabel}>{info.label}</span>
                {info.link ? (
                  <a 
                    href={info.link} 
                    style={styles.cardValue}
                    className="contact-link"
                  >
                    {info.value}
                    <ChevronRight size={16} style={styles.linkIcon} />
                  </a>
                ) : (
                  <span style={styles.cardValue}>{info.value}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assistance Note */}
      <div style={styles.noteWrapper}>
        <div style={styles.noteIconContainer}>
          <MessageSquare size={28} color="#2563eb" />
        </div>
        <div style={styles.noteContent}>
          <h3 style={styles.noteTitle}>Need Immediate Assistance?</h3>
          <p style={styles.noteText}>
            For any booking, payment, or refund related queries, our support team is 
            available 24/7 to assist you. We typically respond within 5-10 minutes.
          </p>
          <div style={styles.noteActions}>
            <a href="mailto:huligeshmalka@gmail.com" style={styles.noteButton}>
              <Mail size={18} />
              Email Us
            </a>
            <a href="tel:+917483090510" style={{...styles.noteButton, ...styles.noteButtonSecondary}}>
              <Phone size={18} />
              Call Now
            </a>
          </div>
        </div>
      </div>

      {/* Business Hours Section */}
      <div style={styles.hoursCard}>
        <div style={styles.hoursHeader}>
          <Clock size={24} color="#4f46e5" />
          <h3 style={styles.hoursTitle}>Business Hours</h3>
        </div>
        <div style={styles.hoursGrid}>
          <div style={styles.hoursItem}>
            <span style={styles.day}>Monday - Friday</span>
            <span style={styles.time}>9:00 AM - 6:00 PM</span>
          </div>
          <div style={styles.hoursItem}>
            <span style={styles.day}>Saturday</span>
            <span style={styles.time}>10:00 AM - 4:00 PM</span>
          </div>
          <div style={styles.hoursItem}>
            <span style={styles.day}>Sunday</span>
            <span style={{...styles.time, color: '#ef4444'}}>Closed</span>
          </div>
        </div>
        <div style={styles.timezone}>
          <span>Timezone: IST (UTC+5:30)</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "60px 24px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    top: "-100px",
    right: "-100px",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(124, 58, 237, 0.03))",
    zIndex: 0,
  },
  decorCircle2: {
    position: "absolute",
    bottom: "-150px",
    left: "-150px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(5, 150, 105, 0.03))",
    zIndex: 0,
  },
  decorBlur1: {
    position: "absolute",
    top: "20%",
    left: "-5%",
    width: "250px",
    height: "250px",
    borderRadius: "50%",
    background: "rgba(79, 70, 229, 0.04)",
    filter: "blur(60px)",
    zIndex: 0,
  },
  decorBlur2: {
    position: "absolute",
    bottom: "10%",
    right: "-5%",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.04)",
    filter: "blur(70px)",
    zIndex: 0,
  },
  header: {
    textAlign: "center",
    marginBottom: 60,
    position: "relative",
    zIndex: 1,
  },
  headerContent: {
    maxWidth: 600,
    margin: "0 auto",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 16px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.5px",
    borderRadius: "40px",
    marginBottom: 20,
  },
  badgeIcon: {
    marginRight: 4,
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 700,
    color: "#111827",
    marginBottom: 16,
    lineHeight: 1.2,
  },
  titleHighlight: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "clamp(0.875rem, 4vw, 1.125rem)",
    color: "#6b7280",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 24,
    marginBottom: 48,
    position: "relative",
    zIndex: 1,
  },
  cardWrapper: {
    transition: "transform 0.3s cubic-bezier(0.2, 0, 0, 1)",
    cursor: "pointer",
    "@media (hover: hover)": {
      ":hover": {
        transform: "translateY(-6px)",
      },
    },
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
    display: "flex",
    alignItems: "center",
    gap: 20,
    transition: "box-shadow 0.3s ease, border-color 0.3s ease",
    border: "1px solid rgba(0,0,0,0.04)",
    "@media (hover: hover)": {
      ":hover": {
        boxShadow: "0 20px 35px -12px rgba(79, 70, 229, 0.15)",
        borderColor: "rgba(79, 70, 229, 0.15)",
      },
    },
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px -6px rgba(0,0,0,0.1)",
    flexShrink: 0,
  },
  icon: {
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    display: "block",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: 500,
  },
  cardValue: {
    fontSize: "clamp(0.875rem, 4vw, 1.125rem)",
    fontWeight: 600,
    color: "#111827",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "color 0.2s ease",
    wordBreak: "break-word",
    "@media (hover: hover)": {
      ":hover": {
        color: "#4f46e5",
      },
      ":hover .contact-link-icon": {
        opacity: 1,
        transform: "translateX(0)",
      },
    },
  },
  linkIcon: {
    opacity: 0,
    transform: "translateX(-4px)",
    transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
  },
  noteWrapper: {
    background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
    padding: "clamp(24px, 5vw, 40px)",
    borderRadius: 28,
    marginBottom: 48,
    display: "flex",
    gap: "clamp(20px, 4vw, 32px)",
    alignItems: "center",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 1,
    border: "1px solid rgba(79, 70, 229, 0.1)",
  },
  noteIconContainer: {
    width: 72,
    height: 72,
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 20px -8px rgba(79, 70, 229, 0.25)",
    flexShrink: 0,
  },
  noteContent: {
    flex: 1,
    minWidth: 200,
  },
  noteTitle: {
    fontSize: "clamp(1.125rem, 4vw, 1.5rem)",
    fontWeight: 600,
    color: "#1e40af",
    marginBottom: 8,
  },
  noteText: {
    fontSize: "clamp(0.875rem, 3.5vw, 1rem)",
    color: "#1e3a8a",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  noteActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  noteButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    textDecoration: "none",
    borderRadius: 40,
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.25s ease",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    "@media (hover: hover)": {
      ":hover": {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        transform: "translateY(-2px)",
        borderColor: "#4f46e5",
      },
    },
  },
  noteButtonSecondary: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    "@media (hover: hover)": {
      ":hover": {
        backgroundColor: "#4338ca",
        transform: "translateY(-2px)",
      },
    },
  },
  hoursCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: "clamp(24px, 5vw, 32px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,0,0,0.04)",
    position: "relative",
    zIndex: 1,
    maxWidth: 500,
    margin: "0 auto",
    width: "100%",
  },
  hoursHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  hoursTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#111827",
  },
  hoursGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 24,
  },
  hoursItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 12,
    borderBottom: "1px solid #f3f4f6",
  },
  day: {
    color: "#4b5563",
    fontWeight: 500,
    fontSize: "0.9375rem",
  },
  time: {
    color: "#111827",
    fontWeight: 600,
    fontSize: "0.9375rem",
  },
  timezone: {
    padding: "12px 16px",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    fontSize: "0.8125rem",
    color: "#6b7280",
    textAlign: "center",
  },
};

// Add hover styles using a style tag since React inline styles don't support pseudo-classes fully
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .contact-link:hover .contact-link-icon {
    opacity: 1;
    transform: translateX(0);
  }
  .contact-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  @media (max-width: 640px) {
    .contact-card-wrapper {
      transform: none !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Contact;