// src/pages/OwnerDashboard.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  Typography, Box, Button, Grid, Alert, Snackbar,
  CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Card, IconButton
} from "@mui/material";

import {
  Add as AddIcon,
  Apartment as ApartmentIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Groups as CommunityIcon
} from "@mui/icons-material";

import StatCard from "../components/owner/StatCard";
import PropertyCard from "../components/owner/PropertyCard";

const API = "http://localhost:5000/api/pg";
const BACKEND_URL = "http://localhost:5000";

/* ---------------- HELPERS ---------------- */

const parseArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

const formatCurrency = (amt) =>
  amt ? `₹${amt.toLocaleString()}` : "₹0";

/* ---------------- COMPONENT ---------------- */

const OwnerDashboard = () => {

  const navigate = useNavigate();

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalRooms: 0,
    availableRooms: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    pendingBookings: 0,
    avgRating: 0
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  /* 🔐 AUTH CHECK */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setAuthLoading(false);
        await loadAllData();
      }
    });

    return () => unsub();
  }, []);

  /* ---------------- LOAD DATA ---------------- */

  const loadAllData = useCallback(async (refresh = false) => {

    try {

      if (!auth.currentUser) return;

      refresh ? setRefreshing(true) : setLoading(true);

      const token = await auth.currentUser.getIdToken();

      /* -------- PG DATA -------- */

      const pgRes = await axios.get(`${API}/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const pgData = Array.isArray(pgRes.data)
        ? pgRes.data
        : pgRes.data?.data || [];

      const properties = pgData.map(pg => {
        const photos = parseArray(pg.photos);
        return {
          ...pg,
          photos,
          image: photos.length ? `${BACKEND_URL}${photos[0]}` : null
        };
      });

      setPGs(properties);

      /* -------- BOOKINGS -------- */

      const bookingsRes = await axios.get(
        `${BACKEND_URL}/api/owner/bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : [];

      const sortedBookings = bookings
        .sort(
          (a, b) =>
            new Date(b.created_at || b.check_in_date) -
            new Date(a.created_at || a.check_in_date)
        )
        .slice(0, 5);

      setRecentBookings(sortedBookings);

      /* -------- STATS -------- */

      const totalRooms = properties.reduce((a, b) => a + (b.total_rooms || 0), 0);
      const availableRooms = properties.reduce((a, b) => a + (b.available_rooms || 0), 0);

      const ratings = properties
        .filter(p => p.avg_rating > 0)
        .map(p => p.avg_rating);

      const avgRating = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;

      const totalEarnings = bookings
        .filter(b => ["confirmed", "completed"].includes(b.status))
        .reduce((a, b) => a + (b.amount || 0), 0);

      const currentMonth = new Date().getMonth();

      const monthlyEarnings = bookings
        .filter(b => {
          const d = new Date(b.created_at || b.check_in_date);
          return (
            ["confirmed", "completed"].includes(b.status) &&
            d.getMonth() === currentMonth
          );
        })
        .reduce((a, b) => a + (b.amount || 0), 0);

      setStats({
        totalProperties: properties.length,
        totalRooms,
        availableRooms,
        totalEarnings,
        monthlyEarnings,
        pendingBookings: bookings.filter(b => b.status === "pending").length,
        avgRating
      });

    } catch (err) {

      console.log("Dashboard error:", err?.response?.data || err.message);

      if (err.response?.status === 401) {
        await auth.signOut();
        navigate("/login");
      }

      setSnackbar({
        open: true,
        message: "Failed to load dashboard",
        severity: "error"
      });

    } finally {
      setLoading(false);
      setRefreshing(false);
    }

  }, [navigate]);

  /* ---------------- LOADER ---------------- */

  if (authLoading || loading) {
    return (
      <Box minHeight="60vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <Box>

      {/* HEADER */}

      <Box display="flex" justifyContent="space-between" mb={4}>

        <Box>
          <Typography variant="h4" fontWeight={700}>
            Owner Dashboard
          </Typography>
          <Typography color="text.secondary">
            Manage your PG community
          </Typography>
        </Box>

        <Box display="flex" gap={2}>

          <IconButton onClick={() => loadAllData(true)}>
            <RefreshIcon />
          </IconButton>

          <Button
            startIcon={<ChatIcon />}
            variant="contained"
            color="success"
            onClick={() => navigate("/owner/chats")}
          >
            User Chats
          </Button>

          <Button
            startIcon={<NotificationsIcon />}
            onClick={() => navigate("/owner/notifications")}
            variant="outlined"
          >
            Notifications
          </Button>

          <Button
            startIcon={<AddIcon />}
            onClick={() => navigate("/owner/add")}
            variant="contained"
          >
            Add PG
          </Button>

        </Box>

      </Box>

      {/* STATS */}

      <Grid container spacing={3} mb={4}>

        <Grid item xs={12} md={3}>
          <StatCard title="Properties" value={stats.totalProperties} icon={<ApartmentIcon />} />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard title="Rooms" value={stats.totalRooms} icon={<CommunityIcon />} />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard title="Monthly Earnings" value={formatCurrency(stats.monthlyEarnings)} icon={<MoneyIcon />} />
        </Grid>

        <Grid item xs={12} md={3}>
          <StatCard title="Pending Bookings" value={stats.pendingBookings} icon={<PendingIcon />} />
        </Grid>

      </Grid>

      {/* EMPTY STATE */}

      {pgs.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No PG added yet. Click <b>Add PG</b> to get started.
        </Alert>
      )}

      {/* PROPERTIES */}

      <Grid container spacing={3} mb={4}>
        {pgs.map(pg => (
          <Grid item xs={12} key={pg.id}>
            <PropertyCard
              property={pg}
              onView={() => navigate(`/pg/${pg.id}`)}
              onEdit={() => navigate(`/owner/edit/${pg.id}`)}
              onRooms={() => navigate(`/owner/rooms/${pg.id}`)}
              onPhotos={() => navigate(`/owner/photos/${pg.id}`)}
              onVideos={() => navigate(`/owner/videos/${pg.id}`)}
              onChat={() => navigate(`/owner/pg-chat/${pg.id}`)}
              onAnnouncement={() =>
                navigate(`/owner/pg-chat/${pg.id}?mode=announcement`)
              }
            />
          </Grid>
        ))}
      </Grid>

      {/* BOOKINGS TABLE */}

      <TableContainer component={Paper}>
        <Table>

          <TableHead>
            <TableRow>
              <TableCell>Tenant</TableCell>
              <TableCell>PG</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>

            {recentBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No bookings yet
                </TableCell>
              </TableRow>
            ) : (
              recentBookings.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Avatar>{b.name?.charAt(0)}</Avatar>
                      {b.name}
                    </Box>
                  </TableCell>

                  <TableCell>{b.pg_name}</TableCell>
                  <TableCell>{b.check_in_date}</TableCell>
                  <TableCell>{formatCurrency(b.amount)}</TableCell>

                  <TableCell>
                    <Chip label={b.status} size="small" />
                  </TableCell>
                </TableRow>
              ))
            )}

          </TableBody>

        </Table>
      </TableContainer>

      {/* SNACKBAR */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default OwnerDashboard;
