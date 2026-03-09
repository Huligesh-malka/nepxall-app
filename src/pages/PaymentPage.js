import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import api from "../api/api";

const PaymentPage = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");

  const [paymentData, setPaymentData] = useState(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({});

  //////////////////////////////////////////////////////
  // TOKEN
  //////////////////////////////////////////////////////
  const getToken = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      navigate("/login");
      return null;
    }

    return await user.getIdToken();
  }, [navigate]);

  //////////////////////////////////////////////////////
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.get("/bookings/user/history", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookings(res.data || []);
      
      // Check payment status for each booking
      res.data.forEach(async (booking) => {
        await checkPaymentStatus(booking.id);
      });

    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  //////////////////////////////////////////////////////
  // CHECK PAYMENT STATUS
  //////////////////////////////////////////////////////
  const checkPaymentStatus = async (bookingId) => {
    try {
      const token = await getToken();
      const res = await api.get(`/payments/status/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.data) {
        setPaymentStatus(prev => ({
          ...prev,
          [bookingId]: res.data.data.status
        }));
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  //////////////////////////////////////////////////////
  // CREATE PAYMENT
  //////////////////////////////////////////////////////
  const handlePayNow = async (booking) => {
    try {
      setPayingId(booking.id);
      setError("");

      const token = await getToken();

      const res = await api.post(
        "/payments/create-payment",
        {
          bookingId: booking.id,
          amount: booking.rent_amount || booking.rent || 1
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: booking.rent_amount || booking.rent,
        bookingId: booking.id
      });

      // Reset form
      setUtr("");
      setScreenshot(null);
      setScreenshotPreview("");

    } catch (err) {
      console.error(err);
      setError("Payment initialization failed");
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
  const submitPayment = async () => {
    if (!screenshot) {
      alert("Please upload payment screenshot");
      return;
    }

    try {
      setUploading(true);
      
      const token = await getToken();
      
      // Create form data
      const formData = new FormData();
      formData.append("orderId", paymentData.orderId);
      formData.append("utr", utr);
      formData.append("screenshot", screenshot);

      const res = await api.post("/payments/submit-screenshot", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.success) {
        alert("✅ Payment submitted successfully! Waiting for admin verification.");
        
        // Update payment status
        setPaymentStatus(prev => ({
          ...prev,
          [paymentData.bookingId]: "submitted"
        }));
        
        // Close payment modal
        setPaymentData(null);
        setUtr("");
        setScreenshot(null);
        setScreenshotPreview("");
        
        // Reload bookings
        loadBookings();
      }

    } catch (err) {
      console.error(err);
      alert("Failed to submit payment. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  //////////////////////////////////////////////////////
  // GET STATUS BADGE
  //////////////////////////////////////////////////////
  const getStatusBadge = (bookingId) => {
    const status = paymentStatus[bookingId];
    
    switch(status) {
      case "paid":
        return <span style={styles.statusPaid}>✅ Verified & Paid</span>;
      case "submitted":
        return <span style={styles.statusSubmitted}>⏳ Pending Admin Verification</span>;
      case "pending":
        return <span style={styles.statusPending}>💰 Payment Pending</span>;
      case "rejected":
        return <span style={styles.statusRejected}>❌ Payment Rejected</span>;
      default:
        return null;
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  if (loading) return <p style={{ padding: 30 }}>Loading...</p>;

  if (error) return <p style={{ padding: 30, color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h2>📜 My Bookings & Payments</h2>

      {bookings.length === 0 ? (
        <p>No bookings found</p>
      ) : (
        bookings.map((b) => (
          <div key={b.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3>{b.pg_name}</h3>
              {getStatusBadge(b.id)}
            </div>

            <p>📞 {b.phone}</p>
            <p>📅 Check-in: {new Date(b.check_in_date).toDateString()}</p>
            <p>💰 Amount: ₹{b.rent_amount || b.rent || 1}</p>

            {b.status === "approved" && !paymentStatus[b.id] && (
              <button
                style={styles.payBtn}
                onClick={() => handlePayNow(b)}
                disabled={payingId === b.id}
              >
                {payingId === b.id
                  ? "Processing..."
                  : `💳 Pay Now`}
              </button>
            )}

            {paymentStatus[b.id] === "submitted" && (
              <div style={styles.infoBox}>
                <p>✅ Payment submitted! Admin will verify shortly.</p>
              </div>
            )}

            {paymentStatus[b.id] === "paid" && (
              <div style={styles.successBox}>
                <p>🎉 Payment verified! Booking confirmed.</p>
              </div>
            )}

            {paymentStatus[b.id] === "rejected" && (
              <div style={styles.rejectedBox}>
                <p>❌ Payment rejected. Please contact support.</p>
                <button
                  style={styles.payBtn}
                  onClick={() => handlePayNow(b)}
                >
                  Pay Again
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Payment Modal */}
      {paymentData && (
        <div style={styles.modalOverlay}>
          <div style={styles.paymentBox}>
            <h3>📱 Complete Payment</h3>
            
            <p><strong>Amount:</strong> ₹{paymentData.amount}</p>
            <p><strong>Order ID:</strong> {paymentData.orderId}</p>

            {/* QR Code */}
            <div style={styles.qrContainer}>
              <img
                src={paymentData.qr}
                alt="UPI QR"
                style={styles.qrImage}
              />
            </div>

            {/* UPI Link */}
            <a
              href={paymentData.upiLink}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.upiBtn}
            >
              Pay via UPI App
            </a>

            <p style={styles.instructions}>
              After payment, upload screenshot and submit for verification
            </p>

            {/* UTR Input (Optional) */}
            <input
              type="text"
              placeholder="Enter UTR number (optional)"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              style={styles.input}
            />

            {/* Screenshot Upload */}
            <div style={styles.uploadArea}>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                style={styles.fileInput}
                id="screenshot-upload"
              />
              <label htmlFor="screenshot-upload" style={styles.uploadLabel}>
                📸 {screenshot ? "Change Screenshot" : "Upload Payment Screenshot"}
              </label>
              
              {screenshotPreview && (
                <div style={styles.previewContainer}>
                  <img 
                    src={screenshotPreview} 
                    alt="Preview" 
                    style={styles.previewImage}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              style={styles.submitBtn}
              onClick={submitPayment}
              disabled={uploading || !screenshot}
            >
              {uploading ? "Submitting..." : "Submit for Verification"}
            </button>

            {/* Close Button */}
            <button
              style={styles.closeBtn}
              onClick={() => {
                setPaymentData(null);
                setUtr("");
                setScreenshot(null);
                setScreenshotPreview("");
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////
const styles = {
  container: {
    maxWidth: 900,
    margin: "auto",
    padding: 20,
    fontFamily: "Arial, sans-serif"
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    position: "relative"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  statusPaid: {
    background: "#4CAF50",
    color: "white",
    padding: "5px 10px",
    borderRadius: 5,
    fontSize: 12
  },
  statusSubmitted: {
    background: "#FF9800",
    color: "white",
    padding: "5px 10px",
    borderRadius: 5,
    fontSize: 12
  },
  statusPending: {
    background: "#2196F3",
    color: "white",
    padding: "5px 10px",
    borderRadius: 5,
    fontSize: 12
  },
  statusRejected: {
    background: "#f44336",
    color: "white",
    padding: "5px 10px",
    borderRadius: 5,
    fontSize: 12
  },
  payBtn: {
    padding: "10px 18px",
    background: "#e11d48",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10
  },
  infoBox: {
    background: "#e3f2fd",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    color: "#1976d2"
  },
  successBox: {
    background: "#e8f5e9",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    color: "#4CAF50"
  },
  rejectedBox: {
    background: "#ffebee",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    color: "#f44336"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  paymentBox: {
    background: "#fff",
    padding: 30,
    borderRadius: 10,
    maxWidth: 400,
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto"
  },
  qrContainer: {
    textAlign: "center",
    margin: "20px 0"
  },
  qrImage: {
    width: 200,
    height: 200,
    border: "1px solid #ddd",
    padding: 10
  },
  upiBtn: {
    display: "block",
    textAlign: "center",
    padding: "12px 20px",
    background: "#4CAF50",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    marginBottom: 15
  },
  instructions: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 15
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    marginBottom: 15,
    fontSize: 14
  },
  uploadArea: {
    marginBottom: 15
  },
  fileInput: {
    display: "none"
  },
  uploadLabel: {
    display: "block",
    textAlign: "center",
    padding: "12px",
    background: "#f0f0f0",
    border: "2px dashed #ccc",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14
  },
  previewContainer: {
    textAlign: "center",
    marginTop: 10
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: 150,
    borderRadius: 6
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10
  },
  closeBtn: {
    width: "100%",
    padding: "10px",
    background: "#444",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14
  }
};

export default PaymentPage;