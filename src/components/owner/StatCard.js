// src/components/owner/StatCard.jsx
import React from "react";
import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";

const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const colorMap = {
  primary: BRAND_BLUE,
  success: BRAND_GREEN,
  warning: "#f59e0b",
  info: "#3b82f6",
  error: "#ef4444",
  purple: "#8b5cf6"
};

const StatCard = ({ 
  title, 
  value, 
  icon, 
  subtitle,
  color = "primary",
  loading = false,
  trend
}) => {
  if (loading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" height={40} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      borderRadius: 2, 
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0"
    }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#0f172a" }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography variant="caption" sx={{ color: BRAND_GREEN, display: "block", mt: 0.5 }}>
                {trend}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${colorMap[color]}15`,
              borderRadius: 2,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(icon, { sx: { color: colorMap[color], fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;