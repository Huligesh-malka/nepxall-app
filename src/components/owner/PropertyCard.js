// src/components/owner/PropertyCard.js
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
  LinearProgress,
  Alert
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
  Image as ImageIcon,
  QrCode as QrCodeIcon,
  Chat as ChatIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const statusConfig = {
  pending: { label: "⏳ WAITING FOR ADMIN", bg: "#fef3c7", text: "#92400e", icon: "⏳" },
  active: { label: "✅ ACTIVE", bg: "#d1fae5", text: "#065f46", icon: "✅" },
  inactive: { label: "⏸️ DISABLED", bg: "#fee2e2", text: "#991b1b", icon: "⏸️" },
  rejected: { label: "❌ REJECTED", bg: "#fee2e2", text: "#991b1b", icon: "❌" },
  closed: { label: "🔒 CLOSED", bg: "#e2e8f0", text: "#334155", icon: "🔒" }
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
  onChat,
  onToggleStatus,
  onAnnouncement,
  onCreatePlan,
  onGenerateQR
}) => {

  const status = statusConfig[property.status] || statusConfig.pending;
  const isActive = property.status === "active";
  const isPending = property.status === "pending";
  const isRejected = property.status === "rejected";

  // Get image URL with fallback
  const getImageUrl = () => {
    if (!property.photos?.length) {
      return null;
    }
    
    const photo = property.photos[0];
    
    if (photo.startsWith('http')) {
      return photo;
    }
    
    if (photo.includes('/uploads/')) {
      const uploadsIndex = photo.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        const relativePath = photo.substring(uploadsIndex);
        return `${BACKEND_URL}${relativePath}`;
      }
    }
    
    if (photo.includes('/opt/render/')) {
      const uploadsMatch = photo.match(/\/uploads\/.*/);
      if (uploadsMatch) {
        return `${BACKEND_URL}${uploadsMatch[0]}`;
      }
    }
    
    const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
    return `${BACKEND_URL}${normalizedPath}`;
  };

  const imageUrl = getImageUrl();

  return (
    <Card sx={{
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      borderRadius: 3,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      border: isPending ? "1px solid #f59e0b40" : "1px solid #e2e8f0",
      height: "100%",
      transition: "all 0.3s ease",
      '&:hover': {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        borderColor: isPending ? "#f59e0b80" : "#cbd5e1"
      }
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
        {/* Status Badge Overlay on Image */}
        {isPending && (
          <Box sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 1,
            background: "rgba(0,0,0,0.6)",
            borderRadius: "20px",
            px: 1.5,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5
          }}>
            <WarningIcon sx={{ fontSize: 14, color: "#f59e0b" }} />
            <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>
              Under Review
            </Typography>
          </Box>
        )}

        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={property.pg_name}
            onError={(e) => {
              console.error("Image failed to load:", imageUrl);
              e.target.onerror = null;
              e.target.style.display = "none";
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
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
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
              {property.area}, {property.city || property.location || "Location not specified"}
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
            icon={<span>{status.icon}</span>}
            sx={{
              bgcolor: status.bg,
              color: status.text,
              fontWeight: 600,
              fontSize: "12px",
              height: 28,
              '& .MuiChip-icon': { fontSize: 14, m: 0 }
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
            <Typography variant="body2" sx={{ color: isActive ? BRAND_GREEN : "#64748b", fontWeight: 600 }}>
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

        {/* 🔥 BIG ALERT FOR PENDING STATUS */}
        {isPending && (
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ 
              mb: 2, 
              mt: 1,
              borderRadius: '12px',
              bgcolor: '#fef3c7',
              border: '1px solid #f59e0b40',
              '& .MuiAlert-icon': { color: '#f59e0b' }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
              ⏳ Waiting for Admin Approval
            </Typography>
            <Typography variant="caption" sx={{ color: '#b45309', display: 'block', mt: 0.5 }}>
              Your PG has been submitted and is under admin verification. 
              This usually takes 24-48 hours. You'll be notified once approved.
              <br />
              <strong>Note:</strong> Management features will be available after approval.
            </Typography>
          </Alert>
        )}

        {/* BIG ALERT FOR REJECTED STATUS */}
        {isRejected && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              mt: 1,
              borderRadius: '12px',
              bgcolor: '#fee2e2',
              border: '1px solid #dc262640'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#991b1b' }}>
              ❌ Property Rejected
            </Typography>
            <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block', mt: 0.5 }}>
              Your property has been rejected. Please check your email for details 
              or contact support to resolve the issues.
            </Typography>
          </Alert>
        )}

        {/* PENDING PROGRESS BAR */}
        {isPending && (
          <Box mb={2}>
            <LinearProgress 
              sx={{ 
                borderRadius: 1, 
                bgcolor: "#fef3c7",
                height: 6,
                '& .MuiLinearProgress-bar': {
                  bgcolor: "#f59e0b"
                }
              }} 
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ACTION BUTTONS - DISABLED FOR NON-ACTIVE */}
        <Box display="flex" gap={1} flexWrap="wrap">

          <Tooltip title="View Property">
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

          <Tooltip title={!isActive ? "Available after admin approval" : "Edit Property"}>
            <span>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<EditIcon />} 
                onClick={onEdit}
                disabled={!isActive}
                sx={{ textTransform: "none" }}
              >
                Edit
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={!isActive ? "Available after admin approval" : "Manage Rooms"}>
            <span>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<RoomsIcon />} 
                onClick={onRooms}
                disabled={!isActive}
                sx={{ textTransform: "none" }}
              >
                Rooms
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={!isActive ? "Available after admin approval" : "Manage Photos"}>
            <span>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<PhotoIcon />} 
                onClick={onPhotos}
                disabled={!isActive}
                sx={{ textTransform: "none" }}
              >
                Photos
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={!isActive ? "Available after admin approval" : "Manage Videos"}>
            <span>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<VideoIcon />} 
                onClick={onVideos}
                disabled={!isActive}
                sx={{ textTransform: "none" }}
              >
                Videos
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={!isActive ? "Available after admin approval" : "Chat with Tenants"}>
            <span>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<ChatIcon />} 
                onClick={onChat}
                disabled={!isActive}
                sx={{ textTransform: "none" }}
              >
                Chat
              </Button>
            </span>
          </Tooltip>

          {/* QR Code Generation Button */}
          <Tooltip title={!isActive ? "Available after admin approval" : "Generate QR Code for this property"}>
            <span>
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<QrCodeIcon />} 
                onClick={onGenerateQR}
                disabled={!isActive}
                sx={{ 
                  textTransform: "none",
                  color: "#6b21a8",
                  borderColor: "#6b21a8",
                  "&:hover": {
                    borderColor: "#581c87",
                    backgroundColor: "#faf5ff"
                  }
                }}
              >
                QR Code
              </Button>
            </span>
          </Tooltip>

          {/* CREATE PLAN BUTTON - Only for coliving */}
          {property.pg_category === "coliving" && onCreatePlan && (
            <Tooltip title={!isActive ? "Available after admin approval" : "Create Membership Plan"}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PlanIcon />}
                  onClick={onCreatePlan}
                  disabled={!isActive}
                  sx={{
                    bgcolor: "#8b5cf6",
                    "&:hover": { bgcolor: "#7c3aed" },
                    textTransform: "none",
                    borderRadius: 2
                  }}
                >
                  Create Plan
                </Button>
              </span>
            </Tooltip>
          )}

          {/* ANNOUNCEMENT BUTTON */}
          <Tooltip title={!isActive ? "Available after admin approval" : "Send Announcement"}>
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<AnnouncementIcon />}
                onClick={onAnnouncement}
                disabled={!isActive}
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

          {/* STATUS TOGGLE - Only for active/inactive */}
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

        {/* Additional Info for Pending Properties */}
        {isPending && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef3c7', borderRadius: '8px' }}>
            <Typography variant="caption" sx={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon sx={{ fontSize: 14 }} />
              Property under review. You'll be notified once approved.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyCard;