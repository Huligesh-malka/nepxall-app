import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton, Divider, Alert, Stack, Grid, Card, CardContent
} from "@mui/material";
import { 
  Refresh, ArrowBack, Gavel, Security, VerifiedUser, 
  InfoOutlined, BorderColor, ReceiptLong, Close, CheckCircle, Download, Payment, Home, Person, AccountBalance, CalendarToday
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
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, []);

  // Sync canvas size when step 3 opens
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

  // Direct download receipt function
  const handleDirectDownload = async (bookingId) => {
    try {
      setIsSubmitting(true);
      // Fetch receipt data first
      const res = await axios.get(`${API}/receipt-details/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const receiptInfo = res.data.data;
        // Generate PDF directly without showing modal
        await generateAndDownloadPDF(receiptInfo);
      } else {
        alert("No receipt data found");
      }
    } catch (err) {
      alert("Failed to download receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate PDF from receipt data without modal
  const generateAndDownloadPDF = async (receiptInfo) => {
    // Create a temporary div to render receipt for PDF capture
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '600px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '24px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempDiv);

    // Render receipt content
    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">NEXPALL</h1>
        <p style="margin: 4px 0 0; color: #666;">Next Places for Living</p>
      </div>
      <div style="border-top: 2px solid #e0e0e0; border-bottom: 2px solid #e0e0e0; padding: 12px 0; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: bold; color: #2e7d32;">✅ PAYMENT SUCCESSFUL</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${new Date(receiptInfo?.verified_date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
      <div style="margin-bottom: 16px;">
        <p style="font-weight: bold; margin: 0 0 4px;">👤 Tenant</p>
        <p style="margin: 0 0 8px 12px;">Mobile: ${receiptInfo?.tenant_phone || '+91 XXXXX XXXXX'}</p>
      </div>
      <div style="margin-bottom: 16px;">
        <p style="font-weight: bold; margin: 0 0 4px;">🏠 Property</p>
        <p style="margin: 0 0 4px 12px;">PG: ${receiptInfo?.pg_name || 'Lakshmi PG'}</p>
        <p style="margin: 0 0 8px 12px;">Room: ${receiptInfo?.room_type || 'Double Sharing'}</p>
      </div>
      <div style="margin-bottom: 16px;">
        <p style="font-weight: bold; margin: 0 0 4px;">👨‍💼 Owner</p>
        <p style="margin: 0 0 8px 12px;">Owner ID: #${receiptInfo?.owner_id || '2'}</p>
      </div>
      <div style="margin-bottom: 16px;">
        <p style="font-weight: bold; margin: 0 0 4px;">💳 Bank</p>
        <p style="margin: 0 0 4px 12px;">Holder: ${receiptInfo?.account_holder_name || 'Balaraja'}</p>
        <p style="margin: 0 0 4px 12px;">Bank: ${receiptInfo?.bank_name || 'SBI Bank'}</p>
        <p style="margin: 0 0 4px 12px;">A/C: ${receiptInfo?.account_number || 'XXXX1285'}</p>
        <p style="margin: 0 0 8px 12px;">IFSC: ${receiptInfo?.ifsc || 'SBIN0040410'}</p>
      </div>
      <hr style="margin: 16px 0;" />
      <div style="margin-bottom: 16px;">
        <p style="font-weight: bold; margin: 0 0 12px;">💰 Payment Summary</p>
        <div style="display: flex; justify-content: space-between; margin: 0 0 8px 12px;">
          <span>Rent</span>
          <span>₹${receiptInfo?.rent_amount || '3000.00'}</span>
        </div>
        ${(receiptInfo?.security_deposit > 0 || !receiptInfo) ? `
        <div style="display: flex; justify-content: space-between; margin: 0 0 8px 12px;">
          <span>Security Deposit</span>
          <span>₹${receiptInfo?.security_deposit || '2000.00'}</span>
        </div>
        ` : ''}
        ${(receiptInfo?.maintenance_amount > 0 || !receiptInfo) ? `
        <div style="display: flex; justify-content: space-between; margin: 0 0 8px 12px;">
          <span>Maintenance</span>
          <span>₹${receiptInfo?.maintenance_amount || '100.00'}</span>
        </div>
        ` : ''}
        <hr style="margin: 12px 0; border-top: 1px dashed #ccc;" />
        <div style="display: flex; justify-content: space-between; margin: 0 0 0 12px; font-weight: bold;">
          <span>TOTAL PAID</span>
          <span>₹${receiptInfo?.total_amount || '3000.00'}</span>
        </div>
      </div>
      <hr style="margin: 16px 0;" />
      <div style="margin: 16px 0;">
        <p style="margin: 8px 0; color: #2e7d32;">✔ Settlement Completed</p>
        <p style="margin: 8px 0; color: #2e7d32;">✔ Paid to Owner</p>
        <p style="margin: 8px 0; color: #2e7d32;">✔ Digital Receipt</p>
      </div>
      <hr style="margin: 16px 0;" />
      <div style="text-align: center;">
        <p style="margin: 0;">Thank you for using NEXPALL 🙏</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #666;">support@nexpall.com</p>
      </div>
    `;

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight, undefined, "FAST");
      pdf.save(`receipt-${receiptInfo?.order_id || "nexpall"}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF ❌");
    } finally {
      document.body.removeChild(tempDiv);
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

  const downloadPDF = async () => {
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        scrollY: -window.scrollY
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight, undefined, "FAST");
      pdf.save(`receipt-${receiptData?.order_id || "nexpall"}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF ❌");
    }
  };

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4, maxWidth: '1400px' }}>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Owner Settlement Dashboard
        </Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
          Refresh Data
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tenant Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Sharing</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Agreement Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Payment Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>No active settlements found.</TableCell></TableRow>
            ) : data.map(item => {
              const isSigned = !!item.signed_pdf;
              return (
                <TableRow key={item.booking_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold" color="primary.main">₹{item.owner_amount}</Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip 
                      label={item.room_type || "N/A"} 
                      size="small" 
                      color={getSharingColor(item.room_type)} 
                      variant="filled" 
                      sx={{ fontWeight: '600', textTransform: 'capitalize' }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    {!item.final_pdf ? (
                      <Chip label="Processing PDF..." variant="outlined" size="small" />
                    ) : isSigned ? (
                      <Button 
                        color="success" 
                        variant="contained" 
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                        onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}
                      >
                        VIEW SIGNED PDF
                      </Button>
                    ) : (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                          onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}
                        >
                          VIEW DRAFT
                        </Button>
                        {item.viewed_by_owner && (
                          <Button 
                            variant="contained" 
                            color="warning" 
                            size="small" 
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                            onClick={() => handleOpenSign(item)}
                          >
                            SIGN NOW
                          </Button>
                        )}
                      </Stack>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    {item.owner_settlement === "DONE" ? (
                      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                        <Chip
                          label="✅ Paid"
                          color="success"
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Download />}
                          onClick={() => handleDirectDownload(item.booking_id)}
                          disabled={isSubmitting}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Receipt
                        </Button>
                      </Stack>
                    ) : (
                      <Chip
                        label="⏳ Pending"
                        color="warning"
                        size="small"
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

      {/* MODERN RECEIPT MODAL - Clean & Professional Design */}
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
            width: { xs: '95%', sm: 550, md: 580 },
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            outline: 'none'
          }}>
            {/* Receipt Content - Modern Card Style */}
            <Box ref={receiptRef} sx={{ p: 3, bgcolor: '#ffffff' }}>
              {/* Header with gradient accent */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h3" fontWeight="800" sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 2
                }}>
                  NEXPALL
                </Typography>
                <Typography variant="body2" color="textSecondary">Next Places for Living</Typography>
              </Box>

              {/* Status Badge */}
              <Box sx={{ 
                bgcolor: '#e8f5e9', 
                borderRadius: 2, 
                p: 1.5, 
                textAlign: 'center',
                mb: 3,
                border: '1px solid #c8e6c9'
              }}>
                <Typography variant="subtitle1" fontWeight="bold" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CheckCircle fontSize="small" /> PAYMENT SUCCESSFUL
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {receiptData?.verified_date ? new Date(receiptData.verified_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>

              {/* Info Cards Grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#fafafa' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Person fontSize="small" color="primary" />
                        <Typography variant="caption" color="textSecondary">Tenant</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="500">{receiptData?.tenant_phone || '+91 XXXXX XXXXX'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#fafafa' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Home fontSize="small" color="primary" />
                        <Typography variant="caption" color="textSecondary">Property</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="500">{receiptData?.pg_name || 'Lakshmi PG'}</Typography>
                      <Typography variant="caption" color="textSecondary">{receiptData?.room_type || 'Double Sharing'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#fafafa' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <AccountBalance fontSize="small" color="primary" />
                        <Typography variant="caption" color="textSecondary">Bank</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="500">{receiptData?.account_holder_name || 'Balaraja'}</Typography>
                      <Typography variant="caption" color="textSecondary">{receiptData?.bank_name || 'SBI Bank'}</Typography>
                      <Typography variant="caption" display="block" color="textSecondary">A/C: {receiptData?.account_number || 'XXXX1285'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#fafafa' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Payment fontSize="small" color="primary" />
                        <Typography variant="caption" color="textSecondary">Payment Summary</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption">Rent</Typography>
                        <Typography variant="body2" fontWeight="500">₹{receiptData?.rent_amount || '3000'}</Typography>
                      </Box>
                      {(receiptData?.security_deposit > 0 || !receiptData) && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Security Deposit</Typography>
                          <Typography variant="body2">₹{receiptData?.security_deposit || '2000'}</Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight="bold">TOTAL</Typography>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary.main">₹{receiptData?.total_amount || '3000'}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Settlement Status */}
              <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, mb: 3 }}>
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle fontSize="small" color="success" />
                    <Typography variant="body2">Settlement Completed</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle fontSize="small" color="success" />
                    <Typography variant="body2">Paid to Owner</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle fontSize="small" color="success" />
                    <Typography variant="body2">Digital Receipt</Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Footer */}
              <Box textAlign="center">
                <Typography variant="body2" color="textSecondary">Thank you for using NEXPALL 🙏</Typography>
                <Typography variant="caption" color="textSecondary">support@nexpall.com</Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0', display: 'flex', gap: 2 }}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={() => setOpenReceiptModal(false)}
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={downloadPDF}
                startIcon={<Download />}
                sx={{ borderRadius: 2 }}
              >
                Download PDF
              </Button>
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
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            outline: 'none',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  {step > 1 && !otpVerified && (
                    <IconButton onClick={() => setStep(step - 1)} size="small" sx={{ mr: 1 }}>
                      <ArrowBack />
                    </IconButton>
                  )}
                  <Typography variant="h6" fontWeight="bold" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Digital Signature Portal
                  </Typography>
                </Box>
                <Chip icon={<Security />} label={`Step ${step} / 3`} color="primary" variant="outlined" />
            </Box>

            {/* STEP 1: LEGAL TERMS */}
            {step === 1 && (
              <Box>
                <Alert icon={<InfoOutlined fontSize="inherit" />} severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  I hereby declare and accept the following legal clauses to proceed.
                </Alert>
                
                <Box sx={{ 
                  bgcolor: '#fcfcfc', 
                  p: 2.5, 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0', 
                  mb: 2,
                }}>
                  <Box sx={{ 
                    maxHeight: 380, 
                    overflowY: "auto", 
                    pr: 1,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '10px' }
                  }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>PART A: GENERAL DECLARATIONS</Typography>
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: 'text.secondary' }}>
                        1. I have understood all terms and conditions.<br/>
                        2. I confirm details are true and correct.<br/>
                        3. Agreement is executed under IT Act, 2000.<br/>
                        4. OTP serves as identity authentication.<br/>
                        5. Electronic signature is valid.<br/>
                        6. Agreement cannot be denied once signed.<br/>
                        7. Governed by Indian laws.<br/>
                        8. Violations lead to legal action.<br/>
                        9. Digital doc is equivalent to physical.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" fontWeight="bold" color="warning.dark" gutterBottom>PART B: OWNER LEGAL RESPONSIBILITIES</Typography>
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: 'text.secondary' }}>
                        10. I am the lawful owner or authorized person.<br/>
                        11. Property is free from disputes.<br/>
                        12. I have full rights to lease this property.<br/>
                        13. Property is safe and habitable.<br/>
                        14. Responsible for major repairs.<br/>
                        15. Refund security deposit as per terms.<br/>
                        16. Liable for false information.<br/>
                        17. Responsible for rental income taxes.<br/>
                        18. Indemnify platform from disputes.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" fontWeight="bold" color="error.main" gutterBottom>PART C: CONSENT & ROLE</Typography>
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: 'text.secondary' }}>
                        19. No illegal activities allowed.<br/>
                        20. Audit trail (OTP, IP) is legal proof.<br/>
                        21. Platform is only a facilitator.<br/>
                        22. Full legal responsibility accepted.
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
                  <Button fullWidth variant="contained" size="large" onClick={sendOtp} disabled={isSubmitting || mobile.length < 10} sx={{ borderRadius: 2 }}>
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
                    <Button fullWidth variant="contained" size="large" onClick={verifyOtp} disabled={isSubmitting || otp.length < 6} sx={{ borderRadius: 2 }}>
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
                  <Button variant="outlined" fullWidth onClick={() => sigCanvas.current.clear()} disabled={isSubmitting} sx={{ borderRadius: 2 }}>
                    Clear
                  </Button>
                  <Button variant="contained" color="success" fullWidth onClick={handleSubmit} disabled={isSubmitting} sx={{ borderRadius: 2 }}>
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