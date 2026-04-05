import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api";
import { auth } from "../../firebase";

/* ── Close dropdown on outside click ── */
function useOutsideClick(ref, cb) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

/* ── Format ISO date → "22 Apr 2026" ── */
const formatDate = (raw) => {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw;
  }
};

/* ── Mask helpers ── */
const maskAccount = (v) =>
  v && v !== "N/A" ? "••••" + String(v).slice(-4) : "N/A";
const maskIFSC = (v) =>
  v && v !== "N/A" ? String(v).slice(0, 4) + "•••••" : "N/A";
const maskUPI = (v) => {
  if (!v || v === "N/A") return "N/A";
  const [user, domain] = String(v).split("@");
  return user.slice(0, 2) + "•••" + (domain ? "@" + domain : "");
};

/* ── Status config ── */
const statusConfig = (item) => {
  if (item.refund_status === "paid")
    return { label: "Paid", color: "#22c55e", bg: "#f0fdf4", dot: "#16a34a" };
  if (item.refund_status === "rejected" || item.user_approval === "rejected")
    return { label: "Rejected", color: "#ef4444", bg: "#fef2f2", dot: "#dc2626" };
  if (item.refund_status === "approved")
    return { label: "Awaiting Tenant", color: "#f59e0b", bg: "#fffbeb", dot: "#d97706" };
  if (item.refund_status === "pending" && item.user_approval === "accepted")
    return { label: "Ready to Pay", color: "#6366f1", bg: "#eef2ff", dot: "#4f46e5" };
  return { label: "Pending Review", color: "#64748b", bg: "#f8fafc", dot: "#94a3b8" };
};

