// src/components/owner/EarningsChart.js
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const EarningsChart = ({ data = [] }) => {
  const theme = useTheme();

  // Default data if none provided
  const chartData = data.length > 0 ? data : [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 0 },
    { month: 'Jul', amount: 0 },
    { month: 'Aug', amount: 0 },
    { month: 'Sep', amount: 0 },
    { month: 'Oct', amount: 0 },
    { month: 'Nov', amount: 0 },
    { month: 'Dec', amount: 0 }
  ];

  // Calculate total and average
  const totalEarnings = chartData.reduce((sum, item) => sum + item.amount, 0);
  const avgEarnings = chartData.length > 0 ? totalEarnings / chartData.length : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            ₹{payload[0].value.toLocaleString()}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        bgcolor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Earnings Overview
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Monthly earnings from your properties
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            p: 1,
            borderRadius: 2
          }}
        >
          <Box textAlign="right">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Total Earnings
            </Typography>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
              ₹{totalEarnings.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AttachMoneyIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
        </Box>
      </Box>

      {/* Chart */}
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
            <XAxis 
              dataKey="month" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickFormatter={(value) => `₹${value/1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="none" 
              fill="url(#colorAmount)" 
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{ 
                fill: theme.palette.primary.main,
                stroke: 'white',
                strokeWidth: 2,
                r: 4
              }}
              activeDot={{ 
                fill: theme.palette.primary.main,
                stroke: 'white',
                strokeWidth: 3,
                r: 6
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {/* Stats Footer */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6}>
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.success.main, 0.04),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.1)
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Average Monthly
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
              ₹{Math.round(avgEarnings).toLocaleString()}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.info.main, 0.04),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.1)
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Best Month
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
              ₹{Math.max(...chartData.map(d => d.amount)).toLocaleString()}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EarningsChart;