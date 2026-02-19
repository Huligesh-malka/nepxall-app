import React from "react";
import { Link, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>🛡 Admin Panel</h2>

      <nav style={styles.nav}>
        <Link style={styles.link(isActive("/admin/pending-pgs"))} to="/admin/pending-pgs">
          📋 Pending PGs
        </Link>

        <Link style={styles.link(isActive("/admin/all-pgs"))} to="/admin/all-pgs">
          🏢 All PGs
        </Link>

        <hr style={styles.divider} />

        <Link
          style={styles.link(isActive("/admin/owner-verification"))}
          to="/admin/owner-verification"
        >
          👤 Owner Verification
        </Link>

        <Link
          style={styles.link(isActive("/admin/verified-owners"))}
          to="/admin/verified-owners"
        >
          ✅ Verified Owners
        </Link>

        <Link
          style={styles.link(isActive("/admin/rejected-owners"))}
          to="/admin/rejected-owners"
        >
          ❌ Rejected Owners
        </Link>
      </nav>
    </div>
  );
};

export default AdminSidebar;

/* ================= STYLES ================= */

const styles = {
  sidebar: {
    width: 260,
    background: "#0f172a",
    color: "#fff",
    minHeight: "100vh",
    padding: 20,
    position: "fixed",
    left: 0,
    top: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  divider: {
    borderTop: "1px solid #334155",
    margin: "12px 0",
  },
  link: (active) => ({
    textDecoration: "none",
    color: "#e5e7eb",
    padding: "10px 14px",
    borderRadius: 8,
    background: active ? "#2563eb" : "#1e293b",
    fontWeight: active ? "600" : "normal",
    transition: "0.2s",
  }),
};
