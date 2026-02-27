// src/components/owner/PropertyCard.jsx

import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Tooltip,
  Divider,
  LinearProgress
} from "@mui/material";

import {
  LocationOn as LocationIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoIcon,
  Videocam as VideoIcon,
  PlayArrow as ActivateIcon,
  Stop as DisableIcon,
  MeetingRoom as RoomsIcon,
  Star as StarIcon,
  Campaign as AnnouncementIcon,
  PlaylistAdd as PlanIcon
} from "@mui/icons-material";

const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const statusConfig = {
  pending: { label: "PENDING", bg: "#fef3c7", text: "#92400e" },
  active: { label: "ACTIVE", bg: "#d1fae5", text: "#065f46" },
  inactive: { label: "DISABLED", bg: "#fee2e2", text: "#991b1b" },
  rejected: { label: "REJECTED", bg: "#fee2e2", text: "#991b1b" },
  closed: { label: "CLOSED", bg: "#e2e8f0", text: "#334155" }
};

const PropertyCard = ({
  property,
  onView,
  onEdit,
  onRooms,
  onPhotos,
  onVideos,
  onToggleStatus,
  onAnnouncement,
  onCreatePlan
}) => {

  const status = statusConfig[property.status] || statusConfig.pending;

  // ✅ FIXED: Handle both Cloudinary URLs and local paths
  const getImageUrl = () => {
    if (!property.photos?.length) {
      return "https://via.placeholder.com/400x300?text=No+Image";
    }
    
    const photo = property.photos[0];
    
    // If it's already a full URL (Cloudinary), use it directly
    if (photo.startsWith('http')) {
      return photo;
    }
    
    // If it's a relative path, prepend local server URL
    return `http://localhost:5000${photo}`;
  };

  const imageUrl = getImageUrl();

  return (
    <Card sx={{
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      borderRadius: 2,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0"
    }}>

      {/* IMAGE */}
      <CardMedia
        component="img"
        image={imageUrl}
        alt={property.pg_name}
        onError={(e) => {
          console.error("Image failed to load:", imageUrl);
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
        }}
        sx={{
          width: { xs: "100%", md: 260 },
          height: { xs: 200, md: "auto" },
          objectFit: "cover"
        }}
      />

      <CardContent sx={{ flex: 1, p: 3 }}>

        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {property.pg_name}
            </Typography>

            <Typography variant="body2" sx={{
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: 0.5
            }}>
              <LocationIcon sx={{ fontSize: 18 }} />
              {property.area}, {property.city}
            </Typography>

            {/* Category Badge */}
            {property.pg_category && (
              <Chip
                label={property.pg_category.toUpperCase()}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: property.pg_category === "coliving" ? "#e0f2fe" : "#f3e8ff",
                  color: property.pg_category === "coliving" ? "#0369a1" : "#6b21a8",
                  fontSize: "11px",
                  height: 20
                }}
              />
            )}
          </Box>

          <Chip
            label={status.label}
            sx={{
              bgcolor: status.bg,
              color: status.text,
              fontWeight: 600,
              fontSize: "12px",
              height: 24
            }}
          />
        </Box>

        {/* ROOMS INFO */}
        <Box display="flex" gap={3} mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <RoomsIcon sx={{ fontSize: 18 }} />
            <Typography>{property.total_rooms || 0} Rooms</Typography>
          </Box>

          <Typography sx={{ color: BRAND_GREEN, fontWeight: 600 }}>
            {property.available_rooms || 0} Available
          </Typography>

          {property.avg_rating > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <StarIcon sx={{ fontSize: 18, color: "#fbbf24" }} />
              <Typography>{property.avg_rating.toFixed(1)}</Typography>
            </Box>
          )}
        </Box>

        {/* PENDING STATUS */}
        {property.status === "pending" && (
          <Box mb={2}>
            <Typography variant="caption" sx={{ color: "#f59e0b" }}>
              ⏳ Under admin review
            </Typography>
            <LinearProgress sx={{ borderRadius: 1, bgcolor: "#fef3c7" }} />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ACTION BUTTONS */}
        <Box display="flex" gap={1} flexWrap="wrap">

          <Tooltip title="View">
            <Button size="small" variant="outlined" startIcon={<ViewIcon />} onClick={onView}>
              View
            </Button>
          </Tooltip>

          <Tooltip title="Edit">
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
              Edit
            </Button>
          </Tooltip>

          <Tooltip title="Rooms">
            <Button size="small" variant="outlined" startIcon={<RoomsIcon />} onClick={onRooms}>
              Rooms
            </Button>
          </Tooltip>

          <Tooltip title="Photos">
            <Button size="small" variant="outlined" startIcon={<PhotoIcon />} onClick={onPhotos}>
              Photos
            </Button>
          </Tooltip>

          <Tooltip title="Videos">
            <Button size="small" variant="outlined" startIcon={<VideoIcon />} onClick={onVideos}>
              Videos
            </Button>
          </Tooltip>

          {/* CREATE PLAN BUTTON - Only for coliving */}
          {property.pg_category === "coliving" && onCreatePlan && (
            <Tooltip title="Create Membership Plan">
              <Button
                size="small"
                variant="contained"
                startIcon={<PlanIcon />}
                onClick={onCreatePlan}
                disabled={property.status !== "active"}
                sx={{
                  bgcolor: "#8b5cf6",
                  "&:hover": { bgcolor: "#7c3aed" },
                  textTransform: "none",
                  borderRadius: 2
                }}
              >
                Create Plan
              </Button>
            </Tooltip>
          )}

          {/* ANNOUNCEMENT BUTTON */}
          <Tooltip title="Send Announcement">
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<AnnouncementIcon />}
                onClick={onAnnouncement}
                disabled={property.status !== "active"}
                sx={{
                  bgcolor: "#f59e0b",
                  "&:hover": { bgcolor: "#d97706" },
                  textTransform: "none",
                  borderRadius: 2
                }}
              >
                Announce
              </Button>
            </span>
          </Tooltip>

          {/* STATUS TOGGLE */}
          {property.status === "active" ? (
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DisableIcon />}
              onClick={onToggleStatus}
            >
              Disable
            </Button>
          ) : property.status === "inactive" && (
            <Button
              size="small"
              color="success"
              variant="outlined"
              startIcon={<ActivateIcon />}
              onClick={onToggleStatus}
            >
              Activate
            </Button>
          )}

        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;