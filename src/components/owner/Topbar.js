// src/components/owner/Topbar.jsx
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Avatar,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Button  // ✅ ADD THIS MISSING IMPORT
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const Topbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [userName, setUserName] = useState("Owner");
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || "Owner");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);

  const handleNotificationClick = (event) => setNotificationAnchor(event.currentTarget);
  const handleNotificationClose = () => setNotificationAnchor(null);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("role");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: "#ffffff",
        color: "#1e293b",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
        ml: "250px",
        width: "calc(100% - 250px)",
        borderBottom: "1px solid #e2e8f0"
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: "70px !important" }}>
        {/* Welcome Message */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#0f172a" }}>
            Welcome back, {userName} 👋
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Manage your properties and bookings
          </Typography>
        </Box>

        {/* Right Section */}
        <Box display="flex" alignItems="center" gap={2}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={handleNotificationClick} sx={{ color: "#475569" }}>
              <Badge badgeContent={notificationCount} color="error" max={9}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Messages */}
          <Tooltip title="Messages">
            <IconButton sx={{ color: "#475569" }}>
              <Badge badgeContent={2} color="primary">
                <MessageIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{ 
              ml: 1, 
              cursor: "pointer",
              py: 0.5,
              px: 1.5,
              borderRadius: 2,
              bgcolor: anchorEl ? "#f1f5f9" : "transparent",
              '&:hover': { bgcolor: "#f1f5f9" }
            }}
            onClick={handleProfileClick}
          >
            <Avatar
              sx={{
                bgcolor: "#0B5ED7",
                width: 40,
                height: 40,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Property Owner
              </Typography>
            </Box>
            <ArrowDownIcon fontSize="small" sx={{ color: "#64748b" }} />
          </Box>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
            }
          }}
        >
          <MenuItem onClick={() => { handleProfileClose(); navigate("/owner/profile"); }}>
            <PersonIcon sx={{ mr: 2, fontSize: 20, color: "#64748b" }} />
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { handleProfileClose(); navigate("/owner/settings"); }}>
            <SettingsIcon sx={{ mr: 2, fontSize: 20, color: "#64748b" }} />
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "#ef4444" }}>
            <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { 
              width: 360, 
              maxHeight: 480,
              mt: 1,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
            }
          }}
        >
          <Box sx={{ p: 2, bgcolor: "#0B5ED7", color: "#fff", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
            </Typography>
          </Box>
          <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
            <MenuItem sx={{ py: 2, borderBottom: "1px solid #e2e8f0" }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>New Booking Request</Typography>
                <Typography variant="caption" color="text.secondary">John Doe wants to book Genstay-2</Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>2 min ago</Typography>
              </Box>
            </MenuItem>
            <MenuItem sx={{ py: 2, borderBottom: "1px solid #e2e8f0" }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>PG Approved</Typography>
                <Typography variant="caption" color="text.secondary">Your property Genstay-2 is now live</Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>1 hour ago</Typography>
              </Box>
            </MenuItem>
            <MenuItem sx={{ py: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Payment Received</Typography>
                <Typography variant="caption" color="text.secondary">₹15,000 credited to your account</Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>5 hours ago</Typography>
              </Box>
            </MenuItem>
          </Box>
          <Box sx={{ p: 1.5, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <Button size="small" onClick={() => navigate("/owner/notifications")}>
              View All Notifications
            </Button>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;