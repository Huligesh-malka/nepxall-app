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
  Button,
  Card,
  CardContent,
  Grid,
  Divider
} from "@mui/material";

import {
  ReceiptLong,
  Person,
  Home,
  AccountBalanceWallet,
  CheckCircle,
  PendingActions,
  Refresh,
  Info
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {

  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  ////////////////////////////////////////////////////////////
  // FETCH PAYMENTS
  ////////////////////////////////////////////////////////////

  const fetchPayments = async (showRefreshing = false) => {

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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

      // Fetch summary as well
      await fetchSummary();

    } catch (err) {
      console.error("Owner payments error:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  ////////////////////////////////////////////////////////////
  // FETCH SETTLEMENT SUMMARY
  ////////////////////////////////////////////////////////////

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API}/settlements/summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error("Summary fetch error:", err);
      // Don't set main error for summary failure
    }
  };
  
  useEffect(() => {
    fetchPayments();
  }, []);

  ////////////////////////////////////////////////////////////
  // HELPER FUNCTIONS
  ////////////////////////////////////////////////////////////

  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "paid":
        return "success";
      case "pending":
      case "submitted":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getSettlementStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case "COMPLETED":
      case "DONE":
        return "success";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  ////////////////////////////////////////////////////////////
  // LOADING UI
  ////////////////////////////////////////////////////////////

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          Loading your earnings...
        </Typography>
      </Box>
    );
  }

  ////////////////////////////////////////////////////////////
  // MAIN UI
  ////////////////////////////////////////////////////////////

  return (

    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* Header Section */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            💰 Earnings Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your verified payments and settlements
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => fetchPayments(true)}
          disabled={refreshing}
          startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
          sx={{ minWidth: 120 }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchPayments()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      Total Earnings
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(summary.total_amount)}
                    </Typography>
                  </Box>
                  <AccountBalanceWallet sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      Pending Settlements
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(summary.pending_amount)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      ({summary.pending_settlements} bookings)
                    </Typography>
                  </Box>
                  <PendingActions sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      Completed Settlements
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(summary.completed_amount)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      ({summary.completed_settlements} bookings)
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      Total Transactions
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {summary.total_settlements || 0}
                    </Typography>
                  </Box>
                  <ReceiptLong sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Table Card */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>

        {/* Table Header with Info */}
        <Box sx={{ 
          p: 2, 
          bgcolor: '#f8f9fa', 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Info fontSize="small" color="info" />
          <Typography variant="body2" color="text.secondary">
            Showing {data.length} verified payment{data.length !== 1 ? 's' : ''} (approved by admin)
          </Typography>
        </Box>

        <Table>

          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell><strong>Booking ID</strong></TableCell>
              <TableCell><strong>Tenant Details</strong></TableCell>
              <TableCell><strong>PG Name</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Payment Status</strong></TableCell>
              <TableCell align="center"><strong>Settlement Status</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>

            {data.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <AccountBalanceWallet sx={{ fontSize: 48, color: '#ccc' }} />
                    <Typography variant="h6" color="text.secondary">
                      No verified payments yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payments will appear here once approved by admin
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => fetchPayments()}
                      sx={{ mt: 2 }}
                    >
                      Refresh
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {data.map((item, index) => (
              <TableRow 
                key={item.booking_id || index} 
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >

                {/* Booking ID */}
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: "#eef2ff", width: 32, height: 32 }}>
                      <ReceiptLong sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      #{item.booking_id}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Tenant Details */}
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: "#e6f4ea", width: 32, height: 32 }}>
                      <Person sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.tenant_name || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.phone || "No phone"}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* PG Name */}
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: "#fff4e5", width: 32, height: 32 }}>
                      <Home sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="body2">
                      {item.pg_name || "N/A"}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Amount */}
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    {formatCurrency(item.amount || item.owner_amount || 0)}
                  </Typography>
                </TableCell>

                {/* Payment Status */}
                <TableCell align="center">
                  <Chip
                    label={(item.payment_status || "paid").toUpperCase()}
                    color={getPaymentStatusColor(item.payment_status)}
                    size="small"
                    variant={item.payment_status === "paid" ? "filled" : "outlined"}
                    sx={{ minWidth: 80 }}
                  />
                </TableCell>

                {/* Settlement Status */}
                <TableCell align="center">
                  <Chip
                    label={item.owner_settlement === "COMPLETED" || item.owner_settlement === "DONE" 
                      ? "PAID" 
                      : "PENDING"
                    }
                    color={getSettlementStatusColor(item.owner_settlement)}
                    size="small"
                    sx={{ minWidth: 80 }}
                  />
                </TableCell>

                {/* Date */}
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.payment_date || item.settlement_date)}
                  </Typography>
                </TableCell>

              </TableRow>
            ))}

          </TableBody>

        </Table>

        {/* Table Footer */}
        {data.length > 0 && (
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f8f9fa', 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <Typography variant="body2" color="text.secondary">
              Total: {formatCurrency(data.reduce((sum, item) => 
                sum + (Number(item.amount || item.owner_amount || 0)), 0
              ))}
            </Typography>
          </Box>
        )}

      </Paper>

      {/* Info Note */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          ⓘ Only payments verified by admin are shown here. 
          Payments pending approval will appear once confirmed.
        </Typography>
      </Box>

    </Container>

  );

}