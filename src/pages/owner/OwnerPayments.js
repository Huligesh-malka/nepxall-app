import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from 'react-signature-canvas';

import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Alert, Button,
  Modal, Backdrop, Fade, Checkbox,
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sigCanvas = useRef({});
  const token = localStorage.getItem("token");

  const fetchPayments = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setData(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOpenSign = (booking) => {
    setSelectedBooking(booking);
    setStep(1);
    setAgreed(false);
    setMobile("");
    setOpenSignModal(true);
  };

  const clearSig = () => sigCanvas.current.clear();

  const handleFinalSubmit = async () => {
    if (!mobile || mobile.length < 10) return alert("Enter valid mobile");
    if (sigCanvas.current.isEmpty()) return alert("Sign required");

    setIsSubmitting(true);
    const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

    try {
      const res = await axios.post(`${API}/sign-agreement`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signatureBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert("Signed successfully!");
        setOpenSignModal(false);
        fetchPayments();
      }
    } catch (err) {
      alert("Error signing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);

  const handleViewPdf = (pdfPath) => {
    const fullUrl = pdfPath.startsWith('http') ? pdfPath : `${BASE_URL}/${pdfPath}`;
    window.open(fullUrl, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" my={3}>
        <Typography variant="h5">Owner Dashboard</Typography>
        <Button onClick={() => fetchPayments(true)} startIcon={<Refresh />}>
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
              <TableCell align="center">Amount</TableCell>
              <TableCell align="center">Agreement</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((item) => (
              <TableRow key={item.booking_id}>
                <TableCell>#{item.booking_id}</TableCell>
                <TableCell>{item.tenant_name}</TableCell>
                <TableCell>{item.pg_name}</TableCell>
                <TableCell align="center">
                  {formatCurrency(item.owner_amount)}
                </TableCell>

                {/* ✅ FIXED LOGIC */}
                <TableCell align="center">
                  {!item.final_pdf ? (
                    <Chip label="Waiting PDF" />
                  ) : item.owner_signed ? (
                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdf />}
                      onClick={() => handleViewPdf(item.final_pdf)}
                    >
                      VIEW PDF
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<SignIcon />}
                      onClick={() => handleOpenSign(item)}
                    >
                      SIGN NOW
                    </Button>
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
            p: 3,
            borderRadius: 2
          }}>

            {step === 1 ? (
              <>
                <Typography>Confirm Agreement</Typography>
                <FormControlLabel
                  control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
                  label="I agree"
                />
                <Button disabled={!agreed} onClick={() => setStep(2)}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />

                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{ width: 300, height: 150 }}
                />

                <Button onClick={clearSig}>Clear</Button>

                <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                  Submit
                </Button>
              </>
            )}

          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}