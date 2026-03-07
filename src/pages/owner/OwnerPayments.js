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
  Alert,
  Button
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

  ////////////////////////////////////////////////////////////
  // FETCH PAYMENTS
  ////////////////////////////////////////////////////////////

  const fetchPayments = async () => {

    try {

      setLoading(true);
      setError("");

      const res = await axios.get(`${API}/payments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("OWNER PAYMENTS RESPONSE:", res.data);

      if (res.data?.success) {
        setData(res.data.data || []);
      } else {
        setError("Failed to load payments");
      }

    } catch (err) {

      console.error("Owner payments error:", err);
      setError("Failed to load payments");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchPayments();
  }, []);

  ////////////////////////////////////////////////////////////
  // PAYMENT STATUS COLOR
  ////////////////////////////////////////////////////////////

  const paymentColor = (status) => {

    switch (status) {

      case "paid":
        return "success";

      case "submitted":
        return "warning";

      case "rejected":
        return "error";

      default:
        return "default";

    }

  };

  ////////////////////////////////////////////////////////////
  // OWNER SETTLEMENT COLOR
  ////////////////////////////////////////////////////////////

  const settlementColor = (status) => {

    if (status === "DONE") return "success";

    return "warning";

  };

  ////////////////////////////////////////////////////////////
  // LOADING UI
  ////////////////////////////////////////////////////////////

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  ////////////////////////////////////////////////////////////
  // MAIN UI
  ////////////////////////////////////////////////////////////

  return (

    <Container maxWidth="lg" sx={{ mt: 4 }}>

      <Box display="flex" justifyContent="space-between" mb={3}>

        <Typography variant="h4" fontWeight="bold">
          💰 Earnings & Payments
        </Typography>

        <Button
          variant="outlined"
          onClick={fetchPayments}
        >
          Refresh
        </Button>

      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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

              <TableRow key={item.payment_id || item.booking_id} hover>

                {/* BOOKING */}

                <TableCell>

                  <Box display="flex" alignItems="center" gap={1}>

                    <Avatar sx={{ bgcolor: "#eef2ff" }}>
                      <ReceiptLong />
                    </Avatar>

                    #{item.booking_id}

                  </Box>

                </TableCell>

                {/* TENANT */}

                <TableCell>

                  <Box display="flex" alignItems="center" gap={1}>

                    <Avatar sx={{ bgcolor: "#e6f4ea" }}>
                      <Person />
                    </Avatar>

                    {item.tenant_name || "-"}

                  </Box>

                </TableCell>

                {/* PG */}

                <TableCell>

                  <Box display="flex" alignItems="center" gap={1}>

                    <Avatar sx={{ bgcolor: "#fff4e5" }}>
                      <Home />
                    </Avatar>

                    {item.pg_name || "-"}

                  </Box>

                </TableCell>

                {/* AMOUNT */}

                <TableCell>

                  ₹{Number(item.owner_amount || item.amount || 0).toLocaleString()}

                </TableCell>

                {/* PAYMENT STATUS */}

                <TableCell>

                  <Chip
                    label={(item.payment_status || item.status || "pending").toUpperCase()}
                    color={paymentColor(item.payment_status || item.status)}
                    size="small"
                  />

                </TableCell>

                {/* OWNER SETTLEMENT */}

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