/* ══════════════════════════════════════════════
   ACTION MENU (3-dot)
══════════════════════════════════════════════ */
const ActionMenu = ({
  item, damage, dues, setDamage, setDues,
  loadingId, onApprove, onReject, onMarkPaid,
}) => {
  const [open, setOpen]         = useState(false);
  const [showForm, setShowForm] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setOpen(false));

  const canApprove  = item.refund_status !== "approved" && item.refund_status !== "paid";
  const canMarkPaid = item.refund_status === "pending" && item.user_approval === "accepted";
  const canReject   = item.refund_status !== "paid" && item.refund_status !== "rejected";

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      {/* 3-dot trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: open ? "#f1f5f9" : "transparent",
          border: "none",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 20,
          color: "#64748b",
          lineHeight: 1,
          transition: "background .15s",
        }}
        title="Actions"
      >
        ⋮
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {canApprove && (
            <button
              style={styles.menuItem}
              onClick={() => { setShowForm(true); setOpen(false); }}
            >
              <span style={{ ...styles.menuIcon, background: "#dcfce7", color: "#16a34a" }}>✓</span>
              {item.user_approval === "rejected" ? "Re-Approve Refund" : "Approve Vacate"}
            </button>
          )}
          {canMarkPaid && (
            <button
              style={styles.menuItem}
              onClick={() => { onMarkPaid(item.booking_id); setOpen(false); }}
              disabled={loadingId === item.booking_id}
            >
              <span style={{ ...styles.menuIcon, background: "#ede9fe", color: "#7c3aed" }}>₹</span>
              Mark as Paid
            </button>
          )}
          {canReject && (
            <button
              style={{ ...styles.menuItem, color: "#ef4444" }}
              onClick={() => { onReject(item.booking_id); setOpen(false); }}
            >
              <span style={{ ...styles.menuIcon, background: "#fee2e2", color: "#dc2626" }}>✕</span>
              Reject Refund
            </button>
          )}
        </div>
      )}

      {/* Inline approval form */}
      {showForm && (
        <div style={styles.formOverlay}>
          <p style={styles.formTitle}>
            {item.user_approval === "rejected" ? "🔄 Re-Approve Refund" : "✅ Approve Vacate"}
          </p>
          <label style={styles.label}>Damage Amount (₹)</label>
          <input
            type="number"
            placeholder="0"
            value={damage[item.booking_id] || ""}
            onChange={(e) =>
              setDamage((d) => ({ ...d, [item.booking_id]: e.target.value }))
            }
            style={styles.input}
          />
          <label style={styles.label}>Pending Dues (₹)</label>
          <input
            type="number"
            placeholder="0"
            value={dues[item.booking_id] || ""}
            onChange={(e) =>
              setDues((d) => ({ ...d, [item.booking_id]: e.target.value }))
            }
            style={styles.input}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              style={styles.confirmBtn}
              onClick={() => { onApprove(item.booking_id); setShowForm(false); }}
              disabled={loadingId === item.booking_id}
            >
              {loadingId === item.booking_id ? "Processing…" : "Confirm"}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   BANK DETAILS — collapsible + masked
══════════════════════════════════════════════ */
const BankDetails = ({ item }) => {
  const [revealed, setRevealed] = useState(false);

  const account = revealed ? (item.account_number || "N/A") : maskAccount(item.account_number);
  const ifsc    = revealed ? (item.ifsc_code || "N/A")      : maskIFSC(item.ifsc_code);
  const upi     = revealed ? (item.upi_id || "N/A")         : maskUPI(item.upi_id);

  return (
    <div style={styles.bankSection}>
      <div style={styles.bankHeader}>
        <span style={styles.bankSectionTitle}>🏦 Bank Details</span>
        <button
          style={styles.revealBtn}
          onClick={() => setRevealed((r) => !r)}
        >
          {revealed ? "🔒 Hide" : "👁 Show"}
        </button>
      </div>
      <div style={styles.bankRow}>
        <BankChip label="Account" value={account} />
        <BankChip label="IFSC"    value={ifsc} />
        <BankChip label="UPI"     value={upi} />
      </div>
    </div>
  );
};

const BankChip = ({ label, value }) => (
  <div style={styles.bankChip}>
    <span style={styles.bankLabel}>{label}</span>
    <span style={styles.bankValue}>{value}</span>
  </div>
);

/* ══════════════════════════════════════════════
   SINGLE REQUEST CARD
══════════════════════════════════════════════ */
const RequestCard = ({
  item, damage, dues, setDamage, setDues,
  loadingId, onApprove, onReject, onMarkPaid,
}) => {
  const st      = statusConfig(item);
  const initial = (item.pg_name || item.user_name || "P")[0].toUpperCase();

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        {/* Avatar — initial only, no + */}
        <div style={styles.avatar}>{initial}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={styles.pgName}>{item.pg_name}</h3>
          <p style={styles.tenantName}>👤 {item.user_name}</p>
        </div>

        <span style={{ ...styles.pill, color: st.color, background: st.bg }}>
          <span style={{ ...styles.pillDot, background: st.dot }} />
          {st.label}
        </span>

        <ActionMenu
          item={item}
          damage={damage}
          dues={dues}
          setDamage={setDamage}
          setDues={setDues}
          loadingId={loadingId}
          onApprove={onApprove}
          onReject={onReject}
          onMarkPaid={onMarkPaid}
        />
      </div>

      {/* Info grid */}
      <div style={styles.infoGrid}>
        <InfoTile icon="📅" label="Move Out" value={formatDate(item.move_out_date)} />
        <InfoTile icon="💳" label="Deposit"  value={`₹${item.security_deposit || 0}`} />
        <InfoTile icon="💰" label="Refund"   value={`₹${item.refund_amount || 0}`} />
        <InfoTile icon="⚒"  label="Damage"   value={`₹${item.damage_amount || 0}`} />
      </div>

      <div style={styles.divider} />

      {/* Bank details */}
      <BankDetails item={item} />

      {/* Reason */}
      {item.reason && (
        <p style={styles.reason}>
          <span style={styles.reasonLabel}>Reason: </span>{item.reason}
        </p>
      )}

      {/* Paid banner */}
      {item.refund_status === "paid" && (
        <div style={styles.paidBanner}>✅ Payment Completed</div>
      )}
    </div>
  );
};

const InfoTile = ({ icon, label, value }) => (
  <div style={styles.tile}>
    <span style={styles.tileIcon}>{icon}</span>
    <span style={styles.tileLabel}>{label}</span>
    <span style={styles.tileValue}>{value}</span>
  </div>
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const OwnerVacateRequests = () => {
  const [requests,  setRequests]  = useState([]);
  const [damage,    setDamage]    = useState({});
  const [dues,      setDues]      = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.get("/owner/vacate/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleApprove = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await auth.currentUser.getIdToken();
      const res = await api.post(
        `/owner/vacate/approve/${bookingId}`,
        {
          damage_amount: Number(damage[bookingId]) || 0,
          pending_dues:  Number(dues[bookingId])   || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Approved! Refund: ₹${res.data.refundAmount}`);
      loadRequests();
    } catch { alert("Approval failed"); }
    finally { setLoadingId(null); }
  };

  const handleReject = async (bookingId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await api.post(`/owner/refund/reject/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("❌ Refund Rejected");
      loadRequests();
    } catch { alert("Reject failed"); }
  };

  const handleMarkPaid = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await auth.currentUser.getIdToken();
      await api.post(`/owner/refund/mark-paid/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("💸 Payment Completed");
      loadRequests();
    } catch { alert("Payment failed"); }
    finally { setLoadingId(null); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Vacate Requests</h1>
          <p style={styles.pageSubtitle}>
            {requests.length} request{requests.length !== 1 ? "s" : ""} pending review
          </p>
        </div>
        <button onClick={loadRequests} style={styles.refreshBtn}>↻ Refresh</button>
      </div>

      {loading && (
        <div style={styles.emptyState}>
          <div style={styles.spinner} />
          <p style={{ color: "#94a3b8", marginTop: 12 }}>Loading requests…</p>
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
          <p style={{ color: "#64748b", fontWeight: 600 }}>No vacate requests yet</p>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>New requests will appear here</p>
        </div>
      )}

      <div style={styles.list}>
        {requests.map((item) => (
          <RequestCard
            key={item.booking_id}
            item={item}
            damage={damage}
            dues={dues}
            setDamage={setDamage}
            setDues={setDues}
            loadingId={loadingId}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkPaid={handleMarkPaid}
          />
        ))}
      </div>
    </div>
  );
};

export default OwnerVacateRequests;

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const styles = {
  page: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "32px 16px 60px",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  pageSubtitle: { fontSize: 13, color: "#94a3b8", margin: "4px 0 0" },
  refreshBtn: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(0,0,0,.04)",
  },
  list: { display: "flex", flexDirection: "column", gap: 16 },

  /* Card */
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "20px 20px 18px",
    boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)",
    border: "1px solid #f1f5f9",
    position: "relative",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  /* Avatar: letter only, no + icon */
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 17,
    flexShrink: 0,
    userSelect: "none",
  },

  pgName:     { margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" },
  tenantName: { margin: "2px 0 0", fontSize: 12, color: "#64748b" },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  pillDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },

  /* Info tiles */
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    marginBottom: 14,
  },
  tile: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    border: "1px solid #f1f5f9",
  },
  tileIcon:  { fontSize: 16 },
  tileLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tileValue: { fontSize: 13, fontWeight: 700, color: "#0f172a" },

  divider: { height: 1, background: "#f1f5f9", margin: "4px 0 12px" },

  /* Bank section */
  bankSection: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 10,
  },
  bankHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bankSectionTitle: { fontSize: 12, fontWeight: 700, color: "#475569" },
  revealBtn: {
    background: "#eef2ff",
    border: "none",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#4f46e5",
    cursor: "pointer",
  },
  bankRow:  { display: "flex", gap: 8, flexWrap: "wrap" },
  bankChip: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  bankLabel: { fontSize: 10, color: "#818cf8", fontWeight: 700, textTransform: "uppercase" },
  bankValue: { fontSize: 12, color: "#3730a3", fontWeight: 600 },

  reason:      { marginTop: 6, fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  reasonLabel: { fontWeight: 700, color: "#475569" },

  paidBanner: {
    marginTop: 14,
    padding: "10px 14px",
    background: "#f0fdf4",
    borderRadius: 8,
    color: "#16a34a",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
    border: "1px solid #bbf7d0",
  },

  /* Dropdown */
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)",
    border: "1px solid #f1f5f9",
    minWidth: 190,
    zIndex: 100,
    overflow: "hidden",
    padding: "6px 0",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    textAlign: "left",
    transition: "background .12s",
  },
  menuIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },

  /* Approval form */
  formOverlay: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 8px 30px rgba(0,0,0,.12)",
    border: "1px solid #e2e8f0",
    padding: "18px 18px 16px",
    minWidth: 240,
    zIndex: 200,
  },
  formTitle: { margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    marginBottom: 10,
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#f8fafc",
  },
  confirmBtn: {
    flex: 1,
    padding: "9px 0",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    padding: "9px 0",
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },

  emptyState: { textAlign: "center", padding: "60px 20px", color: "#94a3b8" },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #e2e8f0",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
};