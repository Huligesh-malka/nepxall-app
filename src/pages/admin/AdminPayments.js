import React, { useEffect, useState } from "react";
import api from "../../api/api";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Stack,
  Snackbar
} from "@mui/material";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      // Note: api already has baseURL configured, so we just need the relative path
      const res = await api.get("/admin/payments");

      if (res.data.success) {
        setPayments(res.data.data);
      } else {
        setError(res.data.message || "Failed to load payments");
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      
      if (err.response?.status === 404) {
        setError("Payments endpoint not found. Please check backend routes.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError(err.response?.data?.message || "Failed to load payments");
      }
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (orderId) => {
    try {
      setProcessing(orderId);
      
      const res = await api.put(`/admin/payments/${orderId}/verify`);
      
      if (res.data.success) {
        setSnackbar({
          open: true,
          message: "Payment approved successfully",
          severity: "success"
        });
        fetchPayments();
      }
    } catch (err) {
      console.error("Approve error:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Approval failed",
        severity: "error"
      });
    } finally {
      setProcessing(null);
    }
  };

  const rejectPayment = async (orderId) => {
    try {
      setProcessing(orderId);
      
      const res = await api.put(`/admin/payments/${orderId}/reject`);
      
      if (res.data.success) {
        setSnackbar({
          open: true,
          message: "Payment rejected successfully",
          severity: "success"
        });
        fetchPayments();
      }
    } catch (err) {
      console.error("Reject error:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Rejection failed",
        severity: "error"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight="bold">
          Payment Verification
        </Typography>

        <Button
          variant="outlined"
          onClick={fetchPayments}
          startIcon={<CircularProgress size={20} sx={{ display: loading ? 'inline-block' : 'none' }} />}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>PG</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>UTR</strong></TableCell>
              <TableCell><strong>Order ID</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No pending payments found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.order_id} hover>
                  <TableCell>{payment.tenant_name || "N/A"}</TableCell>
                  <TableCell>{payment.phone || "N/A"}</TableCell>
                  <TableCell>{payment.pg_name || "N/A"}</TableCell>
                  <TableCell>₹{payment.amount?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {payment.utr || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {payment.order_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={
                        payment.status === 'submitted' ? 'warning' :
                        payment.status === 'paid' ? 'success' :
                        payment.status === 'rejected' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      disabled={processing === payment.order_id}
                      onClick={() => approvePayment(payment.order_id)}
                      sx={{ mr: 1, minWidth: 80 }}
                    >
                      {processing === payment.order_id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Approve"
                      )}
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      disabled={processing === payment.order_id}
                      onClick={() => rejectPayment(payment.order_id)}
                      sx={{ minWidth: 80 }}
                    >
                      {processing === payment.order_id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPayments;