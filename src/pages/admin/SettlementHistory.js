import React, { useEffect, useState } from "react";
import axios from "axios";
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
} from "@mui/material";

import {
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
} from "@mui/icons-material";

/* ================= BACKEND API ================= */

const API = "https://nepxall-backend.onrender.com/api/admin/settlements";

export default function SettlementHistory() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const theme = useTheme();

  //////////////////////////////////////////////////////
  // FETCH HISTORY
  //////////////////////////////////////////////////////

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        `${API}/settlement-history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setData(res.data.data || []);
      setError(null);

    } catch (err) {

      console.error(err);
      setError("Failed to load settlement history");

    } finally {

      setLoading(false);

    }

  };

  //////////////////////////////////////////////////////
  // HELPERS
  //////////////////////////////////////////////////////

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
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  };

  //////////////////////////////////////////////////////
  // CALCULATIONS
  //////////////////////////////////////////////////////

  const totalAmount = data.reduce(
    (sum, item) => sum + (Number(item.owner_amount) || 0),
    0
  );

  const averageAmount =
    data.length > 0 ? Math.round(totalAmount / data.length) : 0;

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: "center" }} color="text.secondary">
            Loading settlement history...
          </Typography>
        </Paper>
      </Container>
    );
  }

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (

    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* Header */}

      <Box sx={{ mb: 4 }}>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
            <HistoryIcon />
          </Avatar>

          <Box>

            <Typography variant="h4" fontWeight="600">
              Settlement History
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">
              Track completed owner settlements
            </Typography>

          </Box>

        </Box>

      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* STAT CARDS */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: 3,
          mb: 4
        }}
      >

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            color: "white"
          }}
        >
          <Typography variant="subtitle2">Total Settlements</Typography>
          <Typography variant="h4">{data.length}</Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg,#f093fb,#f5576c)",
            color: "white"
          }}
        >
          <Typography variant="subtitle2">Total Amount Settled</Typography>
          <Typography variant="h4">
            ₹{totalAmount.toLocaleString("en-IN")}
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg,#4facfe,#00f2fe)",
            color: "white"
          }}
        >
          <Typography variant="subtitle2">Average Settlement</Typography>
          <Typography variant="h4">
            ₹{averageAmount.toLocaleString("en-IN")}
          </Typography>
        </Paper>

      </Box>

      {/* TABLE */}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>

        <Table>

          <TableHead>

            <TableRow sx={{ bgcolor: theme.palette.primary.main }}>

              <TableCell sx={{ color: "white", fontWeight: 600 }}>
                Booking
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: 600 }}>
                Owner
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: 600 }}>
                PG
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: 600 }}>
                Amount
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: 600 }}>
                Date
              </TableCell>

              <TableCell sx={{ color: "white", fontWeight: 600 }}>
                Status
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {data.length === 0 ? (

              <TableRow>

                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>

                  <AccountBalanceIcon
                    sx={{ fontSize: 48, color: "text.disabled" }}
                  />

                  <Typography>No Settlement History</Typography>

                </TableCell>

              </TableRow>

            ) : (

              data.map((item) => (

                <TableRow key={item.booking_id} hover>

                  <TableCell>

                    <Chip
                      label={`#${item.booking_id}`}
                      size="small"
                      sx={{
                        bgcolor: theme.palette.primary.light,
                        color: "white"
                      }}
                    />

                  </TableCell>

                  <TableCell>

                    <Box display="flex" alignItems="center" gap={1}>

                      <Avatar
                        sx={{
                          bgcolor: theme.palette.secondary.main,
                          width: 32,
                          height: 32,
                          fontSize: "0.8rem"
                        }}
                      >
                        {getInitials(item.owner_name)}
                      </Avatar>

                      <Box>

                        <Typography fontWeight="500">
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

                      <HomeIcon sx={{ fontSize: 18 }} />

                      <Typography>
                        {item.pg_name}
                      </Typography>

                    </Box>

                  </TableCell>

                  <TableCell>

                    <Typography
                      fontWeight="600"
                      sx={{ color: theme.palette.success.main }}
                    >
                      ₹{Number(item.owner_amount).toLocaleString("en-IN")}
                    </Typography>

                  </TableCell>

                  <TableCell>

                    <Box display="flex" alignItems="center" gap={1}>

                      <CalendarIcon sx={{ fontSize: 16 }} />

                      <Typography variant="body2">
                        {formatDate(item.settlement_date)}
                      </Typography>

                    </Box>

                  </TableCell>

                  <TableCell>

                    <Chip
                      label="Completed"
                      size="small"
                      sx={{
                        bgcolor: theme.palette.success.light,
                        color: theme.palette.success.dark
                      }}
                    />

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