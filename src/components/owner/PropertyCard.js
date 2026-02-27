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
  PlaylistAdd as PlanIcon,
  Image as ImageIcon
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

// Backend URL from environment
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

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

  // Get image URL with fallback
  const getImageUrl = () => {
    if (!property.photos?.length) {
      return null;
    }
    
    const photo = property.photos[0];
    
    // If it's already a full URL (Cloudinary or other), use it directly
    if (photo.startsWith('http')) {
      return photo;
    }
    
    // If it's a path containing /uploads/
    if (photo.includes('/uploads/')) {
      // Extract everything after /uploads/
      const uploadsIndex = photo.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        const relativePath = photo.substring(uploadsIndex);
        return `${BACKEND_URL}${relativePath}`;
      }
    }
    
    // If it's a relative path starting with /opt/render or similar
    if (photo.includes('/opt/render/')) {
      // Try to extract the /uploads/ part
      const uploadsMatch = photo.match(/\/uploads\/.*/);
      if (uploadsMatch) {
        return `${BACKEND_URL}${uploadsMatch[0]}`;
      }
    }
    
    // Default: just prepend backend URL
    const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
    return `${BACKEND_URL}${normalizedPath}`;
  };

  const imageUrl = getImageUrl();

  // Log for debugging
  console.log(`Property ${property.pg_name} image URL:`, imageUrl);

  return (
    <Card sx={{
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      borderRadius: 2,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0",
      height: "100%"
    }}>

      {/* IMAGE SECTION */}
      <Box
        sx={{
          width: { xs: "100%", md: 260 },
          height: { xs: 200, md: "auto" },
          bgcolor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={property.pg_name}
            onError={(e) => {
              console.error("Image failed to load:", imageUrl);
              e.target.onerror = null;
              e.target.style.display = "none";
              // Show fallback
              const parent = e.target.parentElement;
              const fallbackDiv = document.createElement('div');
              fallbackDiv.style.display = "flex";
              fallbackDiv.style.flexDirection = "column";
              fallbackDiv.style.alignItems = "center";
              fallbackDiv.style.justifyContent = "center";
              fallbackDiv.style.height = "100%";
              fallbackDiv.style.color = "#94a3b8";
              fallbackDiv.style.backgroundColor = "#f1f5f9";
              fallbackDiv.style.width = "100%";
              fallbackDiv.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style="margin-top: 8px; font-size: 14px;">Image not available</span>
              `;
              parent.innerHTML = '';
              parent.appendChild(fallbackDiv);
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        ) : (
          // Fallback when no image
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94a3b8",
              bgcolor: "#f1f5f9",
              width: "100%"
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              No Image
            </Typography>
          </Box>
        )}
      </Box>

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
              gap: 0.5,
              mt: 0.5
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
                  height: 20,
                  fontWeight: 600
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
        <Box display="flex" gap={3} mb={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <RoomsIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {property.total_rooms || 0} Rooms
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2" sx={{ color: BRAND_GREEN, fontWeight: 600 }}>
              {property.available_rooms || 0} Available
            </Typography>
          </Box>

          {property.avg_rating > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <StarIcon sx={{ fontSize: 18, color: "#fbbf24" }} />
              <Typography variant="body2">{property.avg_rating.toFixed(1)}</Typography>
            </Box>
          )}
        </Box>

        {/* PENDING STATUS */}
        {property.status === "pending" && (
          <Box mb={2}>
            <Typography variant="caption" sx={{ color: "#f59e0b", display: "block", mb: 0.5 }}>
              ⏳ Under admin review
            </Typography>
            <LinearProgress 
              sx={{ 
                borderRadius: 1, 
                bgcolor: "#fef3c7",
                '& .MuiLinearProgress-bar': {
                  bgcolor: "#f59e0b"
                }
              }} 
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ACTION BUTTONS */}
        <Box display="flex" gap={1} flexWrap="wrap">

          <Tooltip title="View">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<ViewIcon />} 
              onClick={onView}
              sx={{ textTransform: "none" }}
            >
              View
            </Button>
          </Tooltip>

          <Tooltip title="Edit">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<EditIcon />} 
              onClick={onEdit}
              sx={{ textTransform: "none" }}
            >
              Edit
            </Button>
          </Tooltip>

          <Tooltip title="Rooms">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<RoomsIcon />} 
              onClick={onRooms}
              sx={{ textTransform: "none" }}
            >
              Rooms
            </Button>
          </Tooltip>

          <Tooltip title="Photos">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<PhotoIcon />} 
              onClick={onPhotos}
              sx={{ textTransform: "none" }}
            >
              Photos
            </Button>
          </Tooltip>

          <Tooltip title="Videos">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<VideoIcon />} 
              onClick={onVideos}
              sx={{ textTransform: "none" }}
            >
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
              sx={{ textTransform: "none" }}
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
              sx={{ textTransform: "none" }}
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