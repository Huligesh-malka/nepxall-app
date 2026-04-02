import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Stack,
  Snackbar,
  IconButton,
  Tooltip
} from "@mui/material";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RefreshIcon from '@mui/icons-material/Refresh';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");
  
  const receiptRef = useRef();
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/payments/admin/payments");
      if (res.data.success) {
        setPayments(res.data.data || []);
      } else {
        setError(res.data.message || "Failed to load payments");
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      setError(err.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (orderId) => {
    try {
      setProcessing(orderId);
      const res = await api.put(`/payments/admin/payments/${orderId}/verify`);
      if (res.data.success) {
        setSnackbar({ open: true, message: "Payment approved successfully", severity: "success" });
        fetchPayments();
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Approval failed", severity: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const rejectPayment = async (orderId) => {
    try {
      setProcessing(orderId);
      const res = await api.put(`/payments/admin/payments/${orderId}/reject`);
      if (res.data.success) {
        setSnackbar({ open: true, message: "Payment rejected successfully", severity: "success" });
        fetchPayments();
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Rejection failed", severity: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const handleWhatsAppShare = (p) => {
    const cleanPhone = p.phone ? p.phone.replace(/\D/g, "") : "";
    const message = `*Payment Receipt - Nepxall*%0A%0AHello *${p.tenant_name}*,%0AYour payment for *${p.pg_name}* has been verified successfully.%0A%0A*Details:*%0A💰 Amount: ₹${p.amount}%0A🆔 Order ID: ${p.order_id}%0A✅ Status: Paid%0A📅 Date: ${formatDate(p.paid_date)}%0A%0A_Thank you for choosing Nepxall!_`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownloadReceipt = async (payment) => {
    setSelectedPayment(payment);
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { 
          scale: 3, 
          useCORS: true,
          backgroundColor: "#ffffff"
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${payment.order_id || 'Admin'}.pdf`);
        setSelectedPayment(null);
      } catch (err) {
        console.error("PDF Generation Error:", err);
        setSnackbar({ open: true, message: "Failed to generate receipt", severity: "error" });
      }
    }, 500);
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">💳 Payment Verification</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPayments}>Refresh</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f8fafc" }}>
              <TableCell><strong>Tenant / Phone</strong></TableCell>
              <TableCell><strong>PG Name</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Order ID</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Verification</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No records found</TableCell></TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.order_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{p.tenant_name || "N/A"}</Typography>
                    <Typography variant="caption" color="textSecondary">{p.phone || "-"}</Typography>
                  </TableCell>
                  <TableCell>{p.pg_name}</TableCell>
                  <TableCell><Typography fontWeight="bold">₹{p.amount}</Typography></TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: '11px' }}>{p.order_id}</TableCell>
                  <TableCell>
                    <Chip 
                      label={p.status.toUpperCase()} 
                      size="small" 
                      sx={{ fontWeight: 'bold' }}
                      color={p.status === "paid" ? "success" : p.status === "submitted" ? "warning" : "error"} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={processing === p.order_id || p.status === "paid"}
                        onClick={() => approvePayment(p.order_id)}
                      >
                        {processing === p.order_id ? <CircularProgress size={16} color="inherit" /> : "Approve"}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={processing === p.order_id || p.status === "rejected"}
                        onClick={() => rejectPayment(p.order_id)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title={p.status === "paid" ? "Download Receipt" : "Payment not verified"}>
                        <span>
                          <IconButton 
                            color="primary" 
                            disabled={p.status !== "paid"} 
                            onClick={() => handleDownloadReceipt(p)}
                          >
                            <ReceiptLongIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={p.status === "paid" ? "Share on WhatsApp" : "Payment not verified"}>
                        <span>
                          <IconButton 
                            sx={{ color: "#25D366" }} 
                            disabled={p.status !== "paid"} 
                            onClick={() => handleWhatsAppShare(p)}
                          >
                            <WhatsAppIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* HIDDEN RECEIPT DESIGN - MIRRORED FROM USER VIEW */}
      {selectedPayment && (
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
                    Order ID: {selectedPayment.order_id || "N/A"}
                </p>
                <p style={dateText}>Date: {formatDate(selectedPayment.paid_date || new Date())}</p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>👤 ISSUED TO</label>
                  <p style={receiptValue}>{selectedPayment.tenant_name || "Valued Tenant"}</p>
                  <p style={receiptSubValue}>Mob: {selectedPayment.phone || "N/A"}</p>
                </div>

                <div style={sectionBlock}>
                  <label style={receiptLabel}>🏠 PROPERTY DETAILS</label>
                  <p style={receiptValue}>{selectedPayment.pg_name}</p>
                  <p style={receiptSubValue}>
                    {selectedPayment.room_type || "N/A"} Sharing {selectedPayment.room_no ? `| Room: ${selectedPayment.room_no}` : ""}
                  </p>
                </div>
              </div>

              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={{ ...statusText, color: BRAND_GREEN }}>VERIFIED</h3>
                <p style={dateText}>Payment Mode: Online</p>
                <div style={amountDisplay}>₹{selectedPayment.amount}</div>
              </div>
            </div>

            <div style={tableContainer}>
              <div style={{ ...tableHeader, background: BRAND_BLUE }}>
                <span>📊 PAYMENT BREAKDOWN</span>
                <span>Amount</span>
              </div>
              <div style={tableRow}>
                <span>Monthly Rent Payment</span>
                <span>₹{selectedPayment.amount}</span>
              </div>
              <div style={{ ...tableRow, borderBottom: `2px solid ${BRAND_BLUE}`, fontWeight: "bold", background: "#f8fafc" }}>
                <span>Total Amount Received</span>
                <span>₹{selectedPayment.amount}</span>
              </div>
            </div>

            <div style={{...sectionBlock, marginTop: '30px', padding: '20px', background: '#f0f4f8', borderRadius: '10px'}}>
                <label style={receiptLabel}>💳 SECURITY DEPOSIT (RECORDED)</label>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={receiptValue}>₹{selectedPayment.deposit_amount || "0.00"}</span>
                    <span style={{color: BRAND_GREEN, fontWeight: 'bold'}}>Paid (Refundable)</span>
                </div>
            </div>

            <div style={footerNote}>
              <div style={{textAlign: 'left', marginBottom: '20px', color: '#4b5563'}}>
                <p>✔ Verified Transaction: <strong>{selectedPayment.order_id || 'N/A'}</strong></p>
                <p>✔ This is a digital proof of stay generated via Nepxall Admin Panel.</p>
              </div>
              <p style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>* System-generated receipt. No signature required.</p>
              <p style={{ fontWeight: "bold", marginTop: 5, color: BRAND_BLUE }}>THANK YOU FOR CHOOSING NEPXALL!</p>
            </div>
          </div>
        </div>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert severity={snackbar.severity} variant="filled" onClose={handleCloseSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/* --- SHARED CSS OBJECTS (MATCHING USER SIDE) --- */
const modernReceiptContainer = { width: "210mm", minHeight: "297mm", padding: "60px", background: "#ffffff", color: "#111827", fontFamily: "Helvetica, Arial, sans-serif" };
const receiptHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "20px", marginBottom: "30px" };
const logoText = { margin: 0, fontSize: "36px", fontWeight: "900", letterSpacing: "-1px" };
const tagline = { margin: 0, fontSize: "12px", color: "#6b7280" };
const receiptTitle = { margin: 0, fontSize: "22px", color: "#111827" };
const orderIdText = { margin: 0, fontSize: "14px", fontWeight: "bold" };
const mainReceiptBody = { display: "flex", gap: "30px", marginBottom: "40px" };
const sectionBlock = { marginBottom: "20px" };
const receiptLabel = { fontSize: "11px", color: "#9ca3af", fontWeight: "bold", letterSpacing: "1px", display: "block", marginBottom: "5px" };
const receiptValue = { fontSize: "16px", fontWeight: "bold", margin: 0, color: "#111827" };
const receiptSubValue = { fontSize: "13px", color: "#4b5563", margin: "2px 0" };
const paymentStatusBox = { width: "200px", background: "#f8fafc", borderRadius: "15px", border: "1px solid #e2e8f0", padding: "20px", textAlign: "center" };
const statusCircle = { fontSize: "30px", marginBottom: "5px" };
const statusText = { margin: 0, fontSize: "18px", fontWeight: "bold" };
const dateText = { fontSize: "12px", color: "#6b7280", margin: "5px 0" };
const amountDisplay = { fontSize: "24px", fontWeight: "900", color: "#111827", marginTop: "10px" };
const tableContainer = { marginTop: "10px" };
const tableHeader = { display: "flex", justifyContent: "space-between", padding: "12px", color: "#fff", borderRadius: "8px 8px 0 0", fontWeight: "bold" };
const tableRow = { display: "flex", justifyContent: "space-between", padding: "15px 12px", borderBottom: "1px solid #e5e7eb" };
const footerNote = { marginTop: "50px", textAlign: "center", color: "#9ca3af", fontSize: "12px" };

export default AdminPayments;