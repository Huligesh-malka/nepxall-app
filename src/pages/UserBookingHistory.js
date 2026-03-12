import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import api from "../api/api";

const UserBookingHistory = () => {
  const navigate = useNavigate();

  // State management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef(null);
  
  // State for screenshot upload
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Constants
  const PAYMENT_TIMEOUT = 300; // 5 minutes in seconds
  const STATUS_POLL_INTERVAL = 10000; // 10 seconds

  //////////////////////////////////////////////////////
  // TIMER FUNCTIONS
  //////////////////////////////////////////////////////
  const startTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeLeft(PAYMENT_TIMEOUT);
    setIsExpired(false);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [PAYMENT_TIMEOUT]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTimerColor = useMemo(() => {
    if (timeLeft > 180) return "#4CAF50";
    if (timeLeft > 60) return "#FF9800";
    return "#f44336";
  }, [timeLeft]);

  // Calculate circle progress for SVG
  const circleProgress = useMemo(() => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - timeLeft / PAYMENT_TIMEOUT);
    return { circumference, offset };
  }, [timeLeft, PAYMENT_TIMEOUT]);

  //////////////////////////////////////////////////////
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      
      const res = await api.get("/bookings/user/history");
      setBookings(res.data || []);
      
      if (res.data && res.data.length > 0) {
        await checkAllPaymentStatuses(res.data);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError(err.response?.data?.message || "Failed to load booking history");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  //////////////////////////////////////////////////////
  // CHECK PAYMENT STATUS FOR ALL BOOKINGS
  //////////////////////////////////////////////////////
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
          // Silently fail for individual booking status checks
          console.log(`No payment found for booking ${booking.id}`);
        }
      }));
      
      setPaymentStatuses(statusMap);
    } catch (err) {
      console.error("Error checking payment statuses:", err);
    }
  }, [paymentStatuses]);

  // Auto-refresh payment status
  useEffect(() => {
    const interval = setInterval(() => {
      if (bookings.length > 0) {
        checkAllPaymentStatuses(bookings);
      }
    }, STATUS_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [bookings, checkAllPaymentStatuses, STATUS_POLL_INTERVAL]);

  // Initial load
  useEffect(() => {
    loadBookings();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loadBookings]);

  //////////////////////////////////////////////////////
  // CREATE UPI PAYMENT
  //////////////////////////////////////////////////////
  const handlePayNow = useCallback(async (booking) => {
    try {
      setPayingId(booking.id);
      setError("");

      // Calculate total amount
      const rent = Number(booking.rent_amount || booking.rent || 0);
      const deposit = Number(booking.security_deposit || 0);
      const maintenance = Number(booking.maintenance_amount || 0);
      const total = Number(booking.total_amount) || rent + deposit + maintenance;

      if (!total || total <= 0) {
        throw new Error("Invalid payment amount");
      }

      const res = await api.post("/payments/create-payment", {
        bookingId: booking.id,
        amount: total,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Payment initialization failed");
      }

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: total,
        bookingId: booking.id
      });

      startTimer();
      setScreenshot(null);
      setScreenshotPreview("");

    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      setError(err.message || "Payment initialization failed");
      alert(err.message || "Payment initialization failed");
    } finally {
      setPayingId(null);
    }
  }, [startTimer]);

  //////////////////////////////////////////////////////
  // HANDLE SCREENSHOT UPLOAD
  //////////////////////////////////////////////////////
  const handleScreenshotChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Please upload less than 5MB");
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      alert("Please upload only image files");
      return;
    }

    setScreenshot(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  //////////////////////////////////////////////////////
  // SUBMIT PAYMENT WITH SCREENSHOT
  //////////////////////////////////////////////////////
  const submitPaymentWithScreenshot = useCallback(async () => {
    if (!screenshot) {
      alert("Please upload payment screenshot");
      return;
    }

    if (isExpired) {
      alert("⏰ Payment time expired. Please refresh QR code.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("orderId", paymentData.orderId);
      formData.append("screenshot", screenshot);

      const res = await api.post("/payments/submit-screenshot", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to submit payment");
      }

      alert("✅ Payment submitted successfully! Waiting for admin verification.");

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Update payment status
      setPaymentStatuses(prev => ({
        ...prev,
        [paymentData.bookingId]: "submitted"
      }));

      // Close modal
      setPaymentData(null);
      setScreenshot(null);
      setScreenshotPreview("");
      
      // Refresh bookings
      loadBookings(false);

    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit payment");
      alert(err.message || "Failed to submit payment. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [screenshot, isExpired, paymentData, loadBookings]);

  //////////////////////////////////////////////////////
  // REFRESH QR
  //////////////////////////////////////////////////////
  const refreshQR = useCallback(async () => {
    if (!paymentData) return;
    
    try {
      setRefreshing(true);
      setError("");
      
      const res = await api.post("/payments/create-payment", {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
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

      startTimer();
      
    } catch (err) {
      console.error("REFRESH QR ERROR:", err);
      setError(err.message || "Failed to refresh QR code");
      alert(err.message || "Failed to refresh QR code");
    } finally {
      setRefreshing(false);
    }
  }, [paymentData, startTimer]);

  //////////////////////////////////////////////////////
  // CLOSE MODAL
  //////////////////////////////////////////////////////
  const closeModal = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setPaymentData(null);
    setScreenshot(null);
    setScreenshotPreview("");
    setError("");
  }, []);

  //////////////////////////////////////////////////////
  // GET PAYMENT STATUS DISPLAY
  //////////////////////////////////////////////////////
  const getPaymentStatusDisplay = useCallback((bookingId, bookingStatus) => {
    const status = paymentStatuses[bookingId];
    
    if (!status) {
      return {
        showPayButton: bookingStatus === "approved",
        message: null,
        badge: null,
        canPay: bookingStatus === "approved"
      };
    }

    switch(status) {
      case "paid":
        return {
          showPayButton: false,
          message: null,
          badge: { text: "✅ Payment Verified", style: "paid" },
          canPay: false
        };
      
      case "submitted":
        return {
          showPayButton: false,
          message: "⏳ Payment submitted. Waiting for admin verification...",
          badge: { text: "⏳ Pending Verification", style: "submitted" },
          canPay: false
        };
      
      case "rejected":
        return {
          showPayButton: true,
          message: "❌ Payment was rejected. Please pay again with correct screenshot.",
          badge: { text: "❌ Payment Rejected", style: "rejected" },
          canPay: true
        };
      
      case "pending":
        return {
          showPayButton: true,
          message: null,
          badge: { text: "💰 Payment Pending", style: "pending" },
          canPay: true
        };
      
      default:
        return {
          showPayButton: bookingStatus === "approved",
          message: null,
          badge: null,
          canPay: bookingStatus === "approved"
        };
    }
  }, [paymentStatuses]);

  // Badge styles mapping
  const badgeStyles = {
    paid: { background: "#16a34a", color: "#fff" },
    submitted: { background: "#f59e0b", color: "#fff" },
    rejected: { background: "#e11d48", color: "#fff" },
    pending: { background: "#6b7280", color: "#fff" }
  };

  //////////////////////////////////////////////////////
  // RENDER LOADING STATE
  //////////////////////////////////////////////////////
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your bookings...</p>
      </div>
    );
  }

  //////////////////////////////////////////////////////
  // RENDER ERROR STATE
  //////////////////////////////////////////////////////
  if (error && !bookings.length) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>❌</div>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.retryBtn} onClick={() => loadBookings()}>
          Try Again
        </button>
      </div>
    );
  }

  //////////////////////////////////////////////////////
  // MAIN RENDER
  //////////////////////////////////////////////////////
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📜 My Bookings</h2>

      {bookings.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏠</div>
          <p style={styles.emptyText}>No bookings found</p>
          <button 
            style={styles.browseBtn} 
            onClick={() => navigate("/")}
            aria-label="Browse properties"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div style={styles.bookingsList}>
          {bookings.map((booking) => {
            // Calculate amounts
            const rent = Number(booking.rent_amount || booking.rent || 0);
            const deposit = Number(booking.security_deposit || 0);
            const maintenance = Number(booking.maintenance_amount || 0);
            const total = Number(booking.total_amount) || rent + deposit + maintenance;
            
            const paymentDisplay = getPaymentStatusDisplay(booking.id, booking.status);
            
            const showPayButton = paymentDisplay.canPay && (
              booking.status === "approved" || paymentStatuses[booking.id] === "rejected"
            );

            return (
              <article key={booking.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.pgName}>{booking.pg_name || "PG Name"}</h3>
                  <span 
                    style={{
                      ...styles.statusBadge,
                      ...(booking.status === "confirmed" ? styles.statusConfirmed :
                         booking.status === "approved" ? styles.statusApproved :
                         styles.statusPending)
                    }}
                  >
                    {booking.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>

                {paymentDisplay.badge && (
                  <div style={styles.badgeContainer}>
                    <span style={{
                      ...styles.paymentBadge,
                      ...badgeStyles[paymentDisplay.badge.style]
                    }}>
                      {paymentDisplay.badge.text}
                    </span>
                  </div>
                )}

                <div style={styles.detailsGrid}>
                  <p style={styles.detailItem}>📞 {booking.phone || "N/A"}</p>
                  <p style={styles.detailItem}>
                    📅 {booking.check_in_date
                      ? new Date(booking.check_in_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })
                      : "N/A"}
                  </p>
                  <p style={styles.detailItem}>🛏 {booking.room_type || "Single Room"}</p>
                  {booking.room_no && (
                    <p style={styles.detailItem}>🚪 Room No: {booking.room_no}</p>
                  )}
                </div>

                <div style={styles.priceBreakdown}>
                  <div style={styles.priceRow}>
                    <span>💸 Rent:</span>
                    <span>₹{rent.toLocaleString()}</span>
                  </div>
                  <div style={styles.priceRow}>
                    <span>🔐 Deposit:</span>
                    <span>₹{deposit.toLocaleString()}</span>
                  </div>
                  <div style={styles.priceRow}>
                    <span>🧰 Maintenance:</span>
                    <span>₹{maintenance.toLocaleString()}</span>
                  </div>
                  <div style={styles.totalPrice}>
                    <span>🧾 Total:</span>
                    <span><b>₹{total.toLocaleString()}</b></span>
                  </div>
                </div>

                {paymentDisplay.message && (
                  <div style={styles.messageBox(paymentDisplay.badge?.style)}>
                    {paymentDisplay.message}
                  </div>
                )}

                {(booking.status === "approved" || booking.status === "confirmed") && (
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.viewBtn}
                      onClick={() => navigate(`/pg/${booking.pg_id}`)}
                      aria-label="View PG details"
                    >
                      🏠 View PG
                    </button>

                    <button
                      style={styles.chatBtn}
                      onClick={() => navigate(`/chat/private/${booking.owner_id}/${booking.pg_id}`)}
                      aria-label="Chat with owner"
                    >
                      💬 Chat Owner
                    </button>

                    <button
                      style={styles.agreementBtn}
                      onClick={() => navigate(`/agreement/${booking.id}`)}
                      aria-label="Preview agreement"
                    >
                      📄 Agreement
                    </button>

                    <button
                      style={styles.serviceBtn}
                      onClick={() => navigate(`/user/services/${booking.id}`)}
                      aria-label="Add services"
                    >
                      🚚 Services
                    </button>
                  </div>
                )}

                {showPayButton && (
                  <button
                    style={styles.payButton}
                    onClick={() => handlePayNow(booking)}
                    disabled={payingId === booking.id}
                    aria-label={`Pay ₹${total.toLocaleString()}`}
                  >
                    {payingId === booking.id ? (
                      <>
                        <span style={styles.buttonSpinner}></span>
                        Processing...
                      </>
                    ) : (
                      `💳 Pay ₹${total.toLocaleString()}`
                    )}
                  </button>
                )}

                {booking.status === "confirmed" && paymentStatuses[booking.id] === "paid" && (
                  <div style={styles.confirmedContainer}>
                    <div style={styles.confirmedBadge}>
                      ✅ Payment Verified - Booking Confirmed
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {paymentData && (
        <div 
          style={styles.modalOverlay} 
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Payment modal"
        >
          <div 
            style={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              style={styles.modalCloseBtn}
              onClick={closeModal}
              aria-label="Close modal"
            >
              ✕
            </button>
            
            <h3 style={styles.modalTitle}>Complete Payment</h3>

            {/* Amount and Timer */}
            <div style={styles.modalHeader}>
              <div style={styles.amountBox}>
                <span style={styles.amountLabel}>Amount</span>
                <span style={styles.amountValue}>₹{paymentData.amount.toLocaleString()}</span>
              </div>
              
              <div style={styles.timerContainer}>
                <svg width="70" height="70" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getTimerColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circleProgress.circumference}
                    strokeDashoffset={circleProgress.offset}
                    transform="rotate(-90 50 50)"
                    style={styles.timerCircle}
                  />
                </svg>
                <div style={styles.timerText}>
                  <span style={{ color: getTimerColor, fontWeight: "bold" }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order ID */}
            <div style={styles.orderIdBox}>
              <span style={styles.orderIdLabel}>Order ID:</span>
              <span style={styles.orderIdValue}>{paymentData.orderId}</span>
              <button 
                style={styles.copyBtn}
                onClick={() => {
                  navigator.clipboard.writeText(paymentData.orderId);
                  alert("Order ID copied!");
                }}
                aria-label="Copy order ID"
              >
                📋
              </button>
            </div>

            {/* Account Details */}
            <div style={styles.accountCard}>
              <div style={styles.accountIcon}>🏦</div>
              <div style={styles.accountInfo}>
                <div style={styles.accountRow}>
                  <span>UPI ID:</span>
                  <span style={styles.accountValue}>huligeshmalka-1@oksbi</span>
                </div>
                <div style={styles.accountRow}>
                  <span>Account:</span>
                  <span style={styles.accountValue}>Huligesh</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div style={styles.qrContainer}>
              <img 
                src={paymentData.qr} 
                alt="UPI QR Code" 
                style={styles.qrImage}
                loading="lazy"
              />
            </div>

            {/* UPI Link */}
            <a
              href={paymentData.upiLink}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.upiLink}
              aria-label="Open in UPI app"
            >
              <span>📱</span>
              Open in UPI App
            </a>

            {/* Warning */}
            <div style={styles.warningBox}>
              <span>⚠️</span>
              <span style={styles.warningText}>
                Pay only once. Multiple payments will be rejected.
              </span>
            </div>

            {/* Screenshot Upload */}
            <div style={styles.uploadContainer}>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                style={styles.hiddenInput}
                id="screenshot-upload"
                aria-label="Upload payment screenshot"
              />
              <label htmlFor="screenshot-upload" style={styles.uploadLabel}>
                <span>📸</span>
                {screenshot ? "Change Screenshot" : "Upload Payment Screenshot"}
              </label>
              
              {screenshotPreview && (
                <div style={styles.previewContainer}>
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    style={styles.previewImage}
                  />
                  <button 
                    style={styles.removeImageBtn}
                    onClick={() => {
                      setScreenshot(null);
                      setScreenshotPreview("");
                    }}
                    aria-label="Remove screenshot"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={styles.modalActions}>
              {isExpired ? (
                <button
                  style={styles.refreshButton}
                  onClick={refreshQR}
                  disabled={refreshing}
                  aria-label="Refresh QR code"
                >
                  {refreshing ? (
                    <>
                      <span style={styles.buttonSpinner}></span>
                      Refreshing...
                    </>
                  ) : (
                    "⟳ Refresh QR Code"
                  )}
                </button>
              ) : (
                <button
                  style={styles.submitButton}
                  onClick={submitPaymentWithScreenshot}
                  disabled={uploading || !screenshot}
                  aria-label="Submit payment"
                >
                  {uploading ? (
                    <>
                      <span style={styles.buttonSpinner}></span>
                      Submitting...
                    </>
                  ) : (
                    "✅ Submit for Verification"
                  )}
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div style={styles.modalError}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes for better type checking
UserBookingHistory.propTypes = {
  // Add any props if needed
};

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////
const styles = {
  container: {
    maxWidth: 900,
    margin: "40px auto",
    padding: "0 20px"
  },
  
  title: {
    fontSize: "clamp(24px, 5vw, 32px)",
    fontWeight: 600,
    marginBottom: 30,
    color: "#1e293b"
  },
  
  // Loading states
  loadingContainer: {
    textAlign: "center",
    marginTop: 100
  },
  
  loadingSpinner: {
    width: 50,
    height: 50,
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 1s linear infinite"
  },
  
  loadingText: {
    color: "#64748b",
    fontSize: 16
  },
  
  // Error states
  errorContainer: {
    textAlign: "center",
    marginTop: 100,
    padding: 40
  },
  
  errorIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  
  errorText: {
    color: "#e11d48",
    fontSize: 16,
    marginBottom: 20
  },
  
  retryBtn: {
    padding: "12px 24px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s",
    ":hover": {
      background: "#1d4ed8"
    }
  },
  
  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#f8fafc",
    borderRadius: 20
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5
  },
  
  emptyText: {
    color: "#64748b",
    fontSize: 18,
    marginBottom: 24
  },
  
  browseBtn: {
    padding: "14px 28px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 500,
    cursor: "pointer",
    transition: "transform 0.2s, background 0.2s",
    ":hover": {
      background: "#1d4ed8",
      transform: "translateY(-2px)"
    }
  },
  
  // Bookings list
  bookingsList: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  
  // Card styles
  card: {
    background: "#fff",
    padding: "clamp(16px, 4vw, 24px)",
    borderRadius: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    transition: "transform 0.2s, boxShadow 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
    }
  },
  
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16
  },
  
  pgName: {
    margin: 0,
    fontSize: "clamp(18px, 4vw, 20px)",
    fontWeight: 600,
    color: "#1e293b"
  },
  
  statusBadge: {
    padding: "6px 14px",
    borderRadius: 30,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.5px"
  },
  
  statusConfirmed: {
    background: "#16a34a",
    color: "#fff"
  },
  
  statusApproved: {
    background: "#2563eb",
    color: "#fff"
  },
  
  statusPending: {
    background: "#6b7280",
    color: "#fff"
  },
  
  badgeContainer: {
    marginBottom: 12
  },
  
  paymentBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: 30,
    fontSize: 13,
    fontWeight: 500
  },
  
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
    marginBottom: 16
  },
  
  detailItem: {
    margin: 0,
    color: "#475569",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  
  priceBreakdown: {
    background: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    color: "#475569",
    fontSize: 14
  },
  
  totalPrice: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #e2e8f0",
    fontSize: 16,
    color: "#1e293b"
  },
  
  messageBox: (type) => ({
    padding: "12px 16px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    background: type === "rejected" ? "#fee2e2" : "#fef3c7",
    color: type === "rejected" ? "#e11d48" : "#92400e"
  }),
  
  actionButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16
  },
  
  baseButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    transition: "transform 0.2s, opacity 0.2s",
    ":hover": {
      transform: "translateY(-2px)"
    },
    ":active": {
      transform: "translateY(0)"
    }
  },
  
  viewBtn: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    background: "#2563eb",
    color: "#fff"
  },
  
  chatBtn: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    background: "#25d366",
    color: "#fff"
  },
  
  agreementBtn: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    background: "#7c3aed",
    color: "#fff"
  },
  
  serviceBtn: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    background: "#f59e0b",
    color: "#fff"
  },
  
  payButton: {
    width: "100%",
    padding: "14px",
    background: "#e11d48",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    ":hover": {
      background: "#be123c"
    },
    ":disabled": {
      background: "#94a3b8",
      cursor: "not-allowed"
    }
  },
  
  confirmedContainer: {
    marginTop: 16
  },
  
  confirmedBadge: {
    background: "#16a34a",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 14,
    fontWeight: 500
  },
  
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 20
  },
  
  modalContent: {
    background: "#fff",
    borderRadius: 28,
    padding: "clamp(20px, 5vw, 32px)",
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
  },
  
  modalCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    fontSize: 18,
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
    ":hover": {
      background: "#e2e8f0"
    }
  },
  
  modalTitle: {
    fontSize: "clamp(20px, 5vw, 24px)",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 24,
    background: "linear-gradient(135deg, #2563eb, #4CAF50)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  
  amountBox: {
    background: "linear-gradient(135deg, #2563eb, #4CAF50)",
    color: "#fff",
    padding: "16px 20px",
    borderRadius: 16,
    flex: 1,
    marginRight: 16
  },
  
  amountLabel: {
    display: "block",
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 4
  },
  
  amountValue: {
    display: "block",
    fontSize: "clamp(20px, 4vw, 24px)",
    fontWeight: 700
  },
  
  timerContainer: {
    position: "relative",
    width: 70,
    height: 70
  },
  
  timerCircle: {
    transition: "stroke-dashoffset 1s linear"
  },
  
  timerText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center"
  },
  
  orderIdBox: {
    background: "#f8fafc",
    padding: "12px 16px",
    borderRadius: 14,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  
  orderIdLabel: {
    fontSize: 14,
    color: "#64748b",
    whiteSpace: "nowrap"
  },
  
  orderIdValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
    wordBreak: "break-all",
    flex: 1
  },
  
  copyBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    transition: "background 0.2s",
    ":hover": {
      background: "#e2e8f0"
    }
  },
  
  accountCard: {
    background: "#eff6ff",
    border: "2px solid #2563eb",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 16
  },
  
  accountIcon: {
    fontSize: 32,
    background: "#2563eb",
    color: "#fff",
    width: 54,
    height: 54,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%"
  },
  
  accountInfo: {
    flex: 1
  },
  
  accountRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
    ":lastChild": {
      marginBottom: 0
    }
  },
  
  accountValue: {
    fontWeight: 700,
    color: "#2563eb"
  },
  
  qrContainer: {
    textAlign: "center",
    marginBottom: 20,
    background: "#fff",
    padding: 16,
    borderRadius: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  
  qrImage: {
    width: "min(250px, 70vw)",
    height: "auto",
    aspectRatio: "1",
    borderRadius: 16
  },
  
  upiLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "14px",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 16,
    transition: "transform 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
      background: "#1d4ed8"
    }
  },
  
  warningBox: {
    background: "#fff3cd",
    border: "1px solid #ffeeba",
    borderRadius: 14,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20
  },
  
  warningText: {
    fontSize: 13,
    color: "#856404",
    lineHeight: 1.5
  },
  
  uploadContainer: {
    marginBottom: 20
  },
  
  hiddenInput: {
    display: "none"
  },
  
  uploadLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "#f8fafc",
    border: "2px dashed #cbd5e1",
    borderRadius: 14,
    padding: "16px",
    cursor: "pointer",
    fontSize: 14,
    color: "#475569",
    transition: "border-color 0.2s, background 0.2s",
    ":hover": {
      borderColor: "#2563eb",
      background: "#f1f5f9"
    }
  },
  
  previewContainer: {
    marginTop: 12,
    position: "relative",
    display: "inline-block"
  },
  
  previewImage: {
    maxWidth: "100%",
    maxHeight: 150,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    background: "#e11d48",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
    ":hover": {
      transform: "scale(1.1)"
    }
  },
  
  modalActions: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  
  submitButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "16px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    ":hover": {
      background: "#15803d"
    },
    ":disabled": {
      background: "#94a3b8",
      cursor: "not-allowed"
    }
  },
  
  refreshButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "16px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    ":hover": {
      background: "#1d4ed8"
    },
    ":disabled": {
      background: "#94a3b8",
      cursor: "not-allowed"
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
    marginRight: 8,
    verticalAlign: "middle"
  },
  
  modalError: {
    marginTop: 16,
    padding: "12px 16px",
    background: "#fee2e2",
    color: "#e11d48",
    borderRadius: 12,
    fontSize: 14,
    textAlign: "center"
  }
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default UserBookingHistory;