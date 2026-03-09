import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const UserBookingHistory = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  const [paymentData, setPaymentData] = useState(null);
  
  // New state for screenshot upload
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [utr, setUtr] = useState("");

  //////////////////////////////////////////////////////
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/user/history");
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
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

      // Reset upload states
      setScreenshot(null);
      setScreenshotPreview("");
      setUtr("");

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

    try {
      setUploading(true);

      // Create form data
      const formData = new FormData();
      formData.append("orderId", paymentData.orderId);
      formData.append("utr", utr);
      formData.append("screenshot", screenshot);

      // You'll need to add this endpoint to your backend
      await api.post("/payments/submit-screenshot", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("✅ Payment submitted successfully! Waiting for admin verification.");

      // Close modal and refresh
      setPaymentData(null);
      setScreenshot(null);
      setScreenshotPreview("");
      setUtr("");
      loadBookings();

    } catch (err) {
      console.error(err);
      alert("Failed to submit payment. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  //////////////////////////////////////////////////////
  // SUBMIT PAYMENT CONFIRMATION (Original - without screenshot)
  //////////////////////////////////////////////////////
  const submitPayment = async () => {
    try {
      await api.post("/payments/confirm-payment", {
        orderId: paymentData.orderId,
      });

      alert("Payment submitted successfully");

      setPaymentData(null);
      loadBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment");
    }
  };

  //////////////////////////////////////////////////////
  // CHECK PAYMENT STATUS COLOR
  //////////////////////////////////////////////////////
  const getPaymentStatusStyle = (booking) => {
    // You can check if payment exists for this booking
    // This would require a separate API call or include in booking data
    return {};
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

          const total =
            Number(b.total_amount) || rent + deposit + maintenance;

          return (
            <div key={b.id} style={card}>
              <div style={topRow}>
                <h3 style={pgName}>{b.pg_name || "PG Name"}</h3>
                <span style={statusBadge(b.status)}>
                  {b.status?.toUpperCase() || "PENDING"}
                </span>
              </div>

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

              {(b.status === "approved" || b.status === "confirmed") && (
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

              {b.status === "approved" && (
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

              {b.status === "confirmed" && (
                <div style={confirmedContainer}>
                  <div style={paidBadge}>✅ Paid</div>
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

          {/* QR Code */}
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <img 
              src={paymentData.qr} 
              alt="UPI QR" 
              style={{ width: 200, height: 200, border: "1px solid #ddd", padding: 10 }}
            />
          </div>

          {/* UPI Link */}
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

          {/* UTR Input (Optional) */}
          <input
            type="text"
            placeholder="Enter UTR number (optional)"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            style={inputStyle}
          />

          {/* Screenshot Upload */}
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
            
            {/* Preview */}
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

          {/* Submit Button */}
          <button
            style={uploading ? uploadingBtnStyle : paidButton}
            onClick={submitPaymentWithScreenshot}
            disabled={uploading || !screenshot}
          >
            {uploading ? "Submitting..." : "✅ Submit for Verification"}
          </button>

          {/* OR Divider */}
          <div style={{ margin: "15px 0", position: "relative" }}>
            <hr />
            <span style={orTextStyle}>OR</span>
          </div>

          {/* Original Submit Button (without screenshot) */}
          <button
            style={simplePaidButton}
            onClick={submitPayment}
          >
            Quick Confirm (No Screenshot)
          </button>

          <br />

          {/* Close Button */}
          <button
            style={closeButton}
            onClick={() => {
              setPaymentData(null);
              setScreenshot(null);
              setScreenshotPreview("");
              setUtr("");
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
const paidButton = { ...serviceBtn, background: "#16a34a", marginTop: 10, width: "80%" };
const uploadingBtnStyle = { ...serviceBtn, background: "#9ca3af", marginTop: 10, width: "80%", cursor: "not-allowed" };
const simplePaidButton = { ...serviceBtn, background: "#6b7280", marginTop: 5, width: "80%" };
const closeButton = { ...serviceBtn, background: "#6b7280", marginTop: 10, width: "80%" };

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
const topRow = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const pgName = { margin: 0 };
const statusBadge = (status) => ({ 
  background: status === "confirmed" ? "#16a34a" : "#6b7280", 
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
const paidBadge = { background: "#16a34a", color: "#fff", padding: "8px 16px", borderRadius: 20, display: "inline-block" };
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
  width: "80%",
  marginTop: 10
};

const inputStyle = {
  width: "80%",
  padding: 10,
  margin: "10px 0",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 14
};

const uploadLabelStyle = {
  display: "block",
  width: "80%",
  margin: "10px auto",
  padding: 12,
  background: "#f0f0f0",
  border: "2px dashed #ccc",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  color: "#333"
};

const orTextStyle = {
  position: "absolute",
  top: -10,
  left: "50%",
  transform: "translateX(-50%)",
  background: "#fff",
  padding: "0 10px",
  color: "#999",
  fontSize: 12
};

export default UserBookingHistory;