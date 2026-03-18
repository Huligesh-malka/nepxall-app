import React from "react";
import { Phone, Mail, MapPin, Building2, Clock, MessageSquare } from 'lucide-react';

const Contact = () => {
  const contactInfo = [
    {
      icon: <Building2 size={24} />,
      label: "Legal Name",
      value: "HULIGESH", // ✅ IMPORTANT CHANGE
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
      <div style={styles.header}>
        <h1 style={styles.title}>Get in Touch</h1>
        <p style={styles.subtitle}>
          We're here to help with any questions about bookings, payments, or refunds
        </p>
      </div>

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

      <div style={styles.noteWrapper}>
        <div style={styles.noteIcon}>
          <MessageSquare size={24} color="#2563eb" />
        </div>
        <div style={styles.noteContent}>
          <h3 style={styles.noteTitle}>Need Assistance?</h3>
          <p style={styles.noteText}>
            For any booking, payment, or refund related queries, our support team is 
            available 24/7 to assist you.
          </p>
        </div>
      </div>

      <div style={styles.hoursSection}>
        <h3 style={styles.hoursTitle}>Business Hours</h3>
        <div style={styles.hoursGrid}>
          <div style={styles.hoursItem}>
            <Clock size={20} />
            <span>Monday - Friday: 9:00 AM - 6:00 PM</span>
          </div>
          <div style={styles.hoursItem}>
            <Clock size={20} />
            <span>Saturday: 10:00 AM - 4:00 PM</span>
          </div>
          <div style={styles.hoursItem}>
            <Clock size={20} />
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
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#ffffff",
  },
  header: { textAlign: "center", marginBottom: 48 },
  title: { fontSize: "2.5rem", fontWeight: 700, color: "#111827" },
  subtitle: { fontSize: "1.125rem", color: "#6b7280" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 24,
    marginBottom: 48,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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
  },
  cardContent: { flex: 1 },
  cardLabel: { fontSize: "0.8rem", color: "#9ca3af" },
  cardValue: { fontSize: "1.1rem", fontWeight: 600 },
  noteWrapper: {
    backgroundColor: "#eff6ff",
    padding: 24,
    borderRadius: 16,
    marginBottom: 40,
    display: "flex",
    gap: 20,
  },
  noteTitle: { color: "#1e40af" },
  noteText: { color: "#1e3a8a" },
  hoursSection: {
    backgroundColor: "#f9fafb",
    padding: 24,
    borderRadius: 16,
  }
};

export default Contact;