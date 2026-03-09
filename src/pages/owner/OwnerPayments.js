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
  Grid
} from "@mui/material";

import {
  ReceiptLong,
  Person,
  Home,
  AccountBalanceWallet,
  CheckCircle,
  PendingActions,
  Refresh,
  Info,
  Warning,
  Error as ErrorIcon
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [rawData, setRawData] = useState(null); // For debugging
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch payments with better debugging
  const fetchPayments = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      console.log("📡 Fetching payments from:", `${API}/payments`);
      
      const res = await axios.get(`${API}/payments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("📦 Raw API Response:", res);
      console.log("📦 Response Data:", res.data);
      
      // Store raw data for debugging
      setRawData(res.data);

      if (res.data?.success) {
        console.log("✅ Payments data array:", res.data.data);
        console.log("📊 Number of payments:", res.data.data?.length);
        
        // Log the first item to see structure
        if (res.data.data && res.data.data.length > 0) {
          console.log("📋 First payment item structure:", res.data.data[0]);
        } else {
          console.log("⚠️ No payment items in data array");
        }
        
        setData(res.data.data || []);
      } else {
        console.error("❌ API returned success: false");
        setError("Failed to load payments");
      }

    } catch (err) {
      console.error("❌ Payments fetch error:", err);
      console.error("❌ Error response:", err.response);
      setError(err.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      console.log("📡 Fetching summary from:", `${API}/settlements/summary`);
      
      const res = await axios.get(`${API}/settlements/summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("📦 Summary Response:", res.data);

      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error("❌ Summary fetch error:", err);
    }
  };
  
  // Load all data
  const loadAllData = async (showRefreshing = false) => {
    await fetchPayments(showRefreshing);
    await fetchSummary();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Helper functions
  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "paid":
        return "success";
      case "submitted":
        return "info";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case "paid":
        return "✅ VERIFIED";
      case "submitted":
        return "⏳ AWAITING APPROVAL";
      case "pending":
        return "⏸️ PENDING";
      case "rejected":
        return "❌ REJECTED";
      default:
        return "📌 NO PAYMENT";
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
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  // Calculate stats from data
  const verifiedCount = data.filter(item => 
    item.payment_status?.toLowerCase() === 'paid'
  ).length;
  
  const pendingApprovalCount = data.filter(item => 
    item.payment_status?.toLowerCase() === 'submitted'
  ).length;
  
  const totalAmount = data.reduce((sum, item) => 
    sum + (Number(item.amount) || Number(item.owner_amount) || 0), 0
  );

  // Loading UI
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

  // Main UI
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Debug:</strong> Data length: {data.length} | 
            Verified: {verifiedCount} | 
            Pending: {pendingApprovalCount} | 
            Total: ₹{totalAmount}
          </Typography>
        </Paper>
      )}

      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            💰 Earnings Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your payments and settlements
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => loadAllData(true)}
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
            <Button color="inherit" size="small" onClick={() => loadAllData()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards - Using actual data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Total Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {data.length}
                  </Typography>
                </Box>
                <ReceiptLong sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Verified Payments
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {verifiedCount}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Pending Approval
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {pendingApprovalCount}
                  </Typography>
                </Box>
                <PendingActions sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
                <AccountBalanceWallet sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary">
            <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Showing {data.length} booking{data.length !== 1 ? 's' : ''}
            {verifiedCount > 0 && ` (${verifiedCount} verified)`}
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell><strong>Booking</strong></TableCell>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>PG</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Payment Status</strong></TableCell>
              <TableCell align="center"><strong>Settlement</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <AccountBalanceWallet sx={{ fontSize: 48, color: '#ccc' }} />
                    <Typography variant="h6" color="text.secondary">
                      No payment records found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From admin panel I can see there are approved payments. 
                      This might be a data mapping issue.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => loadAllData(true)}
                      startIcon={<Refresh />}
                    >
                      Refresh Data
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                // Debug each row
                console.log(`🔍 Row ${index}:`, item);
                
                return (
                  <TableRow key={item.booking_id || index} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: "#eef2ff", width: 32, height: 32 }}>
                          <ReceiptLong sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="body2">
                          #{item.booking_id || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: "#e6f4ea", width: 32, height: 32 }}>
                          <Person sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {item.tenant_name || item.name || "N/A"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.phone || "No phone"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

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

                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold" color="primary.main">
                        {formatCurrency(item.amount || item.owner_amount || 0)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={getPaymentStatusLabel(item.payment_status)}
                        color={getPaymentStatusColor(item.payment_status)}
                        size="small"
                        sx={{ minWidth: 120 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={item.owner_settlement === "COMPLETED" || item.owner_settlement === "DONE" ? "PAID" : "PENDING"}
                        color={getSettlementStatusColor(item.owner_settlement)}
                        size="small"
                        sx={{ minWidth: 80 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.payment_date || item.settlement_date || item.booking_date)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Table Footer with Summary */}
        {data.length > 0 && (
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f8f9fa', 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Verified:</strong> {verifiedCount} | 
              <strong>Pending:</strong> {pendingApprovalCount}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              Total: {formatCurrency(totalAmount)}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Info Note */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          ⓘ Payments with status "AWAITING APPROVAL" are pending admin verification
        </Typography>
      </Box>

    </Container>
  );
}