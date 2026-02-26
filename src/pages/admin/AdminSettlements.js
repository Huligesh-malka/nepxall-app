import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  Paper,
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
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Skeleton
} from "@mui/material";
import {
  CheckCircleOutline,
  AccountBalance,
  Person,
  ReceiptLong,
  WarningAmber,
  Refresh,
  ContentCopy,
  Visibility
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const API = "http://localhost:5000/api/payments";

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  overflow: 'hidden'
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: 8,
    height: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: 4,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const BankDetailsChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  '& .MuiChip-label': {
    fontWeight: 500,
    fontSize: '0.75rem'
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
  border: 0,
  borderRadius: theme.spacing(1.5),
  boxShadow: `0 3px 10px ${alpha(theme.palette.success.main, 0.3)}`,
  color: 'white',
  padding: theme.spacing(0.8, 2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 5px 15px ${alpha(theme.palette.success.main, 0.4)}`,
  },
  '&:disabled': {
    background: theme.palette.grey[400],
    boxShadow: 'none',
  }
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  color: 'white',
  borderRadius: theme.spacing(2),
  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
}));

export default function AdminSettlements() {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/admin/pending-settlements`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setData(res.data.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load settlements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const markSettled = async (bookingId) => {
    if (!window.confirm("Are you sure you want to mark this settlement as completed?")) return;

    try {
      setProcessingId(bookingId);
      await axios.put(
        `${API}/admin/mark-settled/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSettlements();
    } catch (err) {
      console.error(err);
      alert("Settlement failed. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" height={400} sx={{ mt: 2, borderRadius: 2 }} />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <HeaderPaper elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              💰 Pending Settlements
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Review and process owner payouts
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={fetchSettlements} 
              sx={{ 
                color: 'white',
                '&:hover': { backgroundColor: alpha('#fff', 0.1) }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Chip 
            icon={<ReceiptLong />} 
            label={`${data.length} Pending Settlements`}
            sx={{ backgroundColor: alpha('#fff', 0.2), color: 'white' }}
          />
          <Chip 
            icon={<AccountBalance />} 
            label={`Total: ₹${data.reduce((sum, item) => sum + Number(item.owner_amount), 0).toLocaleString()}`}
            sx={{ backgroundColor: alpha('#fff', 0.2), color: 'white' }}
          />
        </Box>
      </HeaderPaper>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<WarningAmber />}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <StyledCard>
        {data.length === 0 ? (
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircleOutline sx={{ fontSize: 60, color: theme.palette.success.light, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              All Caught Up!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No pending settlements at the moment
            </Typography>
          </CardContent>
        ) : (
          <StyledTableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Booking Details</StyledTableCell>
                  <StyledTableCell>Owner Info</StyledTableCell>
                  <StyledTableCell align="right">Amount</StyledTableCell>
                  <StyledTableCell>Bank Details</StyledTableCell>
                  <StyledTableCell align="center">Action</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={item.booking_id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      },
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    {/* Booking Details */}
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            width: 32,
                            height: 32
                          }}
                        >
                          <ReceiptLong sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            #{item.booking_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Booking ID
                          </Typography>
                        </Box>
                      </Box>
                    </StyledTableCell>

                    {/* Owner Info */}
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            width: 32,
                            height: 32
                          }}
                        >
                          <Person sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight="500">
                          {item.owner_name}
                        </Typography>
                      </Box>
                    </StyledTableCell>

                    {/* Amount */}
                    <StyledTableCell align="right">
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        ₹{Number(item.owner_amount).toLocaleString()}
                      </Typography>
                    </StyledTableCell>

                    {/* Bank Details */}
                    <StyledTableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {item.account_holder_name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                          <BankDetailsChip
                            label={`A/C: ${item.account_number}`}
                            size="small"
                            deleteIcon={<ContentCopy />}
                            onDelete={() => copyToClipboard(item.account_number, 'Account number')}
                          />
                          <BankDetailsChip
                            label={`IFSC: ${item.ifsc}`}
                            size="small"
                            deleteIcon={<ContentCopy />}
                            onDelete={() => copyToClipboard(item.ifsc, 'IFSC code')}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {item.bank_name} • {item.branch}
                        </Typography>
                      </Box>
                    </StyledTableCell>

                    {/* Action */}
                    <StyledTableCell align="center">
                      <GradientButton
                        variant="contained"
                        disabled={processingId === item.booking_id}
                        onClick={() => markSettled(item.booking_id)}
                        startIcon={processingId === item.booking_id ? 
                          <CircularProgress size={16} color="inherit" /> : 
                          <CheckCircleOutline />
                        }
                      >
                        {processingId === item.booking_id ? "Processing..." : "Mark Settled"}
                      </GradientButton>
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}
      </StyledCard>

      {/* Summary Footer */}
      {data.length > 0 && (
        <Paper 
          sx={{ 
            mt: 2, 
            p: 2, 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            Showing {data.length} pending {data.length === 1 ? 'settlement' : 'settlements'}
          </Typography>
        </Paper>
      )}
    </Container>
  );
}