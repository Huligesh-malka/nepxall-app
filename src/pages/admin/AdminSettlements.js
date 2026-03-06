import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Avatar,
  useTheme,
  Skeleton
} from "@mui/material";

import {
  CheckCircleOutline,
  Person,
  ReceiptLong,
  ContentCopy,
  Home
} from "@mui/icons-material";

import { styled } from "@mui/material/styles";

/* ================= BACKEND API ================= */

const API = "https://nepxall-backend.onrender.com/api/admin/settlements";

/* ================= STYLES ================= */

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
}));

const StyledTableCell = styled(TableCell)(() => ({
  fontWeight: 600
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
  color: "white",
  borderRadius: theme.spacing(1.5),
  "&:hover": { transform: "translateY(-2px)" }
}));

export default function AdminSettlements() {

  const theme = useTheme();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  //////////////////////////////////////////////////////
  // FETCH SETTLEMENTS
  //////////////////////////////////////////////////////

  const fetchSettlements = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        `${API}/pending-settlements`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setData(res.data.data || []);
      setError("");

    } catch (err) {

      console.error("Settlement fetch error:", err);
      setError("Failed to load settlements");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  //////////////////////////////////////////////////////
  // MARK SETTLED
  //////////////////////////////////////////////////////

  const markSettled = async (bookingId) => {

    if (!window.confirm("Confirm settlement payment to owner?")) return;

    try {

      setProcessingId(bookingId);

      await axios.put(
        `${API}/mark-settled/${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchSettlements();

    } catch (err) {

      console.error(err);
      alert("Settlement failed");

    } finally {

      setProcessingId(null);

    }
  };

  //////////////////////////////////////////////////////
  // COPY FUNCTION
  //////////////////////////////////////////////////////

  const copyToClipboard = (text) => {

    navigator.clipboard.writeText(text);
    alert("Copied!");

  };

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Skeleton height={60}/>
        <Skeleton height={400}/>
      </Container>
    );
  }

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (

    <Container maxWidth="xl" sx={{ mt: 4 }}>

      <Typography variant="h4" fontWeight="bold" mb={3}>
        💰 Owner Settlements
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb:2 }}>
          {error}
        </Alert>
      )}

      <StyledCard>

        {data.length === 0 ? (

          <CardContent sx={{ textAlign:"center", py:6 }}>

            <CheckCircleOutline
              sx={{ fontSize:60, color: theme.palette.success.main }}
            />

            <Typography mt={2}>
              No pending settlements
            </Typography>

          </CardContent>

        ) : (

          <TableContainer>

            <Table>

              <TableHead>
                <TableRow>
                  <StyledTableCell>Booking</StyledTableCell>
                  <StyledTableCell>Owner</StyledTableCell>
                  <StyledTableCell>PG</StyledTableCell>
                  <StyledTableCell>Amount</StyledTableCell>
                  <StyledTableCell>Bank</StyledTableCell>
                  <StyledTableCell align="center">Action</StyledTableCell>
                </TableRow>
              </TableHead>

              <TableBody>

                {data.map((item)=>(
                  <TableRow key={item.booking_id} hover>

                    {/* Booking */}

                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor:"#eef2ff" }}>
                          <ReceiptLong/>
                        </Avatar>
                        #{item.booking_id}
                      </Box>
                    </TableCell>

                    {/* Owner */}

                    <TableCell>

                      <Box display="flex" alignItems="center" gap={1}>

                        <Avatar sx={{ bgcolor:"#e6f4ea" }}>
                          <Person/>
                        </Avatar>

                        <Box>

                          <Typography fontWeight="bold">
                            {item.owner_name}
                          </Typography>

                          <Typography variant="caption">
                            {item.owner_phone}
                          </Typography>

                        </Box>

                      </Box>

                    </TableCell>

                    {/* PG */}

                    <TableCell>

                      <Box display="flex" alignItems="center" gap={1}>

                        <Avatar sx={{ bgcolor:"#fff4e5" }}>
                          <Home/>
                        </Avatar>

                        <Box>

                          <Typography fontWeight="bold">
                            {item.pg_name}
                          </Typography>

                          <Typography variant="caption">
                            {item.area}, {item.city}
                          </Typography>

                        </Box>

                      </Box>

                    </TableCell>

                    {/* Amount */}

                    <TableCell>

                      <Typography fontWeight="bold" color="green">
                        ₹{Number(item.owner_amount).toLocaleString()}
                      </Typography>

                    </TableCell>

                    {/* Bank */}

                    <TableCell>

                      <Typography fontWeight="bold">
                        {item.account_holder_name}
                      </Typography>

                      <Chip
                        label={`A/C ${item.account_number}`}
                        size="small"
                        onDelete={()=>copyToClipboard(item.account_number)}
                        deleteIcon={<ContentCopy/>}
                        sx={{mr:1}}
                      />

                      <Chip
                        label={`IFSC ${item.ifsc}`}
                        size="small"
                        onDelete={()=>copyToClipboard(item.ifsc)}
                        deleteIcon={<ContentCopy/>}
                      />

                      <Typography variant="caption">
                        {item.bank_name}
                      </Typography>

                    </TableCell>

                    {/* Action */}

                    <TableCell align="center">

                      <GradientButton
                        disabled={processingId === item.booking_id}
                        onClick={()=>markSettled(item.booking_id)}
                      >

                        {processingId === item.booking_id
                          ? <CircularProgress size={18} color="inherit"/>
                          : "Mark Settled"
                        }

                      </GradientButton>

                    </TableCell>

                  </TableRow>
                ))}

              </TableBody>

            </Table>

          </TableContainer>

        )}

      </StyledCard>

    </Container>
  );
}