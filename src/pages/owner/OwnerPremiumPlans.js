import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../../api/api";

/* ================= PLAN DATA ================= */

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: "₹0",
    priceSuffix: "forever",
    listingLimit: 1,
    photos: 10,
    videos: 1,
    featured: "No Featured",
    icon: "🎁",
    color: "#64748b"
  },
  {
    id: "basic",
    name: "Basic Plan ⭐",
    price: "₹199",
    priceSuffix: "/month",
    listingLimit: 3,
    photos: 15,
    videos: 2,
    featured: "7 Days Featured",
    icon: "🚀",
    color: "#3b82f6",
    highlight: true // MOST POPULAR
  },
  {
    id: "pro",
    name: "Pro Plan 🚀",
    price: "₹599",
    priceSuffix: "/month",
    listingLimit: 10,
    photos: 20,
    videos: 3,
    featured: "30 Days Featured",
    icon: "⭐",
    color: "#8b5cf6"
  }
];

export default function OwnerPremiumPlans() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  
  const [currentPlan, setCurrentPlan] = useState("free");
  const [pageLoading, setPageLoading] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    if (!user) return;
    
    try {
      setPageLoading(true);
      const res = await api.get("/owner/current-plan");
      setCurrentPlan(res.data.plan || "free");
      setSelectedPlan(res.data.plan || "free");
    } catch {
      setCurrentPlan("free");
      setSelectedPlan("free");
    } finally {
      setPageLoading(false);
    }
  };

  /* ================= AUTH + LOAD ================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const buyPlan = async (planId) => {
    if (planId === currentPlan) return;

    try {
      setPageLoading(true);
      await api.post("/owner/buy-plan", { plan: planId });
      
      // Show success message
      const plan = plans.find(p => p.id === planId);
      showNotification(`✨ ${plan.name} activated successfully!`, "success");
      
      setCurrentPlan(planId);
      setSelectedPlan(planId);
    } catch (err) {
      showNotification("❌ Payment failed. Please try again.", "error");
    } finally {
      setPageLoading(false);
    }
  };

  const showNotification = (message, type) => {
    // Simple alert for now - you can replace with a toast component
    alert(message);
  };

  const getSavingsBadge = (planId) => {
    if (planId === "pro") return "Save 20%";
    return null;
  };

  /* ================= PROTECTION ================= */
  if (authLoading || pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.badge}>PRICING</span>
          <h1 style={styles.title}>
            Choose Your <span style={styles.gradientText}>Perfect Plan</span>
          </h1>
          <p style={styles.subtitle}>
            Scale your PG business with our flexible pricing plans. 
            Upgrade anytime to unlock more features.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div style={styles.grid}>
        {plans.map((plan, index) => {
          const isCurrent = currentPlan === plan.id;
          const isHovered = hoveredPlan === plan.id;
          const savings = getSavingsBadge(plan.id);

          return (
            <div
              key={plan.id}
              style={{
                ...styles.card,
                ...(plan.highlight && styles.popularCard),
                ...(isHovered && styles.cardHover),
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
              }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {/* Popular Badge */}
              {plan.highlight && (
                <div style={styles.popularBadge}>
                  <span style={styles.popularBadgeText}>🔥 MOST POPULAR</span>
                </div>
              )}

              {/* Savings Badge */}
              {savings && !plan.highlight && (
                <div style={styles.savingsBadge}>
                  <span style={styles.savingsBadgeText}>{savings}</span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div style={styles.currentBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Current Plan</span>
                </div>
              )}

              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div style={{
                  ...styles.iconContainer,
                  backgroundColor: `${plan.color}15`,
                  color: plan.color
                }}>
                  <span style={styles.icon}>{plan.icon}</span>
                </div>
                <h3 style={styles.planName}>{plan.name}</h3>
              </div>

              {/* Price */}
              <div style={styles.priceContainer}>
                <span style={styles.price}>{plan.price}</span>
                <span style={styles.priceSuffix}>{plan.priceSuffix}</span>
              </div>

              {/* Features - UPDATED: Only Listing, Photos, Videos, Featured */}
              <div style={styles.features}>
                <div style={styles.featureItem}>
                  <svg style={styles.featureIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span><b>{plan.listingLimit}</b> Listings (PG / Coliving / To-Let)</span>
                </div>
                <div style={styles.featureItem}>
                  <svg style={styles.featureIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span><b>{plan.photos}</b> Photos per listing</span>
                </div>
                <div style={styles.featureItem}>
                  <svg style={styles.featureIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span><b>{plan.videos}</b> Videos per listing</span>
                </div>
                <div style={styles.featureItem}>
                  <svg style={styles.featureIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{plan.featured}</span>
                </div>
              </div>

              {/* Action Button */}
              {isCurrent ? (
                <button style={styles.currentButton} disabled>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Active Plan</span>
                </button>
              ) : (
                <button
                  onClick={() => buyPlan(plan.id)}
                  disabled={pageLoading}
                  style={{
                    ...styles.upgradeButton,
                    ...(isHovered && styles.upgradeButtonHover),
                    backgroundColor: plan.highlight ? plan.color : '#fff',
                    color: plan.highlight ? '#fff' : plan.color,
                    border: plan.highlight ? 'none' : `2px solid ${plan.color}`
                  }}
                >
                  {pageLoading ? (
                    <div style={styles.loadingSpinner}>
                      <div style={styles.spinner}></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <span>Choose {plan.name}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Guarantee Section */}
      <div style={styles.guaranteeSection}>
        <div style={styles.guaranteeGrid}>
          <div style={styles.guaranteeItem}>
            <div style={styles.guaranteeIcon}>🔒</div>
            <h4 style={styles.guaranteeTitle}>Secure Payment</h4>
            <p style={styles.guaranteeText}>256-bit SSL encrypted</p>
          </div>
          <div style={styles.guaranteeItem}>
            <div style={styles.guaranteeIcon}>⏱️</div>
            <h4 style={styles.guaranteeTitle}>Cancel Anytime</h4>
            <p style={styles.guaranteeText}>No contracts, no fees</p>
          </div>
          <div style={styles.guaranteeItem}>
            <div style={styles.guaranteeIcon}>💬</div>
            <h4 style={styles.guaranteeTitle}>24/7 Support</h4>
            <p style={styles.guaranteeText}>We're here to help</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ================= MODERN STYLES ================= */

const styles = {
  container: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "100vh"
  },

  header: {
    textAlign: "center",
    marginBottom: 60
  },

  headerContent: {
    maxWidth: 600,
    margin: "0 auto"
  },

  badge: {
    display: "inline-block",
    padding: "6px 12px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
    marginBottom: 16
  },

  title: {
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: 800,
    margin: "0 0 16px 0",
    color: "#1e293b",
    lineHeight: 1.2
  },

  gradientText: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },

  subtitle: {
    fontSize: 18,
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 30,
    marginBottom: 60
  },

  card: {
    background: "#fff",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    position: "relative",
    opacity: 0,
    transform: "translateY(20px)",
    border: "1px solid rgba(0,0,0,0.05)"
  },

  popularCard: {
    transform: "scale(1.02)",
    boxShadow: "0 20px 60px rgba(102, 126, 234, 0.25)",
    border: "2px solid #667eea"
  },

  cardHover: {
    transform: "translateY(-8px)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.12)"
  },

  popularBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "8px 20px",
    borderRadius: 30,
    boxShadow: "0 10px 20px rgba(102, 126, 234, 0.3)"
  },

  popularBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.5
  },

  savingsBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    padding: "4px 12px",
    borderRadius: 20,
    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"
  },

  savingsBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 600
  },

  currentBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    background: "#10b981",
    padding: "6px 12px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"
  },

  cardHeader: {
    marginBottom: 24,
    marginTop: 20
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },

  icon: {
    fontSize: 28
  },

  planName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0
  },

  priceContainer: {
    marginBottom: 24,
    display: "flex",
    alignItems: "baseline",
    gap: 4
  },

  price: {
    fontSize: 36,
    fontWeight: 800,
    color: "#1e293b"
  },

  priceSuffix: {
    fontSize: 16,
    color: "#64748b"
  },

  features: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 32,
    minHeight: 240
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 15,
    color: "#334155"
  },

  featureIcon: {
    flexShrink: 0
  },

  upgradeButton: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#fff",
    border: "2px solid",
    outline: "none"
  },

  upgradeButtonHover: {
    transform: "scale(1.02)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
  },

  currentButton: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    background: "#10b981",
    color: "#fff",
    border: "none",
    cursor: "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },

  loadingSpinner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },

  spinner: {
    width: 20,
    height: 20,
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  guaranteeSection: {
    background: "#fff",
    borderRadius: 24,
    padding: 40,
    boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
    marginTop: 40
  },

  guaranteeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 30,
    textAlign: "center"
  },

  guaranteeItem: {
    padding: "20px"
  },

  guaranteeIcon: {
    fontSize: 32,
    marginBottom: 16
  },

  guaranteeTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1e293b",
    margin: "0 0 8px 0"
  },

  guaranteeText: {
    fontSize: 14,
    color: "#64748b",
    margin: 0
  }
};