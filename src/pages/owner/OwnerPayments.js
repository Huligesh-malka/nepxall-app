import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton, Divider, Alert, Stack, Grid
} from "@mui/material";
import {
  Refresh, ArrowBack, Gavel, Security, VerifiedUser,
  InfoOutlined, BorderColor, ReceiptLong, Close, CheckCircle,
  OpenInFull, PictureAsPdf, Download, Visibility
} from "@mui/icons-material";

import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Ensure this matches your deployment URL
const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Flow State
  const [openSignModal, setOpenSignModal] = useState(false);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [openFullReceiptModal, setOpenFullReceiptModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [step, setStep] = useState(1);

  // Form State
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef(null);
  const receiptRef = useRef();
  const fullReceiptRef = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (step === 3 && openSignModal) {
      const timer = setTimeout(() => {
        if (sigCanvas.current) {
          sigCanvas.current.clear();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, openSignModal]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch payments ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (bookingId) => {
    try {
      setIsSubmitting(true);
      const res = await axios.get(`${API}/receipt-details/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        setReceiptData(res.data.data);
        setOpenReceiptModal(true);
      } else {
        alert("No receipt data found");
      }
    } catch (err) {
      alert("Receipt data not found on server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPdf = async (bookingId, filePath) => {
    try {
      await axios.post(`${API}/agreements/viewed`, { booking_id: bookingId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.open(filePath, "_blank");
      fetchPayments();
    } catch (err) {
      window.open(filePath, "_blank");
    }
  };

  const handleOpenSign = (item) => {
    setSelectedBooking(item);
    setStep(1);
    setAgreed(false);
    setMobile("");
    setOtp("");
    setConfirmObj(null);
    setOtpVerified(false);
    setOpenSignModal(true);
  };

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Enter a valid 10-digit mobile number");
    try {
      setIsSubmitting(true);
      const verifyRes = await axios.post(`${API}/agreements/verify-owner`, {
        booking_id: selectedBooking.booking_id,
        mobile: mobile
      });
      if (!verifyRes.data.success) {
        return alert("Verification Failed: Mobile number mismatch ❌");
      }
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const confirmation = await signInWithPhoneNumber(auth, `+91${mobile}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      alert("OTP Sent Successfully ✅");
    } catch (error) {
      console.error("OTP Error:", error);
      alert(error.response?.data?.message || "OTP Service Error");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return alert("Please enter the 6-digit OTP");
    try {
      setIsSubmitting(true);
      await confirmObj.confirm(otp);
      setOtpVerified(true);
      setStep(3);
    } catch (error) {
      alert("Invalid OTP code. ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!otpVerified) return alert("Phone verification required");
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return alert("Please draw your signature in the box");
    }
    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL("image/png");
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
    try {
      setIsSubmitting(true);
      const res = await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signatureBase64,
        accepted_terms: true,
        owner_device_info: JSON.stringify(deviceInfo)
      });
      if (res.data.success) {
        alert("Agreement Signed & Finalized ✅");
        setOpenSignModal(false);
        fetchPayments();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Signing process failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSharingColor = (type) => {
    if (!type) return "default";
    const t = type.toLowerCase();
    if (t.includes("single")) return "success";
    if (t.includes("double")) return "primary";
    if (t.includes("triple")) return "warning";
    if (t.includes("bhk")) return "secondary";
    return "default";
  };

  const downloadPDF = async (elementRef, filename = `receipt-${receiptData?.order_id || "nexpall"}.pdf`) => {
    try {
      const element = elementRef.current;
      if (!element) {
        alert("Receipt element not found");
        return;
      }
      const loadingOverlay = document.createElement('div');
      loadingOverlay.style.position = 'fixed';
      loadingOverlay.style.top = '0';
      loadingOverlay.style.left = '0';
      loadingOverlay.style.width = '100%';
      loadingOverlay.style.height = '100%';
      loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.alignItems = 'center';
      loadingOverlay.style.justifyContent = 'center';
      loadingOverlay.style.zIndex = '9999';
      loadingOverlay.innerHTML = '<div style="background:white; padding:20px; border-radius:8px;">Generating PDF... Please wait</div>';
      document.body.appendChild(loadingOverlay);
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight, undefined, "FAST");
      pdf.save(filename);
      document.body.removeChild(loadingOverlay);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF ❌");
      const loadingOverlay = document.querySelector('div[style*="z-index: 9999"]');
      if (loadingOverlay) loadingOverlay.remove();
    }
  };

  const handleOpenFullReceipt = () => {
    setOpenFullReceiptModal(true);
  };

  // Modern Receipt Content Component
  const ReceiptContent = React.forwardRef(({ data, isFullScreen = false }, ref) => (
    <Box ref={ref} sx={{
      bgcolor: '#ffffff',
      p: isFullScreen ? 5 : 4,
      borderRadius: isFullScreen ? 0 : 3,
      maxWidth: '100%',
      fontFamily: "'Inter', 'Segoe UI', 'Poppins', sans-serif"
    }}>
      {/* Premium Header with Gradient */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 3,
        p: 3.5,
        mb: 4,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <Box sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '50%'
        }} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography variant="h3" fontWeight="800" sx={{ 
              letterSpacing: '-1px',
              background: 'linear-gradient(135deg, #fff 0%, #a8c8ff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              NEPXALL
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              Digital Rent Receipt • Authorized Document
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Issue Date</Typography>
            <Typography variant="h6" fontWeight="bold">
              {data?.verified_date ? new Date(data.verified_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
              Receipt ID: #{data?.order_id || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Premium Status Badge */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          borderRadius: 50,
          px: 4,
          py: 1.2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
          boxShadow: '0 8px 25px rgba(56,239,125,0.25)'
        }}>
          <CheckCircle sx={{ color: 'white', fontSize: 22 }} />
          <Typography variant="body1" fontWeight="bold" sx={{ color: 'white', letterSpacing: '0.5px' }}>
            PAYMENT VERIFIED & SETTLED
          </Typography>
        </Box>
      </Box>

      {/* Info Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Tenant Card */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 3,
            color: 'white',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 30px rgba(102,126,234,0.3)'
            }
          }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: 28 }}>👤</Box> Tenant Details
            </Typography>
            <Box sx={{ opacity: 0.95 }}>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>Name:</strong> {data?.tenant_name || 'N/A'}</Typography>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>Mobile:</strong> {data?.tenant_phone || 'N/A'}</Typography>
              {data?.tenant_email && <Typography variant="body1"><strong>Email:</strong> {data.tenant_email}</Typography>}
            </Box>
          </Box>
        </Grid>

        {/* Property Card */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: 3,
            p: 3,
            color: 'white',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 30px rgba(240,147,251,0.3)'
            }
          }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: 28 }}>🏠</Box> Property Details
            </Typography>
            <Box sx={{ opacity: 0.95 }}>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>PG/Hostel:</strong> {data?.pg_name || 'N/A'}</Typography>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>Room Type:</strong> {data?.room_type || 'N/A'}</Typography>
              {data?.address && <Typography variant="body1"><strong>Address:</strong> {data.address}</Typography>}
            </Box>
          </Box>
        </Grid>

        {/* Owner Card */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: 3,
            p: 3,
            color: 'white',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 30px rgba(79,172,254,0.3)'
            }
          }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: 28 }}>👨‍💼</Box> Owner Details
            </Typography>
            <Box sx={{ opacity: 0.95 }}>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>Name:</strong> {data?.owner_name || 'N/A'}</Typography>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>Owner ID:</strong> #{data?.owner_id || 'N/A'}</Typography>
              <Typography variant="body1"><strong>Mobile:</strong> {data?.owner_phone || 'N/A'}</Typography>
            </Box>
          </Box>
        </Grid>

        {/* Bank Details Card */}
        <Grid item xs={12} md={6}>
          <Box sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: 3,
            p: 3,
            color: '#333',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 30px rgba(250,112,154,0.3)'
            }
          }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: 28 }}>💳</Box> Settlement Account
            </Typography>
            <Box>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>Holder:</strong> {data?.account_holder_name || 'N/A'}</Typography>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>Bank:</strong> {data?.bank_name || 'N/A'}</Typography>
              <Typography variant="body1" sx={{ mb: 1.5 }}><strong>A/C No:</strong> {data?.account_number || 'N/A'}</Typography>
              <Typography variant="body1"><strong>IFSC:</strong> {data?.ifsc || 'N/A'}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Premium Payment Breakdown */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: 3,
        p: 3.5,
        mb: 4,
        color: 'white'
      }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ fontSize: 28 }}>💰</Box> Payment Breakdown
        </Typography>
        
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, p: 2.5 }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="body1">Rent Amount (Monthly)</Typography>
            <Typography variant="body1" fontWeight="bold">₹{data?.rent_amount?.toLocaleString() || 0}</Typography>
          </Box>
          {data?.security_deposit > 0 && (
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body1">Security Deposit</Typography>
              <Typography variant="body1">₹{data.security_deposit?.toLocaleString()}</Typography>
            </Box>
          )}
          {data?.maintenance_amount > 0 && (
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body1">Maintenance Charges</Typography>
              <Typography variant="body1">₹{data.maintenance_amount?.toLocaleString()}</Typography>
            </Box>
          )}
          {data?.other_charges > 0 && (
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body1">Other Charges</Typography>
              <Typography variant="body1">₹{data.other_charges?.toLocaleString()}</Typography>
            </Box>
          )}
          
          <Box sx={{ borderTop: '2px solid rgba(255,255,255,0.2)', mt: 2.5, pt: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight="bold">Total Amount Paid</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{
                background: 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}>
                ₹{data?.total_amount?.toLocaleString() || 0}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Settlement Confirmation - Premium */}
      <Box sx={{
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        borderRadius: 3,
        p: 3,
        textAlign: 'center',
        mb: 3
      }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, color: 'white' }}>
          ✅ Amount Successfully Credited to Owner's Bank Account
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95, color: 'white' }}>
          Transaction Reference: <strong>NEPXALL-{data?.order_id || 'NA'}</strong> • Digitally Generated Receipt
        </Typography>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', borderTop: '2px solid #f0f0f0', pt: 3, mt: 2 }}>
        <Typography variant="body2" color="textSecondary">
          This is a system-generated rent receipt and does not require a physical signature.
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
          For any disputes, please contact NEPXALL Support at <strong>support@nepxall.com</strong>
        </Typography>
      </Box>
    </Box>
  ));

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center">
        <Typography variant="h5" fontWeight="bold">Owner Settlement Dashboard</Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined">Refresh Data</Button>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell><b>Booking ID</b></TableCell>
              <TableCell><b>Tenant Name</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
              <TableCell align="center"><b>Sharing</b></TableCell>
              <TableCell align="center"><b>Agreement Status</b></TableCell>
              <TableCell align="center"><b>Payment Status</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No active settlements found.</TableCell></TableRow>
            ) : data.map(item => {
              const isSigned = !!item.signed_pdf;
              return (
                <TableRow key={item.booking_id} hover>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">₹{item.owner_amount}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.room_type || "N/A"}
                      size="small"
                      color={getSharingColor(item.room_type)}
                      variant="outlined"
                      sx={{ fontWeight: '600', textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {!item.final_pdf ? (
                      <Chip label="Processing PDF..." variant="outlined" />
                    ) : isSigned ? (
                      <Button color="success" variant="contained" size="small" onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}>
                        VIEW SIGNED PDF
                      </Button>
                    ) : (
                      <Box display="flex" gap={1} justifyContent="center">
                        <Button variant="outlined" size="small" onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}>VIEW DRAFT</Button>
                        {item.viewed_by_owner && (
                          <Button variant="contained" color="warning" size="small" onClick={() => handleOpenSign(item)}>SIGN NOW</Button>
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {item.owner_settlement === "DONE" ? (
                      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                        <Chip
                          label="✅ Paid"
                          color="success"
                          sx={{ fontWeight: "bold" }}
                        />
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewReceipt(item.booking_id)}
                          title="View Receipt"
                        >
                          <ReceiptLong />
                        </IconButton>
                      </Stack>
                    ) : (
                      <Chip
                        label="⏳ Pending"
                        color="warning"
                        sx={{ fontWeight: "bold" }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Premium RENT RECEIPT MODAL */}
      <Modal
        open={openReceiptModal}
        onClose={() => setOpenReceiptModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openReceiptModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: 650, md: 850 },
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: 24,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Premium Header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              p: 2.5,
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLong /> RENT RECEIPT
              </Typography>
              <Box>
                <IconButton onClick={handleOpenFullReceipt} size="small" sx={{ color: 'white', mr: 1 }} title="Full Screen View">
                  <OpenInFull />
                </IconButton>
                <IconButton onClick={() => downloadPDF(receiptRef)} size="small" sx={{ color: 'white', mr: 1 }} title="Download PDF">
                  <PictureAsPdf />
                </IconButton>
                <IconButton onClick={() => setOpenReceiptModal(false)} size="small" sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Box>
            </Box>

            {/* Scrollable Content */}
            <Box sx={{ overflowY: 'auto', p: 2 }}>
              <ReceiptContent ref={receiptRef} data={receiptData} isFullScreen={false} />
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* FULL SCREEN RECEIPT MODAL */}
      <Modal
        open={openFullReceiptModal}
        onClose={() => setOpenFullReceiptModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openFullReceiptModal}>
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: '#f5f5f5',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Full Screen Header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              p: 2.5,
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" fontWeight="bold">NEPXALL - Rent Receipt (Full Screen)</Typography>
              <Box>
                <IconButton onClick={() => downloadPDF(fullReceiptRef, `receipt-full-${receiptData?.order_id || "nexpall"}.pdf`)} size="small" sx={{ color: 'white', mr: 1 }} title="Download PDF">
                  <PictureAsPdf />
                </IconButton>
                <IconButton onClick={() => setOpenFullReceiptModal(false)} size="small" sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Box>
            </Box>

            {/* Scrollable Full Screen Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 4, bgcolor: '#fafafa' }}>
              <ReceiptContent ref={fullReceiptRef} data={receiptData} isFullScreen={true} />
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* MULTI-STEP SIGNING MODAL */}
      <Modal
        open={openSignModal}
        onClose={() => !isSubmitting && setOpenSignModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openSignModal}>
          <Box sx={{
            width: { xs: '95%', sm: 650, md: 800 },
            bgcolor: "background.paper",
            borderRadius: 4,
            p: { xs: 2, sm: 4 },
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 24, outline: 'none'
          }}>
            <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
              <Box display="flex" alignItems="center">
                {step > 1 && !otpVerified && (
                  <IconButton onClick={() => setStep(step - 1)} size="small" sx={{ mr: 1 }}>
                    <ArrowBack />
                  </IconButton>
                )}
                <Typography variant="h6" fontWeight="bold" color="primary.main">Digital Signature Portal</Typography>
              </Box>
              <Chip icon={<Security />} label={`Step ${step} / 3`} color="primary" variant="outlined" />
            </Box>

            {/* STEP 1: LEGAL TERMS */}
            {step === 1 && (
              <Box>
                <Alert icon={<InfoOutlined fontSize="inherit" />} severity="info" sx={{ mb: 2 }}>
                  I hereby declare and accept the following 25 legal clauses to proceed.
                </Alert>
                <Box sx={{
                  bgcolor: '#fcfcfc', p: 2.5, borderRadius: 2, border: '1px solid #e0e0e0', mb: 2,
                }}>
                  <Box sx={{
                    maxHeight: 380, overflowY: "auto", pr: 1,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '10px' }
                  }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>PART A: GENERAL DECLARATIONS</Typography>
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: 'text.secondary' }}>
                      1. I have understood all terms and conditions.<br />
                      2. I confirm details are true and correct.<br />
                      3. Agreement is executed under IT Act, 2000.<br />
                      4. OTP serves as identity authentication.<br />
                      5. Electronic signature is valid.<br />
                      6. Agreement cannot be denied once signed.<br />
                      7. Governed by Indian laws.<br />
                      8. Violations lead to legal action.<br />
                      9. Digital doc is equivalent to physical.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight="bold" color="warning.dark" gutterBottom>PART B: OWNER LEGAL RESPONSIBILITIES</Typography>
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: 'text.secondary' }}>
                      10. I am the lawful owner or authorized person.<br />
                      11. Property is free from disputes.<br />
                      12. I have full rights to lease this property.<br />
                      13. Property is safe and habitable.<br />
                      14. Responsible for major repairs.<br />
                      15. Refund security deposit as per terms.<br />
                      16. Liable for false information.<br />
                      17. Responsible for rental income taxes.<br />
                      18. Indemnify platform from disputes.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight="bold" color="error.main" gutterBottom>PART C: CONSENT & ROLE</Typography>
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: 'text.secondary' }}>
                      19. No illegal activities allowed.<br />
                      22. Audit trail (OTP, IP) is legal proof.<br />
                      23. Platform is only a facilitator.<br />
                      25. Full legal responsibility accepted.
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" mb={3} sx={{ bgcolor: '#fffde7', p: 1.5, borderRadius: 2, border: '1px solid #ffe082' }}>
                  <Checkbox
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    sx={{ p: 0, mr: 1 }}
                  />
                  <Typography variant="body2" fontWeight="600">
                    I have read and accept all legal clauses.
                  </Typography>
                </Box>
                <Button
                  fullWidth variant="contained" size="large" disabled={!agreed}
                  onClick={() => setStep(2)}
                  sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
                >
                  I Agree, Proceed to Verification
                </Button>
              </Box>
            )}

            {/* STEP 2: PHONE OTP */}
            {step === 2 && (
              <Box py={2} textAlign="center">
                <VerifiedUser color="primary" sx={{ fontSize: 60, mb: 1 }} />
                <Typography variant="h6">Phone Authentication</Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  Verify the mobile number for Booking #{selectedBooking?.booking_id}
                </Typography>
                <TextField
                  fullWidth label="Mobile Number" variant="outlined" value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  disabled={!!confirmObj || isSubmitting}
                  sx={{ mb: 3 }}
                  placeholder="Enter 10 digit mobile"
                />
                {!confirmObj ? (
                  <Button fullWidth variant="contained" size="large" onClick={sendOtp} disabled={isSubmitting || mobile.length < 10}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Request OTP"}
                  </Button>
                ) : (
                  <>
                    <TextField
                      fullWidth label="6-Digit OTP"
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      sx={{ mb: 3 }}
                      inputProps={{ maxLength: 6 }}
                    />
                    <Button fullWidth variant="contained" size="large" onClick={verifyOtp} disabled={isSubmitting || otp.length < 6}>
                      {isSubmitting ? <CircularProgress size={24} /> : "Verify & Continue"}
                    </Button>
                  </>
                )}
                <div id="recaptcha-container"></div>
              </Box>
            )}

            {/* STEP 3: DIGITAL SIGNATURE */}
            {step === 3 && (
              <Box py={1}>
                <Box textAlign="center" mb={2}>
                  <BorderColor color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Draw Your Signature</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Please sign inside the box below.
                  </Typography>
                </Box>
                <Box sx={{ border: "2px dashed #1976d2", borderRadius: 2, bgcolor: '#fdfdfd', overflow: 'hidden' }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      width: 680, height: 250, className: "sigCanvas",
                      style: { width: '100%', height: '250px' }
                    }}
                  />
                </Box>
                <Box mt={3} display="flex" gap={2}>
                  <Button variant="outlined" fullWidth onClick={() => sigCanvas.current.clear()} disabled={isSubmitting}>
                    Clear
                  </Button>
                  <Button variant="contained" color="success" fullWidth onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Finalize & Sign Agreement"}
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