import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Divider
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { auth } from "../firebase";

const drawerWidth = 240;

const VendorLayout = () => {

  const navigate = useNavigate();
  const vendorName = localStorage.getItem("name") || "Vendor";

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/vendor/dashboard"
    }
  ];

  return (
    <Box sx={{ display: "flex" }}>

      {/* ================= APPBAR ================= */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "#1976d2"
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">
            Nepxall Vendor Panel
          </Typography>

          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1">
              {vendorName}
            </Typography>

            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ================= SIDEBAR ================= */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box"
          }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  {item.icon}
                  <ListItemText
                    primary={item.text}
                    sx={{ ml: 2 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <LogoutIcon />
                <ListItemText primary="Logout" sx={{ ml: 2 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* ================= MAIN CONTENT ================= */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: `${drawerWidth}px`
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

    </Box>
  );
};

export default VendorLayout;