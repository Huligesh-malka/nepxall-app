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
  Tooltip,
  IconButton
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
  PictureAsPdf,
  Visibility
} from "@mui/icons-material";

const API = "https://nepxall-backend.onrender.com/api/owner";
const BASE_URL = "https://nepxall-backend.onrender.com"; // Base URL for PDF access

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const token = localStorage.getItem("token");

  // Decode token to get user info
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

  // Fetch Payments
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

  const loadAllData = async (showRefreshing = false) => {
    await fetchPayments(showRefreshing);
  };

  useEffect(() => {
    loadAllData();
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

  const getPaymentStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case "paid": return "✅ VERIFIED";
      case "submitted": return "⏳ AWAITING";
      case "pending": return "⏸️ PENDING";
      case "rejected": return "❌ REJECTED";
      default: return "📌 NO PAYMENT";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Logic to open the PDF in a new tab
  const handleViewPdf = (pdfPath) => {
    if (!pdfPath) return;
    // Check if the path is already a full URL or needs the base prefix
    const fullUrl = pdfPath.startsWith('http') ? pdfPath : `${BASE_URL}/${pdfPath}`;
    window.open(fullUrl, '_blank');
  };

  const verifiedCount = data.filter(item => item.payment_status?.toLowerCase() === 'paid').length;
  const totalAmount = data.reduce((sum, item) => sum + (Number(item.amount) || Number(item.owner_amount) || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography color="text.secondary">Loading your earnings...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">💰 Owner Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Track payments and download signed agreements</Typography>
        </Box>
        <Button variant="contained" onClick={() => loadAllData(true)} disabled={refreshing} startIcon={<Refresh />}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Bookings</Typography>
              <Typography variant="h4" fontWeight="bold">{data.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Earnings</Typography>
              <Typography variant="h4" fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Verified</Typography>
              <Typography variant="h4" fontWeight="bold">{verifiedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell><strong>Booking</strong></TableCell>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>PG Name</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Agreement</strong></TableCell> {/* NEW COLUMN */}
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>No records found</TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.booking_id || index} hover>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">{item.tenant_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.phone}</Typography>
                  </TableCell>
                  <TableCell>{item.pg_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(item.amount || item.owner_amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={getPaymentStatusLabel(item.payment_status)} 
                      color={getPaymentStatusColor(item.payment_status)} 
                      size="small" 
                    />
                  </TableCell>
                  
                  {/* PDF AGREEMENT CELL */}
                  <TableCell align="center">
                    {item.final_pdf ? (
                      <Tooltip title="View/Download Signed Agreement">
                        <Button
                          variant="outlined"
                          size="small"
                          color="secondary"
                          startIcon={<PictureAsPdf />}
                          onClick={() => handleViewPdf(item.final_pdf)}
                          sx={{ textTransform: 'none', borderRadius: '20px' }}
                        >
                          View PDF
                        </Button>
                      </Tooltip>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <PendingActions sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption">N/A</Typography>
                      </Box>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(item.payment_date || item.booking_date)}
                    </Typography>
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