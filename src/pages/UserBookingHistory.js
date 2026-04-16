import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import api from "../api/api";

const UserBookingHistory = () => {
  const navigate = useNavigate();
  
  // ✅ USE ONLY THIS - No localStorage.getItem("user_id")
  const { user, role, loading: authLoading } = useAuth();

  // State management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [submittingPayment, setSubmittingPayment] = useState(false); // New state for payment submission loading
  
  // Track submitted payments to prevent multiple submissions
  const [submittedPayments, setSubmittedPayments] = useState({});

  // Filter bookings based on active tab
  const filteredBookings = useMemo(() => {
    if (activeTab === "all") return bookings;
    if (activeTab === "pending") return bookings.filter(b => b.status === "pending");
    if (activeTab === "approved") return bookings.filter(b => b.status === "approved");
    if (activeTab === "confirmed") return bookings.filter(b => b.status === "confirmed");
    if (activeTab === "left") return bookings.filter(b => b.status === "left");
    return bookings;
  }, [bookings, activeTab]);

  // Load bookings
  const loadBookings = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      
      const res = await api.get("/bookings/user/history");
      setBookings(res.data || []);
      
      if (res.data && res.data.length > 0) {
        await checkAllPaymentStatuses([...res.data]);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError(err.response?.data?.message || "Failed to load booking history");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Check payment status
  const checkAllPaymentStatuses = useCallback(async (bookingsList) => {
    try {
      const statusMap = { ...paymentStatuses };
      
      await Promise.all(bookingsList.map(async (booking) => {
        try {
          const res = await api.get(`/payments/status/${booking.id}`);
          if (res.data.success && res.data.data) {
            statusMap[booking.id] = res.data.data.status;
          }
        } catch (err) {
          console.log(`No payment found for booking ${booking.id}`);
        }
      }));
      
      setPaymentStatuses({ ...statusMap });
    } catch (err) {
      console.error("Error checking payment statuses:", err);
    }
  }, [paymentStatuses]);

  // 🔥 AUTO REFRESH PAYMENT STATUS - Added as requested
  useEffect(() => {
    if (!bookings.length) return;

    const interval = setInterval(() => {
      checkAllPaymentStatuses(bookings);
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [bookings, checkAllPaymentStatuses]);

  // Initial load
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Create payment
  const handlePayNow = useCallback(async (booking) => {
  try {
    setPayingId(booking.id);
    setError("");

    // 👉 ASK USER (Agreement Optional)
    const includeAgreement = window.confirm(
      "Do you want to include Agreement?\n\n₹500 extra will be added."
    );

    const rent = Number(booking.rent_amount || 0);
    const deposit = Number(booking.security_deposit || 0);
    const maintenance = Number(booking.maintenance_amount || 0);

    let total = rent + deposit + maintenance;

    if (includeAgreement) {
      total += 500; // 👉 Agreement fee
    }

    if (!total || total <= 0) {
      throw new Error("Invalid payment amount");
    }

    // 🔥 SEND agreement flag to backend
    const res = await api.post("/payments/create-payment", {
      bookingId: booking.id,
      includeAgreement // 👈 IMPORTANT
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Payment initialization failed");
    }

    setPaymentData({
      qr: res.data.qr,
      upiLink: res.data.upiLink,
      orderId: res.data.orderId,
      amount: total, // 👈 UPDATED AMOUNT
      bookingId: booking.id,
      agreement: includeAgreement
    });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    setError(err.message || "Payment initialization failed");
  } finally {
    setPayingId(null);
  }
}, []);

  // Submit payment - I HAVE PAID button
  const submitPayment = useCallback(async () => {
    if (!paymentData) return;
    
    // Check if already submitted
    if (submittedPayments[paymentData.bookingId]) {
      alert("Payment already submitted for this booking. Please wait for verification.");
      return;
    }

    try {
      setSubmittingPayment(true);
      setError("");

      // Mark as submitted immediately
      setSubmittedPayments(prev => ({
        ...prev,
        [paymentData.bookingId]: true
      }));

      // Update payment status locally
      setPaymentStatuses(prev => ({
        ...prev,
        [paymentData.bookingId]: "submitted"
      }));

      // Close modal
      setPaymentData(null);
      
      // Show success message
      alert("✅ Payment submitted successfully!\n\n⏳ Please wait 5 minutes for admin verification.\nThe status will update automatically.");
      
      // Refresh bookings to get latest status
      setTimeout(() => {
        loadBookings(false);
      }, 1000);
      
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit payment");
      // Remove submitted flag on error
      setSubmittedPayments(prev => {
        const newState = { ...prev };
        delete newState[paymentData.bookingId];
        return newState;
      });
    } finally {
      setSubmittingPayment(false);
    }
  }, [paymentData, submittedPayments, loadBookings]);

  // Refresh QR
  const refreshQR = useCallback(async () => {
    if (!paymentData) return;
    
    try {
      setRefreshing(true);
      setError("");
      
      const res = await api.post("/payments/create-payment", {
        bookingId: paymentData.bookingId
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to refresh QR");
      }

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: paymentData.amount,
        bookingId: paymentData.bookingId
      });
      
    } catch (err) {
      console.error("REFRESH QR ERROR:", err);
      setError(err.message || "Failed to refresh QR code");
    } finally {
      setRefreshing(false);
    }
  }, [paymentData]);

  // Close modal
  const closeModal = useCallback(() => {
    setPaymentData(null);
    setError("");
  }, []);

  // Get payment status
  const getPaymentStatusDisplay = useCallback((bookingId, bookingStatus) => {
    const status = paymentStatuses[bookingId];
    
    if (!status) {
      return {
        showPayButton: bookingStatus === "approved",
        showAgreementButton: false,
        message: null,
        badge: null,
        canPay: bookingStatus === "approved"
      };
    }

    switch(status) {
      case "paid":
        return {
          showPayButton: false,
          showAgreementButton: true,
          message: "✅ Payment verified! You can now fill the agreement form.",
          badge: { text: "Payment Verified", style: "paid" },
          canPay: false
        };
      
      case "submitted":
        return {
          showPayButton: false,
          showAgreementButton: false,
          message: "⏳ Payment submitted! Waiting for admin verification (5-10 minutes).",
          badge: { text: "Pending Verification", style: "submitted" },
          canPay: false
        };
      
      case "rejected":
        return {
          showPayButton: true,
          showAgreementButton: false,
          message: "❌ Payment was rejected. Please try again.",
          badge: { text: "Payment Rejected", style: "rejected" },
          canPay: true
        };
      
      case "pending":
        return {
          showPayButton: true,
          showAgreementButton: false,
          message: "💳 Payment pending. Click 'Pay Now' to complete payment.",
          badge: { text: "Payment Pending", style: "pending" },
          canPay: true
        };
      
      default:
        return {
          showPayButton: bookingStatus === "approved",
          showAgreementButton: false,
          message: null,
          badge: null,
          canPay: bookingStatus === "approved"
        };
    }
  }, [paymentStatuses]);

  // Handle agreement form navigation
  const handleFillAgreement = useCallback((bookingId) => {
    navigate(`/agreement-form/${bookingId}`);
  }, [navigate]);

  // ✅ PROTECTION - MOVED AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading authentication...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your bookings...</p>
      </div>
    );
  }

  // Error state
  if (error && !bookings.length) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.retryBtn} onClick={() => loadBookings()}>
          Try Again
        </button>
      </div>
    );
  }

  // KPI Data
  const totalBookings = bookings.length;
  const approvedBookings = bookings.filter(b => b.status === "approved").length;
  const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || Number(b.rent_amount) || 0), 0);

  return (
    <div style={styles.container}>
      {/* Animated Background Elements */}
      <div style={styles.bgGlow1}></div>
      <div style={styles.bgGlow2}></div>
      
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Bookings</h1>
        <p style={styles.subtitle}>Manage your property bookings and payments</p>
      </div>

      {/* KPI Section - Startup Style */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIcon}>🏠</div>
          <div>
            <h3 style={styles.kpiValue}>{totalBookings}</h3>
            <p style={styles.kpiLabel}>Total Bookings</p>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIcon}>✅</div>
          <div>
            <h3 style={styles.kpiValue}>{approvedBookings}</h3>
            <p style={styles.kpiLabel}>Approved</p>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIcon}>💰</div>
          <div>
            <h3 style={styles.kpiValue}>₹{totalSpent.toLocaleString()}</h3>
            <p style={styles.kpiLabel}>Total Spent</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {bookings.length > 0 && (
        <div style={styles.tabsContainer}>
          {["all", "pending", "approved", "confirmed", "left"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.activeTab : {})
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={styles.tabCount}>
                {bookings.filter(b => tab === "all" ? true : b.status === tab).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏠</div>
          <h3 style={styles.emptyTitle}>No bookings found</h3>
          <p style={styles.emptyText}>Start your journey by browsing our properties</p>
          <button 
            style={styles.browseBtn} 
            onClick={() => navigate("/")}
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div style={styles.bookingsGrid}>
          {filteredBookings.map((booking, idx) => {
            const rent = Number(booking.rent_amount || booking.rent || 0);
            const deposit = Number(booking.security_deposit || 0);
            const maintenance = Number(booking.maintenance_amount || 0);
            const total = Number(booking.total_amount) || rent + deposit + maintenance;
            
            const paymentDisplay = getPaymentStatusDisplay(booking.id, booking.status);
            
            // Simple Pay Button Logic
            const paymentStatus = paymentStatuses[booking.id];
            
            const showPayButton =
              booking.status === "approved" &&
              paymentStatus !== "paid" &&
              paymentStatus !== "submitted";

            return (
              <div key={booking.id} style={{...styles.card, animationDelay: `${idx * 0.05}s`}}>
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.pgName}>{booking.pg_name || "Property Name"}</h3>
                    <p style={styles.pgLocation}>{booking.location || "Location not specified"}</p>
                  </div>
                  <div style={styles.badgeGroup}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(booking.status === "confirmed" ? styles.statusConfirmed :
                         booking.status === "approved" ? styles.statusApproved :
                         booking.status === "left" ? styles.statusLeft :
                         styles.statusPending)
                    }}>
                      {booking.status}
                    </span>
                    {paymentDisplay.badge && (
                      <span style={{
                        ...styles.paymentBadge,
                        ...styles[`paymentBadge${paymentDisplay.badge.style}`]
                      }}>
                        {paymentDisplay.badge.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div style={styles.cardContent}>
                  {/* Details Grid */}
                  <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>📞</span>
                      <div>
                        <span style={styles.detailLabel}>Contact</span>
                        <span style={styles.detailValue}>{booking.phone || "N/A"}</span>
                      </div>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>📅</span>
                      <div>
                        <span style={styles.detailLabel}>Check-in</span>
                        <span style={styles.detailValue}>
                          {booking.check_in_date
                            ? new Date(booking.check_in_date).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailIcon}>🛏️</span>
                      <div>
                        <span style={styles.detailLabel}>Room Type</span>
                        <span style={styles.detailValue}>{booking.room_type || "Single"}</span>
                      </div>
                    </div>
                    {booking.room_no && (
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>🚪</span>
                        <div>
                          <span style={styles.detailLabel}>Room No</span>
                          <span style={styles.detailValue}>{booking.room_no}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div style={styles.priceSection}>
                    {rent > 0 && (
                      <div style={styles.priceRow}>
                        <span>Rent</span>
                        <span>₹{rent.toLocaleString()}</span>
                      </div>
                    )}

                    {deposit > 0 && (
                      <div style={styles.priceRow}>
                        <span>Security Deposit</span>
                        <span>₹{deposit.toLocaleString()}</span>
                      </div>
                    )}

                    {maintenance > 0 && (
                      <div style={styles.priceRow}>
                        <span>Maintenance</span>
                        <span>₹{maintenance.toLocaleString()}</span>
                      </div>
                    )}

                    <div style={styles.totalPrice}>
                      <span>Total Amount</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Message if any */}
                  {paymentDisplay.message && (
                    <div style={{
                      ...styles.messageBox,
                      ...styles[`messageBox${paymentDisplay.badge?.style}`]
                    }}>
                      {paymentDisplay.message}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={styles.actionGroup}>
                    <div style={styles.actionButtons}>
                      <button
                        style={styles.iconButton}
                        onClick={() => navigate(`/pg/${booking.pg_id}`)}
                        title="View Property"
                      >
                        <span style={styles.buttonIcon}>🏠</span>
                        <span>View</span>
                      </button>
                      <button
                        style={styles.iconButton}
                        onClick={() => navigate(`/chat/private/${booking.owner_id}/${booking.pg_id}`)}
                        title="Chat with Owner"
                      >
                        <span style={styles.buttonIcon}>💬</span>
                        <span>Chat</span>
                      </button>
                      <button
                        style={styles.iconButton}
                        onClick={() => navigate(`/agreement/${booking.id}`)}
                        title="View Agreement"
                      >
                        <span style={styles.buttonIcon}>📄</span>
                        <span>View</span>
                      </button>
                      <button
                        style={styles.iconButton}
                        onClick={() => navigate(`/user/services/${booking.id}`)}
                        title="Add Services"
                      >
                        <span style={styles.buttonIcon}>🚚</span>
                        <span>Services</span>
                      </button>
                    </div>

                    <div style={styles.actionRow}>
                      {showPayButton && (
                        <button
                          style={styles.payButton}
                          onClick={() => handlePayNow(booking)}
                          disabled={payingId === booking.id}
                        >
                          {payingId === booking.id ? (
                            <>
                              <span style={styles.buttonSpinner}></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <span>💳</span>
                              Pay ₹{total.toLocaleString()}
                            </>
                          )}
                        </button>
                      )}

                      {/* Fill Agreement Button - Shows only when payment is verified */}
                      {paymentDisplay.showAgreementButton && (
                        <button
                          style={styles.agreementButton}
                          onClick={() => handleFillAgreement(booking.id)}
                          title="Fill Agreement Form"
                        >
                          <span style={styles.buttonIcon}>📝</span>
                          <span>Fill Agreement</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* LEFT STATUS UI */}
                  {booking.status === "left" && (
                    <div style={styles.leftStatusBox}>
                      🚪 You have vacated - You can book again
                    </div>
                  )}

                  {/* Confirmed Badge */}
                  {booking.status === "confirmed" && paymentStatuses[booking.id] === "paid" && (
                    <div style={styles.confirmedBadge}>
                      <span>✅</span>
                      <span>Booking Confirmed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal - Premium Redesign */}
      {paymentData && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Complete Payment</h2>
              <button style={styles.modalClose} onClick={closeModal}>×</button>
            </div>

            {/* Amount */}
            <div style={styles.modalAmountSection}>
              <div style={styles.modalAmount}>
                <span style={styles.modalAmountLabel}>Amount to Pay</span>
                <span style={styles.modalAmountValue}>₹{paymentData.amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Order ID */}
            <div style={styles.orderIdSection}>
              <span style={styles.orderIdLabel}>Order ID:</span>
              <code style={styles.orderIdValue}>{paymentData.orderId}</code>
              <button 
                style={styles.copyButton}
                onClick={() => {
                  navigator.clipboard.writeText(paymentData.orderId);
                  alert("Order ID copied!");
                }}
                title="Copy Order ID"
              >
                📋
              </button>
            </div>

            {/* Account Details */}
            <div style={styles.accountDetails}>
              <div style={styles.accountIcon}>🏦</div>
              <div style={styles.accountInfo}>
                <div style={styles.accountRow}>
                  <span>UPI ID:</span>
                  <strong>huligeshmalka-1@oksbi</strong>
                </div>
                <div style={styles.accountRow}>
                  <span>Account:</span>
                  <strong>Huligesh Malka</strong>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div style={styles.qrSection}>
              <img 
                src={paymentData.qr} 
                alt="Payment QR Code" 
                style={styles.qrImage}
              />
              <a
                href={paymentData.upiLink}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.upiButton}
              >
                <span>📱</span>
                Open in UPI App
              </a>
            </div>

            {/* I HAVE PAID Button */}
            <div style={styles.modalActions}>
              <button
                style={styles.submitButton}
                onClick={submitPayment}
                disabled={submittedPayments[paymentData.bookingId] || submittingPayment}
              >
                {submittingPayment ? (
                  <>
                    <span style={styles.buttonSpinner}></span>
                    Submitting...
                  </>
                ) : submittedPayments[paymentData.bookingId] ? (
                  <>
                    <span>⏳</span>
                    Payment Submitted - Waiting for Verification
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    I HAVE PAID
                  </>
                )}
              </button>
            </div>

            {/* Wait Message */}
            <div style={styles.waitMessageBox}>
              <span>⏰</span>
              <div>
                <strong>After payment:</strong>
                <p>Click "I HAVE PAID" and wait 5 minutes for admin verification. Status will update automatically.</p>
              </div>
            </div>

            {/* Warning - Don't Pay Multiple Times */}
            <div style={styles.warningBox}>
              <span>⚠️</span>
              <span>Pay only once! Multiple payments will be rejected.</span>
            </div>

            {/* Refresh QR Button */}
            <div style={styles.refreshSection}>
              <button
                style={styles.refreshButton}
                onClick={refreshQR}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <span style={styles.buttonSpinner}></span>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <span>⟳</span>
                    Refresh QR Code
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyframe Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `}
      </style>
    </div>
  );
};

// Premium Startup-Level Styles
const styles = {
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "40px 24px",
    minHeight: "100vh",
    background: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15), transparent 40%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.15), transparent 40%), linear-gradient(135deg, #0a0a0f, #13131f)",
    position: "relative",
    overflowX: "hidden",
  },
  
  bgGlow1: {
    position: "fixed",
    top: "10%",
    left: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  
  bgGlow2: {
    position: "fixed",
    bottom: "10%",
    right: "-20%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 0,
    pointerEvents: "none",
  },
  
  header: {
    textAlign: "center",
    marginBottom: 48,
    position: "relative",
    zIndex: 2,
  },
  
  title: {
    fontSize: "clamp(36px, 6vw, 56px)",
    fontWeight: 900,
    background: "linear-gradient(135deg, #ffffff, #a5b4fc, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: 12,
    letterSpacing: "-0.02em",
  },
  
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 400,
  },
  
  // KPI Row Styles
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
    marginBottom: 40,
    position: "relative",
    zIndex: 2,
  },
  
  kpiCard: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    borderRadius: 28,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "all 0.3s ease",
    ":hover": {
      transform: "translateY(-4px)",
      background: "rgba(255,255,255,0.08)",
      borderColor: "rgba(255,255,255,0.2)",
    }
  },
  
  kpiIcon: {
    width: 48,
    height: 48,
    background: "rgba(99,102,241,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },
  
  kpiValue: {
    fontSize: "clamp(24px, 4vw, 32px)",
    fontWeight: 800,
    color: "#fff",
    margin: 0,
    lineHeight: 1.2,
  },
  
  kpiLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  
  tabsContainer: {
    display: "flex",
    gap: 12,
    marginBottom: 40,
    flexWrap: "wrap",
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },
  
  tab: {
    padding: "10px 24px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999,
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: 8,
    ":hover": {
      background: "rgba(255,255,255,0.1)",
      transform: "translateY(-2px)",
      borderColor: "rgba(255,255,255,0.3)",
    }
  },
  
  activeTab: {
    background: "#fff",
    color: "#1f2937",
    borderColor: "#fff",
    boxShadow: "0 8px 25px rgba(255,255,255,0.15)",
  },
  
  tabCount: {
    background: "rgba(0,0,0,0.1)",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 11,
    marginLeft: 4,
  },
  
  bookingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: 28,
    position: "relative",
    zIndex: 2,
  },
  
  card: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    borderRadius: 32,
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    transition: "all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
    border: "1px solid rgba(255,255,255,0.1)",
    animation: "slideIn 0.5s ease-out forwards",
    opacity: 0,
    animationFillMode: "forwards",
    ":hover": {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 30px 60px -12px rgba(0,0,0,0.7)",
      borderColor: "rgba(255,255,255,0.2)",
    }
  },
  
  cardHeader: {
    padding: "24px 24px",
    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  
  pgName: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 4,
  },
  
  pgLocation: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  
  badgeGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  
  statusBadge: {
    padding: "6px 14px",
    borderRadius: 40,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  
  statusConfirmed: {
    background: "rgba(16,185,129,0.2)",
    color: "#34d399",
    border: "1px solid rgba(16,185,129,0.3)",
  },
  
  statusApproved: {
    background: "rgba(59,130,246,0.2)",
    color: "#60a5fa",
    border: "1px solid rgba(59,130,246,0.3)",
  },
  
  statusPending: {
    background: "rgba(245,158,11,0.2)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.3)",
  },
  
  statusLeft: {
    background: "rgba(107,114,128,0.2)",
    color: "#9ca3af",
    border: "1px solid rgba(107,114,128,0.3)",
  },
  
  paymentBadge: {
    padding: "6px 14px",
    borderRadius: 40,
    fontSize: 12,
    fontWeight: 600,
  },
  
  paymentBadgepaid: {
    background: "rgba(16,185,129,0.2)",
    color: "#34d399",
    border: "1px solid rgba(16,185,129,0.3)",
  },
  
  paymentBadgesubmitted: {
    background: "rgba(245,158,11,0.2)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.3)",
  },
  
  paymentBadgerejected: {
    background: "rgba(239,68,68,0.2)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)",
  },
  
  paymentBadgepending: {
    background: "rgba(107,114,128,0.2)",
    color: "#9ca3af",
    border: "1px solid rgba(107,114,128,0.3)",
  },
  
  cardContent: {
    padding: 24,
  },
  
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  
  detailIcon: {
    fontSize: 20,
    background: "rgba(255,255,255,0.05)",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  
  detailLabel: {
    display: "block",
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 2,
  },
  
  detailValue: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
  },
  
  priceSection: {
    background: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  
  totalPrice: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid rgba(255,255,255,0.1)",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
  },
  
  messageBox: {
    padding: "12px 16px",
    borderRadius: 16,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: 500,
  },
  
  messageBoxrejected: {
    background: "rgba(239,68,68,0.15)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)",
  },
  
  messageBoxsubmitted: {
    background: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.3)",
  },
  
  messageBoxpaid: {
    background: "rgba(16,185,129,0.15)",
    color: "#34d399",
    border: "1px solid rgba(16,185,129,0.3)",
  },
  
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  
  actionButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  
  actionRow: {
    display: "flex",
    gap: 8,
    width: "100%",
  },
  
  iconButton: {
    padding: "10px 8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    ":hover": {
      background: "rgba(255,255,255,0.1)",
      transform: "translateY(-2px)",
      borderColor: "rgba(255,255,255,0.3)",
    }
  },
  
  buttonIcon: {
    fontSize: 18,
  },
  
  payButton: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 18,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 10px 25px -5px rgba(99,102,241,0.4)",
    ":hover": {
      transform: "scale(1.02)",
      boxShadow: "0 15px 30px -5px rgba(99,102,241,0.5)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    }
  },
  
  agreementButton: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 18,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 10px 25px -5px rgba(16,185,129,0.4)",
    ":hover": {
      transform: "scale(1.02)",
      boxShadow: "0 15px 30px -5px rgba(16,185,129,0.5)",
    }
  },
  
  leftStatusBox: {
    marginTop: 16,
    padding: "12px",
    background: "rgba(107,114,128,0.2)",
    color: "#9ca3af",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 500,
    textAlign: "center",
    border: "1px solid rgba(107,114,128,0.3)",
  },
  
  confirmedBadge: {
    marginTop: 16,
    padding: "12px",
    background: "rgba(16,185,129,0.15)",
    color: "#34d399",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid rgba(16,185,129,0.3)",
  },
  
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    borderRadius: 48,
    border: "1px solid rgba(255,255,255,0.1)",
    position: "relative",
    zIndex: 2,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.7,
  },
  
  emptyTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 8,
  },
  
  emptyText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 24,
  },
  
  browseBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 999,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 25px -5px rgba(99,102,241,0.4)",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 15px 30px -5px rgba(99,102,241,0.5)",
    }
  },
  
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15), transparent 40%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.15), transparent 40%), linear-gradient(135deg, #0a0a0f, #13131f)",
  },
  
  loadingSpinner: {
    width: 50,
    height: 50,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 16,
  },
  
  loadingText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
  },
  
  errorContainer: {
    textAlign: "center",
    padding: "60px 20px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    borderRadius: 48,
    margin: "40px auto",
    maxWidth: 400,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  errorText: {
    fontSize: 15,
    color: "#f87171",
    marginBottom: 24,
  },
  
  retryBtn: {
    padding: "12px 24px",
    background: "rgba(59,130,246,0.2)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: 999,
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      background: "rgba(59,130,246,0.3)",
    }
  },
  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    animation: "fadeIn 0.3s ease",
  },
  
  modalContent: {
    background: "rgba(20,20,35,0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: 40,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    animation: "slideIn 0.3s ease",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
  },
  
  modalHeader: {
    padding: "28px 28px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  
  modalTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#fff",
    margin: 0,
  },
  
  modalClose: {
    width: 40,
    height: 40,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "50%",
    fontSize: 20,
    cursor: "pointer",
    color: "rgba(255,255,255,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    ":hover": {
      background: "rgba(255,255,255,0.2)",
      color: "#fff",
    }
  },
  
  modalAmountSection: {
    padding: "0 28px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  
  modalAmount: {
    display: "flex",
    flexDirection: "column",
  },
  
  modalAmountLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 4,
  },
  
  modalAmountValue: {
    fontSize: 36,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1,
  },
  
  orderIdSection: {
    padding: "16px 28px",
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  
  orderIdLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  
  orderIdValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    background: "rgba(0,0,0,0.5)",
    padding: "6px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    fontFamily: "monospace",
    flex: 1,
  },
  
  copyButton: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "6px 12px",
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      background: "rgba(255,255,255,0.2)",
    }
  },
  
  accountDetails: {
    padding: "20px 28px",
    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
    display: "flex",
    alignItems: "center",
    gap: 16,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  
  accountIcon: {
    width: 48,
    height: 48,
    background: "rgba(255,255,255,0.1)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },
  
  accountInfo: {
    flex: 1,
  },
  
  accountRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    marginBottom: 6,
    color: "rgba(255,255,255,0.8)",
  },
  
  qrSection: {
    padding: "28px",
    textAlign: "center",
  },
  
  qrImage: {
    width: "min(200px, 50vw)",
    height: "auto",
    aspectRatio: "1",
    marginBottom: 20,
    borderRadius: 20,
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
    background: "#fff",
    padding: 8,
  },
  
  upiButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 28px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.3s ease",
    boxShadow: "0 10px 25px -5px rgba(99,102,241,0.4)",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 15px 30px -5px rgba(99,102,241,0.5)",
    }
  },
  
  modalActions: {
    padding: "0 28px 20px",
  },
  
  submitButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 20,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 10px 25px -5px rgba(16,185,129,0.4)",
    ":hover": {
      transform: "scale(1.02)",
      boxShadow: "0 15px 30px -5px rgba(16,185,129,0.5)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    }
  },
  
  waitMessageBox: {
    margin: "0 28px 20px",
    padding: "14px 16px",
    background: "rgba(59,130,246,0.1)",
    borderRadius: 18,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    fontSize: 13,
    color: "#60a5fa",
    border: "1px solid rgba(59,130,246,0.2)",
  },
  
  refreshSection: {
    padding: "0 28px 20px",
  },
  
  refreshButton: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ":hover": {
      background: "rgba(255,255,255,0.1)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    }
  },
  
  buttonSpinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid #fff",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  
  warningBox: {
    margin: "0 28px 24px",
    padding: "12px 16px",
    background: "rgba(245,158,11,0.1)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.2)",
  },
  
  errorBox: {
    margin: "0 28px 28px",
    padding: "12px 16px",
    background: "rgba(239,68,68,0.1)",
    borderRadius: 16,
    color: "#f87171",
    fontSize: 13,
    textAlign: "center",
    border: "1px solid rgba(239,68,68,0.2)",
  },
};

UserBookingHistory.propTypes = {};

export default UserBookingHistory;