import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from 'react-signature-canvas';

import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Alert, Button,
  Modal, Fade, Checkbox,
  FormControlLabel, TextField, Divider
} from "@mui/material";

import {
  Refresh, PictureAsPdf, 
  HistoryEdu as SignIcon
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";
const BASE_URL = "https://nepxall-backend.onrender.com";

export default function OwnerPayments() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef({});
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSign = (item) => {
    setSelectedBooking(item);
    setStep(1);
    setAgreed(false);
    setMobile("");
    setOpenSignModal(true);
  };

  const clearSig = () => sigCanvas.current.clear();

  const handleViewPdf = (pdfPath) => {
    const url = pdfPath?.startsWith("http")
      ? pdfPath
      : `${BASE_URL}/${pdfPath}`;
    window.open(url, "_blank");
  };

  const handleSubmit = async () => {
    if (!agreed) return alert("Accept terms first");
    if (!mobile || mobile.length < 10) return alert("Enter valid mobile");
    if (sigCanvas.current.isEmpty()) return alert("Sign required");

    const signature = sigCanvas.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    setIsSubmitting(true);

    try {
      await axios.post(`${API}/sign-agreement`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Agreement Signed Successfully ✅");
      setOpenSignModal(false);
      fetchPayments();

    } catch {
      alert("Error signing agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Container>

      <Box display="flex" justifyContent="space-between" my={3}>
        <Typography variant="h5">Owner Dashboard</Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>PG</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Agreement</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((item) => (
              <TableRow key={item.booking_id}>
                <TableCell>#{item.booking_id}</TableCell>
                <TableCell>{item.tenant_name}</TableCell>
                <TableCell>{item.pg_name}</TableCell>
                <TableCell>₹{item.owner_amount}</TableCell>

                {/* 🔥 FINAL AGREEMENT LOGIC */}
                <TableCell>

                  {!item.final_pdf ? (

                    <Chip label="Waiting PDF" />

                  ) : item.owner_signed ? (

                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PictureAsPdf />}
                      onClick={() =>
                        handleViewPdf(item.signed_pdf || item.final_pdf)
                      }
                    >
                      VIEW SIGNED
                    </Button>

                  ) : (

                    <Box display="flex" gap={1}>

                      {/* VIEW FIRST */}
                      <Button
                        variant="outlined"
                        startIcon={<PictureAsPdf />}
                        onClick={() => handleViewPdf(item.final_pdf)}
                      >
                        VIEW
                      </Button>

                      {/* THEN SIGN */}
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<SignIcon />}
                        onClick={() => handleOpenSign(item)}
                      >
                        SIGN
                      </Button>

                    </Box>

                  )}

                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* SIGN MODAL */}
      <Modal open={openSignModal}>
        <Fade in={openSignModal}>
          <Box sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            width: 400
          }}>

            {step === 1 && (
              <>
                <Typography variant="h6">📄 Agreement Terms</Typography>
                <Divider sx={{ my: 2 }} />

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={() =>
                    handleViewPdf(selectedBooking?.final_pdf)
                  }
                >
                  View Agreement PDF
                </Button>

                <Box sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "#f5f5f5",
                  maxHeight: 120,
                  overflow: "auto"
                }}>
                  <Typography variant="caption">
                    I confirm that I have read and understood this agreement.
                    I agree to all terms and conditions legally binding.
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                  }
                  label="I accept Terms & Conditions"
                />

                <Button
                  fullWidth
                  disabled={!agreed}
                  onClick={() => setStep(2)}
                >
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Typography variant="h6">✍️ Sign Agreement</Typography>

                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  sx={{ my: 2 }}
                />

                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{ width: 350, height: 150 }}
                />

                <Button onClick={clearSig}>Clear</Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  Submit & Sign
                </Button>
              </>
            )}

          </Box>
        </Fade>
      </Modal>

    </Container>
  );
}