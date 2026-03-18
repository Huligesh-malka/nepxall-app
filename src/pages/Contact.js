import React from "react";
import { Phone, Mail, MapPin, Building2, Clock, MessageSquare, ChevronRight } from 'lucide-react';

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
    },
    {
      icon: <MapPin size={24} />,
      label: "Address",
      value: "Karnataka, India",
      gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)"
    }
  ];

  return (
    <div style={styles.container}>
      {/* Decorative Elements */}
      <div style={styles.decorCircle1} />
      <div style={styles.decorCircle2} />
      
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.badge}>CONTACT US</span>
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

      {/* Business Hours & Map */}
      <div style={styles.footerSection}>
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

        <div style={styles.mapCard}>
          <div style={styles.mapPlaceholder}>
            <MapPin size={32} color="#4f46e5" />
            <h4 style={styles.mapTitle}>Visit Our Office</h4>
            <p style={styles.mapAddress}>Karnataka, India - 560001</p>
            <a 
              href="https://maps.google.com/?q=Karnataka+India" 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.mapLink}
            >
              Get Directions
              <ChevronRight size={16} />
            </a>
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
    display: "inline-block",
    padding: "6px 12px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.5px",
    borderRadius: "20px",
    marginBottom: 16,
  },
  title: {
    fontSize: "3rem",
    fontWeight: 700,
    color: "#111827",
    marginBottom: 16,
    lineHeight: 1.2,
  },
  titleHighlight: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.125rem",
    color: "#6b7280",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 24,
    marginBottom: 48,
    position: "relative",
    zIndex: 1,
  },
  cardWrapper: {
    transition: "transform 0.3s ease",
    cursor: "pointer",
    ":hover": {
      transform: "translateY(-5px)",
    },
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    gap: 20,
    transition: "all 0.3s ease",
    border: "1px solid rgba(0,0,0,0.05)",
    ":hover": {
      boxShadow: "0 20px 40px rgba(79, 70, 229, 0.1)",
      borderColor: "rgba(79, 70, 229, 0.2)",
    },
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
  },
  icon: {
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    display: "block",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardValue: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#111827",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "color 0.3s ease",
    ":hover": {
      color: "#4f46e5",
    },
  },
  linkIcon: {
    opacity: 0,
    transform: "translateX(-5px)",
    transition: "all 0.3s ease",
  },
  noteWrapper: {
    background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
    padding: 40,
    borderRadius: 24,
    marginBottom: 48,
    display: "flex",
    gap: 32,
    alignItems: "center",
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
    boxShadow: "0 10px 20px rgba(79, 70, 229, 0.2)",
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#1e40af",
    marginBottom: 8,
  },
  noteText: {
    fontSize: "1rem",
    color: "#1e3a8a",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  noteActions: {
    display: "flex",
    gap: 12,
  },
  noteButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    textDecoration: "none",
    borderRadius: 12,
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.3s ease",
    border: "1px solid #4f46e5",
    ":hover": {
      backgroundColor: "#4f46e5",
      color: "#ffffff",
      transform: "translateY(-2px)",
    },
  },
  noteButtonSecondary: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    ":hover": {
      backgroundColor: "#4338ca",
    },
  },
  footerSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 24,
    position: "relative",
    zIndex: 1,
  },
  hoursCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.05)",
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
    marginBottom: 20,
  },
  hoursItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottom: "1px solid #f3f4f6",
  },
  day: {
    color: "#4b5563",
    fontWeight: 500,
  },
  time: {
    color: "#111827",
    fontWeight: 600,
  },
  timezone: {
    padding: "12px 16px",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    fontSize: "0.875rem",
    color: "#6b7280",
    textAlign: "center",
  },
  mapCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.05)",
  },
  mapPlaceholder: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 12,
  },
  mapTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#111827",
  },
  mapAddress: {
    color: "#6b7280",
    marginBottom: 16,
  },
  mapLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    color: "#4f46e5",
    textDecoration: "none",
    borderRadius: 8,
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.3s ease",
    ":hover": {
      backgroundColor: "#eef2ff",
      gap: 8,
    },
  },
};

export default Contact;