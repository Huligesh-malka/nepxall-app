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

  // ✅ ADDED: Store MySQL user from backend
  const [me, setMe] = useState(null);

  // State management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  
  // Track which bookings had agreement paid
  const [agreementPaidBookings, setAgreementPaidBookings] = useState({});
  
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
        await checkAgreementStatus([...res.data]);
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

  // Check which bookings had agreement included in payment
  const checkAgreementStatus = useCallback(async (bookingsList) => {
    try {
      const agreementMap = { ...agreementPaidBookings };
      
      await Promise.all(bookingsList.map(async (booking) => {
        try {
          api.get(`/payments/agreement-status/${booking.id}`)
          if (res.data.success) {
            agreementMap[booking.id] = res.data.hasAgreement;
          }
        } catch (err) {
          console.log(`No agreement info for booking ${booking.id}`);
        }
      }));
      
      setAgreementPaidBookings({ ...agreementMap });
    } catch (err) {
      console.error("Error checking agreement status:", err);
    }
  }, [agreementPaidBookings]);

  // 🔥 AUTO REFRESH PAYMENT STATUS
  useEffect(() => {
    if (!bookings.length) return;

    const interval = setInterval(() => {
      checkAllPaymentStatuses(bookings);
      checkAgreementStatus(bookings);
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [bookings, checkAllPaymentStatuses, checkAgreementStatus]);

  // Initial load
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Show agreement dialog before payment
  const handleShowPaymentDialog = useCallback((booking) => {
    setSelectedBookingForPayment(booking);
    setShowAgreementDialog(true);
  }, []);

  // Create payment with agreement option
  const handlePayNow = useCallback(async (includeAgreement) => {
    if (!selectedBookingForPayment) return;

    try {
      setPayingId(selectedBookingForPayment.id);
      setError("");
      setShowAgreementDialog(false);

      const booking = selectedBookingForPayment;

      const rent = Number(booking.rent_amount || 0);
      const deposit = Number(booking.security_deposit || 0);
      const maintenance = Number(booking.maintenance_amount || 0);

      let total = rent + deposit + maintenance;

      if (includeAgreement) {
        total += 500; // Agreement fee
      }

      if (!total || total <= 0) {
        throw new Error("Invalid payment amount");
      }

      // 🔥 SEND agreement flag to backend
      const res = await api.post("/payments/create-payment", {
        bookingId: booking.id,
        includeAgreement: includeAgreement
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Payment initialization failed");
      }

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: total,
        bookingId: booking.id,
        agreement: includeAgreement,
        rent: rent,
        deposit: deposit,
        maintenance: maintenance,
        agreementFee: includeAgreement ? 500 : 0
      });

      // Auto-submit after QR is shown (payment is done via QR scan)
      // The backend will handle payment verification automatically
      
    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      setError(err.message || "Payment initialization failed");
    } finally {
      setPayingId(null);
      setSelectedBookingForPayment(null);
    }
  }, [selectedBookingForPayment]);

  // Refresh QR
  const refreshQR = useCallback(async () => {
    if (!paymentData) return;
    
    try {
      setRefreshing(true);
      setError("");
      
      const res = await api.post("/payments/create-payment", {
        bookingId: paymentData.bookingId,
        includeAgreement: paymentData.agreement
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to refresh QR");
      }

      setPaymentData({
        ...paymentData,
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId
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

  // Close agreement dialog
  const closeAgreementDialog = useCallback(() => {
    setShowAgreementDialog(false);
    setSelectedBookingForPayment(null);
  }, []);

  // Get payment status
  const getPaymentStatusDisplay = useCallback((bookingId, bookingStatus) => {
    const status = paymentStatuses[bookingId];
    const hasAgreement = agreementPaidBookings[bookingId];
    
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
          // Only show agreement button if user paid WITH agreement
          showAgreementButton: hasAgreement === true,
          message: "✅ Payment verified!",
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
          message: "Scan the QR code to complete payment. Status will update automatically.",
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
  }, [paymentStatuses, agreementPaidBookings]);

  // Handle agreement form navigation
  const handleFillAgreement = useCallback((bookingId) => {
    navigate(`/agreement-form/${bookingId}`);
  }, [navigate]);

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

      console.log("Chat navigation - Using MySQL ID:", me.id);
      console.log("PG ID:", booking.pg_id);

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
            const total = Number(booking.total_amount) || rent + deposit + maintenance;
            
            const paymentDisplay = getPaymentStatusDisplay(booking.id, booking.status);
            
            // Simple Pay Button Logic
            const paymentStatus = paymentStatuses[booking.id];
            
            const showPayButton =
              booking.status === "approved" &&
              paymentStatus !== "paid" &&
              paymentStatus !== "submitted";

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

                  {/* Payment completed message */}
                  {paymentStatus === "paid" && (
                    <div style={{
                      background: "#d1fae5",
                      color: "#065f46",
                      padding: "10px",
                      borderRadius: 10,
                      fontSize: 13,
                      textAlign: "center",
                      fontWeight: 600,
                      marginBottom: 16
                    }}>
                      Payment completed

If you are not interested in joining the PG after making the payment, you can request a refund (only if you have not completed check-in/joining).

For any queries, please contact support.
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
                              Pay ₹{total.toLocaleString()}
                            </>
                          )}
                        </button>
                      )}

                      {/* Fill Agreement Button - Shows only when payment is verified AND user paid WITH agreement */}
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

      {/* Agreement Dialog - Yes/No Option */}
      {showAgreementDialog && selectedBookingForPayment && (
        <div style={styles.modalOverlay} onClick={closeAgreementDialog}>
          <div style={styles.agreementDialogContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Agreement Option</h2>
              <button style={styles.modalClose} onClick={closeAgreementDialog}>×</button>
            </div>
            
            <div style={styles.agreementDialogBody}>
              <div style={styles.agreementIcon}>📄</div>
              <p style={styles.agreementText}>
                Do you want to include a legal agreement for this booking?
              </p>
              <p style={styles.agreementFeeText}>
                Agreement fee: <strong>₹500</strong> (one-time)
              </p>
              <div style={styles.agreementButtons}>
                <button
                  style={styles.agreementNoButton}
                  onClick={() => handlePayNow(false)}
                >
                  No, Skip Agreement
                </button>
                <button
                  style={styles.agreementYesButton}
                  onClick={() => handlePayNow(true)}
                >
                  Yes, Include Agreement (+₹500)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - QR Code Only (No Bank Details, No I HAVE PAID Button) */}
      {paymentData && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Complete Payment</h2>
              <button style={styles.modalClose} onClick={closeModal}>×</button>
            </div>

            {/* Two Column Layout - Left: Amount & Order ID, Right: QR Code */}
            <div style={styles.paymentTwoColumn}>
              {/* Left Column - Payment Info */}
              <div style={styles.paymentLeftColumn}>
                {/* Amount */}
                <div style={styles.modalAmountSection}>
                  <div style={styles.modalAmount}>
                    <span style={styles.modalAmountLabel}>Amount to Pay</span>
                    <span style={styles.modalAmountValue}>₹{paymentData.amount.toLocaleString()}</span>
                  </div>
                  
                  {/* Detailed breakdown */}
                  <div style={styles.breakdownSection}>
                    <div style={styles.breakdownRow}>
                      <span>Rent:</span>
                      <span>₹{paymentData.rent.toLocaleString()}</span>
                    </div>
                    <div style={styles.breakdownRow}>
                      <span>Security Deposit:</span>
                      <span>₹{paymentData.deposit.toLocaleString()}</span>
                    </div>
                    <div style={styles.breakdownRow}>
                      <span>Maintenance:</span>
                      <span>₹{paymentData.maintenance.toLocaleString()}</span>
                    </div>
                    {paymentData.agreementFee > 0 && (
                      <div style={styles.breakdownRow}>
                        <span>Agreement Fee:</span>
                        <span>₹{paymentData.agreementFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={styles.breakdownTotal}>
                      <span>Total:</span>
                      <span>₹{paymentData.amount.toLocaleString()}</span>
                    </div>
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
              </div>

              {/* Right Column - QR Code */}
              <div style={styles.paymentRightColumn}>
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
              </div>
            </div>

            {/* Wait Message - Payment will be auto-verified */}
            <div style={styles.waitMessageBox}>
              <span>⏰</span>
              <div>
                <strong>After payment:</strong>
                <p>Scan the QR code and complete payment. Status will update automatically within 5-10 minutes.</p>
              </div>
            </div>

            {/* Warning - Don't Pay Multiple Times */}
            <div style={styles.warningBox}>
              <span>⚠️</span>
              <span>Pay only once! Multiple payments will be rejected.</span>
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
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
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
  
  priceSection: {
    background: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    color: "#4b5563",
    fontSize: 14,
    borderBottom: "1px dashed #e5e7eb",
  },
  
  totalPrice: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "2px solid #e5e7eb",
    fontSize: 16,
    fontWeight: 700,
    color: "#1f2937",
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
    gridTemplateColumns: "repeat(4, 1fr)",
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
  
  agreementButton: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
      boxShadow: "0 10px 20px rgba(16,185,129,0.3)",
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
  
  modalContent: {
    background: "#fff",
    borderRadius: 32,
    width: "100%",
    maxWidth: 680,
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    animation: "slideIn 0.3s ease",
  },
  
  paymentTwoColumn: {
    display: "flex",
    flexDirection: "row",
    gap: 24,
    padding: "0 24px",
    flexWrap: "wrap",
  },
  
  paymentLeftColumn: {
    flex: 1,
    minWidth: 200,
  },
  
  paymentRightColumn: {
    flex: 1,
    minWidth: 200,
  },
  
  agreementDialogContent: {
    background: "#fff",
    borderRadius: 32,
    width: "100%",
    maxWidth: 400,
    position: "relative",
    animation: "slideIn 0.3s ease",
  },
  
  agreementDialogBody: {
    padding: "24px",
    textAlign: "center",
  },
  
  agreementIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  agreementText: {
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  
  agreementFeeText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  
  agreementButtons: {
    display: "flex",
    gap: 12,
  },
  
  agreementYesButton: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    borderRadius: 14,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(16,185,129,0.3)",
    }
  },
  
  agreementNoButton: {
    flex: 1,
    padding: "14px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: 14,
    color: "#4b5563",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      background: "#e5e7eb",
      transform: "translateY(-2px)",
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
  
  modalAmountSection: {
    padding: "0 0 20px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  
  modalAmount: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 16,
  },
  
  modalAmountLabel: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 4,
  },
  
  modalAmountValue: {
    fontSize: 32,
    fontWeight: 800,
    color: "#1f2937",
    lineHeight: 1,
  },
  
  breakdownSection: {
    marginTop: 16,
    padding: "12px",
    background: "#f9fafb",
    borderRadius: 12,
  },
  
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 13,
    color: "#6b7280",
  },
  
  breakdownTotal: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #e5e7eb",
    fontSize: 14,
    fontWeight: 700,
    color: "#1f2937",
  },
  
  orderIdSection: {
    padding: "16px 0",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid #e5e7eb",
  },
  
  orderIdLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  
  orderIdValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1f2937",
    background: "#f9fafb",
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    fontFamily: "monospace",
    flex: 1,
  },
  
  copyButton: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#f3f4f6",
      borderColor: "#d1d5db",
    }
  },
  
  qrSection: {
    textAlign: "center",
  },
  
  qrImage: {
    width: "min(180px, 40vw)",
    height: "auto",
    aspectRatio: "1",
    marginBottom: 16,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  
  upiButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 40,
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.3s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 20px rgba(102,126,234,0.3)",
    }
  },
  
  refreshSection: {
    padding: "16px 0",
  },
  
  refreshButton: {
    width: "100%",
    padding: "12px",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    color: "#4b5563",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ":hover": {
      background: "#e5e7eb",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    }
  },
  
  waitMessageBox: {
    margin: "20px 24px",
    padding: "12px 16px",
    background: "#eff6ff",
    borderRadius: 12,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    color: "#1e40af",
    border: "1px solid #bfdbfe",
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
    margin: "0 24px 24px",
    padding: "12px 16px",
    background: "#fef3c7",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  
  errorBox: {
    margin: "0 24px 24px",
    padding: "12px 16px",
    background: "#fee2e2",
    borderRadius: 12,
    color: "#991b1b",
    fontSize: 14,
    textAlign: "center",
    border: "1px solid #fecaca",
  },
};

UserBookingHistory.propTypes = {};

export default UserBookingHistory;