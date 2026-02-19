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
  pg_rejected: { color: "error", icon: ErrorIcon, label: "REJECTED", bg: "#ffebee" }
};

export default function OwnerNotifications() {
  const [uid, setUid] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setError(null);
      } else {
        setUid(null);
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  /* ================= FETCH ================= */
  const fetchNotifications = useCallback(async () => {
    if (!uid) return;

    try {
      setRefreshing(true);
      setError(null);

      const res = await api.get(`/notifications/${uid}`);

      if (res.data?.success) {
        setNotifications(res.data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ================= ACTIONS ================= */

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.post(`/notifications/mark-all-read`, { user_id: uid });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {}
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  const formatTime = (time) => {
    try {
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
        <Typography>Loading notifications...</Typography>
      </Box>
    );
  }

  if (!uid) {
    return (
      <Alert severity="warning">
        Please login to view notifications
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button onClick={fetchNotifications} startIcon={<Refresh />}>
            Retry
          </Button>
        }
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
      <Paper sx={headerStyle}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Badge badgeContent={unread} color="error">
            <NotificationsIcon sx={{ fontSize: 32 }} />
          </Badge>

          <Box>
            <Typography variant="h5">Notifications</Typography>
            <Typography variant="body2">
              Stay updated about your PG
            </Typography>
          </Box>
        </Box>

        <Stack direction="row">
          <IconButton onClick={fetchNotifications} sx={{ color: "#fff" }}>
            <Refresh />
          </IconButton>

          {unread > 0 && (
            <IconButton onClick={markAllAsRead} sx={{ color: "#fff" }}>
              <DoneAll />
            </IconButton>
          )}
        </Stack>
      </Paper>

      {/* LIST */}
      {notifications.length === 0 ? (
        <Paper sx={emptyStyle}>
          <NotificationsIcon sx={{ fontSize: 60, color: "grey.400" }} />
          <Typography>No notifications yet</Typography>
        </Paper>
      ) : (
        <List>
          {notifications.map((n, i) => {
            const config = typeConfig[n.type] || typeConfig.pg_added;
            const Icon = config.icon;

            return (
              <React.Fragment key={n.id}>
                {i > 0 && <Divider />}

                <Paper sx={{ p: 2, bgcolor: n.is_read ? "#fff" : config.bg }}>
                  <ListItem
                    secondaryAction={
                      <Stack direction="row">
                        {!n.is_read && (
                          <IconButton onClick={() => markAsRead(n.id)}>
                            <DoneAll fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton onClick={() => deleteNotification(n.id)}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Icon color={config.color} />

                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Typography fontWeight={!n.is_read && "bold"}>
                              {n.title}
                            </Typography>

                            <Chip
                              label={config.label}
                              size="small"
                              color={config.color}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography>{n.message}</Typography>
                            <Typography variant="caption">
                              {formatTime(n.created_at)}
                            </Typography>
                          </>
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
        <Typography align="center" sx={{ mt: 2 }}>
          {notifications.length} notifications • {unread} unread
        </Typography>
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
  gap: 2
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
  bgcolor: "grey.50"
};
