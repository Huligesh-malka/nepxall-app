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
const BASE_URL = "https://nepxall-backend.onrender.com";

export default function OwnerPayments() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ✅ LOAD FROM LOCAL STORAGE
  const [viewedPdfs, setViewedPdfs] = useState(() => {
    const saved = localStorage.getItem("viewedPdfs");
    return saved ? JSON.parse(saved) : [];
  });

  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef();
  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */
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

  useEffect(() => {
    fetchPayments();
  }, []);

  /* ================= VIEW PDF ================= */
  const handleViewPdf = (bookingId, pdfPath) => {

    let updated = viewedPdfs;

    if (!viewedPdfs.includes(bookingId)) {
      updated = [...viewedPdfs, bookingId];
      setViewedPdfs(updated);

      // ✅ SAVE IN LOCAL STORAGE
      localStorage.setItem("viewedPdfs", JSON.stringify(updated));
    }

    const url = pdfPath?.startsWith("http")
      ? pdfPath
      : `${BASE_URL}/${pdfPath}`;

    window.open(url, "_blank");
  };

  /* ================= OPEN SIGN ================= */
  const handleOpenSign = (item) => {
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
      .getTrimmedCanvas()
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

      // ✅ REMOVE FROM VIEWED AFTER SIGN
      const updated = viewedPdfs.filter(
        id => id !== selectedBooking.booking_id
      );

      setViewedPdfs(updated);
      localStorage.setItem("viewedPdfs", JSON.stringify(updated));

      setOpenSignModal(false);
      fetchPayments();

    } catch (err) {
      console.error(err);
      alert("Signing failed ❌");
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
              <TableCell align="center">Status</TableCell>
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

                        {viewedPdfs.includes(item.booking_id) && (
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
      <Modal open={openSignModal}>
        <Fade in={openSignModal}>
          <Box sx={{ p: 4, bgcolor: "white", width: 400, margin: "auto", mt: "10%" }}>

            {step === 1 ? (
              <>
                <FormControlLabel
                  control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
                  label="Accept Terms"
                />
                <Button disabled={!agreed} onClick={() => setStep(2)}>Continue</Button>
              </>
            ) : (
              <>
                <TextField fullWidth label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />

                <SignatureCanvas
                  ref={(ref) => (sigCanvas.current = ref)}
                  canvasProps={{ width: 350, height: 150 }}
                />

                <Button onClick={() => sigCanvas.current.clear()}>Clear</Button>
                <Button onClick={handleSubmit}>Submit</Button>
              </>
            )}

          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}