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
  Warning
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_bookings: 0,
    verified_payments: 0,
    pending_approval: 0,
    rejected_payments: 0,
    total_earned: 0,
    pending_settlement: 0,
    completed_settlement: 0
  });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const token = localStorage.getItem("token");

  // Decode token to get user info
  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        console.log("👤 Logged in user:", payload);
        setUserInfo(payload);
      } catch (e) {
        console.error("Could not decode token:", e);
      }
    }
  }, [token]);

  // Fetch payments
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

      console.log("📦 Payments Response:", res.data);
      
      if (res.data?.success) {
        console.log("✅ Payments data:", res.data.data);
        console.log("📊 Count:", res.data.count);
        console.log("🔧 Debug info:", res.data.debug);
        
        setData(res.data.data || []);
        
        // Show warning if no data
        if (res.data.count === 0) {
          console.log("⚠️ No payments found. Debug info:", res.data.debug);
          
          // If there's debug info with ownerId, show helpful message
          if (res.data.debug) {
            setError(`No payments found for your account (Owner ID: ${res.data.debug.ownerId}). This might be because you don't have any PGs or bookings yet.`);
          }
        }
      } else {
        setError("Failed to load payments");
      }

    } catch (err) {
      console.error("❌ Payments fetch error:", err);
      setError(err.response?.data?.message || "Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError("");
      
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
      setSummaryError("Could not load summary data");
    } finally {
      setSummaryLoading(false);
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

  const getSettlementStatusLabel = (status) => {
    switch(status?.toUpperCase()) {
      case "COMPLETED":
      case "DONE":
        return "💰 PAID TO OWNER";
      case "PENDING":
        return "⏳ PENDING SETTLEMENT";
      default:
        return "📌 UNKNOWN";
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

  // Calculate stats from actual data
  const verifiedCount = data.filter(item => 
    item.payment_status?.toLowerCase() === 'paid'
  ).length;
  
  const pendingApprovalCount = data.filter(item => 
    item.payment_status?.toLowerCase() === 'submitted'
  ).length;
  
  const rejectedCount = data.filter(item => 
    item.payment_status?.toLowerCase() === 'rejected'
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

      {/* User Info Banner */}
      {userInfo && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Info color="info" />
            <Typography variant="body2">
              Logged in as: <strong>{userInfo.email || userInfo.name || 'Owner'}</strong> (ID: {userInfo.id || userInfo.userId || 'N/A'})
            </Typography>
          </Box>
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
          severity="warning" 
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

      {/* Summary Error */}
      {summaryError && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<Warning />}>
          {summaryError} - Showing calculated stats from your data
        </Alert>
      )}

      {/* Summary Cards */}
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

      {/* Second Row Summary - Additional Stats */}
      {(verifiedCount > 0 || rejectedCount > 0) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Amount to be Settled
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(totalAmount - (summary?.completed_settlement || 0))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From {verifiedCount} verified payment(s)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Already Settled
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {formatCurrency(summary?.completed_settlement || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Paid to your account
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Rejected Payments
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {rejectedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Need attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary">
            <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Showing {data.length} booking{data.length !== 1 ? 's' : ''}
            {verifiedCount > 0 && ` (${verifiedCount} verified, ${formatCurrency(totalAmount)})`}
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
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <AccountBalanceWallet sx={{ fontSize: 48, color: '#ccc' }} />
                    <Typography variant="h6" color="text.secondary">
                      No payment records found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
                      {userInfo ? (
                        <>You are logged in as Owner ID: <strong>{userInfo.id || userInfo.userId}</strong>. 
                        To see payments, you need to have:
                        <ul style={{ textAlign: 'left', marginTop: 8 }}>
                          <li>PGs registered under your account</li>
                          <li>Bookings for those PGs</li>
                          <li>Payments made against those bookings</li>
                        </ul>
                        </>
                      ) : (
                        'Please make sure you are logged in as an owner with PGs and bookings.'
                      )}
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => loadAllData(true)}
                      startIcon={<Refresh />}
                      sx={{ mt: 2 }}
                    >
                      Refresh Data
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                return (
                  <TableRow key={item.booking_id || index} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: "#eef2ff", width: 32, height: 32 }}>
                          <ReceiptLong sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
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
                          <Typography variant="body2" fontWeight="medium">
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
                        sx={{ 
                          minWidth: 130,
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={getSettlementStatusLabel(item.owner_settlement)}
                        color={getSettlementStatusColor(item.owner_settlement)}
                        size="small"
                        sx={{ 
                          minWidth: 130,
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.payment_date || item.settlement_date || item.booking_date)}
                      </Typography>
                      {item.order_id && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Order: {item.order_id.substring(0, 10)}...
                        </Typography>
                      )}
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
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Verified:</strong> {verifiedCount} | 
                <strong>Pending Approval:</strong> {pendingApprovalCount} |
                <strong>Rejected:</strong> {rejectedCount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                Total: {formatCurrency(totalAmount)}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Info Note */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          ⓘ Payments with status "AWAITING APPROVAL" are pending admin verification. 
          Only "VERIFIED" payments are eligible for settlement.
        </Typography>
      </Box>

    </Container>
  );
}