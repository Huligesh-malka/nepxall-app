import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Button, CircularProgress, Chip, Alert, Stack,
  Snackbar, IconButton, Tooltip
} from "@mui/material";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RefreshIcon from '@mui/icons-material/Refresh';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");
  const receiptRef = useRef();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments/admin/payments");
      if (res.data.success) setPayments(res.data.data || []);
    } catch (err) {
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
        setSnackbar({ open: true, message: "Payment approved", severity: "success" });
        fetchPayments();
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Approval failed", severity: "error" });
    } finally { setProcessing(null); }
  };

  const handleDownloadReceipt = async (payment) => {
    setSelectedPayment(payment);
    setTimeout(async () => {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`Receipt_${payment.order_id}.pdf`);
      setSelectedPayment(null);
    }, 500);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">💳 Payment Verification</Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchPayments}>Refresh</Button>
      </Stack>

      <Paper sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead><TableRow sx={{ bg: "#f8fafc" }}>
            <TableCell>Tenant</TableCell><TableCell>PG</TableCell><TableCell>Amount</TableCell>
            <TableCell>Order ID</TableCell><TableCell>Status</TableCell><TableCell align="center">Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.order_id}>
                <TableCell><b>{p.tenant_name}</b><br/>{p.phone}</TableCell>
                <TableCell>{p.pg_name}</TableCell>
                <TableCell>₹{p.amount}</TableCell>
                <TableCell>{p.order_id}</TableCell>
                <TableCell><Chip label={p.status} color={p.status === "paid" ? "success" : "warning"} /></TableCell>
                <TableCell align="center">
                  <IconButton color="primary" disabled={p.status !== "paid"} onClick={() => handleDownloadReceipt(p)}><ReceiptLongIcon /></IconButton>
                  {p.status === "submitted" && (
                    <Button variant="contained" color="success" size="small" onClick={() => approvePayment(p.order_id)}>Approve</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* HIDDEN RECEIPT GENERATOR */}
      {selectedPayment && (
        <div style={{ position: "absolute", left: "-9999px" }}>
          <div ref={receiptRef} style={modernReceiptContainer}>
            <div style={receiptHeader}>
              <div>
                <h1 style={logoText}><span style={{ color: BRAND_BLUE }}>NEP</span><span style={{ color: BRAND_GREEN }}>XALL</span></h1>
                <p style={tagline}>Next Places for Living</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={receiptTitle}>RENT RECEIPT</h2>
                <p style={{ color: BRAND_BLUE, fontWeight: 'bold' }}>Order ID: {selectedPayment.order_id}</p>
                <p style={dateText}>Date: {formatDate(selectedPayment.paid_date)}</p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>👤 ISSUED TO</label>
                  <p style={receiptValue}>{selectedPayment.tenant_name}</p>
                  <p style={receiptSubValue}>Mob: {selectedPayment.phone}</p>
                </div>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>🏠 PROPERTY DETAILS</label>
                  <p style={receiptValue}>{selectedPayment.pg_name}</p>
                  <p style={receiptSubValue}>{selectedPayment.room_type} | Room: {selectedPayment.room_no || "NA"}</p>
                </div>
              </div>
              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={{ color: BRAND_GREEN }}>VERIFIED</h3>
                <div style={amountDisplay}>₹{selectedPayment.amount}</div>
              </div>
            </div>

            <div style={tableContainer}>
              <div style={{ ...tableHeader, background: BRAND_BLUE }}>
                <span>📊 PAYMENT BREAKDOWN</span><span>Amount</span>
              </div>
              <div style={tableRow}>
                <span>Monthly Room Rent ({selectedPayment.room_type})</span>
                <span>₹{selectedPayment.rent_amount || selectedPayment.amount}</span>
              </div>
              <div style={tableRow}>
                <span>Maintenance Charges</span>
                <span>₹{selectedPayment.maintenance_amount || 0}</span>
              </div>
              <div style={{ ...tableRow, background: "#f8fafc", fontWeight: "bold" }}>
                <span>Total Amount Received</span>
                <span>₹{selectedPayment.amount}</span>
              </div>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', background: '#f0f4f8', borderRadius: '10px' }}>
              <label style={receiptLabel}>💳 SECURITY DEPOSIT (ONE-TIME)</label>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={receiptValue}>₹{selectedPayment.deposit_amount || "0.00"}</span>
                <span style={{ color: BRAND_GREEN, fontWeight: 'bold' }}>Paid (Refundable)</span>
              </div>
            </div>

            <div style={footerNote}>
              <p>✔ Verified Transaction: {selectedPayment.order_id}</p>
              <p>✔ This is a digital proof of stay generated by Nepxall.</p>
              <p style={{ marginTop: 20 }}>* System-generated receipt. No signature required.</p>
            </div>
          </div>
        </div>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

/* --- STYLES (AS PROVIDED IN YOUR TEMPLATE) --- */
const modernReceiptContainer = { width: "210mm", padding: "60px", background: "#fff", fontFamily: "Arial" };
const receiptHeader = { display: "flex", justifyContent: "space-between", marginBottom: "30px", borderBottom: `4px solid ${BRAND_BLUE}`, paddingBottom: "20px" };
const logoText = { margin: 0, fontSize: "36px", fontWeight: "900" };
const tagline = { margin: 0, fontSize: "12px", color: "#6b7280" };
const receiptTitle = { margin: 0, fontSize: "22px" };
const mainReceiptBody = { display: "flex", gap: "30px", marginBottom: "40px" };
const sectionBlock = { marginBottom: "20px" };
const receiptLabel = { fontSize: "11px", color: "#9ca3af", fontWeight: "bold" };
const receiptValue = { fontSize: "16px", fontWeight: "bold", margin: 0 };
const receiptSubValue = { fontSize: "13px", color: "#4b5563" };
const paymentStatusBox = { width: "200px", background: "#f8fafc", borderRadius: "15px", padding: "20px", textAlign: "center", border: "1px solid #e2e8f0" };
const statusCircle = { fontSize: "30px" };
const amountDisplay = { fontSize: "24px", fontWeight: "900", marginTop: "10px" };
const tableContainer = { marginTop: "10px" };
const tableHeader = { display: "flex", justifyContent: "space-between", padding: "12px", color: "#fff", borderRadius: "8px 8px 0 0" };
const tableRow = { display: "flex", justifyContent: "space-between", padding: "15px 12px", borderBottom: "1px solid #e5e7eb" };
const footerNote = { marginTop: "50px", textAlign: "center", color: "#9ca3af", fontSize: "12px" };
const dateText = { fontSize: "12px", color: "#6b7280" };

export default AdminPayments;