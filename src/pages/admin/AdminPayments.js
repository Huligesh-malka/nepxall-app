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
  Stack
} from "@mui/material";

const AdminPayments = () => {

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {

    try {

      setLoading(true);
      setError("");

      const res = await api.get("/admin/payments");

      if (res.data.success) {
        setPayments(res.data.data);
      }

    } catch (err) {

      console.error(err);
      setError("Failed to load payments");

    }

    setLoading(false);
  };

  const approvePayment = async (orderId) => {

    try {

      setProcessing(orderId);

      await api.put(`/admin/payments/${orderId}/verify`);

      fetchPayments();

    } catch (err) {

      console.log(err);
      alert("Approval failed");

    }

    setProcessing(null);
  };

  const rejectPayment = async (orderId) => {

    try {

      setProcessing(orderId);

      await api.put(`/admin/payments/${orderId}/reject`);

      fetchPayments();

    } catch (err) {

      console.log(err);
      alert("Reject failed");

    }

    setProcessing(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
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
        <Typography variant="h5">
          User Payment Verification
        </Typography>

        <Button
          variant="outlined"
          onClick={fetchPayments}
        >
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell>Tenant</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>PG</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>UTR</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Action</TableCell>

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

              <TableRow key={p.order_id}>

                <TableCell>{p.tenant_name}</TableCell>

                <TableCell>{p.phone}</TableCell>

                <TableCell>{p.pg_name}</TableCell>

                <TableCell>₹{p.amount}</TableCell>

                <TableCell>{p.utr || "N/A"}</TableCell>

                <TableCell>{p.order_id}</TableCell>

                <TableCell>

                  <Chip
                    label={p.status}
                    color="warning"
                    size="small"
                  />

                </TableCell>

                <TableCell align="center">

                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    disabled={processing === p.order_id}
                    onClick={() => approvePayment(p.order_id)}
                    sx={{ mr: 1 }}
                  >
                    Approve
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    disabled={processing === p.order_id}
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

    </Box>

  );

};

export default AdminPayments;