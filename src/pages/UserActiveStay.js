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

const UserActiveStay = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const receiptRef = useRef();
  const [selectedStay, setSelectedStay] = useState(null);

  /* --- REFUND STATES --- */
  const [showRefundFormFor, setShowRefundFormFor] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundUpi, setRefundUpi] = useState("");
  const [confirmUpi, setConfirmUpi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* --- VACATE STATES --- */
  const [showVacateFormFor, setShowVacateFormFor] = useState(null);
  const [vacateSubmittedFor, setVacateSubmittedFor] = useState(null); // tracks submitted stay id
  const [vacateReason, setVacateReason] = useState("");
  const [vacateDate, setVacateDate] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  const loadStay = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await api.get("/bookings/user/active-stay", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStays(Array.isArray(res.data) ? res.data : res.data ? [res.data] : []);
    } catch (err) {
      console.error("Error loading stays:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      user ? loadStay(true) : navigate("/login");
    });
    return () => unsubscribe();
  }, [loadStay, navigate]);

  const submitRefundRequest = async (stayId) => {
    if (!refundReason || !refundUpi) {
      alert("Please provide both a reason and a UPI ID.");
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
        { bookingId: stayId, reason: refundReason, upi_id: refundUpi },
        { headers: { Authorization: `Bearer ${token}` } }
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
      alert(err.response?.data?.message || "Refund request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitVacateRequest = async (stayId) => {
    if (!vacateReason || !vacateDate) {
      alert("Please fill all required fields");
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
          reason: vacateReason,
          account_number: accountNumber,
          ifsc_code: ifscCode,
          upi_id: upiId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("✅ Vacate request submitted");
        setVacateSubmittedFor(stayId); // immediately show status view
        setVacateReason("");
        setVacateDate("");
        setAccountNumber("");
        setIfscCode("");
        setUpiId("");
        loadStay(false); // refresh in background
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Vacate failed");
    }
  };

  const acceptRefund = async (bookingId) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await api.post(
        "/bookings/refunds/accept",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Refund accepted");
      loadStay(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Accept failed");
    }
  };

  const rejectRefund = async (bookingId) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await api.post(
        "/bookings/refunds/reject",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("❌ Refund rejected");
      loadStay(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Reject failed");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Processing...";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
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
      }
    }, 500);
  };

  const isRefundDisabled =
    isSubmitting || !refundReason || !refundUpi || refundUpi !== confirmUpi;

  if (loading)
    return (
      <div style={container}>
        <p style={{ textAlign: "center", padding: 50 }}>⏳ Syncing your stays...</p>
      </div>
    );

  if (stays.length === 0)
    return (
      <div style={container}>
        <div style={emptyBox}>
          <h3 style={{ color: "#4b5563" }}>No Active Stays Found</h3>
          <p style={{ color: "#9ca3af", marginBottom: 20 }}>
            You don't have any confirmed bookings at the moment.
          </p>
          <button style={btn} onClick={() => navigate("/")}>
            Browse PGs
          </button>
        </div>
      </div>
    );

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 25, color: "#111827" }}>🏠 My Current Stays</h2>

      {stays.map((stay) => (
        <div key={stay.id} style={card}>

          {/* ===== VACATE FORM VIEW ===== */}
          {showVacateFormFor === stay.id ? (
            <div style={refundFormContainer}>

              {/* Show status if already submitted (from API) OR just submitted now (local) */}
              {stay.vacate_status || vacateSubmittedFor === stay.id ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    fontSize: "40px",
                    marginBottom: "10px"
                  }}>
                    {(stay.vacate_status === "approved") ? "✅" :
                     (stay.vacate_status === "completed") ? "✓" : "⏳"}
                  </div>
                  <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>
                    {(!stay.vacate_status || stay.vacate_status === "pending") && "Vacate Request Pending Approval"}
                    {stay.vacate_status === "approved" && "Vacate Request Approved"}
                    {stay.vacate_status === "completed" && "Vacate Completed"}
                  </div>
                  {stay.vacate_date && (
                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
                      Vacate Date: {formatDate(stay.vacate_date)}
                    </p>
                  )}
                  <button
                    style={{ ...btn, background: "#6b7280", flex: "none", width: "120px" }}
                    onClick={() => {
                      setShowVacateFormFor(null);
                      setVacateSubmittedFor(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ color: "#f59e0b", marginBottom: "15px" }}>🚪 Vacate Request</h3>

                  <div style={inputGroup}>
                    <label style={labelStyle}>Vacate Date *</label>
                    <input
                      type="date"
                      style={inputField}
                      value={vacateDate}
                      onChange={(e) => setVacateDate(e.target.value)}
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>Reason *</label>
                    <textarea
                      style={inputField}
                      placeholder="Why are you vacating?"
                      value={vacateReason}
                      onChange={(e) => setVacateReason(e.target.value)}
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>Account Number</label>
                    <input
                      style={inputField}
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>IFSC Code</label>
                    <input
                      style={inputField}
                      placeholder="Enter IFSC code"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>UPI ID (Optional)</label>
                    <input
                      style={inputField}
                      placeholder="name@bank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <div style={btnRow}>
                    <button
                      style={{ ...btn, background: "#6b7280" }}
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
                      style={{ ...btn, background: "#f59e0b" }}
                      onClick={() => submitVacateRequest(stay.id)}
                    >
                      Submit Vacate
                    </button>
                  </div>
                </>
              )}
            </div>

          /* ===== REFUND FORM VIEW ===== */
          ) : showRefundFormFor === stay.id ? (
            <div style={refundFormContainer}>
              {stay.refund_status ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "10px" }}>
                    {stay.refund_status === "pending" && "⏳ Waiting for Admin Approval"}
                    {stay.refund_status === "approved" && "✅ Approved - Processing"}
                    {stay.refund_status === "paid" && "💸 Refunded Successfully"}
                    {stay.refund_status === "rejected" && "❌ Rejected (You can retry)"}
                  </div>

                  {stay.refund_amount > 0 && (
                    <p style={{ marginBottom: "10px" }}>💰 Refund Amount: ₹{stay.refund_amount}</p>
                  )}

                  {stay.refund_status === "approved" && stay.user_approval === "pending" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                      <button
                        style={{ ...btn, background: "#4CAF50" }}
                        onClick={() => acceptRefund(stay.id)}
                      >
                        ✅ Accept
                      </button>
                      <button
                        style={{ ...btn, background: "#ef4444" }}
                        onClick={() => rejectRefund(stay.id)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  <button
                    style={{ ...btn, background: "#6b7280", flex: "none", width: "120px", marginTop: "15px" }}
                    onClick={() => setShowRefundFormFor(null)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ color: BRAND_RED, marginBottom: "15px" }}>Request Refund</h3>
                  <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>
                    Order ID: {stay.order_id}
                  </p>

                  <div style={inputGroup}>
                    <label style={labelStyle}>Refund Reason</label>
                    <textarea
                      style={inputField}
                      placeholder="Tell us why you want a refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>UPI ID for Transfer</label>
                    <input
                      style={inputField}
                      type="text"
                      placeholder="e.g. name@bank"
                      value={refundUpi}
                      onChange={(e) => setRefundUpi(e.target.value)}
                    />
                  </div>

                  <div style={inputGroup}>
                    <label style={labelStyle}>Confirm UPI ID</label>
                    <input
                      style={{
                        ...inputField,
                        borderColor:
                          confirmUpi && refundUpi !== confirmUpi ? BRAND_RED : "#ddd",
                        backgroundColor:
                          confirmUpi && refundUpi === confirmUpi ? "#f0fdf4" : "#fff",
                      }}
                      type="text"
                      placeholder="Re-enter UPI ID"
                      value={confirmUpi}
                      onChange={(e) => setConfirmUpi(e.target.value)}
                    />
                    {confirmUpi && refundUpi !== confirmUpi && (
                      <span style={{ fontSize: "10px", color: BRAND_RED }}>
                        UPI IDs do not match
                      </span>
                    )}
                  </div>

                  <div style={btnRow}>
                    <button
                      style={{ ...btn, background: "#6b7280" }}
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
                        background: isRefundDisabled ? "#cca7a7" : BRAND_RED,
                        cursor: isRefundDisabled ? "not-allowed" : "pointer",
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

          /* ===== MAIN CARD VIEW ===== */
          ) : (
            <>
              <div style={headerSection}>
                <h3 style={{ margin: 0, color: BRAND_BLUE }}>{stay.pg_name}</h3>
                <span style={statusBadge}>VERIFIED ✅</span>
              </div>

              {/* Vacate Status Banner - shown on main card when status exists or just submitted */}
              {(stay.vacate_status || vacateSubmittedFor === stay.id) && (
                <div
                  style={{
                    background:
                      stay.vacate_status === "approved"
                        ? "#dcfce7"
                        : stay.vacate_status === "completed"
                        ? "#e0e7ff"
                        : "#fef3c7",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontWeight: "bold", margin: 0, marginBottom: "4px" }}>
                    🚪 Vacate Request:
                    {(!stay.vacate_status || stay.vacate_status === "pending") && " ⏳ Pending Approval"}
                    {stay.vacate_status === "approved" && " ✅ Approved"}
                    {stay.vacate_status === "completed" && " ✓ Completed"}
                  </p>
                  {stay.vacate_date && (
                    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                      Vacate Date: {formatDate(stay.vacate_date)}
                    </p>
                  )}
                </div>
              )}

              <div style={infoGrid}>
                <div style={infoItem}>
                  <label style={labelStyle}>🚪 Allotted Room</label>
                  <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
                </div>
                <div style={infoItem}>
                  <label style={labelStyle}>👥 Sharing Type</label>
                  <p style={valStyle}>{stay.room_type || "N/A"}</p>
                </div>
                <div style={{ ...infoItem, gridColumn: "span 2", marginTop: "10px" }}>
                  <label style={labelStyle}>🆔 Order ID</label>
                  <p
                    style={{
                      ...valStyle,
                      fontSize: "12px",
                      color: BRAND_BLUE,
                      wordBreak: "break-all",
                    }}
                  >
                    {stay.order_id || "N/A"}
                  </p>
                </div>
              </div>

              <div style={priceList}>
                <p style={{ ...priceRow, color: BRAND_GREEN, fontWeight: "700" }}>
                  💰 Paid On: <span>{formatDate(stay.paid_date)}</span>
                </p>
                {stay.rent_amount > 0 && (
                  <p style={priceRow}>
                    Monthly Rent: <span>₹{stay.rent_amount}</span>
                  </p>
                )}
                {stay.maintenance_amount > 0 && (
                  <p style={priceRow}>
                    Maintenance: <span>₹{stay.maintenance_amount}</span>
                  </p>
                )}
                {stay.deposit_amount > 0 && (
                  <p
                    style={{
                      ...priceRow,
                      borderTop: "1px dashed #eee",
                      paddingTop: "10px",
                      marginTop: "10px",
                    }}
                  >
                    Security Deposit (Paid):{" "}
                    <span style={{ fontWeight: "bold" }}>₹{stay.deposit_amount}</span>
                  </p>
                )}
                <div style={totalBox}>
                  <span>Total Monthly Paid</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                    ₹{stay.monthly_total}
                  </span>
                </div>
              </div>

              <div style={btnRow}>
                <button style={btn} onClick={() => navigate("/user/bookings")}>
                  📜 History
                </button>
                <button style={payBtn} onClick={() => navigate("/payment")}>
                  💳 Pay Rent
                </button>
                <button style={receiptBtn} onClick={() => handleDownloadReceipt(stay)}>
                  📥 Receipt
                </button>

                {stay.order_id && (
                  <button
                    style={{ ...btn, background: BRAND_RED }}
                    onClick={() => setShowRefundFormFor(stay.id)}
                  >
                    🔁 Refund
                  </button>
                )}

                {/* VACATE BUTTON — hidden once any vacate_status exists or just submitted */}
                {!stay.vacate_status && vacateSubmittedFor !== stay.id && (
                  <button
                    style={{ ...btn, background: "#f59e0b" }}
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

      {/* HIDDEN RECEIPT DESIGN FOR PDF */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef} style={modernReceiptContainer}>
            <div style={{ ...receiptHeader, borderBottom: `4px solid ${BRAND_BLUE}` }}>
              <div>
                <h1 style={logoText}>
                  <span style={{ color: BRAND_BLUE }}>NEP</span>
                  <span style={{ color: BRAND_GREEN }}>XALL</span>
                </h1>
                <p style={tagline}>Next Places for Living</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={receiptTitle}>RENT RECEIPT</h2>
                <p style={{ ...orderIdText, color: BRAND_BLUE }}>
                  Order ID: {selectedStay.order_id || "N/A"}
                </p>
                <p style={dateText}>
                  Date: {formatDate(selectedStay.paid_date || new Date())}
                </p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>👤 ISSUED TO</label>
                  <p style={receiptValue}>
                    {auth.currentUser?.displayName || "Valued Tenant"}
                  </p>
                  <p style={receiptSubValue}>
                    Mob: {auth.currentUser?.phoneNumber || "Registered User"}
                  </p>
                </div>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>🏠 PROPERTY DETAILS</label>
                  <p style={receiptValue}>{selectedStay.pg_name}</p>
                  <p style={receiptSubValue}>
                    {selectedStay.room_type} Sharing{" "}
                    {selectedStay.room_no ? `| Room: ${selectedStay.room_no}` : ""}
                  </p>
                </div>
              </div>
              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={{ ...statusText, color: BRAND_GREEN }}>VERIFIED</h3>
                <p style={dateText}>Payment Mode: Online</p>
                <div style={amountDisplay}>₹{selectedStay.monthly_total}</div>
              </div>
            </div>

            <div style={tableContainer}>
              <div style={{ ...tableHeader, background: BRAND_BLUE }}>
                <span>📊 PAYMENT BREAKDOWN</span>
                <span>Amount</span>
              </div>
              {selectedStay.rent_amount > 0 && (
                <div style={tableRow}>
                  <span>Monthly Room Rent ({selectedStay.room_type})</span>
                  <span>₹{selectedStay.rent_amount}</span>
                </div>
              )}
              {selectedStay.maintenance_amount > 0 && (
                <div style={tableRow}>
                  <span>Maintenance Charges</span>
                  <span>₹{selectedStay.maintenance_amount}</span>
                </div>
              )}
              <div
                style={{
                  ...tableRow,
                  borderBottom: `2px solid ${BRAND_BLUE}`,
                  fontWeight: "bold",
                  background: "#f8fafc",
                }}
              >
                <span>Total Amount Received</span>
                <span>₹{selectedStay.monthly_total}</span>
              </div>
            </div>

            {selectedStay.deposit_amount > 0 && (
              <div
                style={{
                  ...sectionBlock,
                  marginTop: "30px",
                  padding: "20px",
                  background: "#f0f4f8",
                  borderRadius: "10px",
                }}
              >
                <label style={receiptLabel}>💳 SECURITY DEPOSIT (ONE-TIME)</label>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={receiptValue}>₹{selectedStay.deposit_amount}</span>
                  <span style={{ color: BRAND_GREEN, fontWeight: "bold" }}>
                    Paid (Refundable)
                  </span>
                </div>
              </div>
            )}

            <div style={footerNote}>
              <div
                style={{ textAlign: "left", marginBottom: "20px", color: "#4b5563" }}
              >
                <p>
                  ✔ Verified Transaction:{" "}
                  <strong>{selectedStay.order_id || "N/A"}</strong>
                </p>
                <p>✔ This is a digital proof of stay generated by Nepxall.</p>
              </div>
              <p style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
                * System-generated receipt. No signature required.
              </p>
              <p style={{ fontWeight: "bold", marginTop: 5, color: BRAND_BLUE }}>
                THANK YOU FOR STAYING WITH US!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */
const container = {
  maxWidth: 600,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "Inter, sans-serif",
};
const card = {
  background: "#fff",
  padding: 30,
  borderRadius: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  border: "1px solid #f0f0f0",
  marginBottom: "25px",
};
const headerSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};
const infoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: 20,
};
const labelStyle = {
  fontSize: "11px",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: "600",
};
const valStyle = {
  margin: "2px 0 0 0",
  fontWeight: "700",
  fontSize: "15px",
  color: "#111827",
};
const priceList = {
  marginBottom: 20,
  background: "#f9fafb",
  padding: "15px",
  borderRadius: "12px",
};
const priceRow = {
  display: "flex",
  justifyContent: "space-between",
  color: "#4b5563",
  margin: "10px 0",
  fontSize: "14px",
};
const totalBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 15,
  padding: "15px",
  background: "#f0fdf4",
  borderRadius: "8px",
  color: "#166534",
};
const statusBadge = {
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "bold",
  background: "#dcfce7",
  color: "#166534",
};
const btnRow = { display: "flex", gap: 8, flexWrap: "wrap" };
const btn = {
  flex: 1,
  minWidth: "100px",
  padding: "12px",
  background: BRAND_BLUE,
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
};
const payBtn = { ...btn, background: BRAND_GREEN };
const receiptBtn = { ...btn, background: "#4b5563" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = {
  textAlign: "center",
  padding: 60,
  background: "#fff",
  borderRadius: 16,
  border: "2px dashed #e5e7eb",
};
const refundFormContainer = { animation: "fadeIn 0.3s ease" };
const inputGroup = { marginBottom: "15px" };
const inputField = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  marginTop: "5px",
  fontFamily: "inherit",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const modernReceiptContainer = {
  width: "210mm",
  minHeight: "297mm",
  padding: "60px",
  background: "#ffffff",
  color: "#111827",
  fontFamily: "Helvetica, Arial, sans-serif",
};
const receiptHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  paddingBottom: "20px",
  marginBottom: "30px",
};
const logoText = {
  margin: 0,
  fontSize: "36px",
  fontWeight: "900",
  letterSpacing: "-1px",
};
const tagline = { margin: 0, fontSize: "12px", color: "#6b7280" };
const receiptTitle = { margin: 0, fontSize: "22px", color: "#111827" };
const orderIdText = { margin: 0, fontSize: "14px", fontWeight: "bold" };
const mainReceiptBody = { display: "flex", gap: "30px", marginBottom: "40px" };
const sectionBlock = { marginBottom: "20px" };
const receiptLabel = {
  fontSize: "11px",
  color: "#9ca3af",
  fontWeight: "bold",
  letterSpacing: "1px",
  display: "block",
  marginBottom: "5px",
};
const receiptValue = {
  fontSize: "16px",
  fontWeight: "bold",
  margin: 0,
  color: "#111827",
};
const receiptSubValue = { fontSize: "13px", color: "#4b5563", margin: "2px 0" };
const paymentStatusBox = {
  width: "200px",
  background: "#f8fafc",
  borderRadius: "15px",
  border: "1px solid #e2e8f0",
  padding: "20px",
  textAlign: "center",
};
const statusCircle = { fontSize: "30px", marginBottom: "5px" };
const statusText = { margin: 0, fontSize: "18px", fontWeight: "bold" };
const dateText = { fontSize: "12px", color: "#6b7280", margin: "5px 0" };
const amountDisplay = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#111827",
  marginTop: "10px",
};
const tableContainer = { marginTop: "10px" };
const tableHeader = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px",
  color: "#fff",
  borderRadius: "8px 8px 0 0",
  fontWeight: "bold",
};
const tableRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "15px 12px",
  borderBottom: "1px solid #e5e7eb",
};
const footerNote = {
  marginTop: "50px",
  textAlign: "center",
  color: "#9ca3af",
  fontSize: "12px",
};

export default UserActiveStay;