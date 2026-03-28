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
  Tooltip
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
  PictureAsPdf
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";
const BASE_URL = "https://nepxall-backend.onrender.com"; // For PDF file paths

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUserInfo(payload);
      } catch (e) {
        console.error("Could not decode token:", e);
      }
    }
  }, [token]);

  const fetchPayments = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
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
      setError(err.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  /* ================= HELPER FUNCTIONS ================= */
  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "paid": return "success";
      case "submitted": return "info";
      case "pending": return "warning";
      case "rejected": return "error";
      default: return "default";
    }
  };

  const getSettlementStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case "DONE":
      case "COMPLETED": return "success";
      case "PENDING": return "warning";
      default: return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleViewPdf = (pdfPath) => {
    if (!pdfPath) return;
    const fullUrl = pdfPath.startsWith('http') ? pdfPath : `${BASE_URL}/${pdfPath}`;
    window.open(fullUrl, '_blank');
  };

  const verifiedCount = data.filter(item => item.payment_status?.toLowerCase() === 'paid').length;
  const totalAmount = data.reduce((sum, item) => sum + (Number(item.amount) || Number(item.owner_amount) || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography color="text.secondary">Loading your earnings...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            💰 Owner Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your earnings and signed agreements
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={() => fetchPayments(true)} 
          disabled={refreshing} 
          startIcon={refreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Total Bookings</Typography>
              <Typography variant="h4" fontWeight="bold">{data.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#388e3c', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Total Earnings</Typography>
              <Typography variant="h4" fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#0288d1', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Verified</Typography>
              <Typography variant="h4" fontWeight="bold">{verifiedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f8f9fa" }}>
              <TableCell><strong>Booking</strong></TableCell>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>PG Name</strong></TableCell>
              <TableCell align="center"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Settlement</strong></TableCell>
              <TableCell align="center"><strong>Agreement</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <AccountBalanceWallet sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography color="text.secondary">No records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.booking_id || index} hover>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">{item.tenant_name || "N/A"}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.phone}</Typography>
                  </TableCell>
                  <TableCell>{item.pg_name}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="primary.main">
                      {formatCurrency(item.amount || item.owner_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={item.payment_status?.toUpperCase() || "PENDING"} 
                      color={getPaymentStatusColor(item.payment_status)} 
                      size="small" 
                      sx={{ fontWeight: 'bold', px: 1 }}
                    />
                  </TableCell>
                  
                  {/* Settlement Column */}
                  <TableCell align="center">
                    <Chip 
                      label={item.owner_settlement?.toUpperCase() || "PENDING"} 
                      color={getSettlementStatusColor(item.owner_settlement)} 
                      variant="outlined"
                      size="small" 
                    />
                  </TableCell>

                  {/* Agreement Column */}
                  <TableCell align="center">
                    {item.final_pdf ? (
                      <Tooltip title="View Signed Agreement">
                        <Button
                          variant="contained"
                          size="small"
                          color="info"
                          startIcon={<PictureAsPdf />}
                          onClick={() => handleViewPdf(item.final_pdf)}
                          sx={{ textTransform: 'none', borderRadius: '4px', fontSize: '0.75rem' }}
                        >
                          View PDF
                        </Button>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <PendingActions sx={{ fontSize: 14 }} /> Not Uploaded
                      </Typography>
                    )}
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