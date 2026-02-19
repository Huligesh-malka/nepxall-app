// src/components/owner/OccupancyCard.js
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  alpha,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  MeetingRoom as RoomsIcon,
  Person as TenantIcon,
  Warning as WarningIcon,
  CheckCircle as AvailableIcon,
  Hotel as OccupiedIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon
} from '@mui/icons-material';

const OccupancyCard = ({ totalRooms = 0, availableRooms = 0 }) => {
  const theme = useTheme();
  
  const occupiedRooms = totalRooms - availableRooms;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  
  // Determine status color and message
  const getOccupancyStatus = () => {
    if (occupancyRate >= 90) return { color: 'success', message: 'High Occupancy', icon: <TrendUpIcon /> };
    if (occupancyRate >= 70) return { color: 'info', message: 'Good Occupancy', icon: <TrendUpIcon /> };
    if (occupancyRate >= 50) return { color: 'warning', message: 'Moderate Occupancy', icon: <TrendUpIcon /> };
    return { color: 'error', message: 'Low Occupancy', icon: <TrendDownIcon /> };
  };

  const status = getOccupancyStatus();

  // Calculate room distribution
  const roomDistribution = [
    { 
      label: 'Occupied', 
      value: occupiedRooms, 
      color: theme.palette.primary.main,
      icon: <OccupiedIcon />
    },
    { 
      label: 'Available', 
      value: availableRooms, 
      color: theme.palette.success.main,
      icon: <AvailableIcon />
    }
  ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        bgcolor: 'background.paper'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Room Occupancy
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Current status of your rooms
            </Typography>
          </Box>
          <Chip
            icon={status.icon}
            label={status.message}
            color={status.color}
            size="small"
            sx={{ 
              fontWeight: 500,
              bgcolor: alpha(theme.palette[status.color].main, 0.1),
              color: theme.palette[status.color].main,
              border: 'none'
            }}
          />
        </Box>

        {/* Main Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderRadius: 2,
                textAlign: 'center',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.1)
              }}
            >
              <RoomsIcon sx={{ color: theme.palette.primary.main, fontSize: 28, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {totalRooms}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Total Rooms
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.04),
                borderRadius: 2,
                textAlign: 'center',
                border: '1px solid',
                borderColor: alpha(theme.palette.success.main, 0.1)
              }}
            >
              <TenantIcon sx={{ color: theme.palette.success.main, fontSize: 28, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {occupiedRooms}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Occupied Rooms
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Occupancy Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Occupancy Rate
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette[status.color].main }}>
              {occupancyRate.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={occupancyRate}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: alpha(theme.palette[status.color].main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: theme.palette[status.color].main,
                borderRadius: 5
              }
            }}
          />
        </Box>

        {/* Room Distribution */}
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Room Distribution
          </Typography>
          <Grid container spacing={1}>
            {roomDistribution.map((item, index) => (
              <Grid item xs={6} key={index}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: alpha(item.color, 0.04),
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(item.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ color: item.color }}>{item.icon}</Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: item.color }}>
                      {item.value} rooms
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Warning for low availability */}
        {availableRooms <= 2 && availableRooms > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: alpha(theme.palette.warning.main, 0.04),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.warning.main, 0.2),
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: theme.palette.warning.main }}>
              Only {availableRooms} {availableRooms === 1 ? 'room' : 'rooms'} left!
            </Typography>
          </Box>
        )}

        {/* Fully booked message */}
        {availableRooms === 0 && totalRooms > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: alpha(theme.palette.success.main, 0.04),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.2),
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AvailableIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
              All rooms are occupied!
            </Typography>
          </Box>
        )}

        {/* No rooms message */}
        {totalRooms === 0 && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: alpha(theme.palette.info.main, 0.04),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.2),
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <RoomsIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: theme.palette.info.main }}>
              Add rooms to your property to start tracking occupancy
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default OccupancyCard;