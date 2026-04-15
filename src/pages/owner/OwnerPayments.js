import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton, Divider, Alert, Stack, Grid, Card, CardContent, Collapse
} from "@mui/material";
import { 
  Refresh, ArrowBack, Security, 
  InfoOutlined, BorderColor, Close, CheckCircle, Download, 
  Person, Home, AccountBalance, Payment, ExpandMore, ExpandLess, Receipt
} from "@mui/icons-material";

// Brand Colors
const BRAND_BLUE = "#2563eb";
const BRAND_GREEN = "#10b981";
const BRAND_DARK = "#1e293b";
const BRAND_GRAY = "#64748b";
const BRAND_LIGHT_BG = "#f8fafc";

// Ensure this matches your deployment URL
const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  
  const [data, setData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [expandedPGs, setExpandedPGs] = useState({});

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

  const fetchPayments = async () => {
    if (!user) return;
    
    try {
      setPageLoading(true);
      const token = await user.getIdToken();
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch payments ❌");
    } finally {
      setPageLoading(false);
    }
  };

  /* ================= AUTH + LOAD ================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }

    if (user && role === "owner") {
      fetchPayments();
    }
  }, [user, role, authLoading, navigate]);

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

  const handleViewReceipt = async (bookingId) => {
    try {
      setIsSubmitting(true);
      const token = await user.getIdToken();
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

  // Direct download receipt function - FIXED for full content capture
  const handleDirectDownload = async (bookingId) => {
    try {
      setIsSubmitting(true);
      const token = await user.getIdToken();
      const res = await axios.get(`${API}/receipt-details/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const receiptInfo = res.data.data;
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

  const handleMarkPaid = async (bookingId) => {
  try {
    setIsSubmitting(true);

    const token = await user.getIdToken();

    await axios.post(
      `${API}/mark-paid`,
      { booking_id: bookingId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert("Marked as Paid ✅");

    // 🔄 Refresh data
    fetchPayments();

  } catch (err) {
    console.error(err);
    alert("Error ❌");
  } finally {
    setIsSubmitting(false);
  }
};

  // Generate PDF from receipt data - MODERN DESIGN WITH BRAND COLORS
  const generateAndDownloadPDF = async (receiptInfo) => {
    // Create a temporary div to render receipt for PDF capture
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '700px';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '32px';
    tempDiv.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif";
    tempDiv.style.borderRadius = '0px';
    tempDiv.style.boxSizing = 'border-box';
    document.body.appendChild(tempDiv);

    // Format date
    const formattedDate = receiptInfo?.verified_date 
      ? new Date(receiptInfo.verified_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    // Render receipt content with modern design and brand colors
    tempDiv.innerHTML = `
      <div style="max-width: 700px; margin: 0 auto;">
        <!-- Header with Brand Colors -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="font-size: 42px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px;">
            <span style="color: ${BRAND_BLUE};">Nep</span><span style="color: ${BRAND_GREEN};">xall</span>
          </div>
          <p style="margin: 0; color: ${BRAND_GRAY}; font-size: 13px; letter-spacing: 1px;">Next Places for Living</p>
        </div>

        <!-- Status Badge -->
        <div style="background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%); border-radius: 100px; padding: 12px 24px; text-align: center; margin-bottom: 32px; border: 1px solid rgba(16,185,129,0.2);">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="color: ${BRAND_GREEN}; font-size: 20px;">✓</span>
            <span style="font-weight: 700; color: ${BRAND_GREEN}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Payment Successful</span>
          </div>
          <p style="margin: 6px 0 0; font-size: 11px; color: ${BRAND_GRAY};">${formattedDate}</p>
        </div>

        <!-- Info Cards Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <!-- Tenant Card -->
          <div style="background: ${BRAND_LIGHT_BG}; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 20px;">👤</span>
              <span style="font-size: 11px; color: ${BRAND_GRAY}; text-transform: uppercase; letter-spacing: 0.5px;">Tenant</span>
            </div>
            <p style="margin: 0; font-weight: 600; font-size: 14px; color: ${BRAND_DARK};">${receiptInfo?.tenant_phone || '+91 XXXXX XXXXX'}</p>
          </div>

          <!-- Property Card -->
          <div style="background: ${BRAND_LIGHT_BG}; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 20px;">🏠</span>
              <span style="font-size: 11px; color: ${BRAND_GRAY}; text-transform: uppercase; letter-spacing: 0.5px;">Property</span>
            </div>
            <p style="margin: 0; font-weight: 600; font-size: 14px; color: ${BRAND_DARK};">${receiptInfo?.pg_name || 'Lakshmi PG'}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: ${BRAND_GRAY};">${receiptInfo?.room_type || 'Double Sharing'}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <!-- Owner Card -->
          <div style="background: ${BRAND_LIGHT_BG}; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 20px;">👨‍💼</span>
              <span style="font-size: 11px; color: ${BRAND_GRAY}; text-transform: uppercase; letter-spacing: 0.5px;">Owner</span>
            </div>
            <p style="margin: 0; font-weight: 600; font-size: 14px; color: ${BRAND_DARK};">Owner ID: #${receiptInfo?.owner_id || '7'}</p>
          </div>

          <!-- Bank Card -->
          <div style="background: ${BRAND_LIGHT_BG}; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 20px;">💳</span>
              <span style="font-size: 11px; color: ${BRAND_GRAY}; text-transform: uppercase; letter-spacing: 0.5px;">Bank</span>
            </div>
            <p style="margin: 0; font-weight: 500; font-size: 13px;">Holder: ${receiptInfo?.account_holder_name || 'basava'}</p>
            <p style="margin: 4px 0; font-size: 13px;">Bank: ${receiptInfo?.bank_name || 'karnata'}</p>
            <p style="margin: 4px 0; font-size: 13px;">A/C: ${receiptInfo?.account_number ? 'XXXX' + receiptInfo.account_number.slice(-4) : 'XXXX6739'}</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: ${BRAND_GRAY};">IFSC: ${receiptInfo?.ifsc || 'SBIN0040410'}</p>
          </div>
        </div>

        <!-- Divider -->
        <hr style="margin: 8px 0 20px; border: none; border-top: 1px solid #e2e8f0;" />

        <!-- Payment Summary Section -->
        <div style="margin-bottom: 24px;">
          <p style="font-weight: 700; margin: 0 0 16px 0; font-size: 16px; color: ${BRAND_DARK};">💰 Payment Summary</p>
          
          <div style="background: ${BRAND_LIGHT_BG}; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: ${BRAND_GRAY};">Rent</span>
              <span style="font-weight: 600; color: ${BRAND_DARK};">₹${receiptInfo?.rent_amount || '2999.00'}</span>
            </div>
            ${(receiptInfo?.security_deposit > 0 || !receiptInfo) ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: ${BRAND_GRAY};">Security Deposit</span>
              <span style="font-weight: 600; color: ${BRAND_DARK};">₹${receiptInfo?.security_deposit || '2000.00'}</span>
            </div>
            ` : ''}
            ${(receiptInfo?.maintenance_amount > 0 || !receiptInfo) ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: ${BRAND_GRAY};">Maintenance</span>
              <span style="font-weight: 600; color: ${BRAND_DARK};">₹${receiptInfo?.maintenance_amount || '250.00'}</span>
            </div>
            ` : ''}
            
            <div style="margin: 16px 0; border-top: 1px dashed #cbd5e1;"></div>
            
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 16px; color: ${BRAND_DARK};">TOTAL PAID</span>
              <span style="font-weight: 800; font-size: 18px; color: ${BRAND_BLUE};">₹${receiptInfo?.total_amount || '5249.00'}</span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <hr style="margin: 8px 0 20px; border: none; border-top: 1px solid #e2e8f0;" />

        <!-- Settlement Status -->
        <div style="background: linear-gradient(135deg, ${BRAND_LIGHT_BG} 0%, #ffffff 100%); border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 24px; height: 24px; background: ${BRAND_GREEN}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 14px;">✓</span>
            </div>
            <span style="font-weight: 500; color: ${BRAND_DARK};">Settlement Completed</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 24px; height: 24px; background: ${BRAND_GREEN}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 14px;">✓</span>
            </div>
            <span style="font-weight: 500; color: ${BRAND_DARK};">Paid to Owner</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 24px; height: 24px; background: ${BRAND_GREEN}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 14px;">✓</span>
            </div>
            <span style="font-weight: 500; color: ${BRAND_DARK};">Digital Receipt</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: ${BRAND_GRAY}; font-size: 13px;">Thank you for choosing <span style="color: ${BRAND_BLUE};">Nep</span><span style="color: ${BRAND_GREEN};">xall</span> 🙏</p>
          <p style="margin: 8px 0 0; font-size: 10px; color: ${BRAND_GRAY};">support@nexpall.com</p>
        </div>
      </div>
    `;

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4"
      });
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
      const token = await user.getIdToken();
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
      
      const token = await user.getIdToken();
      const verifyRes = await axios.post(`${API}/agreements/verify-owner`, {
        booking_id: selectedBooking.booking_id,
        mobile: mobile
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = await user.getIdToken();
      const res = await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signatureBase64,
        accepted_terms: true,
        owner_device_info: JSON.stringify(deviceInfo) 
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
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

  const togglePGExpand = (pgName) => {
    setExpandedPGs(prev => ({
      ...prev,
      [pgName]: !prev[pgName]
    }));
  };

  // 🔥 GROUP BY PG NAME
  const groupedData = data.reduce((acc, item) => {
    const key = item.pg_name || "Unknown PG";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Calculate summary stats for each PG
  const getPGStats = (bookings) => {
    const totalAmount = bookings.reduce(
  (sum, item) => sum + (parseFloat(item.amount || item.owner_amount) || 0),
  0
);
    const paidCount = bookings.filter(item => item.owner_settlement === "DONE").length;
    const pendingCount = bookings.filter(item => item.owner_settlement !== "DONE").length;
    const signedCount = bookings.filter(item => !!item.signed_pdf).length;
    return { totalAmount, paidCount, pendingCount, signedCount, total: bookings.length };
  };

  // 🔥 GLOBAL SUMMARY (IMPORTANT) - Calculation Logic
  const joinedAmount = data
    .filter(item => 
      item.owner_settlement === "DONE" && 
      item.join_status === "JOINED"
    )
    .reduce((sum, item) => sum + Number(item.owner_amount || item.amount || 0), 0);

  const notJoinedAmount = data
    .filter(item => 
      item.owner_settlement === "DONE" && 
      item.join_status !== "JOINED"
    )
    .reduce((sum, item) => sum + Number(item.owner_amount || item.amount || 0), 0);

  const totalPaid = data
    .filter(item => item.owner_settlement === "DONE")
    .reduce((sum, item) => sum + Number(item.owner_amount || item.amount || 0), 0);

  const pendingAmount = data
    .filter(item => item.owner_settlement !== "DONE")
    .reduce((sum, item) => sum + Number(item.owner_amount || item.amount || 0), 0);

  /* ================= PROTECTION ================= */
  if (authLoading || pageLoading) {
    return (
      <Box p={5} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  return (
    <Container sx={{ py: 4, maxWidth: '1400px' }}>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">
          <span style={{ color: BRAND_BLUE }}>Nep</span>
          <span style={{ color: BRAND_GREEN }}>xall</span>
          <span style={{ color: BRAND_DARK, fontSize: '1.25rem', marginLeft: '8px' }}>Owner Settlement</span>
        </Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
          Refresh Data
        </Button>
      </Box>

      {/* 🔥 TOP SUMMARY CARDS */}
      <Grid container spacing={2} mb={3}>
        {/* ✅ Joined Earnings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: "#ecfdf5" }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Joined Earnings</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: BRAND_GREEN }}>
                ₹{joinedAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ⚠️ Not Joined */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: "#fff7ed" }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Not Joined</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#ea580c" }}>
                ₹{notJoinedAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 💰 Total Paid */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: "#eff6ff" }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Total Paid</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: BRAND_BLUE }}>
                ₹{totalPaid.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ⏳ Pending */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, bgcolor: "#fef9c3" }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Pending Amount</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#ca8a04" }}>
                ₹{pendingAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: '40px' }}></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tenant Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Sharing</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Agreement Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Payment Status</TableCell>
              {/* ✅ NEW JOIN STATUS COLUMN - HEADER */}
              <TableCell align="center" sx={{ fontWeight: 700 }}>Join Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  No active settlements found.
                </TableCell>
              </TableRow>
            ) : (
              Object.keys(groupedData).map((pgName) => {
                const stats = getPGStats(groupedData[pgName]);
                const isExpanded = expandedPGs[pgName] !== false; // Default to expanded
                
                return (
                  <React.Fragment key={pgName}>
                    {/* 🔥 PG HEADER ROW */}
                    <TableRow 
                      sx={{ 
                        bgcolor: "#f1f5f9", 
                        cursor: "pointer",
                        '&:hover': { bgcolor: "#e2e8f0" }
                      }}
                      onClick={() => togglePGExpand(pgName)}
                    >
                      <TableCell sx={{ p: 1, width: '40px' }}>
                        {isExpanded ? <ExpandLess sx={{ color: BRAND_BLUE }} /> : <ExpandMore sx={{ color: BRAND_BLUE }} />}
                      </TableCell>
                      <TableCell colSpan={7} sx={{ fontWeight: "bold", py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                          <Box display="flex" alignItems="center" gap={1}>
                            <span style={{ fontSize: '20px' }}>🏠</span>
                            <span style={{ fontSize: '16px' }}>{pgName}</span>
                          </Box>
                          <Box display="flex" gap={2} sx={{ ml: 'auto' }}>
                            <Chip 
                              label={`${stats.total} Booking${stats.total !== 1 ? 's' : ''}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ bgcolor: 'white' }}
                            />
                            <Chip 
                              label={`₹${stats.totalAmount.toLocaleString()}`} 
                              size="small" 
                              color="primary"
                              sx={{ fontWeight: 'bold' }}
                            />
                            <Chip 
                              label={`${stats.paidCount} Paid`} 
                              size="small" 
                              color="success"
                            />
                            {stats.pendingCount > 0 && (
                              <Chip 
                                label={`${stats.pendingCount} Pending`} 
                                size="small" 
                                color="warning"
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* 🔥 BOOKINGS ROWS WITH COLLAPSE */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 0 }}>
                            {groupedData[pgName].map(item => {
                              const isSigned = !!item.signed_pdf;
                              return (
                                <TableRow key={item.booking_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, bgcolor: '#ffffff' }}>
                                  <TableCell sx={{ width: '40px' }}></TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography sx={{ fontWeight: 600 }}>
                                        #{item.booking_id}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {item.order_id}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>{item.tenant_name}</TableCell>
                                  <TableCell>
                                    <Typography fontWeight="bold" color="primary.main">₹{item.amount || item.owner_amount}</Typography>
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
                                      // 🟢 FINAL STATE → Paid + Receipt
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
                                          startIcon={<Receipt />}
                                          onClick={() => handleDirectDownload(item.booking_id)}
                                          disabled={isSubmitting}
                                          sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                          Receipt
                                        </Button>
                                      </Stack>
                                    ) : item.admin_settlement === "DONE" ? (
                                      // 🟡 ADMIN DONE → SHOW BUTTON
                                      <Stack direction="row" spacing={1} justifyContent="center">
                                        <Chip
                                          label="💰 Settled"
                                          color="info"
                                          size="small"
                                          sx={{ fontWeight: "bold" }}
                                        />
                                        <Button
                                          variant="contained"
                                          color="success"
                                          size="small"
                                          onClick={() => handleMarkPaid(item.booking_id)}
                                          sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                          Mark as Paid
                                        </Button>
                                      </Stack>
                                    ) : (
                                      // 🔴 WAITING ADMIN
                                      <Chip
                                        label="⏳ Waiting Admin"
                                        color="warning"
                                        size="small"
                                        sx={{ fontWeight: "bold" }}
                                      />
                                    )}
                                  </TableCell>

                                  {/* ✅ NEW JOIN STATUS COLUMN - ROW DATA */}
                                  <TableCell align="center">
                                    {item.join_status === "JOINED" ? (
                                      <Chip 
                                        label="✅ Joined" 
                                        color="success" 
                                        size="small"
                                        sx={{ fontWeight: "bold" }}
                                      />
                                    ) : (
                                      <Chip 
                                        label="⏳ Not Joined" 
                                        color="warning" 
                                        size="small"
                                        sx={{ fontWeight: "bold" }}
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* MODERN RECEIPT MODAL - Brand Colors Design */}
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
            width: { xs: '95%', sm: 600, md: 650 },
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            outline: 'none'
          }}>
            {/* Receipt Content - Modern Card Style with Brand Colors */}
            <Box ref={receiptRef} sx={{ p: 4, bgcolor: '#ffffff' }}>
              {/* Header with Brand Colors */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h2" fontWeight="800" sx={{ letterSpacing: 2 }}>
                  <span style={{ color: BRAND_BLUE }}>Nep</span>
                  <span style={{ color: BRAND_GREEN }}>xall</span>
                </Typography>
                <Typography variant="body2" color="textSecondary">Next Places for Living</Typography>
              </Box>

              {/* Status Badge */}
              <Box sx={{ 
                background: `linear-gradient(135deg, ${BRAND_GREEN}10 0%, ${BRAND_GREEN}08 100%)`,
                borderRadius: 100,
                p: 1.5,
                textAlign: 'center',
                mb: 4,
                border: `1px solid ${BRAND_GREEN}30`
              }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: BRAND_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CheckCircle fontSize="small" /> PAYMENT SUCCESSFUL
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {receiptData?.verified_date ? new Date(receiptData.verified_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>

              {/* Info Cards Grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: BRAND_LIGHT_BG, borderColor: '#e2e8f0' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Person fontSize="small" sx={{ color: BRAND_BLUE }} />
                        <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Tenant</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="600" sx={{ color: BRAND_DARK }}>{receiptData?.tenant_phone || '+91 XXXXX XXXXX'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: BRAND_LIGHT_BG, borderColor: '#e2e8f0' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Home fontSize="small" sx={{ color: BRAND_BLUE }} />
                        <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Property</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="600" sx={{ color: BRAND_DARK }}>{receiptData?.pg_name || 'Lakshmi PG'}</Typography>
                      <Typography variant="caption" sx={{ color: BRAND_GRAY }}>{receiptData?.room_type || 'Double Sharing'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: BRAND_LIGHT_BG, borderColor: '#e2e8f0' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AccountBalance fontSize="small" sx={{ color: BRAND_BLUE }} />
                        <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Bank</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="500">Holder: {receiptData?.account_holder_name || 'basava'}</Typography>
                      <Typography variant="caption" display="block">Bank: {receiptData?.bank_name || 'karnata'}</Typography>
                      <Typography variant="caption" display="block">A/C: {receiptData?.account_number ? 'XXXX' + receiptData.account_number.slice(-4) : 'XXXX6739'}</Typography>
                      <Typography variant="caption" display="block" sx={{ color: BRAND_GRAY }}>IFSC: {receiptData?.ifsc || 'SBIN0040410'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: BRAND_LIGHT_BG, borderColor: '#e2e8f0' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Payment fontSize="small" sx={{ color: BRAND_BLUE }} />
                        <Typography variant="caption" sx={{ color: BRAND_GRAY }}>Payment Summary</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="caption">Rent</Typography>
                        <Typography variant="body2" fontWeight="500">₹{receiptData?.rent_amount || '2999.00'}</Typography>
                      </Box>
                      {(receiptData?.security_deposit > 0 || !receiptData) && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="caption">Security Deposit</Typography>
                          <Typography variant="body2">₹{receiptData?.security_deposit || '2000.00'}</Typography>
                        </Box>
                      )}
                      {(receiptData?.maintenance_amount > 0 || !receiptData) && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="caption">Maintenance</Typography>
                          <Typography variant="body2">₹{receiptData?.maintenance_amount || '250.00'}</Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1.5 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight="bold">TOTAL PAID</Typography>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: BRAND_BLUE }}>₹{receiptData?.total_amount || '5249.00'}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Settlement Status */}
              <Box sx={{ bgcolor: BRAND_LIGHT_BG, borderRadius: 3, p: 2.5, mb: 4 }}>
                <Stack spacing={1.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 22, height: 22, bgcolor: BRAND_GREEN, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle fontSize="small" sx={{ color: 'white', fontSize: 14 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: BRAND_DARK }}>Settlement Completed</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 22, height: 22, bgcolor: BRAND_GREEN, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle fontSize="small" sx={{ color: 'white', fontSize: 14 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: BRAND_DARK }}>Paid to Owner</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 22, height: 22, bgcolor: BRAND_GREEN, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle fontSize="small" sx={{ color: 'white', fontSize: 14 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: BRAND_DARK }}>Digital Receipt</Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Footer */}
              <Box textAlign="center">
                <Typography variant="body2" sx={{ color: BRAND_GRAY }}>
                  Thank you for choosing <span style={{ color: BRAND_BLUE, fontWeight: 600 }}>Nep</span><span style={{ color: BRAND_GREEN, fontWeight: 600 }}>xall</span> 🙏
                </Typography>
                <Typography variant="caption" sx={{ color: BRAND_GRAY }}>support@nexpall.com</Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ p: 2.5, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0', display: 'flex', gap: 2 }}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={() => setOpenReceiptModal(false)}
                sx={{ borderRadius: 2, py: 1 }}
              >
                Close
              </Button>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={downloadPDF}
                startIcon={<Download />}
                sx={{ borderRadius: 2, py: 1, bgcolor: BRAND_BLUE, '&:hover': { bgcolor: '#1d4ed8' } }}
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
                  <Typography variant="h6" fontWeight="bold">
                    <span style={{ color: BRAND_BLUE }}>Digital</span>
                    <span style={{ color: BRAND_GREEN }}> Signature Portal</span>
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
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: BRAND_BLUE }} gutterBottom>PART A: GENERAL DECLARATIONS</Typography>
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

                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: BRAND_GREEN }} gutterBottom>PART B: OWNER LEGAL RESPONSIBILITIES</Typography>
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
                  sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2, bgcolor: BRAND_BLUE, '&:hover': { bgcolor: '#1d4ed8' } }}
                >
                  I Agree, Proceed to Verification
                </Button>
              </Box>
            )}

            {/* STEP 2: PHONE OTP */}
            {step === 2 && (
              <Box py={2} textAlign="center">
                <Security sx={{ fontSize: 60, color: BRAND_BLUE, mb: 1 }} />
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
                  <Button fullWidth variant="contained" size="large" onClick={sendOtp} disabled={isSubmitting || mobile.length < 10} sx={{ borderRadius: 2, bgcolor: BRAND_BLUE, '&:hover': { bgcolor: '#1d4ed8' } }}>
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
                    <Button fullWidth variant="contained" size="large" onClick={verifyOtp} disabled={isSubmitting || otp.length < 6} sx={{ borderRadius: 2, bgcolor: BRAND_GREEN, '&:hover': { bgcolor: '#0d9488' } }}>
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
                    <BorderColor sx={{ fontSize: 40, color: BRAND_BLUE, mb: 1 }} />
                    <Typography variant="h6">Draw Your Signature</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Please sign inside the box below.
                    </Typography>
                </Box>
                
                <Box sx={{ border: `2px dashed ${BRAND_BLUE}`, borderRadius: 2, bgcolor: '#fdfdfd', overflow: 'hidden' }}>
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
                  <Button variant="contained" color="success" fullWidth onClick={handleSubmit} disabled={isSubmitting} sx={{ borderRadius: 2, bgcolor: BRAND_GREEN, '&:hover': { bgcolor: '#0d9488' } }}>
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