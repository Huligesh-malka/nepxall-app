import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from 'react-signature-canvas';
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Alert, Button,
  Modal, Fade, Checkbox, FormControlLabel, TextField, Divider
} from "@mui/material";
import { Refresh, PictureAsPdf, HistoryEdu as SignIcon, CheckCircle } from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";
const BASE_URL = "https://nepxall-backend.onrender.com";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [step, setStep] = useState(1);
  const [hasViewed, setHasViewed] = useState(false); // Flow control
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef({});
  const token = localStorage.getItem("token");

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleOpenSign = (item) => {
    setSelectedBooking(item);
    setStep(1);
    setHasViewed(false);
    setAgreed(false);
    setMobile("");
    setOpenSignModal(true);
  };

  const handleViewPdf = (pdfPath) => {
    setHasViewed(true); // Allow moving to next step
    const url = pdfPath?.startsWith("http") ? pdfPath : `${BASE_URL}/${pdfPath}`;
    window.open(url, "_blank");
  };

  const handleSubmit = async () => {
    if (!mobile || mobile.length < 10) return alert("Enter valid mobile");
    if (sigCanvas.current.isEmpty()) return alert("Signature is required");

    const signature = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert("Agreement Signed Successfully ✅");
      setOpenSignModal(false);
      fetchPayments();
    } catch (err) {
      alert("Error signing agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">Owner Settlement Dashboard</Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined">Refresh</Button>
      </Box>

      <Paper elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell><b>Booking</b></TableCell>
              <TableCell><b>Tenant</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
              <TableCell align="center"><b>Agreement Status</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.booking_id}>
                <TableCell>#{item.booking_id}</TableCell>
                <TableCell>{item.tenant_name}</TableCell>
                <TableCell>₹{item.owner_amount}</TableCell>
                <TableCell align="center">
                  {!item.final_pdf ? (
                    <Chip label="Processing PDF" variant="outlined" />
                  ) : item.owner_signed ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleViewPdf(item.signed_pdf || item.final_pdf)}
                    >
                      VIEW SIGNED
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<SignIcon />}
                      onClick={() => handleOpenSign(item)}
                    >
                      VIEW & SIGN
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* SIGNING MODAL */}
      <Modal open={openSignModal} onClose={() => !isSubmitting && setOpenSignModal(false)}>
        <Fade in={openSignModal}>
          <Box sx={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            bgcolor: "white", p: 4, borderRadius: 2, width: { xs: '90%', sm: 450 }, boxShadow: 24
          }}>
            {step === 1 ? (
              <>
                <Typography variant="h6">Step 1: Review Agreement</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="textSecondary" mb={2}>
                  You must view the document before you can proceed to signing.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={() => handleViewPdf(selectedBooking?.final_pdf)}
                  sx={{ mb: 2 }}
                >
                  Open PDF to Read
                </Button>
                <FormControlLabel
                  control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={!hasViewed} />}
                  label="I have read and accept all terms."
                />
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!agreed || !hasViewed}
                  onClick={() => setStep(2)}
                  sx={{ mt: 2 }}
                >
                  Next: Sign Document
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h6">Step 2: Draw Signature</Typography>
                <TextField
                  fullWidth label="Confirm Mobile Number"
                  value={mobile} onChange={(e) => setMobile(e.target.value)}
                  sx={{ my: 2 }}
                />
                <Box sx={{ border: "1px dashed #ccc", borderRadius: 1, mb: 1 }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{ width: 380, height: 150, className: 'sigCanvas' }}
                  />
                </Box>
                <Button size="small" onClick={() => sigCanvas.current.clear()}>Clear Space</Button>
                <Box display="flex" gap={2} mt={3}>
                  <Button fullWidth onClick={() => setStep(1)}>Back</Button>
                  <Button
                    fullWidth variant="contained" color="primary"
                    onClick={handleSubmit} disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing..." : "Finalize & Sign"}
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