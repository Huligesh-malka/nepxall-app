import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/api"; 
import { useAuth } from "../../context/AuthContext";
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
  Home,
  Verified
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

const ApproveButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
  color: "white",
  borderRadius: theme.spacing(1.5),
  textTransform: "none",
  fontWeight: "bold",
  padding: "6px 16px",
  "&:hover": { transform: "translateY(-2px)", boxShadow: theme.shadows[4] },
  "&:disabled": { background: "#ccc" }
}));

export default function AdminSettlements() {
  const theme = useTheme();
  const { user, role, loading: authLoading } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  /* ================= FETCH SETTLEMENTS ================= */

  const fetchSettlements = useCallback(async () => {
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);
      // Fetching all pending approvals for the admin
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

  /* ================= APPROVE SETTLEMENT ================= */

  const approveSettlement = async (bookingId) => {
    if (!window.confirm("Confirm Admin Approval? This will allow the owner to mark the payment as received.")) return;

    try {
      setProcessingId(bookingId);
      // Backend should now update admin_settlement = 'DONE'
      await api.put(`/admin/settlements/mark-settled/${bookingId}`);
      
      alert("Settlement approved successfully!");
      fetchSettlements();
    } catch (err) {
      console.error(err);
      alert("Approval failed. Please check backend logic.");
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= HELPERS ================= */

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight="800" mb={3} color="primary">
        ⚖️ Settlement Approvals
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
              No settlements awaiting approval
            </Typography>
          </CardContent>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                <TableRow>
                  <StyledTableCell>Booking & Order</StyledTableCell>
                  <StyledTableCell>Owner Info</StyledTableCell>
                  <StyledTableCell>Property</StyledTableCell>
                  <StyledTableCell>Payable Amount</StyledTableCell>
                  <StyledTableCell>Bank Details</StyledTableCell>
                  <StyledTableCell align="center">Admin Action</StyledTableCell>
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
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            #{item.booking_id}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {item.order_id}
                          </Typography>
                        </Box>
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
                            {item.area}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <Typography fontWeight="800" color="primary.main">
                        ₹{Number(item.owner_amount).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Bank */}
                    <TableCell>
                      <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                        {item.account_holder_name}
                      </Typography>
                      <Box display="flex" gap={0.5} mb={0.5}>
                        <Chip
                          label={item.account_number}
                          size="small"
                          variant="outlined"
                          onDelete={() => copyToClipboard(item.account_number)}
                          deleteIcon={<ContentCopy sx={{ fontSize: "10px !important" }} />}
                          sx={{ fontSize: 10, height: 20 }}
                        />
                        <Chip
                          label={item.ifsc}
                          size="small"
                          variant="outlined"
                          onDelete={() => copyToClipboard(item.ifsc)}
                          deleteIcon={<ContentCopy sx={{ fontSize: "10px !important" }} />}
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      </Box>
                    </TableCell>

                    {/* Action - UPDATED LOGIC */}
                    <TableCell align="center">
                      {item.admin_settlement === "DONE" ? (
                        <Chip
                          icon={<Verified />}
                          label="Approved"
                          color="success"
                          variant="filled"
                          size="small"
                        />
                      ) : (
                        <ApproveButton
                          disabled={processingId === item.booking_id}
                          onClick={() => approveSettlement(item.booking_id)}
                        >
                          {processingId === item.booking_id ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            "Approve Settlement"
                          )}
                        </ApproveButton>
                      )}
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