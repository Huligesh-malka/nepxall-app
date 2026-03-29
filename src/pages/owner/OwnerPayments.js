import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from 'react-signature-canvas';

import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Alert, Button, Card,
  CardContent, Grid, Tooltip, Modal, Backdrop, Fade, Checkbox,
  FormControlLabel, TextField, Divider
} from "@mui/material";

import {
  AccountBalanceWallet, Refresh, PictureAsPdf, PendingActions,
  Edit as EditIcon, HistoryEdu as SignIcon
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";
const BASE_URL = "https://nepxall-backend.onrender.com";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Signature States
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [step, setStep] = useState(1); // 1: Terms, 2: Signature
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef({});
  const token = localStorage.getItem("token");

  const fetchPayments = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError("");

      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setData(res.data.data || []);
      } else {
        setError("Failed to load payments");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  /* ================= HANDLERS ================= */

  const handleOpenSign = (booking) => {
    setSelectedBooking(booking);
    setStep(1);
    setAgreed(false);
    setMobile("");
    setOpenSignModal(true);
  };

  const clearSig = () => sigCanvas.current.clear();

  const handleFinalSubmit = async () => {
    if (!mobile || mobile.length < 10) return alert("Please enter a valid mobile number");
    if (sigCanvas.current.isEmpty()) return alert("Please provide a signature");

    setIsSubmitting(true);
    const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

    try {
      const res = await axios.post(`${API}/sign-agreement`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signatureBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert("Agreement signed and approved!");
        setOpenSignModal(false);
        fetchPayments();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error saving signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPdf = (pdfPath) => {
    if (!pdfPath) return;
    const fullUrl = pdfPath.startsWith('http') ? pdfPath : `${BASE_URL}/${pdfPath}`;
    window.open(fullUrl, '_blank');
  };

  /* ================= HELPERS ================= */
  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "paid": return "success";
      case "submitted": return "info";
      case "pending": return "warning";
      case "rejected": return "error";
      default: return "default";
    }
  };

  const getSettlementStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case "DONE":
      case "COMPLETED": return "success";
      case "PENDING": return "warning";
      default: return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const verifiedCount = data.filter(item => item.payment_status?.toLowerCase() === 'paid').length;
  const totalAmount = data.reduce((sum, item) => sum + (Number(item.owner_amount) || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography color="text.secondary">Loading your earnings...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">💰 Owner Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Manage your earnings and signed agreements</Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={() => fetchPayments(true)} 
          disabled={refreshing} 
          startIcon={refreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Bookings</Typography>
              <Typography variant="h4" fontWeight="bold">{data.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#388e3c', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Earnings</Typography>
              <Typography variant="h4" fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#0288d1', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Verified Payments</Typography>
              <Typography variant="h4" fontWeight="bold">{verifiedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f8f9fa" }}>
              <TableCell><strong>Booking</strong></TableCell>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>PG Name</strong></TableCell>
              <TableCell align="center"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Settlement</strong></TableCell>
              <TableCell align="center"><strong>Agreement</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <AccountBalanceWallet sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography color="text.secondary">No records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.booking_id || index} hover>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">{item.tenant_name || "N/A"}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.phone}</Typography>
                  </TableCell>
                  <TableCell>{item.pg_name}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="primary.main">{formatCurrency(item.owner_amount)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.payment_status?.toUpperCase()} color={getPaymentStatusColor(item.payment_status)} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={item.owner_settlement?.toUpperCase() || "PENDING"} color={getSettlementStatusColor(item.owner_settlement)} variant="outlined" size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {item.final_pdf ? (
                      <Button variant="contained" size="small" color="info" startIcon={<PictureAsPdf />} onClick={() => handleViewPdf(item.final_pdf)}>
                        View PDF
                      </Button>
                    ) : (
                      <Button variant="outlined" size="small" color="warning" startIcon={<EditIcon />} onClick={() => handleOpenSign(item)}>
                        Sign Now
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* SIGNATURE MODAL */}
      <Modal open={openSignModal} onClose={() => !isSubmitting && setOpenSignModal(false)} closeAfterTransition BackdropComponent={Backdrop}>
        <Fade in={openSignModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 }, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4
          }}>
            {step === 1 ? (
              <Box>
                <Typography variant="h6" fontWeight="bold">Review & Agree</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" gutterBottom><strong>Tenant:</strong> {selectedBooking?.tenant_name}</Typography>
                <Typography variant="body2" gutterBottom><strong>PG:</strong> {selectedBooking?.pg_name}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}><strong>Earnings:</strong> {formatCurrency(selectedBooking?.owner_amount)}</Typography>
                
                <Box sx={{ bgcolor: '#fff9c4', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    By proceeding, you verify that the above details are correct and you agree to digitally sign the rental agreement for this booking.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
                  label="I agree to the terms and conditions."
                />
                <Button fullWidth variant="contained" sx={{ mt: 2 }} disabled={!agreed} onClick={() => setStep(2)}>Continue to Sign</Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" fontWeight="bold">Digital Signature</Typography>
                <Divider sx={{ my: 1 }} />
                <TextField 
                  fullWidth label="Confirm Mobile Number" variant="outlined" size="small"
                  sx={{ my: 2 }} value={mobile} onChange={(e) => setMobile(e.target.value)}
                />
                <Typography variant="caption" color="text.secondary">Draw your signature below:</Typography>
                <Box sx={{ border: '1px solid #ccc', borderRadius: 1, mt: 1, bgcolor: '#fafafa' }}>
                  <SignatureCanvas 
                    ref={sigCanvas} 
                    penColor='black' 
                    canvasProps={{ width: 435, height: 180, className: 'sigCanvas' }} 
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Button size="small" onClick={clearSig} color="error">Clear</Button>
                  <Typography variant="caption">Owner Signature</Typography>
                </Box>

                <Box display="flex" gap={2} mt={3}>
                  <Button fullWidth variant="outlined" onClick={() => setStep(1)}>Back</Button>
                  <Button 
                    fullWidth variant="contained" color="success" 
                    onClick={handleFinalSubmit} disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : "Finish & Approve"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}