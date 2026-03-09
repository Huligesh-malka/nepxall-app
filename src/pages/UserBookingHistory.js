import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const UserBookingHistory = () => {
  const navigate = useNavigate();

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

  //////////////////////////////////////////////////////
  // TIMER FUNCTIONS
  //////////////////////////////////////////////////////
  const startTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeLeft(300); // Reset to 5 minutes
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
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 180) return "#4CAF50"; // Green
    if (timeLeft > 60) return "#FF9800"; // Orange
    return "#f44336"; // Red
  };

  //////////////////////////////////////////////////////
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/user/history");
      setBookings(res.data || []);
      
      // Check payment status for each booking
      if (res.data && res.data.length > 0) {
        await checkAllPaymentStatuses(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  }, []);

  //////////////////////////////////////////////////////
  // CHECK PAYMENT STATUS FOR ALL BOOKINGS
  //////////////////////////////////////////////////////
  const checkAllPaymentStatuses = async (bookingsList) => {
    try {
      const statusMap = {};
      
      for (const booking of bookingsList) {
        try {
          const res = await api.get(`/payments/status/${booking.id}`);
          if (res.data.success && res.data.data) {
            statusMap[booking.id] = res.data.data.status;
          }
        } catch (err) {
          console.log(`No payment found for booking ${booking.id}`);
        }
      }
      
      setPaymentStatuses(statusMap);
    } catch (err) {
      console.error("Error checking payment statuses:", err);
    }
  };

  useEffect(() => {
    loadBookings();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loadBookings]);

  //////////////////////////////////////////////////////
  // CREATE UPI PAYMENT
  //////////////////////////////////////////////////////
  const handlePayNow = async (booking) => {
    try {
      setPayingId(booking.id);

      const rent = Number(booking.rent_amount || booking.rent || 0);
      const deposit = Number(booking.security_deposit || 0);
      const maintenance = Number(booking.maintenance_amount || 0);

      const total =
        Number(booking.total_amount) || rent + deposit + maintenance;

      if (!total || total <= 0) {
        alert("Invalid payment amount");
        return;
      }

      const res = await api.post("/payments/create-payment", {
        bookingId: booking.id,
        amount: total,
      });

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: total,
        bookingId: booking.id
      });

      // Start the timer
      startTimer();

      // Reset upload states
      setScreenshot(null);
      setScreenshotPreview("");

    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      alert("Payment initialization failed");
    } finally {
      setPayingId(null);
    }
  };

  //////////////////////////////////////////////////////
  // HANDLE SCREENSHOT UPLOAD
  //////////////////////////////////////////////////////
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Please upload less than 5MB");
        return;
      }
      
      // Check file type
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
    }
  };

  //////////////////////////////////////////////////////
  // SUBMIT PAYMENT WITH SCREENSHOT
  //////////////////////////////////////////////////////
  const submitPaymentWithScreenshot = async () => {
    if (!screenshot) {
      alert("Please upload payment screenshot");
      return;
    }

    if (isExpired) {
      alert("⏰ Payment time expired. Please generate QR again.");
      return;
    }

    try {
      setUploading(true);

      // Create form data
      const formData = new FormData();
      formData.append("orderId", paymentData.orderId);
      formData.append("screenshot", screenshot);

      await api.post("/payments/submit-screenshot", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("✅ Payment submitted successfully! Waiting for admin verification.");

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Update payment status locally
      setPaymentStatuses(prev => ({
        ...prev,
        [paymentData.bookingId]: "submitted"
      }));

      // Close modal and refresh
      setPaymentData(null);
      setScreenshot(null);
      setScreenshotPreview("");
      loadBookings();

    } catch (err) {
      console.error(err);
      alert("Failed to submit payment. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  //////////////////////////////////////////////////////
  // REFRESH QR (if expired)
  //////////////////////////////////////////////////////
  const refreshQR = async () => {
    if (!paymentData) return;
    
    try {
      setUploading(true);
      
      const res = await api.post("/payments/create-payment", {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
      });

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: paymentData.amount,
        bookingId: paymentData.bookingId
      });

      // Restart timer
      startTimer();
      
    } catch (err) {
      console.error("REFRESH QR ERROR:", err);
      alert("Failed to refresh QR code");
    } finally {
      setUploading(false);
    }
  };

  //////////////////////////////////////////////////////
  // GET PAYMENT STATUS DISPLAY
  //////////////////////////////////////////////////////
  const getPaymentStatusDisplay = (bookingId, bookingStatus) => {
    const status = paymentStatuses[bookingId];
    
    if (!status) {
      // No payment yet
      if (bookingStatus === "approved") {
        return {
          showPayButton: true,
          message: null,
          badge: null
        };
      }
      return {
        showPayButton: false,
        message: null,
        badge: null
      };
    }

    switch(status) {
      case "paid":
        return {
          showPayButton: false,
          message: null,
          badge: <div style={paidBadge}>✅ Payment Verified</div>
        };
      
      case "submitted":
        return {
          showPayButton: false,
          message: <div style={submittedMessage}>⏳ Payment submitted. Waiting for admin verification...</div>,
          badge: <div style={submittedBadge}>⏳ Pending Verification</div>
        };
      
      case "rejected":
        return {
          showPayButton: true,
          message: <div style={rejectedMessage}>❌ Payment was rejected. Please pay again with correct screenshot.</div>,
          badge: <div style={rejectedBadge}>❌ Payment Rejected</div>
        };
      
      case "pending":
        return {
          showPayButton: true,
          message: null,
          badge: <div style={pendingBadge}>💰 Payment Pending</div>
        };
      
      default:
        return {
          showPayButton: bookingStatus === "approved",
          message: null,
          badge: null
        };
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  if (loading)
    return (
      <div style={loadingContainer}>
        <div style={loadingSpinner}></div>
        <p style={{ color: "#64748b", marginTop: 16 }}>Loading your bookings...</p>
      </div>
    );

  if (error)
    return (
      <div style={errorBox}>
        <p style={{ color: "#e11d48", marginBottom: 16 }}>{error}</p>
        <button style={retryBtn} onClick={loadBookings}>
          Retry
        </button>
      </div>
    );

  return (
    <div style={container}>
      <h2 style={title}>
        <span style={{ color: "#0B5ED7" }}>📜 My</span>{" "}
        <span style={{ color: "#4CAF50" }}>Bookings</span>
      </h2>

      {bookings.length === 0 ? (
        <div style={emptyState}>
          <p style={{ color: "#64748b", marginBottom: 20 }}>No bookings found</p>
          <button style={browseBtn} onClick={() => navigate("/")}>
            Browse Properties
          </button>
        </div>
      ) : (
        <div style={bookingsGrid}>
          {bookings.map((b) => {
            const rent = Number(b.rent_amount || b.rent || 0);
            const deposit = Number(b.security_deposit || 0);
            const maintenance = Number(b.maintenance_amount || 0);
            const total = Number(b.total_amount) || rent + deposit + maintenance;
            
            const paymentStatus = getPaymentStatusDisplay(b.id, b.status);
            
            const showPayButton = paymentStatuses[b.id] === "rejected" 
              ? true
              : (paymentStatus.showPayButton && b.status === "approved");

            return (
              <div key={b.id} style={card}>
                <div style={cardHeader}>
                  <div style={headerLeft}>
                    <h3 style={pgName}>{b.pg_name || "PG Name"}</h3>
                    <span style={roomTypeBadge}>{b.room_type || "Single Room"}</span>
                  </div>
                  <span style={statusBadge(b.status)}>
                    {b.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>

                {paymentStatus.badge && (
                  <div style={badgeContainer}>
                    {paymentStatus.badge}
                  </div>
                )}

                <div style={detailsGrid}>
                  <div style={detailItem}>
                    <span style={detailIcon}>📞</span>
                    <span>{b.phone || "N/A"}</span>
                  </div>
                  <div style={detailItem}>
                    <span style={detailIcon}>📅</span>
                    <span>
                      {b.check_in_date
                        ? new Date(b.check_in_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : "N/A"}
                    </span>
                  </div>
                  {b.room_no && (
                    <div style={detailItem}>
                      <span style={detailIcon}>🚪</span>
                      <span>Room {b.room_no}</span>
                    </div>
                  )}
                </div>

                <div style={priceBreakdown}>
                  <div style={priceRow}>
                    <span>💸 Rent</span>
                    <span style={priceValue}>₹{rent.toLocaleString()}</span>
                  </div>
                  <div style={priceRow}>
                    <span>🔐 Deposit</span>
                    <span style={priceValue}>₹{deposit.toLocaleString()}</span>
                  </div>
                  <div style={priceRow}>
                    <span>🧰 Maintenance</span>
                    <span style={priceValue}>₹{maintenance.toLocaleString()}</span>
                  </div>
                  <div style={totalPriceRow}>
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={totalPriceValue}>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {paymentStatus.message && (
                  <div style={messageContainer}>
                    {paymentStatus.message}
                  </div>
                )}

                <div style={actionButtons}>
                  <button style={viewBtn} onClick={() => navigate(`/pg/${b.pg_id}`)}>
                    🏠 View
                  </button>
                  <button style={chatBtn} onClick={() => navigate(`/chat/private/${b.owner_id}`)}>
                    💬 Chat
                  </button>
                  <button style={agreementBtn} onClick={() => navigate(`/agreement/${b.id}`)}>
                    📄 Agreement
                  </button>
                  <button style={serviceBtn} onClick={() => navigate(`/user/services/${b.id}`)}>
                    🚚 Services
                  </button>
                </div>

                {showPayButton && (
                  <button
                    style={payBtn}
                    onClick={() => handlePayNow(b)}
                    disabled={payingId === b.id}
                  >
                    {payingId === b.id ? (
                      <>
                        <span style={spinner}></span>
                        Processing...
                      </>
                    ) : (
                      `💳 Pay ₹${total.toLocaleString()}`
                    )}
                  </button>
                )}

                {b.status === "confirmed" && paymentStatuses[b.id] === "paid" && (
                  <div style={confirmedContainer}>
                    <div style={paidBadge}>✅ Payment Verified - Booking Confirmed</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Payment Modal with Timer */}
      {paymentData && (
        <div style={modalOverlay}>
          <div style={modernPaymentModal}>
            <button style={modalCloseBtn} onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setPaymentData(null);
              setScreenshot(null);
              setScreenshotPreview("");
            }}>✕</button>
            
            <h3 style={modalTitle}>Complete Payment</h3>

            {/* Timer Display */}
            <div style={timerContainer}>
              <div style={timerCircle}>
                <svg width="80" height="80" viewBox="0 0 100 100">
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
                    stroke={getTimerColor()}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={2 * Math.PI * 45 * (1 - timeLeft / 300)}
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div style={timerText}>
                  <span style={{ fontSize: 24, fontWeight: "bold", color: getTimerColor() }}>
                    {formatTime(timeLeft)}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>remaining</span>
                </div>
              </div>
            </div>

            {/* Amount and Order ID */}
            <div style={amountContainer}>
              <div style={amountBox}>
                <span style={amountLabel}>Amount</span>
                <span style={amountValue}>₹{paymentData.amount.toLocaleString()}</span>
              </div>
              <div style={orderIdBox}>
                <span style={orderIdLabel}>Order ID</span>
                <span style={orderIdValue}>{paymentData.orderId}</span>
              </div>
            </div>

            {/* UPI Details */}
            <div style={upiDetailsContainer}>
              <div style={upiDetailItem}>
                <span style={upiDetailLabel}>UPI ID:</span>
                <span style={upiDetailValue}>huligeshmalka-1@oksbi</span>
              </div>
              <div style={upiDetailItem}>
                <span style={upiDetailLabel}>Account:</span>
                <span style={upiDetailValue}>Huligesh</span>
              </div>
            </div>

            {/* QR Code */}
            <div style={qrContainer}>
              <img 
                src={paymentData.qr} 
                alt="UPI QR" 
                style={qrImage}
              />
            </div>

            {/* UPI Link */}
            <a
              href={paymentData.upiLink}
              target="_blank"
              rel="noopener noreferrer"
              style={upiLinkButton}
            >
              <span style={upiLinkIcon}>📱</span>
              Open in UPI App
            </a>

            {/* Warning Message */}
            <div style={warningBox}>
              <span style={warningIcon}>⚠️</span>
              <span style={warningText}>Pay only once. Multiple payments will be rejected.</span>
            </div>

            {/* Screenshot Upload */}
            <div style={uploadContainer}>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                style={{ display: "none" }}
                id="screenshot-upload"
              />
              <label htmlFor="screenshot-upload" style={uploadLabel}>
                <span style={uploadIcon}>📸</span>
                {screenshot ? "Change Screenshot" : "Upload Payment Screenshot"}
              </label>
              
              {screenshotPreview && (
                <div style={previewContainer}>
                  <img
                    src={screenshotPreview}
                    alt="Preview"
                    style={previewImage}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={modalActions}>
              {isExpired ? (
                <button
                  style={refreshButton}
                  onClick={refreshQR}
                  disabled={uploading}
                >
                  {uploading ? "Refreshing..." : "⟳ Refresh QR"}
                </button>
              ) : (
                <button
                  style={submitButton}
                  onClick={submitPaymentWithScreenshot}
                  disabled={uploading || !screenshot || isExpired}
                >
                  {uploading ? (
                    <>
                      <span style={spinner}></span>
                      Submitting...
                    </>
                  ) : (
                    "✅ Submit for Verification"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

//////////////////////////////////////////////////////
// MODERN STYLES
//////////////////////////////////////////////////////

const container = {
  maxWidth: 1200,
  margin: "40px auto",
  padding: "0 20px"
};

const title = {
  fontSize: 32,
  fontWeight: 700,
  marginBottom: 40,
  textAlign: "center"
};

const bookingsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
  gap: 24
};

const card = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  transition: "transform 0.2s, boxShadow 0.2s",
  cursor: "pointer",
  ":hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
  }
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16
};

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: 12
};

const pgName = {
  fontSize: 18,
  fontWeight: 600,
  margin: 0,
  color: "#1e293b"
};

const roomTypeBadge = {
  background: "#e2e8f0",
  color: "#475569",
  padding: "4px 8px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500
};

const badgeContainer = {
  marginBottom: 16
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginBottom: 16
};

const detailItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  color: "#64748b"
};

const detailIcon = {
  fontSize: 16
};

const priceBreakdown = {
  background: "#f8fafc",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16
};

const priceRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 8,
  fontSize: 14,
  color: "#475569"
};

const priceValue = {
  fontWeight: 500,
  color: "#1e293b"
};

const totalPriceRow = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 8,
  paddingTop: 8,
  borderTop: "1px solid #e2e8f0",
  fontSize: 16
};

const totalPriceValue = {
  fontWeight: 700,
  color: "#0B5ED7"
};

const actionButtons = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  marginBottom: 16
};

const serviceBtn = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  background: "#f59e0b",
  color: "#fff",
  cursor: "pointer",
  transition: "opacity 0.2s",
  ":hover": { opacity: 0.9 }
};

const viewBtn = { ...serviceBtn, background: "#2563eb" };
const chatBtn = { ...serviceBtn, background: "#25d366" };
const agreementBtn = { ...serviceBtn, background: "#7c3aed" };

const payBtn = {
  ...serviceBtn,
  background: "#e11d48",
  width: "100%",
  marginTop: 8,
  padding: "12px",
  fontSize: 14
};

const loadingContainer = {
  textAlign: "center",
  padding: "60px 20px"
};

const loadingSpinner = {
  width: 50,
  height: 50,
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #0B5ED7",
  borderRadius: "50%",
  margin: "0 auto",
  animation: "spin 1s linear infinite"
};

const errorBox = {
  textAlign: "center",
  padding: 60
};

const retryBtn = {
  padding: "12px 24px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  cursor: "pointer"
};

const emptyState = {
  textAlign: "center",
  padding: 60
};

const browseBtn = {
  padding: "14px 28px",
  background: "linear-gradient(90deg, #0B5ED7 0%, #4CAF50 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(11,94,215,0.3)"
};

const confirmedContainer = {
  marginTop: 16
};

const paidBadge = {
  background: "#16a34a",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 20,
  display: "inline-block",
  fontSize: 13,
  fontWeight: 500
};

const submittedBadge = {
  background: "#f59e0b",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 20,
  display: "inline-block",
  fontSize: 12,
  fontWeight: 500
};

const rejectedBadge = {
  background: "#e11d48",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 20,
  display: "inline-block",
  fontSize: 12,
  fontWeight: 500
};

const pendingBadge = {
  background: "#6b7280",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 20,
  display: "inline-block",
  fontSize: 12,
  fontWeight: 500
};

const submittedMessage = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "12px",
  borderRadius: 8,
  fontSize: 13,
  lineHeight: 1.5
};

const rejectedMessage = {
  background: "#fee2e2",
  color: "#e11d48",
  padding: "12px",
  borderRadius: 8,
  fontSize: 13,
  lineHeight: 1.5
};

const messageContainer = {
  marginBottom: 16
};

const statusBadge = (status) => ({
  background: status === "confirmed" ? "#16a34a" : status === "approved" ? "#2563eb" : "#6b7280",
  color: "#fff",
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500
});

// Modal Styles
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  backdropFilter: "blur(5px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modernPaymentModal = {
  background: "#fff",
  borderRadius: 24,
  padding: 32,
  width: "90%",
  maxWidth: 450,
  maxHeight: "90vh",
  overflow: "auto",
  position: "relative",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
};

const modalCloseBtn = {
  position: "absolute",
  top: 16,
  right: 16,
  background: "none",
  border: "none",
  fontSize: 20,
  cursor: "pointer",
  color: "#64748b",
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  ":hover": { background: "#f1f5f9" }
};

const modalTitle = {
  fontSize: 24,
  fontWeight: 700,
  textAlign: "center",
  marginBottom: 24,
  background: "linear-gradient(90deg, #0B5ED7 0%, #4CAF50 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
};

const timerContainer = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 24
};

const timerCircle = {
  position: "relative",
  width: 100,
  height: 100
};

const timerText = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  textAlign: "center"
};

const amountContainer = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 20
};

const amountBox = {
  background: "linear-gradient(135deg, #0B5ED7 0%, #4CAF50 100%)",
  color: "#fff",
  padding: 16,
  borderRadius: 12,
  textAlign: "center"
};

const amountLabel = {
  display: "block",
  fontSize: 12,
  opacity: 0.9,
  marginBottom: 4
};

const amountValue = {
  display: "block",
  fontSize: 20,
  fontWeight: 700
};

const orderIdBox = {
  background: "#f1f5f9",
  padding: 16,
  borderRadius: 12,
  textAlign: "center"
};

const orderIdLabel = {
  display: "block",
  fontSize: 12,
  color: "#64748b",
  marginBottom: 4
};

const orderIdValue = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  color: "#1e293b",
  wordBreak: "break-all"
};

const upiDetailsContainer = {
  background: "#f8fafc",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20
};

const upiDetailItem = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 8,
  ":lastChild": { marginBottom: 0 }
};

const upiDetailLabel = {
  fontSize: 14,
  color: "#64748b"
};

const upiDetailValue = {
  fontSize: 14,
  fontWeight: 600,
  color: "#1e293b"
};

const qrContainer = {
  textAlign: "center",
  marginBottom: 20
};

const qrImage = {
  width: 200,
  height: 200,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
};

const upiLinkButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#2563eb",
  color: "#fff",
  textDecoration: "none",
  padding: "14px",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 500,
  marginBottom: 20,
  transition: "transform 0.2s",
  ":hover": { transform: "translateY(-2px)" }
};

const upiLinkIcon = {
  fontSize: 20
};

const warningBox = {
  background: "#fff3cd",
  border: "1px solid #ffeeba",
  borderRadius: 12,
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 20
};

const warningIcon = {
  fontSize: 20
};

const warningText = {
  fontSize: 13,
  color: "#856404",
  lineHeight: 1.5
};

const uploadContainer = {
  marginBottom: 20
};

const uploadLabel = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#f1f5f9",
  border: "2px dashed #94a3b8",
  borderRadius: 12,
  padding: "16px",
  cursor: "pointer",
  fontSize: 14,
  color: "#475569",
  transition: "border-color 0.2s",
  ":hover": { borderColor: "#0B5ED7" }
};

const uploadIcon = {
  fontSize: 20
};

const previewContainer = {
  marginTop: 12,
  textAlign: "center"
};

const previewImage = {
  maxWidth: "100%",
  maxHeight: 150,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const modalActions = {
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const submitButton = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "16px",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s",
  ":hover": { background: "#15803d" },
  ":disabled": { background: "#94a3b8", cursor: "not-allowed" }
};

const refreshButton = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "16px",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s",
  ":hover": { background: "#1d4ed8" }
};

const spinner = {
  display: "inline-block",
  width: 16,
  height: 16,
  border: "2px solid #fff",
  borderTop: "2px solid transparent",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  marginRight: 8
};

// Add keyframes for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default UserBookingHistory;