import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from 'react-signature-canvas';
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, Button, Modal, Fade, Checkbox, 
  FormControlLabel, TextField, Divider
} from "@mui/material";
import { PictureAsPdf, Create as SignIcon, CheckCircle } from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";
const BASE_URL = "https://nepxall-backend.onrender.com";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewedAgreements, setViewedAgreements] = useState([]); // Tracks if PDF was opened
  const [mobile, setMobile] = useState("");
  const sigCanvas = useRef({});

  const fetchPayments = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API}/payments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setData(res.data.data || []);
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleViewPdf = (bookingId, pdfPath) => {
    // Mark as viewed to unlock the Sign button
    if (!viewedAgreements.includes(bookingId)) {
      setViewedAgreements([...viewedAgreements, bookingId]);
    }
    window.open(`${BASE_URL}/${pdfPath}`, "_blank");
  };

  const handleSubmit = async () => {
    const signature = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true
      }, { headers: { Authorization: `Bearer ${token}` } });

      setOpenSignModal(false);
      fetchPayments();
    } catch (err) { alert("Error signing"); }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" mb={3}>Owner Settlement Dashboard</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell align="center">Agreement Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.booking_id}>
                <TableCell>#{item.booking_id}</TableCell>
                <TableCell>{item.tenant_name}</TableCell>
                <TableCell align="center">
                  {!item.final_pdf ? (
                    <Chip label="Processing PDF" />
                  ) : item.owner_signed ? (
                    /* STATE 3: COMPLETED */
                    <Button 
                      variant="contained" 
                      color="success" 
                      startIcon={<CheckCircle />}
                      onClick={() => window.open(`${BASE_URL}/${item.signed_pdf}`, "_blank")}
                    >
                      VIEW SIGNED
                    </Button>
                  ) : (
                    <Box display="flex" gap={1} justifyContent="center">
                      /* STATE 1: VIEW PDF ALWAYS VISIBLE */
                      <Button 
                        variant="outlined" 
                        startIcon={<PictureAsPdf />}
                        onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}
                      >
                        VIEW PDF
                      </Button>

                      /* STATE 2: SIGN ONLY APPEARS AFTER VIEWING */
                      {viewedAgreements.includes(item.booking_id) && (
                        <Button 
                          variant="contained" 
                          color="warning" 
                          startIcon={<SignIcon />}
                          onClick={() => { setSelectedBooking(item); setOpenSignModal(true); }}
                        >
                          SIGN
                        </Button>
                      )}
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* SIGN MODAL */}
      <Modal open={openSignModal} onClose={() => setOpenSignModal(false)}>
        <Fade in={openSignModal}>
          <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", bgcolor: "white", p: 4, borderRadius: 2, width: 400 }}>
            <Typography variant="h6">✍️ Sign Document</Typography>
            <TextField fullWidth label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} sx={{ my: 2 }} />
            <Box sx={{ border: "1px solid #ccc", mb: 1 }}><SignatureCanvas ref={sigCanvas} canvasProps={{ width: 335, height: 150 }} /></Box>
            <Button fullWidth variant="contained" onClick={handleSubmit}>Submit Signature</Button>
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}