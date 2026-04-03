import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton, Divider, Alert, Stack,
  Card, CardContent, Avatar, Tooltip, Zoom, alpha, useTheme
} from "@mui/material";
import {
  Refresh, ArrowBack, Gavel, Security, VerifiedUser,
  InfoOutlined, BorderColor, ReceiptLong, Close, CheckCircle,
  Download, Payment, Home, Person, AccountBalance, Receipt,
  AttachMoney, KeyboardArrowDown, KeyboardArrowUp, Star
} from "@mui/icons-material";

import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Modal & Flow State
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [step, setStep] = useState(1);

  // Form State
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const sigCanvas = useRef(null);
  const token = localStorage.getItem("token");
  const theme = useTheme();

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (step === 3 && openSignModal) {
      const timer = setTimeout(() => {
        if (sigCanvas.current) sigCanvas.current.clear();
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

  // ─── Modern PDF Download (Direct without modal) ───────────────────────────────────────
  const handleViewReceipt = async (bookingId) => {
    try {
      setDownloadingId(bookingId);
      const res = await axios.get(`${API}/receipt-details/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data.success || !res.data.data) {
        alert("No receipt data found");
        return;
      }

      const d = res.data.data;
      generateModernReceiptPDF(d);
    } catch (err) {
      alert("Receipt data not found on server.");
    } finally {
      setDownloadingId(null);
    }
  };

  const generateModernReceiptPDF = (d) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 20;

    // Helper functions
    const gradientRect = (x, y, w, h, color1, color2) => {
      for (let i = 0; i <= 100; i++) {
        const r = color1.r + (color2.r - color1.r) * (i / 100);
        const g = color1.g + (color2.g - color1.g) * (i / 100);
        const b = color1.b + (color2.b - color1.b) * (i / 100);
        pdf.setFillColor(r, g, b);
        pdf.rect(x + (w * i / 100), y, w / 100, h, "F");
      }
    };

    const roundedRect = (x, y, w, h, r, fill = true) => {
      if (fill) {
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, w, h, r, r, "F");
      }
      pdf.setDrawColor(230, 230, 230);
      pdf.roundedRect(x, y, w, h, r, r, "D");
    };

    // Modern Header with Gradient
    pdf.setFillColor(31, 41, 55);
    pdf.rect(0, 0, pageW, 45, "F");
    
    // Accent line
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 42, pageW, 3, "F");
    
    // Logo area
    pdf.setFillColor(59, 130, 246);
    pdf.circle(30, 22, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text("NEXPALL", 42, 26);
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(209, 213, 219);
    pdf.text("Premium Living Solutions", 42, 34);
    
    // Receipt Badge
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(pageW - 55, 15, 40, 18, 3, 3, "F");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("RECEIPT", pageW - 35, 27, { align: "center" });
    
    y = 58;
    
    // Success Banner
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, y, contentW, 20, 4, 4, "F");
    pdf.setFillColor(34, 197, 94);
    pdf.circle(margin + 12, y + 10, 4, "F");
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(22, 101, 52);
    pdf.text("PAYMENT CONFIRMED", margin + 22, y + 14);
    pdf.setFontSize(9);
    pdf.setTextColor(74, 222, 128);
    pdf.text("✓ Transaction Successful", margin + 22, y + 21);
    
    y += 28;
    
    // Order ID and Date Cards
    const dateStr = d.verified_date
      ? new Date(d.verified_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    
    // Card style boxes
    roundedRect(margin, y, contentW / 2 - 5, 20, 4);
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text("ORDER ID", margin + 8, y + 8);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    pdf.text(d.order_id || "NEXPALL-2024", margin + 8, y + 16);
    
    roundedRect(margin + contentW / 2 + 5, y, contentW / 2 - 5, 20, 4);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("DATE", margin + contentW / 2 + 13, y + 8);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    pdf.text(dateStr, margin + contentW / 2 + 13, y + 16);
    
    y += 30;
    
    // Divider
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageW - margin, y);
    y += 15;
    
    // Section Title Helper
    const sectionTitle = (title, icon, yPos) => {
      pdf.setFillColor(59, 130, 246);
      pdf.circle(margin + 4, yPos - 4, 3, "F");
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text(title, margin + 12, yPos);
      return yPos + 12;
    };
    
    // Tenant Details Card
    y = sectionTitle("TENANT INFORMATION", "👤", y);
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, y - 5, contentW, 35, 6, "F");
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("Name", margin + 12, y + 5);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont("helvetica", "bold");
    pdf.text(d.tenant_name || "—", margin + 12, y + 13);
    
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("Mobile Number", margin + contentW / 2 + 10, y + 5);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont("helvetica", "bold");
    pdf.text(d.tenant_phone || "+91 XXXXX XXXXX", margin + contentW / 2 + 10, y + 13);
    
    y += 38;
    
    // Property Details
    y = sectionTitle("PROPERTY DETAILS", "🏠", y);
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, y - 5, contentW, 35, 6, "F");
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("PG Name", margin + 12, y + 5);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont("helvetica", "bold");
    pdf.text(d.pg_name || "—", margin + 12, y + 13);
    
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("Room Type", margin + contentW / 2 + 10, y + 5);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont("helvetica", "bold");
    pdf.text(d.room_type || "—", margin + contentW / 2 + 10, y + 13);
    
    y += 38;
    
    // Owner Details
    y = sectionTitle("OWNER INFORMATION", "👑", y);
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, y - 5, contentW, 25, 6, "F");
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("Owner ID", margin + 12, y + 5);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont("helvetica", "bold");
    pdf.text(`#${d.owner_id || "—"}`, margin + 12, y + 13);
    
    y += 33;
    
    // Bank Details
    y = sectionTitle("BANK DETAILS", "🏦", y);
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, y - 5, contentW, 50, 6, "F");
    
    const bankItems = [
      { label: "Account Holder", value: d.account_holder_name || "—" },
      { label: "Bank Name", value: d.bank_name || "—" },
      { label: "Account Number", value: d.account_number || "—" },
      { label: "IFSC Code", value: d.ifsc || "—" }
    ];
    
    bankItems.forEach((item, idx) => {
      const rowY = y + 5 + (idx * 10);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text(item.label, margin + 12, rowY);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text(item.value, margin + 70, rowY);
    });
    
    y += 58;
    
    // Payment Summary with Modern Design
    y = sectionTitle("PAYMENT SUMMARY", "💰", y);
    
    const rent = parseFloat(d.rent_amount) || 0;
    const deposit = parseFloat(d.security_deposit) || 0;
    const maintenance = parseFloat(d.maintenance_amount) || 0;
    const total = parseFloat(d.total_amount) || rent + deposit + maintenance;
    
    // Payment items card
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, y - 5, contentW, 65, 6, "F");
    
    let paymentY = y;
    
    // Rent row
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("Rent Amount", margin + 12, paymentY + 5);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont("helvetica", "bold");
    pdf.text(`₹${rent.toFixed(2)}`, pageW - margin - 12, paymentY + 5, { align: "right" });
    paymentY += 12;
    
    if (deposit > 0) {
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Security Deposit", margin + 12, paymentY + 5);
      pdf.setTextColor(31, 41, 55);
      pdf.setFont("helvetica", "bold");
      pdf.text(`₹${deposit.toFixed(2)}`, pageW - margin - 12, paymentY + 5, { align: "right" });
      paymentY += 12;
    }
    
    if (maintenance > 0) {
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Maintenance Charges", margin + 12, paymentY + 5);
      pdf.setTextColor(31, 41, 55);
      pdf.setFont("helvetica", "bold");
      pdf.text(`₹${maintenance.toFixed(2)}`, pageW - margin - 12, paymentY + 5, { align: "right" });
      paymentY += 12;
    }
    
    // Divider
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 12, paymentY + 2, pageW - margin - 12, paymentY + 2);
    paymentY += 8;
    
    // Total row with highlight
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin + 12, paymentY - 2, contentW - 24, 12, 4, "F");
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOTAL AMOUNT", margin + 18, paymentY + 7);
    pdf.text(`₹${total.toFixed(2)}`, pageW - margin - 18, paymentY + 7, { align: "right" });
    
    y += 70;
    
    // Status Section
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, y, contentW, 28, 6, "F");
    
    const statusItems = ["✓ Settlement Completed", "✓ Paid to Owner", "✓ Digital Receipt"];
    statusItems.forEach((item, idx) => {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(34, 197, 94);
      pdf.text(item, margin + 12 + (idx * 65), y + 18);
    });
    
    y += 38;
    
    // Footer
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y, pageW - margin, y);
    y += 10;
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("Thank you for choosing NEXPALL", pageW / 2, y, { align: "center" });
    y += 6;
    pdf.setFontSize(8);
    pdf.text("support@nexpall.com | www.nexpall.com", pageW / 2, y, { align: "center" });
    y += 6;
    pdf.setFontSize(7);
    pdf.text("This is a system-generated receipt and does not require a signature.", pageW / 2, y, { align: "center" });
    
    // Save PDF
    pdf.save(`receipt-${d.order_id || d.booking_id || "nexpall"}.pdf`);
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
      if (!verifyRes.data.success) return alert("Verification Failed: Mobile number mismatch ❌");

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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress size={60} thickness={4} />
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Owner Settlement Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Manage and track all your property settlements
            </Typography>
          </Box>
          <Button 
            onClick={fetchPayments} 
            startIcon={<Refresh />} 
            variant="contained" 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              borderRadius: 2
            }}
          >
            Refresh Data
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3} mb={3}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Settlements</Typography>
            <Typography variant="h4" fontWeight="bold">{data.length}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Paid Amount</Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              ₹{data.filter(item => item.owner_settlement === "DONE").reduce((sum, item) => sum + (item.owner_amount || 0), 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Pending Amount</Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              ₹{data.filter(item => item.owner_settlement !== "DONE").reduce((sum, item) => sum + (item.owner_amount || 0), 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Success Rate</Typography>
            <Typography variant="h4" fontWeight="bold">
              {((data.filter(item => item.owner_settlement === "DONE").length / data.length) * 100 || 0).toFixed(0)}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: '1px solid #e2e8f0' }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8fafc", borderBottom: '2px solid #e2e8f0' }}>
            <TableRow>
              <TableCell width="50px"></TableCell>
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
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography color="textSecondary">No active settlements found.</Typography>
                </TableCell>
              </TableRow>
            ) : data.map(item => {
              const isSigned = !!item.signed_pdf;
              return (
                <React.Fragment key={item.booking_id}>
                  <TableRow hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <IconButton size="small" onClick={() => setExpandedRow(expandedRow === item.booking_id ? null : item.booking_id)}>
                        {expandedRow === item.booking_id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="600">#{item.booking_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <Person sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography fontWeight="500">{item.tenant_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold" color="primary.main">₹{item.owner_amount}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.room_type || "N/A"}
                        size="small"
                        color={getSharingColor(item.room_type)}
                        variant="outlined"
                        sx={{ fontWeight: "600", textTransform: "capitalize", borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {!item.final_pdf ? (
                        <Chip label="Processing PDF..." variant="outlined" size="small" />
                      ) : isSigned ? (
                        <Tooltip title="View Signed Agreement">
                          <Button 
                            color="success" 
                            variant="contained" 
                            size="small" 
                            onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            VIEW SIGNED PDF
                          </Button>
                        </Tooltip>
                      ) : (
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            VIEW DRAFT
                          </Button>
                          {item.viewed_by_owner && (
                            <Button 
                              variant="contained" 
                              color="warning" 
                              size="small" 
                              onClick={() => handleOpenSign(item)}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              SIGN NOW
                            </Button>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {item.owner_settlement === "DONE" ? (
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Chip 
                            label="Paid" 
                            color="success" 
                            size="small"
                            icon={<CheckCircle sx={{ fontSize: 16 }} />}
                            sx={{ fontWeight: "bold", borderRadius: 2 }}
                          />
                          <Tooltip title="Download Receipt">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleViewReceipt(item.booking_id)}
                              disabled={downloadingId === item.booking_id}
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                              }}
                            >
                              {downloadingId === item.booking_id
                                ? <CircularProgress size={18} />
                                : <Download />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Chip label="Pending" color="warning" size="small" sx={{ fontWeight: "bold", borderRadius: 2 }} />
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedRow === item.booking_id && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ bgcolor: '#f8fafc', py: 2 }}>
                        <Box p={2}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Additional Details</Typography>
                          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={2}>
                            <Typography variant="body2"><strong>Property:</strong> {item.pg_name || 'N/A'}</Typography>
                            <Typography variant="body2"><strong>Move-in Date:</strong> {item.move_in_date ? new Date(item.move_in_date).toLocaleDateString() : 'N/A'}</Typography>
                            <Typography variant="body2"><strong>Agreement Date:</strong> {item.agreement_date ? new Date(item.agreement_date).toLocaleDateString() : 'N/A'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* MULTI-STEP SIGNING MODAL - Modern Design */}
      <Modal
        open={openSignModal}
        onClose={() => !isSubmitting && setOpenSignModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openSignModal}>
          <Box sx={{
            width: { xs: "95%", sm: 650, md: 800 },
            bgcolor: "background.paper",
            borderRadius: 4,
            p: { xs: 2, sm: 4 },
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: 24, outline: "none"
          }}>
            <Box display="flex" alignItems="center" mb={3} justifyContent="space-between">
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
                <Alert icon={<InfoOutlined fontSize="inherit" />} severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  I hereby declare and accept the following legal clauses to proceed.
                </Alert>

                <Box sx={{ bgcolor: "#fafafa", p: 2.5, borderRadius: 2, border: "1px solid #e0e0e0", mb: 2 }}>
                  <Box sx={{
                    maxHeight: 380, overflowY: "auto", pr: 1,
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: "10px" }
                  }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>PART A: GENERAL DECLARATIONS</Typography>
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: "text.secondary" }}>
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
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: "text.secondary" }}>
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
                    <Typography variant="caption" component="div" sx={{ mb: 2, lineHeight: 1.6, color: "text.secondary" }}>
                      19. No illegal activities allowed.<br />
                      22. Audit trail (OTP, IP) is legal proof.<br />
                      23. Platform is only a facilitator.<br />
                      24. Full legal responsibility accepted.
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" mb={3} sx={{ bgcolor: "#fffde7", p: 1.5, borderRadius: 2, border: "1px solid #ffe082" }}>
                  <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} sx={{ p: 0, mr: 1 }} />
                  <Typography variant="body2" fontWeight="600">I have read and accept all legal clauses.</Typography>
                </Box>

                <Button
                  fullWidth variant="contained" size="large" disabled={!agreed}
                  onClick={() => setStep(2)}
                  sx={{ py: 1.5, fontWeight: "bold", borderRadius: 2 }}
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
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
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
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
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
                  <Typography variant="caption" color="textSecondary">Please sign inside the box below.</Typography>
                </Box>

                <Box sx={{ border: "2px dashed #1976d2", borderRadius: 2, bgcolor: "#fdfdfd", overflow: "hidden" }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      width: 680, height: 250, className: "sigCanvas",
                      style: { width: "100%", height: "250px" }
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