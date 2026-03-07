import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Avatar,
  Box,
  CircularProgress,
  Alert
} from "@mui/material";

import {
  ReceiptLong,
  Person,
  Home
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {

    try {

      const res = await axios.get(
        `${API}/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setData(res.data.data || []);

    } catch (err) {

      console.error(err);
      setError("Failed to load payments");

    } finally {

      setLoading(false);

    }

  };

  const paymentColor = (status) => {

    if (status === "paid") return "success";
    if (status === "submitted") return "warning";
    if (status === "pending") return "default";
    if (status === "rejected") return "error";

    return "default";

  };

  const settlementColor = (status) => {

    if (status === "DONE") return "success";
    return "warning";

  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (

    <Container maxWidth="lg" sx={{ mt: 4 }}>

      <Typography variant="h4" fontWeight="bold" mb={3}>
        💰 Earnings & Payments
      </Typography>

      {error && (
        <Alert severity="error">{error}</Alert>
      )}

      <Paper sx={{ borderRadius: 2 }}>

        <Table>

          <TableHead>

            <TableRow sx={{ background: "#f5f5f5" }}>

              <TableCell><strong>Booking</strong></TableCell>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>PG</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Payment</strong></TableCell>
              <TableCell><strong>Owner Paid</strong></TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No payment records
                </TableCell>
              </TableRow>
            )}

            {data.map((item) => (

              <TableRow key={item.booking_id} hover>

                {/* Booking */}

                <TableCell>

                  <Box display="flex" alignItems="center" gap={1}>

                    <Avatar sx={{ bgcolor: "#eef2ff" }}>
                      <ReceiptLong />
                    </Avatar>

                    #{item.booking_id}

                  </Box>

                </TableCell>

                {/* Tenant */}

                <TableCell>

                  <Box display="flex" alignItems="center" gap={1}>

                    <Avatar sx={{ bgcolor: "#e6f4ea" }}>
                      <Person />
                    </Avatar>

                    {item.tenant_name}

                  </Box>

                </TableCell>

                {/* PG */}

                <TableCell>

                  <Box display="flex" alignItems="center" gap={1}>

                    <Avatar sx={{ bgcolor: "#fff4e5" }}>
                      <Home />
                    </Avatar>

                    {item.pg_name}

                  </Box>

                </TableCell>

                {/* Amount */}

                <TableCell>
                  ₹{Number(item.owner_amount || 0).toLocaleString()}
                </TableCell>

                {/* Payment Status */}

                <TableCell>

                  <Chip
                    label={item.payment_status || "pending"}
                    color={paymentColor(item.payment_status)}
                    size="small"
                  />

                </TableCell>

                {/* Owner Settlement */}

                <TableCell>

                  <Chip
                    label={item.owner_settlement === "DONE" ? "Paid" : "Pending"}
                    color={settlementColor(item.owner_settlement)}
                    size="small"
                  />

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

    </Container>

  );

}