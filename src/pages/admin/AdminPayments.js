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

  const handleDownloadReceipt = async (payment) => {
    setSelectedPayment(payment);
    // Allow state to update and hidden DOM to render
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
              <TableCell align="center"><strong>Receipt</strong></TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* HIDDEN RECEIPT DESIGN */}
      {selectedPayment && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef} style={receiptStyles.container}>
            <div style={receiptStyles.header}>
              <div>
                <h1 style={receiptStyles.logo}>NEPXALL</h1>
                <p style={receiptStyles.tagline}>Next Places for Living</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: 0, color: '#111827' }}>PAYMENT RECEIPT</h2>
                <p style={{ margin: 0, fontSize: '14px', color: BRAND_BLUE, fontWeight: 'bold' }}>
                  ID: {selectedPayment.order_id}
                </p>
              </div>
            </div>

            <div style={receiptStyles.body}>
              <div style={{ flex: 1 }}>
                <div style={receiptStyles.section}>
                  <label style={receiptStyles.label}>TENANT NAME</label>
                  <p style={receiptStyles.value}>{selectedPayment.tenant_name}</p>
                  <p style={receiptStyles.subValue}>Phone: {selectedPayment.phone}</p>
                </div>
                <div style={receiptStyles.section}>
                  <label style={receiptStyles.label}>PROPERTY</label>
                  <p style={receiptStyles.value}>{selectedPayment.pg_name}</p>
                </div>
              </div>
              <div style={receiptStyles.statusBox}>
                <div style={{ fontSize: '24px' }}>✅</div>
                <div style={{ fontWeight: 'bold', color: BRAND_GREEN }}>VERIFIED</div>
                <div style={{ fontSize: '20px', fontWeight: '900', marginTop: '5px' }}>₹{selectedPayment.amount}</div>
              </div>
            </div>

            <div style={receiptStyles.table}>
              <div style={{ ...receiptStyles.tableHeader, backgroundColor: BRAND_BLUE }}>
                <span>Transaction Details</span>
                <span>Amount</span>
              </div>
              <div style={receiptStyles.tableRow}>
                <span>Monthly Rental Payment</span>
                <span>₹{selectedPayment.amount}</span>
              </div>
              <div style={{ ...receiptStyles.tableRow, fontWeight: 'bold', borderTop: '2px solid #eee' }}>
                <span>Total Received</span>
                <span>₹{selectedPayment.amount}</span>
              </div>
            </div>

            <div style={receiptStyles.footer}>
              <p>This is an automated receipt generated by the Nepxall Admin Panel.</p>
              <p style={{ color: BRAND_BLUE, fontWeight: 'bold', marginTop: '10px' }}>THANK YOU FOR CHOOSING NEPXALL</p>
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

/* --- RECEIPT PDF STYLES --- */
const receiptStyles = {
  container: { width: "210mm", padding: "60px", background: "#ffffff", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", borderBottom: `4px solid ${BRAND_BLUE}`, paddingBottom: "20px", marginBottom: "30px" },
  logo: { margin: 0, fontSize: "32px", fontWeight: "900", color: "#111827" },
  tagline: { margin: 0, fontSize: "12px", color: "#6b7280" },
  body: { display: "flex", justifyContent: "space-between", marginBottom: "40px" },
  section: { marginBottom: "20px" },
  label: { fontSize: "11px", color: "#9ca3af", fontWeight: "bold", letterSpacing: "1px" },
  value: { fontSize: "18px", fontWeight: "bold", margin: "5px 0 0 0" },
  subValue: { fontSize: "13px", color: "#4b5563", margin: "2px 0" },
  statusBox: { padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", minWidth: "150px" },
  table: { marginTop: "20px" },
  tableHeader: { display: "flex", justifyContent: "space-between", padding: "12px", color: "#fff", borderRadius: "8px 8px 0 0" },
  tableRow: { display: "flex", justifyContent: "space-between", padding: "15px 12px", borderBottom: "1px solid #eee" },
  footer: { marginTop: "60px", textAlign: "center", fontSize: "12px", color: "#9ca3af", borderTop: "1px solid #eee", paddingTop: "20px" }
};

export default AdminPayments;