import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, FormControlLabel, TextField, Divider
} from "@mui/material";
import { Refresh, PictureAsPdf, CheckCircle } from "@mui/icons-material";
import { HistoryEdu as SignIcon } from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef(null);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIEW PDF ================= */
  const handleViewPdf = async (bookingId, filePath) => {
    try {
      await axios.post(
        `${API}/agreements/viewed`,
        { booking_id: bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("View update failed", err);
    }

    const url = filePath;
    window.open(url, "_blank");

    fetchPayments(); // refresh UI
  };

  /* ================= OPEN SIGN ================= */
  const handleOpenSign = (item) => {
    if (item.signed_pdf) return;

    setSelectedBooking(item);
    setStep(1);
    setAgreed(false);
    setMobile("");
    setOpenSignModal(true);
  };

  /* ================= SUBMIT SIGN ================= */
  const handleSubmit = async () => {

    if (!mobile || mobile.length < 10) {
      return alert("Enter valid mobile number");
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return alert("Signature required");
    }

    const signature = sigCanvas.current
      .getCanvas()
      .toDataURL("image/png");

    setIsSubmitting(true);

    try {
      await axios.post(
        `${API}/agreements/sign`,
        {
          booking_id: selectedBooking.booking_id,
          owner_mobile: mobile,
          owner_signature: signature,
          accepted_terms: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Agreement Signed Successfully ✅");

      setOpenSignModal(false);
      fetchPayments();

    } catch (err) {
      console.error(err);

      if (err.response?.status === 400) {
        alert(err.response.data.message || "Already signed");
      } else {
        alert("Signing failed ❌");
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box p={5} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Owner Settlement Dashboard
        </Typography>

        <Button
          onClick={fetchPayments}
          startIcon={<Refresh />}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* TABLE */}
      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Booking</b></TableCell>
              <TableCell><b>Tenant</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
              <TableCell align="center"><b>Status</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((item) => {
              const isSigned = !!item.signed_pdf;

              return (
                <TableRow key={item.booking_id}>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>₹{item.owner_amount}</TableCell>

                  <TableCell align="center">

                    {!item.final_pdf ? (
                      <Chip label="Processing PDF" />
                    ) : isSigned ? (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() =>
                          handleViewPdf(item.booking_id, item.signed_pdf)
                        }
                      >
                        VIEW SIGNED
                      </Button>
                    ) : (
                      <Box display="flex" gap={1} justifyContent="center">

                        <Button
                          variant="outlined"
                          startIcon={<PictureAsPdf />}
                          onClick={() =>
                            handleViewPdf(item.booking_id, item.final_pdf)
                          }
                        >
                          VIEW PDF
                        </Button>

                        {item.viewed_by_owner && (
                          <Button
                            variant="contained"
                            color="warning"
                            startIcon={<SignIcon />}
                            onClick={() => handleOpenSign(item)}
                          >
                            SIGN
                          </Button>
                        )}

                      </Box>
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
            p: 4,
            bgcolor: "#fff",
            width: 400,
            margin: "auto",
            mt: "10%",
            borderRadius: 2
          }}>

            {step === 1 ? (
              <>
                <Typography variant="h6">Confirm Terms</Typography>
                <Divider sx={{ my: 2 }} />

                <FormControlLabel
                  control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
                  label="I accept all terms"
                />

                <Button
                  fullWidth
                  variant="contained"
                  disabled={!agreed}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h6">Draw Signature</Typography>

                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  sx={{ my: 2 }}
                />

                <SignatureCanvas
                  ref={(ref) => (sigCanvas.current = ref)}
                  canvasProps={{
                    width: 350,
                    height: 150,
                    style: { background: "#fff" }
                  }}
                />

                <Button onClick={() => sigCanvas.current.clear()}>
                  Clear
                </Button>

                <Box display="flex" gap={2} mt={2}>
                  <Button fullWidth onClick={() => setStep(1)}>Back</Button>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing..." : "Submit"}
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