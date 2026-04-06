import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/api"; // ✅ Using your centralized API instance
import { useAuth } from "../../context/AuthContext"; // ✅ Added AuthContext
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Avatar,
  useTheme,
  Skeleton
} from "@mui/material";

import {
  CheckCircleOutline,
  Person,
  ReceiptLong,
  ContentCopy,
  Home
} from "@mui/icons-material";

import { styled } from "@mui/material/styles";

/* ================= STYLES ================= */

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
}));

const StyledTableCell = styled(TableCell)(() => ({
  fontWeight: 600
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
  color: "white",
  borderRadius: theme.spacing(1.5),
  textTransform: "none",
  fontWeight: "bold",
  "&:hover": { transform: "translateY(-2px)" },
  "&:disabled": { background: "#ccc" }
}));

export default function AdminSettlements() {
  const theme = useTheme();

  // ✅ 1. Get Auth State
  const { user, role, loading: authLoading } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  /* ================= FETCH SETTLEMENTS ================= */

  const fetchSettlements = useCallback(async () => {
    // Only fetch if authenticated and admin
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);
      // Path adjusted to match your API structure
      const res = await api.get("/admin/settlements/pending-settlements");
      setData(res.data.data || []);
      setError("");
    } catch (err) {
      console.error("Settlement fetch error:", err);
      setError("Failed to load settlements");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  /* ================= MARK SETTLED ================= */

  const markSettled = async (bookingId) => {
    if (!window.confirm("Confirm settlement payment to owner?")) return;

    try {
      setProcessingId(bookingId);

      await api.put(`/admin/settlements/mark-settled/${bookingId}`);
      
      alert("Settlement marked as successful");
      fetchSettlements();
    } catch (err) {
      console.error(err);
      alert("Settlement update failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= HELPERS ================= */

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  /* ================= ROUTE PROTECTION ================= */

  if (authLoading) {
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Verifying Admin Access...</Typography>
      </Container>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Skeleton height={80} width="40%" />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  /* ================= UI ================= */

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight="800" mb={3} color="primary">
        💰 Owner Settlements
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <StyledCard>
        {data.length === 0 ? (
          <CardContent sx={{ textAlign: "center", py: 10 }}>
            <CheckCircleOutline
              sx={{ fontSize: 80, color: theme.palette.success.main, opacity: 0.5 }}
            />
            <Typography variant="h6" mt={2} color="textSecondary">
              No pending settlements
            </Typography>
          </CardContent>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <StyledTableCell>Booking</StyledTableCell>
                  <StyledTableCell>Owner Info</StyledTableCell>
                  <StyledTableCell>PG / Property</StyledTableCell>
                  <StyledTableCell>Owner Share</StyledTableCell>
                  <StyledTableCell>Bank Details</StyledTableCell>
                  <StyledTableCell align="center">Action</StyledTableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.booking_id} hover>
                    {/* Booking */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: "#eef2ff", color: "#4f46e5" }}>
                          <ReceiptLong fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
  #{item.booking_id}
</Typography>

<Typography variant="caption" color="textSecondary">
  {item.order_id}
</Typography>
                      </Box>
                    </TableCell>

                    {/* Owner */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: "#e6f4ea", color: "#2e7d32" }}>
                          <Person fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {item.owner_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.owner_phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* PG */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: "#fff4e5", color: "#ed6c02" }}>
                          <Home fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {item.pg_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.area}, {item.city}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <Typography fontWeight="bold" color="success.main">
                        ₹{Number(item.owner_amount).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Bank */}
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        {item.account_holder_name}
                      </Typography>
                      <Box display="flex" gap={1} mb={0.5}>
                        <Chip
                          label={item.account_number}
                          size="small"
                          onDelete={() => copyToClipboard(item.account_number)}
                          deleteIcon={<ContentCopy sx={{ fontSize: "12px !important" }} />}
                          sx={{ fontSize: 11 }}
                        />
                        <Chip
                          label={item.ifsc}
                          size="small"
                          onDelete={() => copyToClipboard(item.ifsc)}
                          deleteIcon={<ContentCopy sx={{ fontSize: "12px !important" }} />}
                          sx={{ fontSize: 11 }}
                        />
                      </Box>
                      <Typography variant="caption" display="block">
                        {item.bank_name}
                      </Typography>
                    </TableCell>

                    {/* Action */}
                    <TableCell align="center">
                      <GradientButton
                        disabled={processingId === item.booking_id}
                        onClick={() => markSettled(item.booking_id)}
                      >
                        {processingId === item.booking_id ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Mark Settled"
                        )}
                      </GradientButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledCard>
    </Container>
  );
}