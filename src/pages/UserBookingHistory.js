import React, { useEffect, useState, useCallback } from "react";
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
  
  // State for screenshot upload
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [uploading, setUploading] = useState(false);

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
  }, [loadBookings]);

  //////////////////////////////////////////////////////
  // CREATE UPI PAYMENT - WITH ERROR HANDLING
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

      // Reset upload states
      setScreenshot(null);
      setScreenshotPreview("");

    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      
      // Handle existing payment error
      if (err.response?.data?.existingPayment) {
        const existing = err.response.data.existingPayment;
        
        if (existing.status === 'paid') {
          alert("✅ Payment already completed for this booking!");
        } else if (existing.status === 'submitted') {
          alert("⏳ You already have a payment pending verification. Please wait for admin approval.");
        } else if (existing.status === 'pending') {
          alert("💰 You already have a pending payment. Please complete it or wait.");
        }
        
        // Refresh to show correct status
        loadBookings();
      } else {
        alert(err.response?.data?.message || "Payment initialization failed");
      }
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
          
          // Show pay button for approved bookings OR rejected payments
          const showPayButton = b.status === "approved" || paymentStatuses[b.id] === "rejected";

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

      {/* Payment Modal with Screenshot Upload */}
      {paymentData && (
        <div style={paymentModal}>
          <h3 style={{ marginBottom: 20 }}>📱 Complete Payment</h3>

          <p style={{ fontSize: 18, fontWeight: "bold" }}>
            Amount: ₹{paymentData.amount}
          </p>
          <p style={{ fontSize: 12, color: "#666" }}>
            Order ID: {paymentData.orderId}
          </p>

          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <img 
              src={paymentData.qr} 
              alt="UPI QR" 
              style={{ width: 200, height: 200, border: "1px solid #ddd", padding: 10 }}
            />
          </div>

          <a
            href={paymentData.upiLink}
            target="_blank"
            rel="noopener noreferrer"
            style={upiLinkStyle}
          >
            Pay via UPI App
          </a>

          <p style={{ fontSize: 12, color: "#666", marginTop: 10 }}>
            After payment, upload screenshot and submit for verification
          </p>

          <p style={{ fontSize: 12, color: "#e11d48", fontWeight: "bold" }}>
            ⚠️ Important: Pay only once. Multiple payments will be rejected.
          </p>

          <div style={{ marginBottom: 15 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              style={{ display: "none" }}
              id="screenshot-upload"
            />
            <label
              htmlFor="screenshot-upload"
              style={uploadLabelStyle}
            >
              📸 {screenshot ? "Change Screenshot" : "Upload Payment Screenshot"}
            </label>
            
            {screenshotPreview && (
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <img
                  src={screenshotPreview}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 6 }}
                />
              </div>
            )}
          </div>

          <button
            style={uploading ? uploadingBtnStyle : submitButtonStyle}
            onClick={submitPaymentWithScreenshot}
            disabled={uploading || !screenshot}
          >
            {uploading ? "Submitting..." : "✅ Submit for Verification"}
          </button>

          <button
            style={closeButton}
            onClick={() => {
              setPaymentData(null);
              setScreenshot(null);
              setScreenshotPreview("");
            }}
          >
            Close
          </button>
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

const submitButtonStyle = {
  ...serviceBtn,
  background: "#16a34a",
  marginTop: 10,
  width: "100%",
  fontSize: 16,
  padding: "14px"
};

const uploadingBtnStyle = {
  ...submitButtonStyle,
  background: "#9ca3af",
  cursor: "not-allowed"
};

const closeButton = {
  ...serviceBtn,
  background: "#6b7280",
  marginTop: 10,
  width: "100%"
};

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

const paymentModal = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
  padding: 30,
  borderRadius: 12,
  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  textAlign: "center",
  width: "90%",
  maxWidth: 400,
  maxHeight: "90vh",
  overflow: "auto",
  zIndex: 1000
};

const upiLinkStyle = {
  ...serviceBtn,
  background: "#2563eb",
  textDecoration: "none",
  display: "inline-block",
  width: "100%",
  marginTop: 10,
  textAlign: "center"
};

const uploadLabelStyle = {
  display: "block",
  width: "100%",
  margin: "10px 0",
  padding: 12,
  background: "#f0f0f0",
  border: "2px dashed #ccc",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  color: "#333",
  textAlign: "center"
};

export default UserBookingHistory;