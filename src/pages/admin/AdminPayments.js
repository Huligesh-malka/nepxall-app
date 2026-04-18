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
  Tooltip,
  Divider,
  Avatar
} from "@mui/material";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RefreshIcon from '@mui/icons-material/Refresh';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageIcon from '@mui/icons-material/Image';

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";
const DARK_TEXT = "#1B2559";
const SUBTLE_TEXT = "#A3AED0";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");
  
  const receiptRef = useRef();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (!window.confirm("Are you sure you want to approve this payment?")) return;
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
    if (!window.confirm("Are you sure you want to reject this payment? This action cannot be undone.")) return;
    try {
      setProcessing(orderId);
      const res = await api.put(`/payments/admin/payments/${orderId}/reject`);
      if (res.data.success) {
        setSnackbar({ open: true, message: "Payment rejected successfully", severity: "info" });
        fetchPayments();
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Rejection failed", severity: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const handleWhatsAppShare = (p) => {
    const contactNumber = p.reg_phone || p.phone || "";
    const cleanPhone = contactNumber.replace(/\D/g, "");
    
    if (!cleanPhone || cleanPhone === "" || cleanPhone === "N/A") {
        setSnackbar({ open: true, message: "No valid phone number available", severity: "warning" });
        return;
    }

    const userName = p.reg_name || "User";
    const message = `*Payment Receipt - Nepxall*%0A%0AHello *${userName}*,%0AYour payment for *${p.pg_name}* (${p.sharing || 'N/A'} Sharing) has been verified successfully.%0A%0A*Details:*%0A💰 Amount: ₹${p.total_amount || p.amount}%0A🆔 Order ID: ${p.order_id}%0A✅ Status: Paid%0A📅 Date: ${formatDate(p.submitted_at || p.created_at)}%0A%0A_Thank you for choosing Nepxall!_`;
    const whatsappUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDownloadReceipt = async (payment) => {
    setSelectedPayment(payment);
    setIsGenerating(true);
    
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        if (!element) throw new Error("Receipt element not found");

        const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Nepxall_Receipt_${payment.order_id}.pdf`);
        
        setSnackbar({ open: true, message: "Receipt downloaded successfully", severity: "success" });
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
        setSnackbar({ open: true, message: "Failed to generate receipt", severity: "error" });
      } finally {
        setSelectedPayment(null);
        setIsGenerating(false);
      }
    }, 800);
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  if (loading) return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh">
      <CircularProgress sx={{ color: BRAND_BLUE }} />
      <Typography mt={2} fontWeight="600">Loading payments...</Typography>
    </Box>
  );

  return (
    <Box p={4} sx={{ backgroundColor: "#f4f7fe", minHeight: "100vh" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
            <Typography variant="h4" fontWeight="800" color={DARK_TEXT}>Payment Verification</Typography>
            <Typography variant="body2" color={SUBTLE_TEXT}>Manage and verify incoming rental payments for Nepxall properties.</Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<RefreshIcon />} 
            onClick={fetchPayments}
            sx={{ borderRadius: "10px", textTransform: 'none', px: 3, backgroundColor: BRAND_BLUE, fontWeight: '700' }}
        >
            Refresh Data
        </Button>
      </Stack>

      {error && <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: "12px" }}>{error}</Alert>}

      <Paper elevation={0} sx={{ width: '100%', overflowX: 'auto', borderRadius: "16px", border: "1px solid #E0E5F2" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#F4F7FE" }}>
              <TableCell sx={{ color: SUBTLE_TEXT, fontWeight: "bold" }}>USER DETAILS</TableCell>
              <TableCell sx={{ color: SUBTLE_TEXT, fontWeight: "bold" }}>PROPERTY</TableCell>
              <TableCell sx={{ color: SUBTLE_TEXT, fontWeight: "bold" }}>AMOUNT</TableCell>
              <TableCell sx={{ color: SUBTLE_TEXT, fontWeight: "bold" }}>ORDER ID / UTR</TableCell>
              <TableCell sx={{ color: SUBTLE_TEXT, fontWeight: "bold" }}>STATUS</TableCell>
              <TableCell align="center" sx={{ color: SUBTLE_TEXT, fontWeight: "bold" }}>VERIFICATION</TableCell>
              <TableCell align="center" sx={{ color: SUBTLE_TEXT, fontWeight: "bold" }}>RECEIPT</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ backgroundColor: "#fff" }}>
            {payments.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}>No payment records found.</TableCell></TableRow>
            ) : (
              payments.map((p) => {
                const displayName = p.reg_name || "Guest User";
                const displayPhone = p.reg_phone || "N/A";
                
                const isApproved = p.status === "paid" || p.status === "confirmed";
                const isRejected = p.status === "rejected";
                const isProcessing = processing === p.order_id;
                const isApproveDisabled = isApproved || isProcessing;
                const isRejectDisabled = isRejected || isProcessing;
                
                return (
                  <TableRow key={p.order_id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: BRAND_BLUE, fontWeight: 'bold' }}>
                              {displayName[0].toUpperCase()}
                          </Avatar>
                          <Box>
                              <Typography variant="body2" fontWeight="700" color={DARK_TEXT}>
                                  {displayName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: BRAND_BLUE, fontWeight: '600' }}>
                                  {displayPhone}
                              </Typography>
                          </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{p.pg_name}</Typography>
                      <Chip 
                        label={p.sharing ? `${p.sharing}` : 'N/A Sharing'} 
                        size="small" 
                        sx={{ height: '20px', fontSize: '10px', mt: 0.5, fontWeight: 'bold' }} 
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography fontWeight="800" color={DARK_TEXT}>
                        ₹{p.total_amount || p.amount}
                      </Typography>

                      <Chip
                        label={
                          p.agreement_paid === 1
                            ? "✅ Agreement Paid by User"
                            : "❌ Agreement Not Paid"
                        }
                        size="small"
                        sx={{
                          mt: 0.5,
                          fontWeight: "bold",
                          backgroundColor: p.agreement_paid === 1 ? "#dcfce7" : "#fee2e2",
                          color: p.agreement_paid === 1 ? "#16a34a" : "#dc2626"
                        }}
                      />

                      {p.agreement_paid === 1 && (
                        <Typography variant="caption" sx={{ display: "block", color: "#16a34a", mt: 0.5 }}>
                          + ₹500 Agreement Fee (Paid by User)
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="caption" display="block" sx={{ fontFamily: "monospace", color: "#707EAE" }}>{p.order_id}</Typography>
                      {p.utr && <Typography variant="caption" sx={{ color: BRAND_GREEN, fontWeight: 'bold' }}>UTR: {p.utr}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status.toUpperCase()} 
                        size="small" 
                        sx={{ fontWeight: '800', borderRadius: '6px' }}
                        color={
                          p.status === "paid" || p.status === "confirmed"
                            ? "success"
                            : p.status === "submitted" || p.status === "approved"
                            ? "warning"
                            : p.status === "rejected"
                            ? "error"
                            : "default"
                        } 
                      />
                      {(p.status === "paid" || p.status === "confirmed") && (
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#16a34a",
                              fontWeight: "bold",
                              display: "block",
                              mt: 1
                            }}
                          >
                            ✅ Approved (Can still reject)
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#6b7280",
                              fontSize: "10px",
                              display: "block"
                            }}
                          >
                            User moved to ACTIVE (PG Users)
                          </Typography>
                        </>
                      )}
                      {p.status === "rejected" && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#dc2626",
                            fontWeight: "bold",
                            display: "block",
                            mt: 1
                          }}
                        >
                          ⚠️ Payment rejected. Can re-approve.
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {p.screenshot && (
                          <Tooltip title="View Proof">
                             <IconButton 
                               size="small" 
                               color="primary" 
                               onClick={() => window.open(p.screenshot, "_blank")}
                               sx={{ border: '1px solid #E0E5F2' }}
                             >
                               <ImageIcon fontSize="small" />
                             </IconButton>
                          </Tooltip>
                        )}

                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          disableElevation
                          startIcon={<CheckCircleIcon />}
                          disabled={isApproveDisabled}
                          onClick={() => approvePayment(p.order_id)}
                          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: '700' }}
                        >
                          {isProcessing ? 
                            <CircularProgress size={16} color="inherit" /> : 
                            (p.status === "rejected" ? "Re-Approve" : "Approve")
                          }
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          disabled={isRejectDisabled}
                          onClick={() => rejectPayment(p.order_id)}
                          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: '700' }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title={(p.status === "paid" || p.status === "confirmed") ? "Download PDF" : "Wait for approval"}>
                          <span>
                            <IconButton 
                              color="primary" 
                              disabled={(p.status !== "paid" && p.status !== "confirmed") || isGenerating} 
                              onClick={() => handleDownloadReceipt(p)}
                            >
                              <ReceiptLongIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={(p.status === "paid" || p.status === "confirmed") ? "WhatsApp Notify" : "Wait for approval"}>
                          <span>
                            <IconButton 
                              sx={{ color: "#25D366" }} 
                              disabled={(p.status !== "paid" && p.status !== "confirmed")} 
                              onClick={() => handleWhatsAppShare(p)}
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* HIDDEN RECEIPT COMPONENT FOR PDF GENERATION */}
      {selectedPayment && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef} style={modernReceiptContainer}>
            <div style={receiptHeader}>
              <div>
                <h1 style={logoText}>
                    <span style={{ color: BRAND_BLUE }}>NEP</span>
                    <span style={{ color: BRAND_GREEN }}>XALL</span>
                </h1>
                <p style={tagline}>Next Places for Living</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={receiptTitle}>RENT RECEIPT</h2>
                <p style={{ ...orderIdText, color: BRAND_BLUE }}>ID: {selectedPayment.order_id}</p>
                <p style={dateText}>Generated: {formatDate(new Date())}</p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>👤 CUSTOMER DETAILS</label>
                  <p style={receiptValue}>{selectedPayment.reg_name || "Valued Customer"}</p>
                  <p style={receiptSubValue}>Phone: {selectedPayment.reg_phone || "N/A"}</p>
                </div>

                <div style={sectionBlock}>
                  <label style={receiptLabel}>🏠 PROPERTY DESCRIPTION</label>
                  <p style={receiptValue}>{selectedPayment.pg_name}</p>
                  <p style={receiptSubValue}>Category: {selectedPayment.sharing || 'N/A'} Sharing Accommodation</p>
                </div>
              </div>

              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={{ ...statusText, color: BRAND_GREEN }}>PAID & VERIFIED</h3>
                <p style={dateText}>Method: Digital Payment</p>
                <Divider sx={{ my: 1 }} />
                <div style={amountDisplay}>₹{selectedPayment.total_amount || selectedPayment.amount}</div>
              </div>
            </div>

            <div style={tableContainer}>
              <div style={{ ...tableHeader, background: BRAND_BLUE }}>
                <span>DESCRIPTION</span>
                <span>AMOUNT (₹)</span>
              </div>

              {(selectedPayment.rent_amount > 0 || selectedPayment.rent_amount) && (
                <div style={tableRow}>
                  <span>Room Rent ({selectedPayment.sharing || 'N/A'} Sharing)</span>
                  <span>₹{selectedPayment.rent_amount || 0}</span>
                </div>
              )}

              {(selectedPayment.maintenance_amount > 0 || selectedPayment.maintenance_amount) && (
                <div style={tableRow}>
                  <span>Maintenance Charges</span>
                  <span>₹{selectedPayment.maintenance_amount || 0}</span>
                </div>
              )}

              {(selectedPayment.security_deposit > 0 || selectedPayment.security_deposit) && (
                <div style={tableRow}>
                  <span>Security Deposit</span>
                  <span>₹{selectedPayment.security_deposit || 0}</span>
                </div>
              )}

              {selectedPayment.agreement_paid === 1 && (
                <div style={{ ...tableRow, backgroundColor: "#f0fdf4", borderLeft: `3px solid ${BRAND_GREEN}` }}>
                  <span>
                    <strong>📄 Agreement Charges</strong>
                    <span style={{ fontSize: "11px", color: "#16a34a", display: "block" }}>(Paid by User)</span>
                  </span>
                  <span><strong>₹500</strong></span>
                </div>
              )}

              {selectedPayment.platform_fee > 0 && (
                <div style={tableRow}>
                  <span>Platform Fee</span>
                  <span>₹{selectedPayment.platform_fee}</span>
                </div>
              )}

              <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "10px 0" }}></div>

              <div style={{
                ...tableRow,
                fontWeight: "bold",
                fontSize: "16px",
                background: "#f8fafc"
              }}>
                <span>TOTAL PAID BY USER</span>
                <span>₹{selectedPayment.total_amount || selectedPayment.amount}</span>
              </div>

              <div style={{ marginTop: "20px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, color: DARK_TEXT }}>
                  💰 PAYMENT DISTRIBUTION
                </Typography>
                
                <div style={{ fontSize: "14px", color: "#4b5563", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px", marginBottom: "8px" }}>
                  <span>Owner Receives:</span>
                  <span style={{ float: "right", fontWeight: "bold" }}>
                    ₹{(selectedPayment.rent_amount || 0) + 
                       (selectedPayment.security_deposit || 0) + 
                       (selectedPayment.maintenance_amount || 0)}
                  </span>
                </div>
                
                {selectedPayment.agreement_paid === 1 && (
                  <div style={{ fontSize: "14px", color: "#16a34a", fontWeight: "bold" }}>
                    <span>🏢 Admin Earnings (Agreement Fee):</span>
                    <span style={{ float: "right" }}>₹500</span>
                  </div>
                )}
                
                {selectedPayment.platform_fee > 0 && (
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    <span>Platform Fee:</span>
                    <span style={{ float: "right" }}>₹{selectedPayment.platform_fee}</span>
                  </div>
                )}

                {selectedPayment.agreement_paid !== 1 && (
                  <div style={{ fontSize: "13px", color: "#dc2626", marginTop: "8px", fontStyle: "italic" }}>
                    ⚠️ Note: Agreement fee not collected from user
                  </div>
                )}
              </div>
            </div>

            <div style={footerNote}>
              <div style={{textAlign: 'left', marginBottom: '30px', color: '#4b5563', fontSize: '14px'}}>
                <p>• Verified Transaction ID: <strong>{selectedPayment.order_id}</strong></p>
                {selectedPayment.utr && <p>• Bank UTR: <strong>{selectedPayment.utr}</strong></p>}
                <p>• Payment timestamp: {formatDate(selectedPayment.submitted_at || selectedPayment.created_at)}</p>
              </div>
              <p style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>This is a computer-generated document. It does not require a physical signature.</p>
              <p style={{ fontWeight: "bold", marginTop: 10, color: BRAND_BLUE, fontSize: '16px' }}>NEPXALL - MAKING LIVING EASIER</p>
            </div>
          </div>
        </div>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={handleCloseSnackbar} sx={{ width: '100%', borderRadius: '10px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/* --- STYLES --- */
const modernReceiptContainer = { width: "210mm", minHeight: "290mm", padding: "80px", background: "#ffffff", color: "#111827", fontFamily: "Helvetica, Arial, sans-serif" };
const receiptHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "30px", marginBottom: "40px", borderBottom: `5px solid ${BRAND_BLUE}` };
const logoText = { margin: 0, fontSize: "42px", fontWeight: "900", letterSpacing: "-1.5px" };
const tagline = { margin: 0, fontSize: "14px", color: "#6b7280", fontWeight: "500" };
const receiptTitle = { margin: 0, fontSize: "28px", color: "#111827", fontWeight: "800" };
const orderIdText = { margin: "5px 0 0 0", fontSize: "14px", fontWeight: "bold" };
const mainReceiptBody = { display: "flex", gap: "40px", marginBottom: "50px" };
const sectionBlock = { marginBottom: "25px" };
const receiptLabel = { fontSize: "12px", color: "#9ca3af", fontWeight: "bold", letterSpacing: "1.2px", display: "block", marginBottom: "8px" };
const receiptValue = { fontSize: "18px", fontWeight: "bold", margin: 0, color: "#111827" };
const receiptSubValue = { fontSize: "14px", color: "#4b5563", margin: "4px 0" };
const paymentStatusBox = { width: "240px", background: "#f0fdf4", borderRadius: "20px", border: "2px solid #bbf7d0", padding: "25px", textAlign: "center" };
const statusCircle = { fontSize: "36px", marginBottom: "5px" };
const statusText = { margin: 0, fontSize: "20px", fontWeight: "bold" };
const dateText = { fontSize: "13px", color: "#6b7280", margin: "5px 0" };
const amountDisplay = { fontSize: "32px", fontWeight: "900", color: "#111827", marginTop: "10px" };
const tableContainer = { marginTop: "20px" };
const tableHeader = { display: "flex", justifyContent: "space-between", padding: "16px", color: "#fff", borderRadius: "10px 10px 0 0", fontWeight: "bold", fontSize: "14px" };
const tableRow = { display: "flex", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px" };
const footerNote = { marginTop: "80px", textAlign: "center", color: "#9ca3af", fontSize: "13px" };

export default AdminPayments;