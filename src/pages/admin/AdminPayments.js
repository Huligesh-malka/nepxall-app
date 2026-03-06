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

  ////////////////////////////////////////////////////////
  // LOAD PAYMENTS
  ////////////////////////////////////////////////////////

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {

    try {

      setLoading(true);
      setError("");

      const res = await api.get("/payments/admin/payments");

      if (res.data.success) {
        setPayments(res.data.data || []);
      } else {
        setError(res.data.message || "Failed to load payments");
      }

    } catch (err) {

      console.error("Fetch payments error:", err);

      if (err.response?.status === 404) {
        setError("Payments API not found");
      }
      else if (err.response?.status === 403) {
        setError("Admin permission required");
      }
      else {
        setError(err.response?.data?.message || "Failed to load payments");
      }

    } finally {
      setLoading(false);
    }

  };

  ////////////////////////////////////////////////////////
  // APPROVE PAYMENT
  ////////////////////////////////////////////////////////

  const approvePayment = async (orderId) => {

    try {

      setProcessing(orderId);

      const res = await api.put(
        `/payments/admin/payments/${orderId}/verify`
      );

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

  ////////////////////////////////////////////////////////
  // REJECT PAYMENT
  ////////////////////////////////////////////////////////

  const rejectPayment = async (orderId) => {

    try {

      setProcessing(orderId);

      const res = await api.put(
        `/payments/admin/payments/${orderId}/reject`
      );

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

  ////////////////////////////////////////////////////////
  // LOADING
  ////////////////////////////////////////////////////////

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (

    <Box p={3}>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >

        <Typography variant="h5" fontWeight="bold">
          💳 Payment Verification
        </Typography>

        <Button
          variant="outlined"
          onClick={fetchPayments}
        >
          Refresh
        </Button>

      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>

        <Table>

          <TableHead>
            <TableRow sx={{ background: "#f5f5f5" }}>
              <TableCell><strong>Tenant</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>PG</strong></TableCell>
              <TableCell><strong>Owner</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Order ID</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>

            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No pending payments
                </TableCell>
              </TableRow>
            )}

            {payments.map((p) => (

              <TableRow key={p.order_id} hover>

                <TableCell>{p.tenant_name || "-"}</TableCell>
                <TableCell>{p.phone || "-"}</TableCell>
                <TableCell>{p.pg_name || "-"}</TableCell>
                <TableCell>{p.owner_id || "-"}</TableCell>

                <TableCell>₹{p.amount}</TableCell>

                <TableCell sx={{ fontFamily: "monospace" }}>
                  {p.order_id}
                </TableCell>

                <TableCell>

                  <Chip
                    label={p.status}
                    color={
                      p.status === "submitted"
                        ? "warning"
                        : p.status === "paid"
                        ? "success"
                        : p.status === "rejected"
                        ? "error"
                        : "default"
                    }
                    size="small"
                  />

                </TableCell>

                <TableCell align="center">

                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    disabled={
                      processing === p.order_id ||
                      p.status === "paid"
                    }
                    onClick={() => approvePayment(p.order_id)}
                    sx={{ mr: 1 }}
                  >
                    {processing === p.order_id
                      ? <CircularProgress size={18} color="inherit" />
                      : "Approve"}
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    disabled={
                      processing === p.order_id ||
                      p.status === "rejected"
                    }
                    onClick={() => rejectPayment(p.order_id)}
                  >
                    Reject
                  </Button>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>

  );

};

export default AdminPayments;