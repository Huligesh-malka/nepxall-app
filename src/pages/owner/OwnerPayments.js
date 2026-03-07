import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, 
  TableCell, TableBody, Chip, Avatar, Box, CircularProgress, 
  Alert, Button, Collapse, IconButton, Tooltip
} from "@mui/material";
import { 
  ReceiptLong, 
  Home, 
  KeyboardArrowDown, 
  KeyboardArrowUp,
  Payment,
  CheckCircle,
  Pending
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

// Row component with expandable payments
function PaymentRow({ item }) {
  const [open, setOpen] = useState(false);

  // Helper to color the User's payment to the platform
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'captured':
      case 'success':
      case 'paid': return "success";
      case 'submitted': return "info";
      case 'pending': return "warning";
      case 'rejected': return "error";
      default: return "default";
    }
  };

  // Helper for the Admin-to-Owner settlement status
  const getSettlementColor = (status) => {
    return status === "DONE" ? "success" : "warning";
  };

  // Check if this booking has multiple payments
  const hasMultiplePayments = item.payments && item.payments.length > 1;
  const mainPayment = item.payments && item.payments[0];

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            {hasMultiplePayments && (
              <IconButton size="small" onClick={() => setOpen(!open)}>
                {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            )}
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
            <Typography variant="body2">{item.pg_name || 'N/A'}</Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Typography fontWeight="bold" color="green">
            ₹{Number(item.owner_amount || 0).toLocaleString()}
          </Typography>
        </TableCell>

        <TableCell>
          {mainPayment ? (
            <Box>
              <Chip 
                label={mainPayment.payment_status?.toUpperCase() || "PENDING"} 
                size="small" 
                color={getPaymentStatusColor(mainPayment.payment_status)} 
              />
              {mainPayment.amount && (
                <Typography variant="caption" display="block" color="textSecondary">
                  ₹{Number(mainPayment.amount).toLocaleString()}
                </Typography>
              )}
            </Box>
          ) : (
            <Chip 
              label="NO PAYMENT" 
              size="small" 
              color="default" 
            />
          )}
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
      
      {/* Expandable payments section */}
      {hasMultiplePayments && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2 }}>
                <Typography variant="subtitle2" gutterBottom component="div">
                  Payment History
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Payment ID</strong></TableCell>
                      <TableCell><strong>Amount</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Order ID</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.payments.map((payment) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell>#{payment.payment_id}</TableCell>
                        <TableCell>₹{Number(payment.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={payment.payment_status?.toUpperCase() || "PENDING"} 
                            size="small" 
                            color={getPaymentStatusColor(payment.payment_status)} 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {payment.order_id || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 });

  const token = localStorage.getItem("token");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔍 Fetching payments with token:", token ? "Token exists" : "No token");
      
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("📊 API Response:", res.data);

      if (res.data?.success) {
        // Process the data to group payments by booking
        const rawData = res.data.data || [];
        
        // Group payments by booking_id
        const bookingMap = new Map();
        
        rawData.forEach(item => {
          if (!bookingMap.has(item.booking_id)) {
            bookingMap.set(item.booking_id, {
              booking_id: item.booking_id,
              tenant_name: item.tenant_name,
              phone: item.phone,
              pg_name: item.pg_name,
              owner_amount: item.owner_amount,
              owner_settlement: item.owner_settlement,
              booking_status: item.booking_status,
              payments: []
            });
          }
          
          if (item.payment_id) {
            bookingMap.get(item.booking_id).payments.push({
              payment_id: item.payment_id,
              amount: item.user_payment || item.payment_amount,
              payment_status: item.payment_status,
              order_id: item.order_id,
              utr: item.utr,
              payment_date: item.payment_date
            });
          }
        });

        const groupedData = Array.from(bookingMap.values());
        
        // Calculate summary
        const totalBookings = groupedData.length;
        const paidBookings = groupedData.filter(b => 
          b.payments.some(p => p.payment_status?.toLowerCase() === 'paid')
        ).length;
        
        setSummary({
          total: totalBookings,
          paid: paidBookings,
          pending: totalBookings - paidBookings
        });
        
        setData(groupedData);
        console.log("✅ Processed data:", groupedData);
      } else {
        setError(res.data?.message || "Failed to load payments");
      }
    } catch (err) {
      console.error("❌ Owner payments error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Server unreachable or session expired");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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
        <Button variant="contained" onClick={fetchPayments} startIcon={<Payment />}>
          Refresh Data
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3}>
        <Paper sx={{ p: 2, flex: 1, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle2" color="textSecondary">Total Bookings</Typography>
          <Typography variant="h5">{summary.total}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, bgcolor: '#e8f5e9' }}>
          <Typography variant="subtitle2" color="textSecondary">Paid</Typography>
          <Typography variant="h5" color="success.main">{summary.paid}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, bgcolor: '#fff3e0' }}>
          <Typography variant="subtitle2" color="textSecondary">Pending</Typography>
          <Typography variant="h5" color="warning.main">{summary.pending}</Typography>
        </Paper>
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
                  <Typography color="textSecondary">No payment records found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <PaymentRow key={item.booking_id} item={item} />
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}