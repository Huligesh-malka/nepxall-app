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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeLeft(300);
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
    if (timeLeft > 180) return "#4CAF50";
    if (timeLeft > 60) return "#FF9800";
    return "#f44336";
  };

  //////////////////////////////////////////////////////
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/user/history");
      setBookings(res.data || []);
      
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

      startTimer();
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
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Please upload less than 5MB");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        alert("Please upload only image files");
        return;
      }

      setScreenshot(file);
      
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

      const formData = new FormData();
      formData.append("orderId", paymentData.orderId);
      formData.append("screenshot", screenshot);

      await api.post("/payments/submit-screenshot", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("✅ Payment submitted successfully! Waiting for admin verification.");

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setPaymentStatuses(prev => ({
        ...prev,
        [paymentData.bookingId]: "submitted"
      }));

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
  // REFRESH QR
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
        <p>Loading your bookings...</p>
      </div>
    );

  if (error)
    return (
      <div style={errorBox}>
        {error}
        <br />
        <button style={retryBtn} onClick={loadBookings}>
          Retry
        </button>
      </div>
    );

  return (
    <div style={container}>
      <h2 style={title}>📜 My Bookings</h2>

      {bookings.length === 0 ? (
        <div style={emptyState}>
          <p>No bookings found</p>
          <button style={browseBtn} onClick={() => navigate("/")}>
            Browse Properties
          </button>
        </div>
      ) : (
        bookings.map((b) => {
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
              <div style={topRow}>
                <h3 style={pgName}>{b.pg_name || "PG Name"}</h3>
                <span style={statusBadge(b.status)}>
                  {b.status?.toUpperCase() || "PENDING"}
                </span>
              </div>

              {paymentStatus.badge && (
                <div style={{ marginTop: 10 }}>
                  {paymentStatus.badge}
                </div>
              )}

              <div style={detailsGrid}>
                <p style={detailItem}>📞 {b.phone || "N/A"}</p>
                <p style={detailItem}>
                  📅{" "}
                  {b.check_in_date
                    ? new Date(b.check_in_date).toDateString()
                    : "N/A"}
                </p>
                <p style={detailItem}>🛏 {b.room_type || "Single Room"}</p>
                {b.room_no && (
                  <p style={detailItem}>🚪 Room No: {b.room_no}</p>
                )}
              </div>

              <div style={priceBreakdown}>
                <p style={priceItem}>💸 Rent: ₹{rent.toLocaleString()}</p>
                <p style={priceItem}>
                  🔐 Deposit: ₹{deposit.toLocaleString()}
                </p>
                <p style={priceItem}>
                  🧰 Maintenance: ₹{maintenance.toLocaleString()}
                </p>
                <p style={totalPrice}>
                  <b>🧾 Total: ₹{total.toLocaleString()}</b>
                </p>
              </div>

              {paymentStatus.message && (
                <div style={{ marginTop: 10 }}>
                  {paymentStatus.message}
                </div>
              )}

              {(b.status === "approved" || b.status === "confirmed" || paymentStatuses[b.id] === "rejected") && (
                <div style={btnRow}>
                  <button
                    style={viewBtn}
                    onClick={() => navigate(`/pg/${b.pg_id}`)}
                  >
                    🏠 View PG
                  </button>

                  <button
                    style={chatBtn}
                    onClick={() => navigate(`/chat/private/${b.owner_id}`)}
                  >
                    💬 Chat Owner
                  </button>

                  <button
                    style={agreementBtn}
                    onClick={() => navigate(`/agreement/${b.id}`)}
                  >
                    📄 Preview Agreement
                  </button>

                  <button
                    style={serviceBtn}
                    onClick={() => navigate(`/user/services/${b.id}`)}
                  >
                    🚚 Add Services
                  </button>
                </div>
              )}

              {showPayButton && (
                <button
                  style={payBtn}
                  onClick={() => handlePayNow(b)}
                  disabled={payingId === b.id}
                >
                  {payingId === b.id
                    ? "Processing..."
                    : `💳 Pay ₹${total.toLocaleString()}`}
                </button>
              )}

              {b.status === "confirmed" && paymentStatuses[b.id] === "paid" && (
                <div style={confirmedContainer}>
                  <div style={paidBadge}>✅ Payment Verified - Booking Confirmed</div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Modern Payment Modal with Timer and Account Details INSIDE */}
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

            {/* Amount and Timer Row */}
            <div style={amountTimerRow}>
              <div style={amountBox}>
                <span style={amountLabel}>Amount</span>
                <span style={amountValue}>₹{paymentData.amount.toLocaleString()}</span>
              </div>
              
              {/* Timer Circle */}
              <div style={timerCircleContainer}>
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
                  <span style={{ fontSize: 16, fontWeight: "bold", color: getTimerColor() }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order ID */}
            <div style={orderIdBox}>
              <span style={orderIdLabel}>Order ID:</span>
              <span style={orderIdValue}>{paymentData.orderId}</span>
            </div>

            {/* Account Details - Prominently Displayed */}
            <div style={accountDetailsCard}>
              <div style={accountIcon}>🏦</div>
              <div style={accountInfo}>
                <div style={accountDetail}>
                  <span style={accountLabel}>UPI ID:</span>
                  <span style={accountValue}>huligeshmalka-1@oksbi</span>
                </div>
                <div style={accountDetail}>
                  <span style={accountLabel}>Account:</span>
                  <span style={accountValue}>Huligesh</span>
                </div>
              </div>
            </div>

            {/* Large QR Code */}
            <div style={qrContainer}>
              <img 
                src={paymentData.qr} 
                alt="UPI QR" 
                style={qrImage}
              />
            </div>

            {/* UPI Link Button */}
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
                  {uploading ? "Refreshing..." : "⟳ Refresh QR Code"}
                </button>
              ) : (
                <button
                  style={submitButton}
                  onClick={submitPaymentWithScreenshot}
                  disabled={uploading || !screenshot}
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
// STYLES
//////////////////////////////////////////////////////

const serviceBtn = {
  padding: "10px 18px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 14,
  background: "#f59e0b",
  color: "#fff",
};

const viewBtn = { ...serviceBtn, background: "#2563eb" };
const chatBtn = { ...serviceBtn, background: "#25d366" };
const agreementBtn = { ...serviceBtn, background: "#7c3aed" };
const payBtn = { ...serviceBtn, background: "#e11d48", width: "100%", marginTop: 10 };

const container = { maxWidth: 900, margin: "40px auto", padding: 20 };
const title = { marginBottom: 30, fontSize: 28, fontWeight: 600 };
const loadingContainer = { textAlign: "center", marginTop: 100 };
const loadingSpinner = { 
  width: 40, 
  height: 40, 
  border: "4px solid #f3f3f3", 
  borderTop: "4px solid #2563eb", 
  borderRadius: "50%", 
  margin: "0 auto 20px",
  animation: "spin 1s linear infinite"
};
const card = { background: "#fff", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" };
const topRow = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 };
const pgName = { margin: 0 };
const statusBadge = (status) => ({ 
  background: status === "confirmed" ? "#16a34a" : status === "approved" ? "#2563eb" : "#6b7280", 
  color: "#fff", 
  padding: "6px 12px", 
  borderRadius: 20, 
  fontSize: 12 
});
const detailsGrid = { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 };
const detailItem = { margin: 0 };
const priceBreakdown = { marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8 };
const priceItem = { margin: 4, fontSize: 14 };
const totalPrice = { marginTop: 8, fontSize: 16 };
const btnRow = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 };
const confirmedContainer = { marginTop: 16 };

const paidBadge = { 
  background: "#16a34a", 
  color: "#fff", 
  padding: "8px 16px", 
  borderRadius: 20, 
  display: "inline-block",
  fontSize: 14,
  fontWeight: "bold"
};

const submittedBadge = {
  background: "#f59e0b",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 20,
  display: "inline-block",
  fontSize: 14,
  fontWeight: "bold"
};

const rejectedBadge = {
  background: "#e11d48",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 20,
  display: "inline-block",
  fontSize: 14,
  fontWeight: "bold"
};

const pendingBadge = {
  background: "#6b7280",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 20,
  display: "inline-block",
  fontSize: 14,
  fontWeight: "bold"
};

const submittedMessage = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "12px",
  borderRadius: 8,
  fontSize: 14,
  marginTop: 10
};

const rejectedMessage = {
  background: "#fee2e2",
  color: "#e11d48",
  padding: "12px",
  borderRadius: 8,
  fontSize: 14,
  marginTop: 10
};

const errorBox = { padding: 40, textAlign: "center" };
const retryBtn = { padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const emptyState = { textAlign: "center", padding: 60 };
const browseBtn = { padding: "12px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };

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
  transition: "background 0.2s",
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

const amountTimerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20
};

const amountBox = {
  background: "linear-gradient(135deg, #0B5ED7 0%, #4CAF50 100%)",
  color: "#fff",
  padding: "16px 20px",
  borderRadius: 12,
  flex: 1,
  marginRight: 16
};

const amountLabel = {
  display: "block",
  fontSize: 12,
  opacity: 0.9,
  marginBottom: 4
};

const amountValue = {
  display: "block",
  fontSize: 24,
  fontWeight: 700
};

const timerCircleContainer = {
  position: "relative",
  width: 70,
  height: 70
};

const timerText = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  textAlign: "center"
};

const orderIdBox = {
  background: "#f1f5f9",
  padding: "12px 16px",
  borderRadius: 12,
  marginBottom: 20,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const orderIdLabel = {
  fontSize: 14,
  color: "#64748b"
};

const orderIdValue = {
  fontSize: 14,
  fontWeight: 600,
  color: "#1e293b",
  wordBreak: "break-all"
};

const accountDetailsCard = {
  background: "#e8f0fe",
  border: "2px solid #2563eb",
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
  display: "flex",
  alignItems: "center",
  gap: 16
};

const accountIcon = {
  fontSize: 32,
  background: "#2563eb",
  color: "#fff",
  width: 50,
  height: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%"
};

const accountInfo = {
  flex: 1
};

const accountDetail = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 8,
  ":lastChild": { marginBottom: 0 }
};

const accountLabel = {
  fontSize: 14,
  color: "#475569",
  fontWeight: 500
};

const accountValue = {
  fontSize: 15,
  fontWeight: 700,
  color: "#2563eb"
};

const qrContainer = {
  textAlign: "center",
  marginBottom: 20,
  background: "#f8fafc",
  padding: 20,
  borderRadius: 16
};

const qrImage = {
  width: 250,
  height: 250,
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
  marginBottom: 16,
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