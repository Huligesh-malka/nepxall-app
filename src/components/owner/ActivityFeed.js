// src/components/owner/ActivityFeed.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  IconButton,
  Badge,
  Button,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Home as HomeIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ activities = [], loading = false, onRefresh }) => {
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [notifications, setNotifications] = useState({
    bookings: true,
    payments: true,
    approvals: true,
    maintenance: false
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return <HomeIcon sx={{ color: '#0B5ED7' }} />;
      case 'payment':
        return <PaymentIcon sx={{ color: '#10b981' }} />;
      case 'approval':
        return <VerifiedIcon sx={{ color: '#8b5cf6' }} />;
      case 'maintenance':
        return <WarningIcon sx={{ color: '#f59e0b' }} />;
      case 'review':
        return <StarIcon sx={{ color: '#fbbf24' }} />;
      case 'message':
        return <MessageIcon sx={{ color: '#64748b' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#64748b' }} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'booking': return '#0B5ED7';
      case 'payment': return '#10b981';
      case 'approval': return '#8b5cf6';
      case 'maintenance': return '#f59e0b';
      case 'review': return '#fbbf24';
      default: return '#64748b';
    }
  };

  // Sample activities if none provided
  const sampleActivities = [
    {
      id: 1,
      type: 'booking',
      title: 'New booking received for Sunshine PG',
      description: 'Room 204 - 2 seater | John Doe',
      time: new Date(Date.now() - 2 * 60000),
      status: 'pending',
      user: 'John Doe',
      amount: '₹12,000'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment received for Green Villa',
      description: 'Monthly rent - June 2024',
      time: new Date(Date.now() - 1 * 3600000),
      status: 'completed',
      user: 'Jane Smith',
      amount: '₹15,000'
    },
    {
      id: 3,
      type: 'approval',
      title: 'PG approved by admin',
      description: 'City Heights PG is now live',
      time: new Date(Date.now() - 3 * 3600000),
      status: 'success',
      user: 'Admin'
    },
    {
      id: 4,
      type: 'maintenance',
      title: 'Maintenance request #104',
      description: 'AC not working - Room 101',
      time: new Date(Date.now() - 5 * 3600000),
      status: 'urgent',
      user: 'Mike Wilson'
    },
    {
      id: 5,
      type: 'review',
      title: 'New 5-star review received',
      description: '"Excellent facilities and service"',
      time: new Date(Date.now() - 1 * 86400000),
      status: 'completed',
      user: 'Sarah Johnson'
    },
    {
      id: 6,
      type: 'booking',
      title: 'Booking confirmed for Cozy Nest',
      description: 'Room 105 - Single occupancy',
      time: new Date(Date.now() - 2 * 86400000),
      status: 'confirmed',
      user: 'Alex Brown',
      amount: '₹18,000'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : sampleActivities;

  const filteredActivities = displayActivities.filter(activity => {
    if (filterType === 'all') return true;
    return activity.type === filterType;
  });

  const unreadCount = filteredActivities.filter(a => a.status === 'pending' || a.status === 'urgent').length;

  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" size="small" color="warning" sx={{ height: 20, fontSize: '10px' }} />;
      case 'urgent':
        return <Chip label="Urgent" size="small" color="error" sx={{ height: 20, fontSize: '10px' }} />;
      case 'confirmed':
      case 'completed':
      case 'success':
        return <Chip label="Done" size="small" color="success" sx={{ height: 20, fontSize: '10px' }} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card sx={{ 
        borderRadius: 3, 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon sx={{ color: '#0B5ED7' }} />
                </Badge>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  Activity Feed
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={onRefresh}>
                    <RefreshIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Filter">
                  <IconButton 
                    size="small" 
                    onClick={(e) => setFilterAnchor(e.currentTarget)}
                  >
                    <MoreVertIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                    <SettingsIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Filter Chips */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {['all', 'booking', 'payment', 'approval', 'maintenance', 'review'].map((type) => (
                <Chip
                  key={type}
                  label={type === 'all' ? 'All' : type}
                  size="small"
                  onClick={() => setFilterType(type)}
                  sx={{ 
                    bgcolor: filterType === type ? '#0B5ED7' : '#f1f5f9',
                    color: filterType === type ? '#fff' : '#475569',
                    textTransform: 'capitalize',
                    '&:hover': { 
                      bgcolor: filterType === type ? '#0a4ab0' : '#e2e8f0'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Activity List */}
          <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
            <List sx={{ p: 0 }}>
              {filteredActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      p: 2,
                      bgcolor: activity.status === 'urgent' ? '#fee2e215' : 'transparent',
                      '&:hover': { bgcolor: '#f8fafc' },
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box 
                            sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%',
                              bgcolor: activity.status === 'urgent' ? '#ef4444' : 
                                      activity.status === 'pending' ? '#f59e0b' : '#10b981',
                              border: '2px solid white'
                            }} 
                          />
                        }
                      >
                        <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}15` }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#0f172a',
                              maxWidth: '70%'
                            }}
                          >
                            {activity.title}
                          </Typography>
                          {getStatusChip(activity.status)}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: '#64748b', display: 'block', mb: 0.5 }}
                          >
                            {activity.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {activity.user || 'System'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <ScheduleIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {formatTime(activity.time)}
                              </Typography>
                            </Box>
                            {activity.amount && (
                              <Typography variant="caption" sx={{ color: '#0B5ED7', fontWeight: 600 }}>
                                {activity.amount}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredActivities.length - 1 && (
                    <Divider variant="inset" component="li" sx={{ ml: 7 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Box>

          {/* Footer */}
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12
          }}>
            <Button 
              fullWidth 
              variant="text"
              endIcon={<CheckCircleIcon />}
              sx={{ 
                color: '#0B5ED7',
                textTransform: 'none',
                '&:hover': { bgcolor: '#e8f0fe' }
              }}
            >
              Mark all as read
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            mt: 1
          }
        }}
      >
        <MenuItem onClick={() => { setFilterType('all'); setFilterAnchor(null); }}>
          Show All Activities
        </MenuItem>
        <MenuItem onClick={() => { setFilterType('booking'); setFilterAnchor(null); }}>
          Show Bookings Only
        </MenuItem>
        <MenuItem onClick={() => { setFilterType('payment'); setFilterAnchor(null); }}>
          Show Payments Only
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setFilterAnchor(null)}>
          Clear Filters
        </MenuItem>
      </Menu>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #e2e8f0',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
            Notification Settings
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={notifications.bookings}
                onChange={(e) => setNotifications({...notifications, bookings: e.target.checked})}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0B5ED7',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#0B5ED7',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a' }}>
                  Booking Notifications
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Get alerts for new booking requests
                </Typography>
              </Box>
            }
            sx={{ width: '100%', mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch 
                checked={notifications.payments}
                onChange={(e) => setNotifications({...notifications, payments: e.target.checked})}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a' }}>
                  Payment Notifications
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Get alerts for payment receipts
                </Typography>
              </Box>
            }
            sx={{ width: '100%', mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch 
                checked={notifications.approvals}
                onChange={(e) => setNotifications({...notifications, approvals: e.target.checked})}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a' }}>
                  Approval Notifications
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Get alerts for PG approvals
                </Typography>
              </Box>
            }
            sx={{ width: '100%', mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch 
                checked={notifications.maintenance}
                onChange={(e) => setNotifications({...notifications, maintenance: e.target.checked})}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a' }}>
                  Maintenance Requests
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Get alerts for maintenance issues
                </Typography>
              </Box>
            }
            sx={{ width: '100%' }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button 
            onClick={() => setSettingsOpen(false)}
            sx={{ 
              color: '#64748b',
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => setSettingsOpen(false)}
            sx={{ 
              bgcolor: '#0B5ED7',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#0a4ab0' }
            }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ActivityFeed;