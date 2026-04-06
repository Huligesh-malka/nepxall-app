Here is the updated code with vertical layout, unique avatar styles for each status, and first-letter-only PG selection.
```css
/* Unique styles for different statuses with avatar symbols */
/* Vertical layout implementation */
/* PG selection with first letter avatar */
/* No horizontal scroll, all vertical stacking */
```

```jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../../api/api";

/* ── Outside click hook ── */
function useOutsideClick(ref, cb) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

/* ── Helpers ── */
const formatDate = (raw) => {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return raw; }
};
const maskAccount = (v) => v && v !== "N/A" ? "••••" + String(v).slice(-4) : "N/A";
const maskIFSC = (v) => v && v !== "N/A" ? String(v).slice(0, 4) + "•••••" : "N/A";
const maskUPI = (v) => {
  if (!v || v === "N/A") return "N/A";
  const [user, domain] = String(v).split("@");
  return user.slice(0, 2) + "•••" + (domain ? "@" + domain : "");
};

/* ── Status config with unique avatar symbols ── */
const statusConfig = (item) => {
  if (item.refund_status === "paid") return { 
    label: "Paid", 
    color: "#16a34a", 
    bg: "#dcfce7",
    avatarSymbol: "✓",
    avatarBg: "#22c55e",
    avatarIconBg: "#166534"
  };
  if (item.refund_status === "rejected" || item.user_approval === "rejected") return { 
    label: "Rejected", 
    color: "#dc2626", 
    bg: "#fee2e2",
    avatarSymbol: "✕",
    avatarBg: "#ef4444",
    avatarIconBg: "#7f1d1d"
  };
  if (item.refund_status === "approved") return { 
    label: "Awaiting", 
    color: "#d97706", 
    bg: "#fef3c7",
    avatarSymbol: "⏳",
    avatarBg: "#f59e0b",
    avatarIconBg: "#78350f"
  };
  if (item.refund_status === "pending" && item.user_approval === "accepted") return { 
    label: "Ready", 
    color: "#4f46e5", 
    bg: "#eef2ff",
    avatarSymbol: "⚡",
    avatarBg: "#6366f1",
    avatarIconBg: "#312e81"
  };
  return { 
    label: "Pending", 
    color: "#64748b", 
    bg: "#f1f5f9",
    avatarSymbol: "○",
    avatarBg: "#94a3b8",
    avatarIconBg: "#475569"
  };
};

/* ── Filter definitions ── */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "awaiting", label: "Awaiting" },
  { key: "ready", label: "Ready" },
  { key: "paid", label: "Paid" },
  { key: "rejected", label: "Rejected" },
];

const matchesFilter = (item, key) => {
  switch (key) {
    case "all": return true;
    case "pending": return item.refund_status === "pending" && item.user_approval === "pending";
    case "awaiting": return item.refund_status === "approved";
    case "ready": return item.refund_status === "pending" && item.user_approval === "accepted";
    case "paid": return item.refund_status === "paid";
    case "rejected": return item.refund_status === "rejected" || item.user_approval === "rejected";
    default: return true;
  }
};

/* ══════════════════════════════════════════════
   ACTION MENU
══════════════════════════════════════════════ */
const ActionMenu = ({ item, damage, dues, setDamage, setDues, loadingId, onApprove, onReject, onMarkPaid }) => {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setOpen(false));

  const canApprove = item.refund_status !== "approved" && item.refund_status !== "paid";
  const canMarkPaid = item.refund_status === "pending" && item.user_approval === "accepted";
  const canReject = item.refund_status !== "paid" && item.refund_status !== "rejected";

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button onClick={() => setOpen((o) => !o)} style={s.actionBtn}>⋮</button>
      {open && (
        <div style={s.dropdown}>
          {canApprove && (
            <button style={s.menuItem} onClick={() => { setShowForm(true); setOpen(false); }}>
              <span style={{ ...s.menuIcon, background: "#dcfce7", color: "#16a34a" }}>✓</span>
              {item.user_approval === "rejected" ? "Re-Approve" : "Approve"}
            </button>
          )}
          {canMarkPaid && (
            <button style={s.menuItem} onClick={() => { onMarkPaid(item.booking_id); setOpen(false); }} disabled={loadingId === item.booking_id}>
              <span style={{ ...s.menuIcon, background: "#ede9fe", color: "#7c3aed" }}>₹</span>
              Mark Paid
            </button>
          )}
          {canReject && (
            <button style={{ ...s.menuItem, color: "#ef4444" }} onClick={() => { onReject(item.booking_id); setOpen(false); }}>
              <span style={{ ...s.menuIcon, background: "#fee2e2", color: "#dc2626" }}>✕</span>
              Reject
            </button>
          )}
        </div>
      )}
      {showForm && (
        <div style={s.formOverlay}>
          <p style={s.formTitle}>{item.user_approval === "rejected" ? "Re-Approve" : "Approve Vacate"}</p>
          <label style={s.label}>Damage Amount (₹)</label>
          <input type="number" placeholder="0" value={damage[item.booking_id] || ""} onChange={(e) => setDamage((d) => ({ ...d, [item.booking_id]: e.target.value }))} style={s.input} />
          <label style={s.label}>Pending Dues (₹)</label>
          <input type="number" placeholder="0" value={dues[item.booking_id] || ""} onChange={(e) => setDues((d) => ({ ...d, [item.booking_id]: e.target.value }))} style={s.input} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={s.confirmBtn} onClick={() => { onApprove(item.booking_id); setShowForm(false); }} disabled={loadingId === item.booking_id}>
              {loadingId === item.booking_id ? "..." : "Confirm"}
            </button>
            <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   BANK DETAILS
══════════════════════════════════════════════ */
const BankDetails = ({ item }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={s.bankSection}>
      <div style={s.bankHeader}>
        <span style={s.bankTitle}>Bank Details</span>
        <button style={s.revealBtn} onClick={() => setRevealed((r) => !r)}>{revealed ? "Hide" : "Show"}</button>
      </div>
      <div style={s.bankRow}>
        <div style={s.bankChip}><span style={s.bankLabel}>Account</span><span style={s.bankValue}>{revealed ? (item.account_number || "N/A") : maskAccount(item.account_number)}</span></div>
        <div style={s.bankChip}><span style={s.bankLabel}>IFSC</span><span style={s.bankValue}>{revealed ? (item.ifsc_code || "N/A") : maskIFSC(item.ifsc_code)}</span></div>
        <div style={s.bankChip}><span style={s.bankLabel}>UPI</span><span style={s.bankValue}>{revealed ? (item.upi_id || "N/A") : maskUPI(item.upi_id)}</span></div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   REQUEST CARD - with unique status avatar styles
══════════════════════════════════════════════ */
const RequestCard = ({ item, damage, dues, setDamage, setDues, loadingId, onApprove, onReject, onMarkPaid }) => {
  const st = statusConfig(item);
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={{ ...s.avatar, background: st.avatarBg, boxShadow: `0 0 0 3px ${st.avatarBg}20` }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{st.avatarSymbol}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={s.tenantName}>{item.user_name}</div>
          <div style={s.bookingId}>Booking #{item.booking_id}</div>
        </div>
        <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>{st.label}</span>
        <ActionMenu item={item} damage={damage} dues={dues} setDamage={setDamage} setDues={setDues} loadingId={loadingId} onApprove={onApprove} onReject={onReject} onMarkPaid={onMarkPaid} />
      </div>

      <div style={s.detailGrid}>
        <div style={s.detailBox}><span style={s.detailLabel}>Move Out</span><span style={s.detailVal}>{formatDate(item.move_out_date)}</span></div>
        <div style={s.detailBox}><span style={s.detailLabel}>Deposit</span><span style={s.detailVal}>₹{item.security_deposit || 0}</span></div>
        <div style={s.detailBox}><span style={s.detailLabel}>Refund</span><span style={s.detailVal}>₹{item.refund_amount || 0}</span></div>
        <div style={s.detailBox}><span style={s.detailLabel}>Damage</span><span style={s.detailVal}>₹{item.damage_amount || 0}</span></div>
      </div>

      <BankDetails item={item} />
      {item.reason && <div style={s.reasonBox}><span style={{ fontWeight: 500 }}>Reason:</span> {item.reason}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════
   PG SELECTION SCREEN - vertical layout, first letter only avatar
══════════════════════════════════════════════ */
const PGSelectionScreen = ({ pgList, pgStats, onSelect, onRefresh }) => {
  const totalRequests = pgList.reduce((sum, pg) => sum + pg.totalRequests, 0);
  const totalPending = Object.values(pgStats).reduce((sum, s) => sum + s.pending, 0);

  // Unique gradient colors for PG avatars based on first letter
  const getAvatarGradient = (letter) => {
    const gradients = {
      A: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
      B: "linear-gradient(135deg, #4ecdc4, #44bdaf)",
      C: "linear-gradient(135deg, #45b7d1, #2c98b5)",
      D: "linear-gradient(135deg, #f9ca24, #f6b93b)",
      E: "linear-gradient(135deg, #6c5ce7, #5a4bd1)",
      F: "linear-gradient(135deg, #a55eea, #8b4bcb)",
      G: "linear-gradient(135deg, #20bf6b, #0f9d58)",
      H: "linear-gradient(135deg, #fa8231, #e17026)",
      I: "linear-gradient(135deg, #2d98da, #1f7fa8)",
      J: "linear-gradient(135deg, #eb3b5a, #c92a42)",
      K: "linear-gradient(135deg, #8854d0, #6c3cb0)",
      L: "linear-gradient(135deg, #3b3b98, #2c2c70)",
      M: "linear-gradient(135deg, #58b19f, #40957f)",
      N: "linear-gradient(135deg, #e66767, #d94a4a)",
      O: "linear-gradient(135deg, #f8c291, #e6a66b)",
      P: "linear-gradient(135deg, #b71540, #94002e)",
      Q: "linear-gradient(135deg, #0abde3, #008bb5)",
      R: "linear-gradient(135deg, #f6e58d, #e8d064)",
      S: "linear-gradient(135deg, #ff7979, #e86161)",
      T: "linear-gradient(135deg, #badc58, #a1c433)",
      U: "linear-gradient(135deg, #c44569, #ad3252)",
      V: "linear-gradient(135deg, #7ed6df, #5db8c4)",
      W: "linear-gradient(135deg, #e056fd, #c638e0)",
      X: "linear-gradient(135deg, #686de0, #5249bd)",
      Y: "linear-gradient(135deg, #ffbe76, #f5a623)",
      Z: "linear-gradient(135deg, #95afc0, #748ca3)"
    };
    return gradients[letter] || "linear-gradient(135deg, #4f46e5, #7c3aed)";
  };

  return (
    <div style={s.container}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Vacate Requests</h1>
          <p style={s.pageSubtitle}>{pgList.length} properties · {totalRequests} total · {totalPending} pending</p>
        </div>
        <button onClick={onRefresh} style={s.refreshBtn}>↻ Refresh</button>
      </div>

      {/* Vertical layout for PG cards - flex column instead of grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {pgList.map((pg) => {
          const stats = pgStats[pg.name] || {};
          const firstLetter = pg.name[0]?.toUpperCase() || "P";
          return (
            <div key={pg.name} style={s.pgCardVertical} onClick={() => onSelect(pg.name)}>
              <div style={s.pgCardContent}>
                <div style={{ ...s.pgAvatarVertical, background: getAvatarGradient(firstLetter) }}>
                  <span style={s.pgAvatarLetter}>{firstLetter}</span>
                </div>
                <div style={s.pgInfo}>
                  <div style={s.pgNameVertical}>{pg.name}</div>
                  <div style={s.pgTotalVertical}>{pg.totalRequests} request{pg.totalRequests !== 1 ? "s" : ""}</div>
                </div>
                <div style={s.pgStatRowVertical}>
                  {stats.pending > 0 && <span style={{ ...s.pgBadgeVertical, background: "#fef3c7", color: "#92400e" }}>📋 P{stats.pending}</span>}
                  {stats.awaiting > 0 && <span style={{ ...s.pgBadgeVertical, background: "#fffbeb", color: "#b45309" }}>⏳ A{stats.awaiting}</span>}
                  {stats.ready > 0 && <span style={{ ...s.pgBadgeVertical, background: "#eef2ff", color: "#3730a3" }}>⚡ R{stats.ready}</span>}
                  {stats.paid > 0 && <span style={{ ...s.pgBadgeVertical, background: "#dcfce7", color: "#166534" }}>✓ Pd{stats.paid}</span>}
                  {stats.rejected > 0 && <span style={{ ...s.pgBadgeVertical, background: "#fee2e2", color: "#991b1b" }}>✕ Rj{stats.rejected}</span>}
                  {pg.totalRequests === 0 && <span style={{ ...s.pgBadgeVertical, background: "#f1f5f9", color: "#64748b" }}>○ No requests</span>}
                </div>
                <span style={s.arrowIconVertical}>›</span>
              </div>
            </div>
          );
        })}
      </div>

      {pgList.length === 0 && (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>📭</div>
          <div style={s.emptyTitle}>No vacate requests</div>
          <div style={s.emptySubtitle}>All your properties are clear</div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   PG DETAIL SCREEN
══════════════════════════════════════════════ */
const PGDetailScreen = ({ pgName, requests, pgStats, damage, dues, setDamage, setDues, loadingId, onApprove, onReject, onMarkPaid, onBack }) => {
  const [filter, setFilter] = useState("all");
  const stats = pgStats[pgName] || {};

  const counts = useMemo(() => {
    const c = { all: requests.length };
    FILTERS.forEach(f => { if (f.key !== "all") c[f.key] = requests.filter(r => matchesFilter(r, f.key)).length; });
    return c;
  }, [requests]);

  const filtered = useMemo(() => requests.filter(r => matchesFilter(r, filter)), [requests, filter]);

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.detailHeader}>
        <button onClick={onBack} style={s.backBtn}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 style={s.pageTitle}>{pgName}</h1>
          <p style={s.pageSubtitle}>{requests.length} total request{requests.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Summary badges - vertical friendly */}
      <div style={s.summaryRow}>
        {stats.pending > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #d97706" }}><div style={s.summaryNum}>{stats.pending}</div><div style={s.summaryLabel}>Pending</div></div>}
        {stats.awaiting > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #f59e0b" }}><div style={s.summaryNum}>{stats.awaiting}</div><div style={s.summaryLabel}>Awaiting</div></div>}
        {stats.ready > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #4f46e5" }}><div style={s.summaryNum}>{stats.ready}</div><div style={s.summaryLabel}>Ready</div></div>}
        {stats.paid > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #16a34a" }}><div style={s.summaryNum}>{stats.paid}</div><div style={s.summaryLabel}>Paid</div></div>}
        {stats.rejected > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #dc2626" }}><div style={s.summaryNum}>{stats.rejected}</div><div style={s.summaryLabel}>Rejected</div></div>}
      </div>

      {/* Filters - horizontal but scrollable on mobile */}
      <div style={s.filterRow}>
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ ...s.filterChip, ...(filter === f.key ? s.filterChipActive : {}) }}>
            {f.label}
            {counts[f.key] > 0 && <span style={{ ...s.chipCount, ...(filter === f.key ? s.chipCountActive : {}) }}>{counts[f.key]}</span>}
          </button>
        ))}
      </div>

      {/* Cards - vertical stack */}
      <div style={s.cardsList}>
        {filtered.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>📭</div>
            <div style={s.emptyTitle}>No requests found</div>
            <div style={s.emptySubtitle}>Try a different filter</div>
          </div>
        ) : (
          filtered.map((item) => (
            <RequestCard key={item.booking_id} item={item} damage={damage} dues={dues} setDamage={setDamage} setDues={setDues} loadingId={loadingId} onApprove={onApprove} onReject={onReject} onMarkPaid={onMarkPaid} />
          ))
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const OwnerVacateRequests = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState([]);
  const [damage, setDamage] = useState({});
  const [dues, setDues] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedPG, setSelectedPG] = useState(null);

  const loadRequests = async () => {
    if (!user) return;
    try {
      setPageLoading(true);
      const token = await user.getIdToken();
      const res = await api.get("/owner/vacate/requests", { headers: { Authorization: `Bearer ${token}` } });
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (user && role === "owner") loadRequests();
  }, [user, role, authLoading, navigate]);

  const pgGroups = useMemo(() => {
    const groups = {};
    requests.forEach(req => {
      const name = req.pg_name || "Unknown PG";
      if (!groups[name]) groups[name] = [];
      groups[name].push(req);
    });
    return groups;
  }, [requests]);

  const pgStats = useMemo(() => {
    const stats = {};
    Object.keys(pgGroups).forEach(pgName => {
      const reqs = pgGroups[pgName];
      stats[pgName] = {
        total: reqs.length,
        pending: reqs.filter(r => r.refund_status === "pending" && r.user_approval === "pending").length,
        awaiting: reqs.filter(r => r.refund_status === "approved").length,
        ready: reqs.filter(r => r.refund_status === "pending" && r.user_approval === "accepted").length,
        paid: reqs.filter(r => r.refund_status === "paid").length,
        rejected: reqs.filter(r => r.refund_status === "rejected" || r.user_approval === "rejected").length,
      };
    });
    return stats;
  }, [pgGroups]);

  const pgList = useMemo(() => Object.keys(pgGroups).map(name => ({ name, totalRequests: pgGroups[name].length })), [pgGroups]);

  const handleApprove = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await user.getIdToken();
      const res = await api.post(`/owner/vacate/approve/${bookingId}`, { damage_amount: Number(damage[bookingId]) || 0, pending_dues: Number(dues[bookingId]) || 0 }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Approved! Refund: ₹${res.data.refundAmount}`);
      loadRequests();
    } catch { alert("Approval failed"); } finally { setLoadingId(null); }
  };

  const handleReject = async (bookingId) => {
    try {
      const token = await user.getIdToken();
      await api.post(`/owner/refund/reject/${bookingId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Refund Rejected");
      loadRequests();
    } catch { alert("Reject failed"); }
  };

  const handleMarkPaid = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await user.getIdToken();
      await api.post(`/owner/refund/mark-paid/${bookingId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Payment Completed");
      loadRequests();
    } catch { alert("Payment failed"); } finally { setLoadingId(null); }
  };

  if (authLoading || pageLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  if (selectedPG) {
    return (
      <PGDetailScreen
        pgName={selectedPG}
        requests={pgGroups[selectedPG] || []}
        pgStats={pgStats}
        damage={damage}
        dues={dues}
        setDamage={setDamage}
        setDues={setDues}
        loadingId={loadingId}
        onApprove={handleApprove}
        onReject={handleReject}
        onMarkPaid={handleMarkPaid}
        onBack={() => setSelectedPG(null)}
      />
    );
  }

  return (
    <PGSelectionScreen
      pgList={pgList}
      pgStats={pgStats}
      onSelect={setSelectedPG}
      onRefresh={loadRequests}
    />
  );
};

export default OwnerVacateRequests;

/* ══════════════════════════════════════════════
   STYLES - Vertical layout optimized
══════════════════════════════════════════════ */
const s = {
  container: {
    minHeight: "100vh",
    background: "#f0f2f5",
    padding: "20px 16px",
    maxWidth: 900,
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  detailHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#666",
    margin: "4px 0 0",
  },
  refreshBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
    cursor: "pointer",
  },
  backBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  
  /* PG Card - Vertical Layout (no horizontal grid) */
  pgCardVertical: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  pgCardContent: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px",
  },
  pgAvatarVertical: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  pgAvatarLetter: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
  },
  pgInfo: {
    flex: 1,
  },
  pgNameVertical: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: 4,
  },
  pgTotalVertical: {
    fontSize: 12,
    color: "#94a3b8",
  },
  pgStatRowVertical: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  pgBadgeVertical: {
    padding: "3px 8px",
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  arrowIconVertical: {
    fontSize: 22,
    color: "#cbd5e1",
    fontWeight: 300,
    marginLeft: 8,
  },

  /* Summary row */
  summaryRow: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "10px 16px",
    border: "1px solid #e5e7eb",
    minWidth: 70,
  },
  summaryNum: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a2e",
    lineHeight: 1.2,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  
  /* Filter row - scrollable horizontally on mobile, but main layout vertical */
  filterRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
  },
  filterChipActive: {
    background: "#4f46e5",
    borderColor: "#4f46e5",
    color: "#fff",
  },
  chipCount: {
    background: "rgba(0,0,0,0.08)",
    padding: "1px 6px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
  },
  chipCountActive: {
    background: "rgba(255,255,255,0.25)",
  },
  
  /* Cards list - vertical stack */
  cardsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  bookingId: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginBottom: 14,
  },
  detailBox: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "8px",
    textAlign: "center",
  },
  detailLabel: {
    display: "block",
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 3,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  bankSection: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px",
  },
  bankHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bankTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
  },
  revealBtn: {
    background: "#eef2ff",
    border: "none",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 10,
    fontWeight: 600,
    color: "#4f46e5",
    cursor: "pointer",
  },
  bankRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  bankChip: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "5px 10px",
    flex: 1,
    minWidth: 80,
  },
  bankLabel: {
    display: "block",
    fontSize: 9,
    color: "#94a3b8",
    marginBottom: 2,
  },
  bankValue: {
    fontSize: 11,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  reasonBox: {
    marginTop: 10,
    padding: "8px 10px",
    background: "#fefce8",
    borderRadius: 10,
    fontSize: 11,
    color: "#78350f",
  },
  
  /* Action menu */
  actionBtn: {
    background: "transparent",
    border: "none",
    borderRadius: 8,
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 20,
    color: "#94a3b8",
    lineHeight: 1,
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb",
    minWidth: 150,
    zIndex: 100,
    overflow: "hidden",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "8px 12px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color: "#334155",
    textAlign: "left",
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  formOverlay: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
    border: "1px solid #e5e7eb",
    padding: "14px",
    minWidth: 220,
    zIndex: 200,
  },
  formTitle: {
    margin: "0 0 10px",
    fontSize: 13,
    fontWeight: 700,
    color: "#1a1a2e",
  },
  label: {
    display: "block",
    fontSize: 10,
    fontWeight: 600,
    color: "#64748b",
    marginBottom: 3,
  },
  input: {
    width: "100%",
    padding: "7px 9px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    marginBottom: 8,
    boxSizing: "border-box",
    outline: "none",
  },
  confirmBtn: {
    flex: 1,
    padding: "7px 0",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    padding: "7px 0",
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 12,
    cursor: "pointer",
  },
  
  /* Empty state */
  emptyState: {
    textAlign: "center",
    padding: "50px 20px",
    color: "#94a3b8",
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#64748b",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94a3b8",
  },
};
```