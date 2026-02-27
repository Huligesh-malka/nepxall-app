import React, { useEffect, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";
import { formatDistanceToNow } from "date-fns";

/* MUI */
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Button,
  Stack,
  Tooltip,
  Badge
} from "@mui/material";

/* Icons */
import {
  NotificationsActive as NotificationsIcon,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Refresh,
  DeleteOutline,
  DoneAll,
  Schedule
} from "@mui/icons-material";

/* ================= CONFIG ================= */

const typeConfig = {
  pg_added: { color: "warning", icon: Info, label: "SUBMITTED", bg: "#fff3e0" },
  pg_approved: { color: "success", icon: CheckCircle, label: "APPROVED", bg: "#e8f5e9" },
  pg_rejected: { color: "error", icon: ErrorIcon, label: "REJECTED", bg: "#ffebee" },
  // Add default for other types
  default: { color: "info", icon: Info, label: "INFO", bg: "#e3f2fd" }
};

export default function OwnerNotifications() {
  const [uid, setUid] = useState(null);
  const [mysqlId, setMysqlId] = useState(null); // ✅ Track MySQL ID
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /* ================= AUTH & USER MAPPING ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        setError(null);
        
        // ✅ Fetch MySQL ID for this user
        try {
          const response = await api.get(`/users/firebase/${user.uid}`);
          if (response.data?.success && response.data?.data?.id) {
            setMysqlId(response.data.data.id);
            console.log("✅ Got MySQL ID:", response.data.data.id);
          } else {
            console.error("Failed to get MySQL ID for user");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setUid(null);
        setMysqlId(null);
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  /* ================= FETCH NOTIFICATIONS ================= */
  const fetchNotifications = useCallback(async () => {
    // ✅ Try both UID and MySQL ID
    const userId = mysqlId || uid;
    
    if (!userId) {
      console.log("No user ID available yet");
      return;
    }

    try {
      setRefreshing(true);
      setError(null);

      console.log("Fetching notifications for user:", userId);
      
      // ✅ Use the correct endpoint - notifications are stored with user_id (MySQL ID)
      const res = await api.get(`/notifications/user/${userId}`);

      console.log("Notifications response:", res.data);

      if (res.data?.success) {
        setNotifications(res.data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
      
      // Try fallback with UID if MySQL ID failed
      if (mysqlId && uid && err.response?.status === 404) {
        console.log("Trying fallback with UID...");
        try {
          const fallbackRes = await api.get(`/notifications/user/${uid}`);
          if (fallbackRes.data?.success) {
            setNotifications(fallbackRes.data.data || []);
            setError(null);
          }
        } catch (fallbackErr) {
          console.error("Fallback also failed:", fallbackErr);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid, mysqlId]);

  useEffect(() => {
    if (uid || mysqlId) {
      fetchNotifications();
    }
  }, [uid, mysqlId, fetchNotifications]);

  /* ================= ACTIONS ================= */

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    // ✅ Use MySQL ID for marking all as read
    const userId = mysqlId || uid;
    
    if (!userId) return;

    try {
      await api.post(`/notifications/mark-all-read`, { user_id: userId });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const formatTime = (time) => {
    try {
      if (!time) return "recently";
      return formatDistanceToNow(new Date(time), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  /* ================= STATES ================= */

  if (loading) {
    return (
      <Box sx={centerBox}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading notifications...</Typography>
      </Box>
    );
  }

  if (!uid) {
    return (
      <Alert severity="warning" sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        Please login to view notifications
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button onClick={fetchNotifications} startIcon={<Refresh />} color="inherit">
            Retry
          </Button>
        }
        sx={{ maxWidth: 800, mx: "auto", mt: 4 }}
      >
        {error}
      </Alert>
    );
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  /* ================= UI ================= */

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      {/* HEADER */}
      <Paper elevation={3} sx={headerStyle}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Badge badgeContent={unread} color="error">
            <NotificationsIcon sx={{ fontSize: 32 }} />
          </Badge>

          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold">
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Stay updated about your PG
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchNotifications} sx={{ color: "#fff" }} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>

          {unread > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton onClick={markAllAsRead} sx={{ color: "#fff" }}>
                <DoneAll />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Paper>

      {/* LIST */}
      {notifications.length === 0 ? (
        <Paper elevation={1} sx={emptyStyle}>
          <NotificationsIcon sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notifications yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            When you receive notifications about your PG, they'll appear here
          </Typography>
        </Paper>
      ) : (
        <List sx={{ bgcolor: "transparent" }}>
          {notifications.map((n, i) => {
            const config = typeConfig[n.type] || typeConfig.default;
            const Icon = config.icon;

            return (
              <React.Fragment key={n.id}>
                {i > 0 && <Divider sx={{ my: 1 }} />}

                <Paper 
                  elevation={n.is_read ? 0 : 2} 
                  sx={{ 
                    p: 2, 
                    bgcolor: n.is_read ? "#fff" : config.bg,
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: n.is_read ? "#f5f5f5" : config.bg,
                    }
                  }}
                >
                  <ListItem
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        {!n.is_read && (
                          <Tooltip title="Mark as read">
                            <IconButton 
                              edge="end" 
                              onClick={() => markAsRead(n.id)}
                              size="small"
                            >
                              <DoneAll fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton 
                            edge="end" 
                            onClick={() => deleteNotification(n.id)}
                            size="small"
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                    disablePadding
                  >
                    <Box sx={{ display: "flex", gap: 2, width: "100%", pr: 8 }}>
                      <Icon color={config.color} sx={{ mt: 0.5 }} />

                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight={!n.is_read ? "bold" : "normal"}
                            >
                              {n.title}
                            </Typography>

                            <Chip
                              label={config.label}
                              size="small"
                              color={config.color}
                              variant={n.is_read ? "outlined" : "filled"}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {n.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                              {formatTime(n.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </ListItem>
                </Paper>
              </React.Fragment>
            );
          })}
        </List>
      )}

      {/* FOOTER */}
      {notifications.length > 0 && (
        <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""} • 
            <Box component="span" sx={{ fontWeight: "bold", mx: 0.5 }}>
              {unread}
            </Box> 
            unread
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

/* ================= STYLES ================= */

const centerBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 400,
  gap: 2,
  maxWidth: 800,
  mx: "auto",
  p: 3
};

const headerStyle = {
  p: 3,
  mb: 3,
  bgcolor: "primary.main",
  color: "#fff",
  borderRadius: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const emptyStyle = {
  p: 6,
  textAlign: "center",
  bgcolor: "grey.50",
  borderRadius: 2
};