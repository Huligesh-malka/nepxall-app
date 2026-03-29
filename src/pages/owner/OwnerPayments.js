import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField
} from "@mui/material";
import { Refresh } from "@mui/icons-material";

import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

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
  const [confirmObj, setConfirmObj] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, []);

  // FIX SIGNATURE LOAD
  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
        sigCanvas.current?.clear();
      }, 200);
    }
  }, [step]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch {
      alert("Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async (bookingId, filePath) => {
    await axios.post(`${API}/agreements/viewed`, { booking_id: bookingId }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    window.open(filePath, "_blank");
    fetchPayments();
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

  // SEND OTP
  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Enter valid mobile");

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${mobile}`,
        window.recaptchaVerifier
      );

      setConfirmObj(confirmation);
      alert("OTP Sent ✅");

    } catch {
      alert("OTP failed ❌");
    }
  };

  // VERIFY OTP FIX
  const verifyOtp = async () => {
    try {
      await confirmObj.confirm(otp);

      setOtpVerified(false);

      setTimeout(() => {
        setOtpVerified(true);
        setStep(3);
      }, 100);

      alert("OTP Verified ✅");

    } catch {
      alert("Invalid OTP ❌");
    }
  };

  // SUBMIT
  const handleSubmit = async () => {

    if (!otpVerified) return alert("Verify OTP first");

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return alert("Draw signature");
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

      alert("Signed ✅");
      setOpenSignModal(false);
      fetchPayments();

    } catch {
      alert("Failed ❌");
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
                        <Button onClick={() =>
                          handleViewPdf(item.booking_id, item.final_pdf)}>
                          VIEW PDF
                        </Button>

                        {item.viewed_by_owner && (
                          <Button color="warning"
                            onClick={() => handleOpenSign(item)}>
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
      <Modal open={openSignModal} key={step}>
        <Fade in={openSignModal}>
          <Box sx={{
            width: 420,
            bgcolor: "#fff",
            borderRadius: 3,
            p: 4,
            m: "auto",
            mt: "8%",
            boxShadow: 5
          }}>

            {/* STEP BAR */}
            <Box display="flex" justifyContent="space-between" mb={3}>
              {["Consent", "OTP", "Sign"].map((label, i) => (
                <Box key={i} textAlign="center" flex={1}>
                  <Box sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    mx: "auto",
                    bgcolor: step >= i + 1 ? "#1976d2" : "#ccc",
                    color: "#fff",
                    lineHeight: "30px"
                  }}>
                    {i + 1}
                  </Box>
                  <Typography fontSize={12}>{label}</Typography>
                </Box>
              ))}
            </Box>

            {step === 1 && (
              <>
                <Checkbox checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)} />
                <Typography>I agree to terms</Typography>

                <Button fullWidth variant="contained"
                  disabled={!agreed}
                  onClick={() => setStep(2)}>
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <TextField fullWidth label="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)} />

                <Button fullWidth sx={{ mt: 2 }}
                  onClick={sendOtp}>
                  Send OTP
                </Button>

                {confirmObj && (
                  <>
                    <TextField fullWidth sx={{ mt: 2 }}
                      label="OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)} />

                    <Button fullWidth sx={{ mt: 2 }}
                      variant="contained"
                      onClick={verifyOtp}>
                      Verify OTP
                    </Button>
                  </>
                )}

                <div id="recaptcha-container"></div>
              </>
            )}

            {step === 3 && otpVerified && (
              <>
                <Typography mb={2}>Draw Signature</Typography>

                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    width: 360,
                    height: 150,
                    style: { background: "#f9f9f9" }
                  }}
                />

                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button onClick={() => sigCanvas.current.clear()}>
                    Clear
                  </Button>

                  <Button variant="contained"
                    onClick={handleSubmit}>
                    Finish
                  </Button>
                </Box>
              </>
            )}

          </Box>
        </Fade>
      </Modal>

    </Container>
  );
}