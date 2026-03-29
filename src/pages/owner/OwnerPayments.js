import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from 'react-signature-canvas';
import { 
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, Button, Box, Modal, Fade, TextField, Checkbox, FormControlLabel, Divider 
} from "@mui/material";
import { PictureAsPdf, Create as SignIcon, CheckCircle } from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";
const BASE_URL = "https://nepxall-backend.onrender.com";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const sigCanvas = useRef({});

  const fetchPayments = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API}/payments`, { headers: { Authorization: `Bearer ${token}` } });
    setData(res.data.data);
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleView = (path) => {
    window.open(`${BASE_URL}/${path}`, "_blank");
  };

  const handleSignSubmit = async () => {
    if (sigCanvas.current.isEmpty() || !mobile) return alert("Complete all fields");
    
    const signature = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/sign-agreement`, {
        booking_id: selected.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert("Signed Successfully!");
      setOpenModal(false);
      fetchPayments();
    } catch (err) { alert("Error signing"); }
  };

  return (
    <Container>
      <Typography variant="h5" sx={{ my: 3 }}>Earnings & Agreements</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.booking_id}>
                <TableCell>#{row.booking_id}</TableCell>
                <TableCell>{row.tenant_name}</TableCell>
                <TableCell>
                  {row.owner_signed ? (
                    <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleView(row.signed_pdf)}>
                      VIEW SIGNED
                    </Button>
                  ) : row.final_pdf ? (
                    <Box gap={1} display="flex">
                      <Button variant="outlined" onClick={() => handleView(row.final_pdf)}>VIEW PDF</Button>
                      <Button variant="contained" color="warning" startIcon={<SignIcon />} onClick={() => { setSelected(row); setOpenModal(true); }}>
                        SIGN NOW
                      </Button>
                    </Box>
                  ) : "Pending PDF"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Fade in={openModal}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', p: 4, borderRadius: 2 }}>
            <Typography variant="h6">Sign Agreement</Typography>
            <Divider sx={{ my: 2 }} />
            <Button fullWidth variant="text" onClick={() => handleView(selected?.final_pdf)}>Review Document Again</Button>
            <FormControlLabel control={<Checkbox onChange={(e) => setAgreed(e.target.checked)} />} label="I confirm terms and conditions" />
            <TextField fullWidth label="Mobile" margin="normal" onChange={(e) => setMobile(e.target.value)} />
            <Box sx={{ border: "1px solid #ccc", mt: 1 }}>
              <SignatureCanvas ref={sigCanvas} canvasProps={{ width: 335, height: 150, className: 'sigCanvas' }} />
            </Box>
            <Button fullWidth variant="contained" sx={{ mt: 2 }} disabled={!agreed} onClick={handleSignSubmit}>Complete Signature</Button>
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}