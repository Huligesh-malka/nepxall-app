import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton
} from "@mui/material";
import { Refresh, ArrowBack } from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [step, setStep] = useState(1);

  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (step === 3 && openSignModal) {
      setTimeout(() => sigCanvas.current?.clear(), 300);
    }
  }, [step, openSignModal]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch {
      alert("Failed to fetch payments ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async (bookingId, filePath) => {
    try {
      await axios.post(`${API}/agreements/viewed`, { booking_id: bookingId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    window.open(filePath, "_blank");
  };

  const handleOpenSign = (item) => {
    setSelectedBooking(item);
    setStep(1);
    setAgreed(false);
    setMobile("");
    setOtp("");
    setOtpVerified(false);
    setOpenSignModal(true);
  };

  /* ================= OTP SEND ================= */
  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return alert("Enter valid mobile number");
    }

    try {
      setIsSubmitting(true);

      await axios.post(`${API}/otp/send`, { mobile }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("OTP Sent ✅");
    } catch (err) {
      alert(err?.response?.data?.message || "OTP failed ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= OTP VERIFY ================= */
  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");

    try {
      setIsSubmitting(true);

      await axios.post(`${API}/otp/verify`, { mobile, otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOtpVerified(true);
      setStep(3);
      alert("OTP Verified ✅");

    } catch (err) {
      alert(err?.response?.data?.message || "Invalid OTP ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!otpVerified) return alert("Verify OTP first");

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return alert("Please sign");
    }

    const signature = sigCanvas.current.getCanvas().toDataURL("image/png");

    try {
      setIsSubmitting(true);

      await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true,
        otp_verified: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Agreement Signed ✅");
      setOpenSignModal(false);
      fetchPayments();

    } catch {
      alert("Submission failed ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Box p={5} textAlign="center"><CircularProgress /></Box>;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Owner Settlement Dashboard
        </Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined">
          Refresh
        </Button>
      </Box>

      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(item => {
              const isSigned = !!item.signed_pdf;

              return (
                <TableRow key={item.booking_id}>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>₹{item.owner_amount}</TableCell>
                  <TableCell>
                    {!item.final_pdf ? (
                      <Chip label="Processing" />
                    ) : isSigned ? (
                      <Button color="success" variant="contained"
                        onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}>
                        VIEW SIGNED
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}>
                          VIEW PDF
                        </Button>
                        {item.viewed_by_owner && (
                          <Button color="warning" onClick={() => handleOpenSign(item)}>
                            SIGN
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* MODAL */}
      <Modal open={openSignModal} onClose={() => !isSubmitting && setOpenSignModal(false)}>
        <Fade in={openSignModal}>
          <Box sx={{
            width: 400,
            bgcolor: "white",
            p: 4,
            borderRadius: 3,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}>

            <Typography variant="h6">Sign Agreement</Typography>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                Agree Terms
                <Button fullWidth disabled={!agreed} onClick={() => setStep(2)}>
                  Continue
                </Button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <TextField fullWidth label="Mobile" value={mobile}
                  onChange={(e) => setMobile(e.target.value)} />

                <Button fullWidth onClick={sendOtp}>Send OTP</Button>

                <TextField fullWidth label="OTP" value={otp}
                  onChange={(e) => setOtp(e.target.value)} />

                <Button fullWidth onClick={verifyOtp}>Verify OTP</Button>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <SignatureCanvas ref={sigCanvas}
                  canvasProps={{ width: 350, height: 150 }} />

                <Button onClick={() => sigCanvas.current.clear()}>
                  Clear
                </Button>

                <Button onClick={handleSubmit}>
                  Sign Agreement
                </Button>
              </>
            )}

          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}