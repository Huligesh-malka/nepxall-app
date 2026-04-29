import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import api from "../api/api";
import { load } from "@cashfreepayments/cashfree-js";

const UserBookingHistory = () => {
  const navigate = useNavigate();
  
  // ✅ USE ONLY THIS - No localStorage.getItem("user_id")
  const { user, role, loading: authLoading } = useAuth();

  // ✅ ADDED: Store MySQL user from backend
  const [me, setMe] = useState(null);

  // State management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  
  // Track submitted payments to prevent multiple submissions
  const [submittedPayments, setSubmittedPayments] = useState({});

  // ✅ ADDED: Load user from backend (converts Firebase UID to MySQL ID)
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get("/private-chat/me");
        setMe(res.data); // ✅ contains MySQL id
        console.log("✅ User loaded from backend:", res.data);
      } catch (err) {
        console.error("Failed to load user from backend:", err);
      }
    };

    if (user?.uid) {
      loadMe();
    }
  }, [user?.uid]);

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

  // 🔥 AUTO REFRESH PAYMENT STATUS
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

  // Show payment dialog
  const handleShowPaymentDialog = useCallback((booking) => {
    setSelectedBookingForPayment(booking);
    setShowPaymentDialog(true);
  }, []);

  // ✅ SIMPLIFIED: Create payment with Cashfree (Fixed amount ₹1099)
  const handlePayNow = useCallback(async () => {
    if (!selectedBookingForPayment) return;

    try {
      setPayingId(selectedBookingForPayment.id);
      setError("");

      const booking = selectedBookingForPayment;

      // Fixed payment amount: ₹1099 (Token + Platform Fee)
      const amountToPay = 1099;

      // 🔥 Create Cashfree order
      const res = await api.post("/payments/create-cashfree-order", {
        amount: amountToPay,
        customerId: String(user.uid),
        customerPhone: user.phoneNumber || "9999999999",
        bookingId: booking.id,
        includeAgreement: false // Agreement removed
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Cashfree order failed");
      }

      // Initialize Cashfree
      const cashfree = await load({
        mode: "production" // Use "sandbox" for testing
      });

      // Redirect to Cashfree checkout page
      await cashfree.checkout({
        paymentSessionId: res.data.payment_session_id,
        redirectTarget: "_self"
      });
      
    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      setError(err.message || "Payment initialization failed");
    } finally {
      setPayingId(null);
      setSelectedBookingForPayment(null);
      setShowPaymentDialog(false);
    }
  }, [selectedBookingForPayment, user]);

  // Close payment dialog
  const closePaymentDialog = useCallback(() => {
    setShowPaymentDialog(false);
    setSelectedBookingForPayment(null);
  }, []);

  // Get payment status and button visibility
  const getPaymentStatusDisplay = useCallback((bookingId, bookingStatus) => {
    const status = paymentStatuses[bookingId];
    
    if (!status) {
      return {
        showPayButton: bookingStatus === "approved",
        message: null,
        badge: null
      };
    }

    switch(status) {
      case "paid":
        return {
          showPayButton: false,
          message: "✅ Payment completed!",
          badge: { text: "Paid", style: "paid" }
        };
      
      case "submitted":
        return {
          showPayButton: false,
          message: "⏳ Payment submitted! Waiting for verification.",
          badge: { text: "Pending Verification", style: "submitted" }
        };
      
      case "rejected":
        return {
          showPayButton: true,
          message: "❌ Payment was rejected. Please try again.",
          badge: { text: "Rejected", style: "rejected" }
        };
      
      case "pending":
        return {
          showPayButton: true,
          message: "Complete payment to confirm your booking.",
          badge: { text: "Payment Pending", style: "pending" }
        };
      
      default:
        return {
          showPayButton: bookingStatus === "approved",
          message: null,
          badge: null
        };
    }
  }, [paymentStatuses]);

  // Handle chat navigation
  const handleChatNavigation = useCallback(async (booking) => {
    try {
      if (!booking.pg_id) {
        console.log("No pg_id for this booking");
        return;
      }

      if (!me?.id) {
        console.log("User MySQL ID not loaded yet");
        return;
      }

      const res = await api.get(
        `/private-chat/user/${me.id}?pg_id=${booking.pg_id}`
      );

      const ownerId = res.data?.id;

      if (!ownerId) {
        console.log("No owner found");
        return;
      }

      navigate(`/chat/private/${ownerId}/${booking.pg_id}`);

    } catch (err) {
      console.error("Chat error:", err);
    }
  }, [navigate, me]);

  // PROTECTION
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

  // Calculate remaining amount for display
  const calculateRemainingAmount = (booking) => {
    const rent = Number(booking.rent_amount || booking.rent || 0);
    const deposit = Number(booking.security_deposit || 0);
    const maintenance = Number(booking.maintenance_amount || 0);
    const total = rent + deposit + maintenance;
    const paid = 1099;
    const remaining = total - paid;
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Bookings</h1>
        <p style={styles.subtitle}>Manage your property bookings and payments</p>
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
          {filteredBookings.map((booking) => {
            const rent = Number(booking.rent_amount || booking.rent || 0);
            const deposit = Number(booking.security_deposit || 0);
            const maintenance = Number(booking.maintenance_amount || 0);
            const totalAmount = rent + deposit + maintenance;
            const remainingAmount = calculateRemainingAmount(booking);
            
            const paymentDisplay = getPaymentStatusDisplay(booking.id, booking.status);
            const paymentStatus = paymentStatuses[booking.id];
            
            const showPayButton = paymentDisplay.showPayButton;

            return (
              <div key={booking.id} style={styles.card}>
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
                        {booking.status !== "pending" && booking.phone ? (
                          <a
                            href={`tel:${booking.phone}`}
                            style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              background: "#10b981",
                              color: "#fff",
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              textDecoration: "none"
                            }}
                          >
                            Call Owner
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>Not available</span>
                        )}
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

                  {/* Waiting for approval message */}
                  {booking.status === "pending" && (
                    <div style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      padding: "10px",
                      borderRadius: 10,
                      fontSize: 13,
                      textAlign: "center",
                      fontWeight: 600,
                      marginBottom: 20
                    }}>
                      ⏳ Booking requested — Waiting for owner approval
                    </div>
                  )}

                  {/* ✅ SIMPLIFIED PAYMENT SECTION - Clean & User Friendly */}
                  {paymentStatus === "paid" && (
                    <div style={styles.paymentConfirmedSection}>
                      <div style={styles.confirmedIcon}>✅</div>
                      <div style={styles.confirmedTitle}>Booking Confirmed!</div>
                      <div style={styles.paidOnline}>
                        💳 Paid Online: ₹1,099
                      </div>
                      <div style={styles.remainingPaymentMessage}>
                        🏠 Remaining amount of <strong>₹{remainingAmount.toLocaleString()}</strong> to be paid directly to the owner during check-in
                      </div>
                    </div>
                  )}

                  {/* Show simplified price summary for unpaid bookings */}
                  {paymentStatus !== "paid" && booking.status === "approved" && (
                    <div style={styles.paymentCardSection}>
                      <div style={styles.paymentAmount}>
                        <span>Payment Required:</span>
                        <strong>₹1,099</strong>
                      </div>
                      <div style={styles.paymentNote}>
                        One-time online payment to confirm your booking
                      </div>
                    </div>
                  )}

                  {/* Message if any */}
                  {paymentDisplay.message && paymentStatus !== "paid" && (
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
                        style={{
                          ...styles.iconButton,
                          opacity: !me?.id ? 0.5 : 1,
                          cursor: !me?.id ? "not-allowed" : "pointer"
                        }}
                        onClick={() => handleChatNavigation(booking)}
                        disabled={!me?.id}
                        title="Chat with Owner"
                      >
                        <span style={styles.buttonIcon}>
                          {!me?.id ? "⏳" : "💬"}
                        </span>
                        <span>
                          {!me?.id ? "Loading..." : "Chat"}
                        </span>
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
                          onClick={() => handleShowPaymentDialog(booking)}
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
                              Pay ₹1,099 & Confirm Booking
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* LEFT STATUS UI */}
                  {booking.status === "left" && (
                    <div style={{
                      marginTop: 16,
                      padding: "12px",
                      background: "#6b7280",
                      color: "#fff",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      textAlign: "center"
                    }}>
                      🚪 You have vacated - You can book again
                    </div>
                  )}

                  {/* Confirmed Badge */}
                  {booking.status === "confirmed" && paymentStatus === "paid" && (
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

      {/* Payment Dialog - Simplified (No Agreement Option) */}
      {showPaymentDialog && selectedBookingForPayment && (
        <div style={styles.modalOverlay} onClick={closePaymentDialog}>
          <div style={styles.paymentDialogContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirm Booking</h2>
              <button style={styles.modalClose} onClick={closePaymentDialog}>×</button>
            </div>
            
            <div style={styles.paymentDialogBody}>
              <div style={styles.paymentDialogIcon}>💳</div>
              <p style={styles.paymentDialogText}>
                Complete your booking payment of
              </p>
              <div style={styles.paymentDialogAmount}>₹1,099</div>
              <p style={styles.paymentDialogNote}>
                This confirms your booking. Remaining amount will be paid directly to the owner during check-in.
              </p>
              <button
                style={styles.confirmPayButton}
                onClick={handlePayNow}
                disabled={payingId === selectedBookingForPayment.id}
              >
                {payingId === selectedBookingForPayment.id ? (
                  <>
                    <span style={styles.buttonSpinner}></span>
                    Processing...
                  </>
                ) : (
                  "Proceed to Pay ₹1,099"
                )}
              </button>
              <button
                style={styles.cancelPayButton}
                onClick={closePaymentDialog}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {error && (
        <div style={styles.errorToast}>
          <span>❌</span>
          <span>{error}</span>
          <button onClick={() => setError("")} style={styles.errorToastClose}>×</button>
        </div>
      )}

      {/* Add keyframe animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
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
        `}
      </style>
    </div>
  );
};

// Modern Styles
const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 24px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    animation: "slideIn 0.5s ease-out",
  },
  
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  
  title: {
    fontSize: "clamp(32px, 6vw, 48px)",
    fontWeight: 800,
    color: "#fff",
    marginBottom: 8,
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    letterSpacing: "-0.5px",
  },
  
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 400,
  },
  
  tabsContainer: {
    display: "flex",
    gap: 12,
    marginBottom: 32,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  
  tab: {
    padding: "12px 24px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 40,
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: 8,
    ":hover": {
      background: "rgba(255,255,255,0.2)",
      transform: "translateY(-2px)",
    }
  },
  
  activeTab: {
    background: "#fff",
    color: "#667eea",
    borderColor: "#fff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  
  tabCount: {
    background: "rgba(0,0,0,0.1)",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 12,
    marginLeft: 4,
  },
  
  bookingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: 24,
  },
  
  card: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    animation: "slideIn 0.5s ease-out",
    border: "1px solid rgba(255,255,255,0.2)",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 30px 60px rgba(0,0,0,0.15)",
    }
  },
  
  cardHeader: {
    padding: "20px 24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  
  pgName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 4,
  },
  
  pgLocation: {
    margin: 0,
    fontSize: 13,
    opacity: 0.9,
  },
  
  badgeGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  
  statusBadge: {
    padding: "6px 12px",
    borderRadius: 30,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  
  statusConfirmed: {
    background: "#10b981",
    color: "#fff",
  },
  
  statusApproved: {
    background: "#3b82f6",
    color: "#fff",
  },
  
  statusPending: {
    background: "#f59e0b",
    color: "#fff",
  },
  
  statusLeft: {
    background: "#6b7280",
    color: "#fff",
  },
  
  paymentBadge: {
    padding: "6px 12px",
    borderRadius: 30,
    fontSize: 12,
    background: "#fff",
  },
  
  paymentBadgepaid: {
    background: "#10b981",
    color: "#fff",
  },
  
  paymentBadgesubmitted: {
    background: "#f59e0b",
    color: "#fff",
  },
  
  paymentBadgerejected: {
    background: "#ef4444",
    color: "#fff",
  },
  
  paymentBadgepending: {
    background: "#6b7280",
    color: "#fff",
  },
  
  cardContent: {
    padding: 24,
  },
  
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    marginBottom: 20,
  },
  
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  
  detailIcon: {
    fontSize: 24,
    background: "#f3f4f6",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  
  detailLabel: {
    display: "block",
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 2,
  },
  
  detailValue: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#1f2937",
  },
  
  paymentConfirmedSection: {
    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    textAlign: "center",
    border: "1px solid #10b981",
  },
  
  confirmedIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  
  confirmedTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#065f46",
    marginBottom: 12,
  },
  
  paidOnline: {
    fontSize: 16,
    fontWeight: 600,
    color: "#047857",
    marginBottom: 12,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.5)",
    borderRadius: 10,
    display: "inline-block",
  },
  
  remainingPaymentMessage: {
    fontSize: 14,
    color: "#065f46",
    padding: "8px",
    background: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    marginTop: 8,
  },
  
  paymentCardSection: {
    background: "#fef3c7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    textAlign: "center",
    border: "1px solid #f59e0b",
  },
  
  paymentAmount: {
    fontSize: 18,
    fontWeight: 700,
    color: "#92400e",
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
  },
  
  paymentNote: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 8,
  },
  
  messageBox: {
    padding: "12px 16px",
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: 500,
  },
  
  messageBoxrejected: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },
  
  messageBoxsubmitted: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  
  messageBoxpaid: {
    background: "#d1fae5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  
  actionButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  
  actionRow: {
    display: "flex",
    gap: 8,
    width: "100%",
  },
  
  iconButton: {
    padding: "10px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    color: "#4b5563",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    ":hover": {
      background: "#e5e7eb",
      transform: "translateY(-2px)",
    }
  },
  
  buttonIcon: {
    fontSize: 18,
  },
  
  payButton: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: 14,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(102,126,234,0.3)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    }
  },
  
  confirmedBadge: {
    marginTop: 16,
    padding: "12px",
    background: "#10b981",
    color: "#fff",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 32,
    border: "1px solid rgba(255,255,255,0.2)",
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  
  emptyTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 8,
  },
  
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
  },
  
  browseBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: 40,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(102,126,234,0.3)",
    }
  },
  
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  
  loadingSpinner: {
    width: 50,
    height: 50,
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 16,
  },
  
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  
  errorContainer: {
    textAlign: "center",
    padding: "60px 20px",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 32,
    margin: "40px auto",
    maxWidth: 400,
  },
  
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 24,
  },
  
  retryBtn: {
    padding: "12px 24px",
    background: "#3b82f6",
    border: "none",
    borderRadius: 40,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#2563eb",
    }
  },
  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    animation: "fadeIn 0.3s ease",
  },
  
  paymentDialogContent: {
    background: "#fff",
    borderRadius: 32,
    width: "100%",
    maxWidth: 400,
    position: "relative",
    animation: "slideIn 0.3s ease",
  },
  
  paymentDialogBody: {
    padding: "24px",
    textAlign: "center",
  },
  
  paymentDialogIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  paymentDialogText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 12,
  },
  
  paymentDialogAmount: {
    fontSize: 36,
    fontWeight: 800,
    color: "#667eea",
    marginBottom: 16,
  },
  
  paymentDialogNote: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  
  confirmPayButton: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: 14,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginBottom: 12,
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(102,126,234,0.3)",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    }
  },
  
  cancelPayButton: {
    width: "100%",
    padding: "12px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: 14,
    color: "#4b5563",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#e5e7eb",
    }
  },
  
  modalHeader: {
    padding: "24px 24px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  },
  
  modalClose: {
    width: 40,
    height: 40,
    background: "#f3f4f6",
    border: "none",
    borderRadius: "50%",
    fontSize: 20,
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#e5e7eb",
      color: "#1f2937",
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
  
  errorToast: {
    position: "fixed",
    bottom: 20,
    right: 20,
    background: "#fee2e2",
    color: "#991b1b",
    padding: "16px 20px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
    fontWeight: 500,
    border: "1px solid #fecaca",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    zIndex: 1100,
    animation: "slideIn 0.3s ease",
    maxWidth: 400,
  },
  
  errorToastClose: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#991b1b",
    marginLeft: "auto",
    padding: "0 4px",
    ":hover": {
      opacity: 0.7,
    }
  },
};

UserBookingHistory.propTypes = {};

export default UserBookingHistory;