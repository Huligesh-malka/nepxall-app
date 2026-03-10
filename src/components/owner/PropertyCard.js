import React, { useState } from "react";
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
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  MobileStepper,
  Avatar
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Fullscreen as FullscreenIcon
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

// Helper function to get proper image URL
const getImageUrl = (photo) => {
  if (!photo) return null;
  
  // If it's already a full URL (Cloudinary or other)
  if (photo.startsWith('http')) {
    return photo;
  }
  
  // If it's a path containing /uploads/
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BACKEND_URL}${relativePath}`;
    }
  }
  
  // If it's a relative path starting with /opt/render or similar
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) {
      return `${BACKEND_URL}${uploadsMatch[0]}`;
    }
  }
  
  // Default: just prepend backend URL
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

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
  const [openGallery, setOpenGallery] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const status = statusConfig[property.status] || statusConfig.pending;

  // Get all photos with proper URLs
  const propertyPhotos = property.photosWithUrls || 
    (property.photos ? property.photos.map(p => getImageUrl(p)).filter(Boolean) : []);
  
  const firstImage = propertyPhotos.length > 0 ? propertyPhotos[0] : null;
  const hasMultiplePhotos = propertyPhotos.length > 1;

  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Property ${property.pg_name} has ${propertyPhotos.length} photos`);
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleOpenGallery = () => {
    setOpenGallery(true);
    setActiveStep(0);
  };

  const handleCloseGallery = () => {
    setOpenGallery(false);
  };

  return (
    <>
      <Card sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0",
        height: "100%",
        width: "100%",
        overflow: "hidden"
      }}>

        {/* IMAGE SECTION - Gallery style with multiple photos indicator */}
        <Box
          sx={{
            width: { xs: "100%", md: 280 },
            height: { xs: 220, md: "auto" },
            minHeight: { md: 220 },
            bgcolor: "#f8fafc",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            cursor: hasMultiplePhotos ? "pointer" : "default",
            transition: "transform 0.2s ease",
            "&:hover": {
              "& .gallery-overlay": {
                opacity: 1
              }
            }
          }}
          onClick={hasMultiplePhotos ? handleOpenGallery : undefined}
        >
          {firstImage ? (
            <>
              <Box
                component="img"
                src={firstImage}
                alt={property.pg_name}
                onError={(e) => {
                  console.error("Image failed to load:", firstImage);
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  // Show fallback
                  const parent = e.target.parentElement;
                  if (parent) {
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.style.display = "flex";
                    fallbackDiv.style.flexDirection = "column";
                    fallbackDiv.style.alignItems = "center";
                    fallbackDiv.style.justifyContent = "center";
                    fallbackDiv.style.height = "100%";
                    fallbackDiv.style.width = "100%";
                    fallbackDiv.style.backgroundColor = "#f1f5f9";
                    fallbackDiv.style.color = "#94a3b8";
                    fallbackDiv.innerHTML = `
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px;">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span style="font-size: 14px;">Image not available</span>
                    `;
                    parent.innerHTML = '';
                    parent.appendChild(fallbackDiv);
                  }
                }}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
              
              {/* Photo count badge - Gallery style */}
              {hasMultiplePhotos && (
                <Box
                  className="gallery-overlay"
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    borderRadius: 2,
                    px: 1,
                    py: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    opacity: { xs: 1, md: 0 },
                    transition: "opacity 0.2s ease"
                  }}
                >
                  <ImageIcon sx={{ fontSize: 14 }} />
                  <span>{propertyPhotos.length} photos</span>
                </Box>
              )}
              
              {/* Fullscreen icon on hover */}
              {hasMultiplePhotos && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "white",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: { xs: 0, md: 0 },
                    transition: "opacity 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.7)"
                    }
                  }}
                  className="gallery-overlay"
                >
                  <FullscreenIcon sx={{ fontSize: 20 }} />
                </Box>
              )}
            </>
          ) : (
            // Fallback when no image
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: "100%",
                color: "#94a3b8",
                bgcolor: "#f1f5f9"
              }}
            >
              <ImageIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                No Image
              </Typography>
            </Box>
          )}
        </Box>

        <CardContent sx={{ flex: 1, p: 3, width: "100%" }}>

          {/* HEADER */}
          <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
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

            <Tooltip title="Edit Property">
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

            <Tooltip title="Manage Rooms">
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

            <Tooltip title="Manage Photos">
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

            <Tooltip title="Manage Videos">
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

            <Tooltip title="Chat with Tenants">
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<ChatIcon />} 
                onClick={onChat}
                sx={{ textTransform: "none" }}
              >
                Chat
              </Button>
            </Tooltip>

            {/* QR Code Generation Button */}
            <Tooltip title="Generate QR Code for this property">
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<QrCodeIcon />} 
                onClick={onGenerateQR}
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

      {/* Image Gallery Dialog */}
      <Dialog
        open={openGallery}
        onClose={handleCloseGallery}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.9)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{property.pg_name} - Photos</Typography>
          <IconButton onClick={handleCloseGallery} sx={{ color: 'white' }}>
            <FullscreenIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {propertyPhotos.length > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Box
                  component="img"
                  src={propertyPhotos[activeStep]}
                  alt={`${property.pg_name} - ${activeStep + 1}`}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 500,
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              {propertyPhotos.length > 1 && (
                <MobileStepper
                  steps={propertyPhotos.length}
                  position="static"
                  activeStep={activeStep}
                  sx={{ 
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '& .MuiMobileStepper-dot': {
                      bgcolor: 'rgba(255,255,255,0.3)'
                    },
                    '& .MuiMobileStepper-dotActive': {
                      bgcolor: 'white'
                    }
                  }}
                  nextButton={
                    <Button
                      size="small"
                      onClick={handleNext}
                      disabled={activeStep === propertyPhotos.length - 1}
                      sx={{ color: 'white' }}
                    >
                      Next
                      <ChevronRightIcon />
                    </Button>
                  }
                  backButton={
                    <Button
                      size="small"
                      onClick={handleBack}
                      disabled={activeStep === 0}
                      sx={{ color: 'white' }}
                    >
                      <ChevronLeftIcon />
                      Back
                    </Button>
                  }
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyCard;