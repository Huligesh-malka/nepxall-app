import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton, Divider, Alert
} from "@mui/material";
import { Refresh, ArrowBack, Gavel, VerifiedUser, InfoOutlined, BorderColor } from "@mui/icons-material";

import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [locationStr, setLocationStr] = useState("Unknown Location");

  const sigCanvas = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
    captureLocation(); // Get location on mount
  }, []);

  // Capture Location for PDF Audit Trail
  const captureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse Geocoding (Optional: Use an API like OpenStreetMap)
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const geoData = await geoRes.json();
          const city = geoData.address.city || geoData.address.town || "Bangalore";
          const state = geoData.address.state || "Karnataka";
          setLocationStr(`${city}, ${state}`);
        } catch (err) {
          setLocationStr("Bangalore, Karnataka"); // Fallback
        }
      }, () => setLocationStr("Bangalore, Karnataka"));
    }
  };

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
    } finally {
      setLoading(false);
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

      if (!verifyRes.data.success) return alert("Mobile number mismatch ❌");

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }

      const confirmation = await signInWithPhoneNumber(auth, `+91${mobile}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      alert("OTP Sent Successfully ✅");
    } catch (error) {
      alert("OTP Service Error");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
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
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return alert("Please sign first");

    const signatureBase64 = sigCanvas.current.getCanvas().toDataURL("image/png");

    const deviceInfo = {
      browser: navigator.userAgent.split(' ').pop(),
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`
    };

    try {
      setIsSubmitting(true);
      const res = await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signatureBase64,
        accepted_terms: true,
        owner_device_info: JSON.stringify(deviceInfo),
        owner_location: locationStr // Pass captured location to backend
      });

      if (res.data.success) {
        alert("Agreement Signed Successfully ✅");
        setOpenSignModal(false);
        fetchPayments(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Signing failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center">
        <Typography variant="h5" fontWeight="bold">Settlement Dashboard</Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined">Refresh</Button>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Tenant</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
              <TableCell align="center"><b>Status</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(item => (
              <TableRow key={item.booking_id} hover>
                <TableCell>#{item.booking_id}</TableCell>
                <TableCell>{item.tenant_name}</TableCell>
                <TableCell>₹{item.owner_amount}</TableCell>
                <TableCell align="center">
                  {item.signed_pdf ? (
                    <Button color="success" size="small" onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}>VIEW SIGNED</Button>
                  ) : (
                    <Box display="flex" gap={1} justifyContent="center">
                      <Button variant="outlined" size="small" onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}>DRAFT</Button>
                      {item.viewed_by_owner && <Button variant="contained" color="warning" size="small" onClick={() => handleOpenSign(item)}>SIGN NOW</Button>}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* MODAL */}
      <Modal open={openSignModal} onClose={() => !isSubmitting && setOpenSignModal(false)}>
        <Fade in={openSignModal}>
          <Box sx={{
            width: { xs: '95%', sm: 600 }, bgcolor: "white", borderRadius: 4, p: 4,
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">Step {step} of 3</Typography>
              {step > 1 && !otpVerified && <IconButton onClick={() => setStep(step - 1)}><ArrowBack /></IconButton>}
            </Box>

            {step === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>Read legal clauses to proceed.</Alert>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', p: 2, mb: 2 }}>
                  <Typography variant="caption">1. I confirm property ownership. 2. Digital signature is legally binding under IT Act 2000. 3. I consent to IP/Location logging.</Typography>
                </Box>
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> Accept Terms
                <Button fullWidth variant="contained" disabled={!agreed} onClick={() => setStep(2)} sx={{ mt: 2 }}>Continue</Button>
              </Box>
            )}

            {step === 2 && (
              <Box textAlign="center">
                <VerifiedUser color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <TextField fullWidth label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} sx={{ mb: 2 }} />
                {!confirmObj ? (
                  <Button fullWidth variant="contained" onClick={sendOtp}>Get OTP</Button>
                ) : (
                  <>
                    <TextField fullWidth label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} sx={{ mb: 2 }} />
                    <Button fullWidth variant="contained" onClick={verifyOtp}>Verify</Button>
                  </>
                )}
                <div id="recaptcha-container"></div>
              </Box>
            )}

            {step === 3 && (
              <Box>
                <Typography textAlign="center" mb={1}>Draw Signature Below</Typography>
                <Box sx={{ border: "2px dashed #1976d2", borderRadius: 2 }}>
                  <SignatureCanvas ref={sigCanvas} canvasProps={{ width: 530, height: 200, className: "sigCanvas" }} />
                </Box>
                <Box mt={2} display="flex" gap={1}>
                  <Button fullWidth variant="outlined" onClick={() => sigCanvas.current.clear()}>Clear</Button>
                  <Button fullWidth variant="contained" color="success" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Finalize & Sign"}
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