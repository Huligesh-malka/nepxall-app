import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

const AdminLayout = () => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#f8fafc",
      }}
    >
      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <AdminSidebar />
      </div>

      {/* Page Content */}
      <div
        style={{
          flex: 1,
          padding: 24,
          overflowY: "auto",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
