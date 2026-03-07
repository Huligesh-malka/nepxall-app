import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, 
  TableCell, TableBody, Chip, Avatar, Box, CircularProgress, 
  Alert, Button
} from "@mui/material";
import { ReceiptLong, Person, Home } from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setData(res.data.data || []);
      } else {
        setError("Failed to load payments");
      }
    } catch (err) {
      console.error("Owner payments error:", err);
      setError("Server unreachable or session expired");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Helper to color the User's payment to the platform
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'captured':
      case 'success':
      case 'paid': return "success";
      case 'pending': return "warning";
      default: return "default";
    }
  };

  // Helper for the Admin-to-Owner settlement status
  const getSettlementColor = (status) => {
    return status === "DONE" ? "success" : "warning";
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          💰 Earnings & Payments
        </Typography>
        <Button variant="contained" onClick={fetchPayments}>
          Refresh Data
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f8f9fa" }}>
              <TableCell><strong>Booking</strong></TableCell>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>PG Name</strong></TableCell>
              <TableCell><strong>Your Earning</strong></TableCell>
              <TableCell><strong>User Payment</strong></TableCell>
              <TableCell><strong>Settlement</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="textSecondary">No confirmed payment records found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.booking_id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: "#eef2ff", color: "#3f51b5", width: 32, height: 32 }}>
                        <ReceiptLong fontSize="small" />
                      </Avatar>
                      <Typography variant="body2">#{item.booking_id}</Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="500">{item.tenant_name}</Typography>
                    <Typography variant="caption" color="textSecondary">{item.phone}</Typography>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Home fontSize="small" color="action" />
                      <Typography variant="body2">{item.pg_name}</Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight="bold" color="green">
                      ₹{Number(item.owner_amount || 0).toLocaleString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip 
                      label={item.payment_status || "PENDING"} 
                      size="small" 
                      color={getPaymentStatusColor(item.payment_status)} 
                    />
                  </TableCell>

                  <TableCell>
                    <Chip 
                      label={item.owner_settlement === "DONE" ? "Paid to You" : "Pending"} 
                      size="small" 
                      variant={item.owner_settlement === "DONE" ? "filled" : "outlined"}
                      color={getSettlementColor(item.owner_settlement)} 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}