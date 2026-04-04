import React, { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";
const BRAND_RED = "#ef4444";
const BRAND_ORANGE = "#f59e0b";
const BRAND_GRAY = "#6b7280";

const UserActiveStay = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const receiptRef = useRef();
  const [selectedStay, setSelectedStay] = useState(null);

  /* --- REFUND FORM STATES --- */
  const [showRefundFormFor, setShowRefundFormFor] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundUpi, setRefundUpi] = useState("");
  const [confirmUpi, setConfirmUpi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* --- VACATE FORM STATES --- */
  const [showVacateFormFor, setShowVacateFormFor] = useState(null);
  const [vacateReason, setVacateReason] = useState("");
  const [vacateDate, setVacateDate] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  const loadStay = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
        setError(null);
      }
      
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const token = await user.getIdToken();
      const res = await api.get("/bookings/user/active-stay", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const staysData = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      setStays(staysData);
      
    } catch (err) {
      console.error("Error loading stays:", err);
      setError(err.response?.data?.message || "Failed to load your stays. Please try again.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadStay(true);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [loadStay, navigate]);

  const submitRefundRequest = async (stayId) => {
    if (!refundReason.trim()) {
      alert("Please provide a reason for refund.");
      return;
    }

    if (!refundUpi.trim()) {
      alert("Please provide a UPI ID for refund.");
      return;
    }

    if (refundUpi !== confirmUpi) {
      alert("UPI IDs do not match!");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await api.post(
        "/bookings/refunds/request",
        {
          bookingId: stayId,
          reason: refundReason.trim(),
          upi_id: refundUpi.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        alert("✅ Refund request submitted successfully.");
        await loadStay(false);
        setShowRefundFormFor(null);
        setRefundReason("");
        setRefundUpi("");
        setConfirmUpi("");
      }
    } catch (err) {
      console.error("Refund Error:", err);
      alert(err.response?.data?.message || "Refund request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitVacateRequest = async (stayId) => {
    if (!vacateReason.trim()) {
      alert("Please provide a reason for vacating.");
      return;
    }

    if (!vacateDate) {
      alert("Please select a vacate date.");
      return;
    }

    if (!accountNumber.trim()) {
      alert("Please provide account number.");
      return;
    }

    if (!ifscCode.trim()) {
      alert("Please provide IFSC code.");
      return;
    }

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await api.post(
        "/bookings/vacate/request",
        {
          bookingId: stayId,
          vacate_date: vacateDate,
          reason: vacateReason.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim().toUpperCase(),
          upi_id: upiId.trim() || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        alert("✅ Vacate request submitted successfully.");
        setShowVacateFormFor(null);
        setVacateReason("");
        setVacateDate("");
        setAccountNumber("");
        setIfscCode("");
        setUpiId("");
        await loadStay(false);
      }

    } catch (err) {
      console.error("Vacate Error:", err);
      alert(err.response?.data?.message || "Vacate request failed. Please try again.");
    }
  };

  const acceptRefund = async (bookingId) => {
    if (!window.confirm("Are you sure you want to accept this refund offer?")) {
      return;
    }

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      await api.post(
        "/bookings/refunds/accept",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Refund accepted successfully!");
      await loadStay(false);

    } catch (err) {
      console.error("Accept Refund Error:", err);
      alert(err.response?.data?.message || "Failed to accept refund. Please try again.");
    }
  };

  const rejectRefund = async (bookingId) => {
    if (!window.confirm("Are you sure you want to reject this refund offer?")) {
      return;
    }

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      await api.post(
        "/bookings/refunds/reject",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("❌ Refund rejected.");
      await loadStay(false);

    } catch (err) {
      console.error("Reject Refund Error:", err);
      alert(err.response?.data?.message || "Failed to reject refund. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Processing...";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${stay.order_id || "Booking"}.pdf`);
        setSelectedStay(null);
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
        alert("Failed to generate receipt. Please try again.");
        setSelectedStay(null);
      }
    }, 500);
  };

  const getVacateStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { background: "#fef3c7", color: "#92400e", icon: "⏳" };
      case "approved":
        return { background: "#dcfce7", color: "#166534", icon: "✅" };
      case "completed":
        return { background: "#e0e7ff", color: "#1e40af", icon: "✓" };
      default:
        return { background: "#f3f4f6", color: "#374151", icon: "📋" };
    }
  };

  const getRefundStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { text: "⏳ Pending", color: "#f59e0b" };
      case "approved":
        return { text: "✅ Approved", color: "#10b981" };
      case "paid":
        return { text: "💸 Paid", color: "#3b82f6" };
      case "rejected":
        return { text: "❌ Rejected", color: "#ef4444" };
      default:
        return { text: "❓ Unknown", color: "#6b7280" };
    }
  };

  const isRefundDisabled = isSubmitting || !refundReason.trim() || !refundUpi.trim() || refundUpi !== confirmUpi;

  if (loading) {
    return (
      <div style={container}>
        <div style={loadingContainer}>
          <div style={spinner}></div>
          <p style={{ textAlign: "center", color: "#6b7280" }}>⏳ Loading your stays...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={container}>
        <div style={emptyBox}>
          <h3 style={{ color: BRAND_RED }}>Error Loading Stays</h3>
          <p style={{ color: "#6b7280", marginBottom: 20 }}>{error}</p>
          <button style={btn} onClick={() => loadStay(true)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (stays.length === 0) {
    return (
      <div style={container}>
        <div style={emptyBox}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🏠</div>
          <h3 style={{ color: "#374151", marginBottom: "10px" }}>No Active Stays Found</h3>
          <p style={{ color: "#9ca3af", marginBottom: 20 }}>
            You don't have any confirmed bookings at the moment.
          </p>
          <button style={btn} onClick={() => navigate("/")}>
            Browse PGs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={pageHeader}>
        <h2 style={{ color: "#111827", margin: 0 }}>🏠 My Current Stays</h2>
        <p style={{ color: "#6b7280", marginTop: "5px" }}>{stays.length} active stay(s)</p>
      </div>

      {stays.map((stay) => (
        <div key={stay.id} style={card}>
          {/* VACATE STATUS BANNER */}
          {stay.vacate_status && (
            <div style={{
              ...vacateBanner,
              background: getVacateStatusStyle(stay.vacate_status).background
            }}>
              <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                {getVacateStatusStyle(stay.vacate_status).icon} Vacate Request Status: {stay.vacate_status.toUpperCase()}
              </p>
              {stay.vacate_date && (
                <p style={{ fontSize: "12px", marginTop: "5px" }}>
                  Vacate Date: {formatDate(stay.vacate_date)}
                </p>
              )}
              
              {/* Refund Status inside Vacate Banner */}
              {stay.refund_status && (
                <div style={refundStatusInline}>
                  <p style={{ fontWeight: "bold", fontSize: "13px", margin: 0 }}>
                    Refund Status: <span style={{ color: getRefundStatusStyle(stay.refund_status).color }}>
                      {getRefundStatusStyle(stay.refund_status).text}
                    </span>
                  </p>
                  {stay.refund_amount > 0 && (
                    <p style={{ margin: "5px 0 0 0", fontSize: "13px" }}>
                      💰 Refund Amount: ₹{stay.refund_amount}
                    </p>
                  )}
                  {stay.refund_status === "approved" && stay.user_approval === "pending" && (
                    <div style={refundActionButtons}>
                      <button
                        style={{ ...smallBtn, background: BRAND_GREEN }}
                        onClick={() => acceptRefund(stay.id)}
                      >
                        ✅ Accept
                      </button>
                      <button
                        style={{ ...smallBtn, background: BRAND_RED }}
                        onClick={() => rejectRefund(stay.id)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VACATE FORM */}
          {!stay.vacate_status && showVacateFormFor === stay.id && (
            <div style={formContainer}>
              <h3 style={{ color: BRAND_ORANGE, marginBottom: "15px" }}>🚪 Vacate Request Form</h3>
              
              <div style={inputGroup}>
                <label style={labelStyle}>Vacate Date *</label>
                <input
                  type="date"
                  style={inputField}
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Reason for Vacating *</label>
                <textarea
                  style={inputField}
                  placeholder="Please provide detailed reason..."
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  rows="3"
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Account Number *</label>
                <input
                  style={inputField}
                  placeholder="Enter bank account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ''))}
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>IFSC Code *</label>
                <input
                  style={inputField}
                  placeholder="Enter IFSC code (e.g., SBIN0001234)"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>UPI ID (Optional)</label>
                <input
                  style={inputField}
                  placeholder="name@bank (if preferred over bank transfer)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>

              <div style={btnRow}>
                <button
                  style={{ ...btn, background: BRAND_GRAY }}
                  onClick={() => {
                    setShowVacateFormFor(null);
                    setVacateReason("");
                    setVacateDate("");
                    setAccountNumber("");
                    setIfscCode("");
                    setUpiId("");
                  }}
                >
                  Cancel
                </button>
                <button
                  style={{ ...btn, background: BRAND_ORANGE }}
                  onClick={() => submitVacateRequest(stay.id)}
                >
                  Submit Vacate Request
                </button>
              </div>
            </div>
          )}

          {/* REFUND FORM */}
          {showRefundFormFor === stay.id && (
            <div style={formContainer}>
              {stay.refund_status ? (
                <div style={refundStatusDisplay}>
                  <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "10px" }}>
                    {getRefundStatusStyle(stay.refund_status).text}
                  </div>
                  {stay.refund_status === "rejected" && (
                    <button 
                      style={{ ...btn, background: BRAND_BLUE, marginTop: "10px" }}
                      onClick={() => {
                        setShowRefundFormFor(null);
                        // Reset form for retry
                        setRefundReason("");
                        setRefundUpi("");
                        setConfirmUpi("");
                      }}
                    >
                      Try Again
                    </button>
                  )}
                  {stay.refund_status !== "rejected" && (
                    <button 
                      style={{ ...btn, background: BRAND_GRAY }}
                      onClick={() => setShowRefundFormFor(null)}
                    >
                      Close
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <h3 style={{ color: BRAND_RED, marginBottom: "15px" }}>🔄 Request Refund</h3>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
                    Order ID: {stay.order_id}
                  </p>

                  <div style={inputGroup}>
                    <label style={labelStyle}>Refund Reason *</label>
                    <textarea
                      style={inputField}
                      placeholder="Tell us why you want a refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows="3"
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>UPI ID for Transfer *</label>
                    <input
                      style={inputField}
                      type="text"
                      placeholder="e.g., name@bank"
                      value={refundUpi}
                      onChange={(e) => setRefundUpi(e.target.value)}
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>Confirm UPI ID *</label>
                    <input
                      style={{ 
                        ...inputField, 
                        borderColor: confirmUpi && refundUpi !== confirmUpi ? BRAND_RED : "#ddd",
                        backgroundColor: confirmUpi && refundUpi === confirmUpi ? "#f0fdf4" : "#fff"
                      }}
                      type="text"
                      placeholder="Re-enter UPI ID"
                      value={confirmUpi}
                      onChange={(e) => setConfirmUpi(e.target.value)}
                    />
                    {confirmUpi && refundUpi !== confirmUpi && (
                      <span style={{ fontSize: '11px', color: BRAND_RED, marginTop: '5px', display: 'block' }}>
                        ⚠️ UPI IDs do not match
                      </span>
                    )}
                  </div>

                  <div style={btnRow}>
                    <button
                      style={{ ...btn, background: BRAND_GRAY }}
                      onClick={() => {
                        setShowRefundFormFor(null);
                        setConfirmUpi("");
                        setRefundUpi("");
                        setRefundReason("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      style={{ 
                        ...btn, 
                        background: isRefundDisabled ? "#f5c6c6" : BRAND_RED,
                        cursor: isRefundDisabled ? "not-allowed" : "pointer",
                        opacity: isRefundDisabled ? 0.7 : 1
                      }}
                      disabled={isRefundDisabled}
                      onClick={() => submitRefundRequest(stay.id)}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MAIN CONTENT - Only show when no form is open */}
          {!showRefundFormFor === stay.id && !showVacateFormFor === stay.id && (
            <>
              <div style={headerSection}>
                <div>
                  <h3 style={{ margin: 0, color: BRAND_BLUE }}>{stay.pg_name}</h3>
                  <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                    Booking ID: {stay.id}
                  </p>
                </div>
                <span style={verifiedBadge}>VERIFIED ✅</span>
              </div>

              <div style={infoGrid}>
                <div style={infoItem}>
                  <label style={labelStyle}>🚪 Allotted Room</label>
                  <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
                </div>
                <div style={infoItem}>
                  <label style={labelStyle}>👥 Sharing Type</label>
                  <p style={valStyle}>{stay.room_type || "N/A"}</p>
                </div>
                <div style={{ ...infoItem, gridColumn: "span 2" }}>
                  <label style={labelStyle}>🆔 Order ID</label>
                  <p style={{ ...valStyle, fontSize: "12px", color: BRAND_BLUE, wordBreak: "break-all" }}>
                    {stay.order_id || "N/A"}
                  </p>
                </div>
              </div>

              <div style={priceCard}>
                <div style={priceHeader}>
                  <span>💰 Payment Details</span>
                </div>
                <div style={priceDetails}>
                  <p style={priceRow}>
                    <span>Paid On:</span>
                    <span style={{ fontWeight: "700", color: BRAND_GREEN }}>{formatDate(stay.paid_date)}</span>
                  </p>
                  {stay.rent_amount > 0 && (
                    <p style={priceRow}>
                      <span>Monthly Rent:</span>
                      <span>₹{stay.rent_amount}</span>
                    </p>
                  )}
                  {stay.maintenance_amount > 0 && (
                    <p style={priceRow}>
                      <span>Maintenance:</span>
                      <span>₹{stay.maintenance_amount}</span>
                    </p>
                  )}
                  {stay.deposit_amount > 0 && (
                    <p style={{ ...priceRow, borderTop: "1px solid #e5e7eb", paddingTop: "10px", marginTop: "10px" }}>
                      <span>Security Deposit:</span>
                      <span style={{ fontWeight: "bold" }}>₹{stay.deposit_amount}</span>
                    </p>
                  )}
                  <div style={totalAmount}>
                    <span>Total Monthly Paid</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: BRAND_BLUE }}>
                      ₹{stay.monthly_total}
                    </span>
                  </div>
                </div>
              </div>

              <div style={btnRow}>
                <button style={secondaryBtn} onClick={() => navigate("/user/bookings")}>
                  📜 History
                </button>
                <button style={payBtn} onClick={() => navigate("/payment")}>
                  💳 Pay Rent
                </button>
                <button style={receiptBtn} onClick={() => handleDownloadReceipt(stay)}>
                  📥 Receipt
                </button>
                {stay.order_id && !stay.refund_status && (
                  <button
                    style={{ ...secondaryBtn, background: BRAND_RED, color: "#fff" }}
                    onClick={() => setShowRefundFormFor(stay.id)}
                  >
                    🔁 Refund
                  </button>
                )}
                {!stay.vacate_status && (
                  <button
                    style={{ ...secondaryBtn, background: BRAND_ORANGE, color: "#fff" }}
                    onClick={() => setShowVacateFormFor(stay.id)}
                  >
                    🚪 Vacate
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* HIDDEN RECEIPT TEMPLATE */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef} style={receiptWrapper}>
            <div style={receiptInner}>
              <div style={receiptHeaderModern}>
                <div>
                  <h1 style={logoModern}>
                    <span style={{ color: BRAND_BLUE }}>NEP</span>
                    <span style={{ color: BRAND_GREEN }}>XALL</span>
                  </h1>
                  <p style={taglineModern}>Next Places for Living</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h2 style={receiptTitleModern}>RENT RECEIPT</h2>
                  <p style={orderIdModern}>Order ID: {selectedStay.order_id || "N/A"}</p>
                  <p style={dateModern}>Date: {formatDate(selectedStay.paid_date || new Date())}</p>
                </div>
              </div>

              <div style={receiptBodyModern}>
                <div style={{ flex: 1 }}>
                  <div style={infoBlock}>
                    <label style={infoLabelModern}>👤 ISSUED TO</label>
                    <p style={infoValueModern}>{auth.currentUser?.displayName || "Valued Tenant"}</p>
                    <p style={infoSubModern}>Email: {auth.currentUser?.email || "N/A"}</p>
                  </div>
                  <div style={infoBlock}>
                    <label style={infoLabelModern}>🏠 PROPERTY DETAILS</label>
                    <p style={infoValueModern}>{selectedStay.pg_name}</p>
                    <p style={infoSubModern}>
                      {selectedStay.room_type} Sharing {selectedStay.room_no ? `| Room: ${selectedStay.room_no}` : ""}
                    </p>
                  </div>
                </div>
                <div style={statusBoxModern}>
                  <div style={statusIconModern}>✅</div>
                  <h3 style={{ ...statusTextModern, color: BRAND_GREEN }}>VERIFIED</h3>
                  <p style={dateModern}>Payment: Online</p>
                  <div style={amountModern}>₹{selectedStay.monthly_total}</div>
                </div>
              </div>

              <div style={tableModern}>
                <div style={tableHeaderModern}>
                  <span>📊 PAYMENT BREAKDOWN</span>
                  <span>Amount (₹)</span>
                </div>
                {selectedStay.rent_amount > 0 && (
                  <div style={tableRowModern}>
                    <span>Monthly Room Rent ({selectedStay.room_type})</span>
                    <span>{selectedStay.rent_amount}</span>
                  </div>
                )}
                {selectedStay.maintenance_amount > 0 && (
                  <div style={tableRowModern}>
                    <span>Maintenance Charges</span>
                    <span>{selectedStay.maintenance_amount}</span>
                  </div>
                )}
                <div style={{ ...tableRowModern, borderBottom: `2px solid ${BRAND_BLUE}`, fontWeight: "bold", background: "#f8fafc" }}>
                  <span>Total Amount Received</span>
                  <span>{selectedStay.monthly_total}</span>
                </div>
              </div>

              {selectedStay.deposit_amount > 0 && (
                <div style={depositBlock}>
                  <label style={infoLabelModern}>💳 SECURITY DEPOSIT</label>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={infoValueModern}>₹{selectedStay.deposit_amount}</span>
                    <span style={{ color: BRAND_GREEN, fontWeight: "bold" }}>✓ Paid (Refundable)</span>
                  </div>
                </div>
              )}

              <div style={footerModern}>
                <div style={{ textAlign: "left", marginBottom: "20px" }}>
                  <p>✔ Transaction ID: <strong>{selectedStay.order_id || "N/A"}</strong></p>
                  <p>✔ This is a digitally generated proof of stay</p>
                </div>
                <hr style={divider} />
                <p style={{ marginTop: "20px" }}>Thank you for choosing Nepxall!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */
const container = { 
  maxWidth: 700, 
  margin: "40px auto", 
  padding: "0 20px", 
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
};

const pageHeader = {
  marginBottom: "30px",
  paddingBottom: "15px",
  borderBottom: "2px solid #e5e7eb"
};

const loadingContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "400px"
};

const spinner = {
  width: "40px",
  height: "40px",
  border: "3px solid #f3f3f3",
  borderTop: `3px solid ${BRAND_BLUE}`,
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  marginBottom: "20px"
};

const card = { 
  background: "#fff", 
  padding: "25px", 
  borderRadius: "16px", 
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)", 
  border: "1px solid #e5e7eb", 
  marginBottom: "25px",
  transition: "transform 0.2s, box-shadow 0.2s",
  ':hover': {
    boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
  }
};

const headerSection = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "flex-start", 
  marginBottom: "20px" 
};

const infoGrid = { 
  display: "grid", 
  gridTemplateColumns: "1fr 1fr", 
  gap: "15px", 
  marginBottom: "20px" 
};

const infoItem = { 
  display: "flex", 
  flexDirection: "column" 
};

const labelStyle = { 
  fontSize: "11px", 
  color: "#6b7280", 
  textTransform: "uppercase", 
  letterSpacing: "0.5px", 
  fontWeight: "600",
  marginBottom: "5px"
};

const valStyle = { 
  margin: 0, 
  fontWeight: "700", 
  fontSize: "15px", 
  color: "#111827" 
};

const priceCard = {
  marginBottom: "20px",
  background: "#f9fafb",
  borderRadius: "12px",
  overflow: "hidden"
};

const priceHeader = {
  padding: "12px 15px",
  background: "#f3f4f6",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: "600",
  fontSize: "14px"
};

const priceDetails = {
  padding: "15px"
};

const priceRow = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center",
  color: "#4b5563", 
  margin: "8px 0", 
  fontSize: "14px" 
};

const totalAmount = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center", 
  marginTop: "15px", 
  paddingTop: "15px",
  borderTop: "2px solid #e5e7eb",
  fontWeight: "600"
};

const verifiedBadge = { 
  padding: "6px 12px", 
  borderRadius: "20px", 
  fontSize: "11px", 
  fontWeight: "bold", 
  background: "#dcfce7", 
  color: "#166534" 
};

const btnRow = { 
  display: "flex", 
  gap: "10px", 
  flexWrap: "wrap",
  marginTop: "10px"
};

const baseBtn = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  transition: "all 0.2s",
  ':hover': {
    transform: "translateY(-1px)",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
  }
};

const btn = { 
  ...baseBtn,
  background: BRAND_BLUE, 
  color: "#fff",
  flex: 1,
  minWidth: "100px"
};

const secondaryBtn = { 
  ...baseBtn,
  background: "#f3f4f6", 
  color: "#374151",
  flex: 1,
  minWidth: "90px"
};

const payBtn = { 
  ...btn, 
  background: BRAND_GREEN 
};

const receiptBtn = { 
  ...btn, 
  background: BRAND_GRAY 
};

const smallBtn = {
  padding: "6px 12px",
  fontSize: "12px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
  color: "#fff"
};

const emptyBox = { 
  textAlign: "center", 
  padding: "60px 20px", 
  background: "#fff", 
  borderRadius: "16px", 
  border: "2px dashed #e5e7eb" 
};

const formContainer = {
  marginTop: "20px",
  padding: "20px",
  background: "#f9fafb",
  borderRadius: "12px",
  border: "1px solid #e5e7eb"
};

const inputGroup = { 
  marginBottom: "15px" 
};

const inputField = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  marginTop: "5px",
  fontFamily: "inherit",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
  ':focus': {
    borderColor: BRAND_BLUE
  }
};

const vacateBanner = {
  padding: "15px",
  borderRadius: "8px",
  marginBottom: "20px",
  textAlign: "center"
};

const refundStatusInline = {
  marginTop: "10px",
  paddingTop: "10px",
  borderTop: "1px solid rgba(0,0,0,0.1)"
};

const refundActionButtons = {
  display: "flex",
  gap: "8px",
  marginTop: "10px",
  justifyContent: "center"
};

const refundStatusDisplay = {
  textAlign: "center",
  padding: "20px 0"
};

// Receipt styles
const receiptWrapper = {
  width: "210mm",
  minHeight: "297mm",
  padding: "40px",
  background: "#ffffff",
  fontFamily: "Helvetica, Arial, sans-serif"
};

const receiptInner = {
  maxWidth: "100%",
  margin: "0 auto"
};

const receiptHeaderModern = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  paddingBottom: "20px",
  marginBottom: "30px",
  borderBottom: `3px solid ${BRAND_BLUE}`
};

const logoModern = {
  margin: 0,
  fontSize: "32px",
  fontWeight: "900",
  letterSpacing: "-1px"
};

const taglineModern = {
  margin: "5px 0 0 0",
  fontSize: "11px",
  color: "#6b7280"
};

const receiptTitleModern = {
  margin: 0,
  fontSize: "20px",
  color: "#111827"
};

const orderIdModern = {
  margin: "5px 0 0 0",
  fontSize: "12px",
  fontWeight: "bold",
  color: BRAND_BLUE
};

const dateModern = {
  margin: "2px 0 0 0",
  fontSize: "11px",
  color: "#6b7280"
};

const receiptBodyModern = {
  display: "flex",
  gap: "30px",
  marginBottom: "30px"
};

const infoBlock = {
  marginBottom: "20px"
};

const infoLabelModern = {
  fontSize: "10px",
  color: "#9ca3af",
  fontWeight: "bold",
  letterSpacing: "1px",
  display: "block",
  marginBottom: "5px",
  textTransform: "uppercase"
};

const infoValueModern = {
  fontSize: "15px",
  fontWeight: "bold",
  margin: 0,
  color: "#111827"
};

const infoSubModern = {
  fontSize: "12px",
  color: "#4b5563",
  margin: "2px 0 0 0"
};

const statusBoxModern = {
  width: "180px",
  background: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "15px",
  textAlign: "center"
};

const statusIconModern = {
  fontSize: "28px",
  marginBottom: "5px"
};

const statusTextModern = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "bold"
};

const amountModern = {
  fontSize: "22px",
  fontWeight: "900",
  color: "#111827",
  marginTop: "10px"
};

const tableModern = {
  marginTop: "20px"
};

const tableHeaderModern = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 12px",
  background: BRAND_BLUE,
  color: "#fff",
  borderRadius: "8px 8px 0 0",
  fontWeight: "bold",
  fontSize: "12px"
};

const tableRowModern = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "13px"
};

const depositBlock = {
  marginTop: "25px",
  padding: "15px",
  background: "#f0f4f8",
  borderRadius: "10px"
};

const footerModern = {
  marginTop: "40px",
  textAlign: "center"
};

const divider = {
  border: "none",
  borderTop: "1px solid #e5e7eb",
  margin: "20px 0"
};

// Add keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default UserActiveStay;