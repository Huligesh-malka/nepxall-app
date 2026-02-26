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
} from "@mui/icons-material";

const API = "http://localhost:5000/api/payments";

export default function SettlementHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const theme = useTheme();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/settlement-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to load settlement history");
      console.error("Error fetching settlement history:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }} color="textSecondary">
            Loading settlement history...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="600">
              Settlement History
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Track all completed owner settlements
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
            Total Settlements
          </Typography>
          <Typography variant="h4" fontWeight="600">
            {data.length}
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
            Total Amount Settled
          </Typography>
          <Typography variant="h4" fontWeight="600">
            ₹{data.reduce((sum, item) => sum + (item.owner_amount || 0), 0).toLocaleString('en-IN')}
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
            Average Settlement
          </Typography>
          <Typography variant="h4" fontWeight="600">
            ₹{data.length ? (data.reduce((sum, item) => sum + (item.owner_amount || 0), 0) / data.length).toFixed(0) : 0}
          </Typography>
        </Paper>
      </Box>

      {/* Table Section */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Booking ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Owner Details</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Settlement Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No Settlement History
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Settlements will appear here once processed
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow 
                  key={item.booking_id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      transition: 'background-color 0.2s'
                    },
                    animation: `fadeIn 0.3s ease-out ${index * 0.05}s`
                  }}
                >
                  <TableCell>
                    <Chip 
                      label={`#${item.booking_id}`}
                      size="small"
                      sx={{ 
                        bgcolor: theme.palette.primary.light,
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: theme.palette.secondary.main,
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem'
                        }}
                      >
                        {getInitials(item.owner_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {item.owner_name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="600"
                      sx={{ color: theme.palette.success.main }}
                    >
                      ₹{item.owner_amount?.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="textSecondary">
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
                        color: theme.palette.success.dark,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer Summary */}
      {data.length > 0 && (
        <Paper sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="textSecondary" align="right">
            Showing {data.length} settlement{data.length !== 1 ? 's' : ''} • Last updated: {formatDate(new Date())}
          </Typography>
        </Paper>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Container>
  );
}