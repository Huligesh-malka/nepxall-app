import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/api"; 
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Container,
  useTheme,
  IconButton,
  Tooltip
} from "@mui/material";

import {
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";

export default function SettlementHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, role, loading: authLoading } = useAuth();
  const theme = useTheme();

  /* ================= FETCH HISTORY ================= */

  const fetchHistory = useCallback(async () => {
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);
      const res = await api.get("/admin/settlements/settlement-history");
      setData(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch history error:", err);
      setError("Failed to load settlement history");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ================= HELPERS ================= */

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getInitials = (name) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /* ================= CALCULATIONS ================= */

  const stats = useMemo(() => {
    const total = data.reduce((sum, item) => sum + (Number(item.owner_amount) || 0), 0);
    const average = data.length > 0 ? Math.round(total / data.length) : 0;
    return { total, average };
  }, [data]);

  /* ================= ROUTE PROTECTION ================= */

  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: "center" }} color="text.secondary">
          Verifying Admin Access...
        </Typography>
      </Container>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  /* ================= UI ================= */

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56, boxShadow: 3 }}>
            <HistoryIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="700" color="text.primary">
              Settlement History
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Track and audit all completed owner payments
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh History">
          <IconButton onClick={fetchHistory} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* STAT CARDS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 3,
          mb: 4
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #4361ee, #3f37c9)",
            color: "white",
            boxShadow: "0 10px 20px rgba(63, 55, 201, 0.2)"
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Total Settlements</Typography>
          <Typography variant="h3" fontWeight="700">{data.length}</Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #2ec4b6, #0096c7)",
            color: "white",
            boxShadow: "0 10px 20px rgba(0, 150, 199, 0.2)"
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Total Amount Settled</Typography>
          <Typography variant="h3" fontWeight="700">
            ₹{stats.total.toLocaleString("en-IN")}
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #7209b7, #b5179e)",
            color: "white",
            boxShadow: "0 10px 20px rgba(181, 23, 158, 0.2)"
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Average Payout</Typography>
          <Typography variant="h3" fontWeight="700">
            ₹{stats.average.toLocaleString("en-IN")}
          </Typography>
        </Paper>
      </Box>

      {/* TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 4 }}>
        {loading && <LinearProgress color="secondary" />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Owner Details</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Property</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payout Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Settled On</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <AccountBalanceIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
                  <Typography variant="h6" color="text.disabled">
                    No payout history found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.booking_id} hover sx={{ transition: "0.2s" }}>
                  <TableCell>
                    <Box>
                      <Typography fontWeight="bold">
                        #{item.booking_id}
                      </Typography>
                      {item.order_id && (
                        <Typography variant="caption" color="textSecondary">
                          {item.order_id}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.light,
                          width: 36,
                          height: 36,
                          fontSize: "0.9rem",
                          fontWeight: "bold"
                        }}
                      >
                        {getInitials(item.owner_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {item.owner_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.owner_phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <HomeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2">{item.pg_name}</Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight="700" color="success.main">
                      ₹{Number(item.owner_amount).toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.primary">
                        {formatDate(item.settled_at)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    {item.owner_settlement === "DONE" ? (
                      <Chip
                        label="✅ Completed"
                        size="small"
                        sx={{
                          bgcolor: "#dcfce7",
                          color: "#166534",
                          fontWeight: "bold",
                          px: 1
                        }}
                      />
                    ) : (
                      <Chip
                        label="⏳ Awaiting"
                        size="small"
                        sx={{
                          bgcolor: "#fef3c7",
                          color: "#92400e",
                          fontWeight: "bold",
                          px: 1
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}