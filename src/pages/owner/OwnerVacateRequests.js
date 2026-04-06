import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../../api/api";

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
    return { label: "Paid", color: "#22c55e", bg: "#f0fdf4", icon: "✅" };
  if (item.refund_status === "rejected" || item.user_approval === "rejected")
    return { label: "Rejected", color: "#ef4444", bg: "#fef2f2", icon: "❌" };
  if (item.refund_status === "approved")
    return { label: "Awaiting", color: "#f59e0b", bg: "#fffbeb", icon: "⏳" };
  if (item.refund_status === "pending" && item.user_approval === "accepted")
    return { label: "Ready", color: "#6366f1", bg: "#eef2ff", icon: "💸" };
  return { label: "Pending", color: "#64748b", bg: "#f8fafc", icon: "🕐" };
};

/* ── Filter definitions ── */
const FILTERS = [
  { key: "all", label: "All", icon: "📋" },
  { key: "pending", label: "Pending", icon: "🕐" },
  { key: "awaiting", label: "Awaiting", icon: "⏳" },
  { key: "ready", label: "Ready", icon: "💸" },
  { key: "paid", label: "Paid", icon: "✅" },
  { key: "rejected", label: "Rejected", icon: "❌" },
];

const matchesFilter = (item, filterKey) => {
  switch (filterKey) {
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
   ACTION MENU (3-dot)
══════════════════════════════════════════════ */
const ActionMenu = ({
  item, damage, dues, setDamage, setDues,
  loadingId, onApprove, onReject, onMarkPaid,
}) => {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setOpen(false));

  const canApprove = item.refund_status !== "approved" && item.refund_status !== "paid";
  const canMarkPaid = item.refund_status === "pending" && item.user_approval === "accepted";
  const canReject = item.refund_status !== "paid" && item.refund_status !== "rejected";

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button onClick={() => setOpen((o) => !o)} style={styles.actionButton}>⋮</button>

      {open && (
        <div style={styles.dropdown}>
          {canApprove && (
            <button style={styles.menuItem} onClick={() => { setShowForm(true); setOpen(false); }}>
              <span style={{ ...styles.menuIcon, background: "#dcfce7", color: "#16a34a" }}>✓</span>
              {item.user_approval === "rejected" ? "Re-Approve" : "Approve"}
            </button>
          )}
          {canMarkPaid && (
            <button style={styles.menuItem} onClick={() => { onMarkPaid(item.booking_id); setOpen(false); }} disabled={loadingId === item.booking_id}>
              <span style={{ ...styles.menuIcon, background: "#ede9fe", color: "#7c3aed" }}>₹</span>
              Mark Paid
            </button>
          )}
          {canReject && (
            <button style={{ ...styles.menuItem, color: "#ef4444" }} onClick={() => { onReject(item.booking_id); setOpen(false); }}>
              <span style={{ ...styles.menuIcon, background: "#fee2e2", color: "#dc2626" }}>✕</span>
              Reject
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div style={styles.formOverlay}>
          <p style={styles.formTitle}>{item.user_approval === "rejected" ? "🔄 Re-Approve" : "✅ Approve Vacate"}</p>
          <label style={styles.label}>Damage Amount (₹)</label>
          <input type="number" placeholder="0" value={damage[item.booking_id] || ""} onChange={(e) => setDamage((d) => ({ ...d, [item.booking_id]: e.target.value }))} style={styles.input} />
          <label style={styles.label}>Pending Dues (₹)</label>
          <input type="number" placeholder="0" value={dues[item.booking_id] || ""} onChange={(e) => setDues((d) => ({ ...d, [item.booking_id]: e.target.value }))} style={styles.input} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button style={styles.confirmBtn} onClick={() => { onApprove(item.booking_id); setShowForm(false); }} disabled={loadingId === item.booking_id}>
              {loadingId === item.booking_id ? "..." : "Confirm"}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
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
  const account = revealed ? (item.account_number || "N/A") : maskAccount(item.account_number);
  const ifsc = revealed ? (item.ifsc_code || "N/A") : maskIFSC(item.ifsc_code);
  const upi = revealed ? (item.upi_id || "N/A") : maskUPI(item.upi_id);

  return (
    <div style={styles.bankSection}>
      <div style={styles.bankHeader}>
        <span style={styles.bankSectionTitle}>🏦 Bank Details</span>
        <button style={styles.revealBtn} onClick={() => setRevealed((r) => !r)}>{revealed ? "🔒 Hide" : "👁 Show"}</button>
      </div>
      <div style={styles.bankRow}>
        <div style={styles.bankChip}><span style={styles.bankLabel}>Account</span><span style={styles.bankValue}>{account}</span></div>
        <div style={styles.bankChip}><span style={styles.bankLabel}>IFSC</span><span style={styles.bankValue}>{ifsc}</span></div>
        <div style={styles.bankChip}><span style={styles.bankLabel}>UPI</span><span style={styles.bankValue}>{upi}</span></div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   REQUEST CARD
══════════════════════════════════════════════ */
const RequestCard = ({ item, damage, dues, setDamage, setDues, loadingId, onApprove, onReject, onMarkPaid }) => {
  const st = statusConfig(item);

  return (
    <div style={styles.requestCard}>
      <div style={styles.requestHeader}>
        <div style={styles.requestAvatar}>{item.user_name?.[0]?.toUpperCase() || "U"}</div>
        <div style={{ flex: 1 }}>
          <div style={styles.requestTenant}>{item.user_name}</div>
          <div style={styles.requestId}>Booking #{item.booking_id}</div>
        </div>
        <span style={{ ...styles.requestStatus, color: st.color, background: st.bg }}>{st.icon} {st.label}</span>
        <ActionMenu item={item} damage={damage} dues={dues} setDamage={setDamage} setDues={setDues} loadingId={loadingId} onApprove={onApprove} onReject={onReject} onMarkPaid={onMarkPaid} />
      </div>

      <div style={styles.requestDetails}>
        <div style={styles.detailItem}><span style={styles.detailLabel}>📅 Move Out</span><span style={styles.detailValue}>{formatDate(item.move_out_date)}</span></div>
        <div style={styles.detailItem}><span style={styles.detailLabel}>💰 Deposit</span><span style={styles.detailValue}>₹{item.security_deposit || 0}</span></div>
        <div style={styles.detailItem}><span style={styles.detailLabel}>💸 Refund</span><span style={styles.detailValue}>₹{item.refund_amount || 0}</span></div>
        <div style={styles.detailItem}><span style={styles.detailLabel}>⚒️ Damage</span><span style={styles.detailValue}>₹{item.damage_amount || 0}</span></div>
      </div>

      <BankDetails item={item} />
      {item.reason && <div style={styles.requestReason}><span>📝 Reason:</span> {item.reason}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════
   PG CARD (Main Selection)
══════════════════════════════════════════════ */
const PGCard = ({ pg, stats, isSelected, onSelect }) => {
  const firstLetter = pg.name?.[0]?.toUpperCase() || "P";
  
  return (
    <div style={{ ...styles.pgCard, ...(isSelected ? styles.pgCardSelected : {}) }} onClick={() => onSelect(pg.name)}>
      <div style={styles.pgCardAvatar}>{firstLetter}</div>
      <div style={styles.pgCardContent}>
        <div style={styles.pgCardName}>{pg.name}</div>
        <div style={styles.pgCardStats}>
          <span>📋 {pg.totalRequests}</span>
          <span>🕐 {stats.pending}</span>
          <span>⏳ {stats.awaiting}</span>
          <span>💸 {stats.ready}</span>
          <span>✅ {stats.paid}</span>
        </div>
      </div>
      <div style={styles.pgCardArrow}>{isSelected ? "←" : "→"}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   FILTER CHIPS
══════════════════════════════════════════════ */
const FilterChips = ({ active, onChange, counts }) => (
  <div style={styles.filterChips}>
    {FILTERS.map((f) => (
      <button key={f.key} onClick={() => onChange(f.key)} style={{ ...styles.chip, ...(active === f.key ? styles.chipActive : {}) }}>
        <span>{f.icon}</span> {f.label}
        {counts[f.key] > 0 && <span style={styles.chipCount}>{counts[f.key]}</span>}
      </button>
    ))}
  </div>
);

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
  const [filter, setFilter] = useState("all");
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

  // Group by PG
  const pgGroups = useMemo(() => {
    const groups = {};
    requests.forEach(req => {
      const pgName = req.pg_name || "Unknown PG";
      if (!groups[pgName]) groups[pgName] = [];
      groups[pgName].push(req);
    });
    return groups;
  }, [requests]);

  // Calculate PG stats
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

  // PG list for selection
  const pgList = useMemo(() => Object.keys(pgGroups).map(pgName => ({ name: pgName, totalRequests: pgGroups[pgName].length, stats: pgStats[pgName] })), [pgGroups, pgStats]);

  // Auto-select first PG
  useEffect(() => { if (!selectedPG && pgList.length > 0) setSelectedPG(pgList[0].name); }, [pgList, selectedPG]);

  // Get current PG requests
  const currentPGRequests = selectedPG ? pgGroups[selectedPG] || [] : [];
  const filteredRequests = useMemo(() => currentPGRequests.filter(req => matchesFilter(req, filter)), [currentPGRequests, filter]);

  // Counts for filter
  const counts = useMemo(() => {
    const c = { all: currentPGRequests.length };
    FILTERS.forEach(f => { if (f.key !== "all") c[f.key] = currentPGRequests.filter(r => matchesFilter(r, f.key)).length; });
    return c;
  }, [currentPGRequests]);

  const handleApprove = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await user.getIdToken();
      const res = await api.post(`/owner/vacate/approve/${bookingId}`, { damage_amount: Number(damage[bookingId]) || 0, pending_dues: Number(dues[bookingId]) || 0 }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`✅ Approved! Refund: ₹${res.data.refundAmount}`);
      loadRequests();
    } catch { alert("Approval failed"); } finally { setLoadingId(null); }
  };

  const handleReject = async (bookingId) => {
    try {
      const token = await user.getIdToken();
      await api.post(`/owner/refund/reject/${bookingId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("❌ Refund Rejected");
      loadRequests();
    } catch { alert("Reject failed"); }
  };

  const handleMarkPaid = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await user.getIdToken();
      await api.post(`/owner/refund/mark-paid/${bookingId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("💸 Payment Completed");
      loadRequests();
    } catch { alert("Payment failed"); } finally { setLoadingId(null); }
  };

  if (authLoading || pageLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  const totalPending = Object.values(pgStats).reduce((sum, s) => sum + s.pending, 0);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Vacate Requests</h1>
          <p style={styles.subtitle}>{Object.keys(pgGroups).length} PGs · {totalPending} pending review</p>
        </div>
        <button onClick={loadRequests} style={styles.refreshBtn}>↻ Refresh</button>
      </div>

      {/* Two Column Layout */}
      <div style={styles.twoColumnLayout}>
        {/* Left Column - PG List */}
        <div style={styles.leftColumn}>
          <div style={styles.leftHeader}>
            <span>🏘️ Your Properties</span>
            <span style={styles.leftCount}>{pgList.length}</span>
          </div>
          <div style={styles.pgList}>
            {pgList.map((pg) => (<PGCard key={pg.name} pg={pg} stats={pg.stats} isSelected={selectedPG === pg.name} onSelect={setSelectedPG} />))}
            {pgList.length === 0 && <div style={styles.emptyPG}>No vacate requests yet</div>}
          </div>
        </div>

        {/* Right Column - Requests */}
        <div style={styles.rightColumn}>
          {selectedPG && (
            <>
              {/* Selected PG Header */}
              <div style={styles.selectedHeader}>
                <div>
                  <div style={styles.selectedTitle}>{selectedPG}</div>
                  <div style={styles.selectedSubtitle}>{pgStats[selectedPG]?.total || 0} total requests</div>
                </div>
                <div style={styles.selectedStats}>
                  {pgStats[selectedPG]?.pending > 0 && <span style={{ ...styles.statBadge, background: "#fef3c7", color: "#d97706" }}>🕐 {pgStats[selectedPG].pending}</span>}
                  {pgStats[selectedPG]?.awaiting > 0 && <span style={{ ...styles.statBadge, background: "#fffbeb", color: "#f59e0b" }}>⏳ {pgStats[selectedPG].awaiting}</span>}
                  {pgStats[selectedPG]?.ready > 0 && <span style={{ ...styles.statBadge, background: "#eef2ff", color: "#4f46e5" }}>💸 {pgStats[selectedPG].ready}</span>}
                  {pgStats[selectedPG]?.paid > 0 && <span style={{ ...styles.statBadge, background: "#dcfce7", color: "#16a34a" }}>✅ {pgStats[selectedPG].paid}</span>}
                </div>
              </div>

              {/* Filters */}
              <FilterChips active={filter} onChange={setFilter} counts={counts} />

              {/* Requests List */}
              <div style={styles.requestsList}>
                {filteredRequests.length === 0 ? (
                  <div style={styles.emptyRequests}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                    <div>No requests found</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Try a different filter</div>
                  </div>
                ) : (
                  filteredRequests.map((item) => (<RequestCard key={item.booking_id} item={item} damage={damage} dues={dues} setDamage={setDamage} setDues={setDues} loadingId={loadingId} onApprove={handleApprove} onReject={handleReject} onMarkPaid={handleMarkPaid} />))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerVacateRequests;

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f0f2f5",
    padding: "24px",
  },
  header: {
    maxWidth: 1400,
    margin: "0 auto 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    margin: "4px 0 0",
  },
  refreshBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  twoColumnLayout: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 24,
  },
  leftColumn: {
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    height: "fit-content",
    maxHeight: "calc(100vh - 120px)",
    display: "flex",
    flexDirection: "column",
  },
  leftHeader: {
    padding: "20px 20px",
    background: "#fff",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600,
    fontSize: 16,
    color: "#1a1a2e",
  },
  leftCount: {
    background: "#f0f2f5",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: "#666",
  },
  pgList: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
  },
  pgCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px",
    marginBottom: 8,
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#fff",
    border: "1px solid #eee",
  },
  pgCardSelected: {
    background: "#f0f7ff",
    borderColor: "#4f46e5",
    boxShadow: "0 2px 8px rgba(79,70,229,0.1)",
  },
  pgCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
  },
  pgCardContent: {
    flex: 1,
  },
  pgCardName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: 6,
  },
  pgCardStats: {
    display: "flex",
    gap: 10,
    fontSize: 11,
    fontWeight: 500,
    color: "#888",
  },
  pgCardArrow: {
    fontSize: 16,
    color: "#ccc",
  },
  emptyPG: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#999",
  },
  rightColumn: {
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100vh - 120px)",
  },
  selectedHeader: {
    padding: "20px 24px",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  selectedTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  selectedSubtitle: {
    fontSize: 13,
    opacity: 0.9,
  },
  selectedStats: {
    display: "flex",
    gap: 8,
  },
  statBadge: {
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  filterChips: {
    padding: "14px 20px",
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    borderBottom: "1px solid #eee",
    background: "#fafafa",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 14px",
    borderRadius: 20,
    border: "1px solid #ddd",
    background: "#fff",
    fontSize: 13,
    fontWeight: 500,
    color: "#666",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  chipActive: {
    background: "#4f46e5",
    borderColor: "#4f46e5",
    color: "#fff",
  },
  chipCount: {
    background: "rgba(0,0,0,0.1)",
    padding: "2px 6px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  },
  requestsList: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  requestCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px",
    border: "1px solid #eee",
    transition: "all 0.2s",
  },
  requestHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
  },
  requestTenant: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  requestId: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  requestStatus: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  requestDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    background: "#f8f9fa",
    padding: "10px",
    borderRadius: 12,
    textAlign: "center",
  },
  detailLabel: {
    display: "block",
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  requestReason: {
    marginTop: 12,
    padding: "10px 12px",
    background: "#fef3c7",
    borderRadius: 12,
    fontSize: 12,
    color: "#92400e",
  },
  bankSection: {
    background: "#f8f9fa",
    borderRadius: 12,
    padding: "12px",
  },
  bankHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bankSectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#666",
  },
  revealBtn: {
    background: "#eef2ff",
    border: "none",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
    color: "#4f46e5",
    cursor: "pointer",
  },
  bankRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  bankChip: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 8,
    padding: "6px 12px",
    flex: 1,
    minWidth: 100,
  },
  bankLabel: {
    display: "block",
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  bankValue: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  actionButton: {
    background: "transparent",
    border: "none",
    borderRadius: 8,
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 18,
    color: "#999",
    lineHeight: 1,
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    border: "1px solid #eee",
    minWidth: 160,
    zIndex: 100,
    overflow: "hidden",
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
    fontWeight: 500,
    color: "#333",
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
  },
  formOverlay: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    border: "1px solid #eee",
    padding: "16px",
    minWidth: 240,
    zIndex: 200,
  },
  formTitle: {
    margin: "0 0 12px",
    fontSize: 14,
    fontWeight: 700,
    color: "#1a1a2e",
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#666",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 13,
    marginBottom: 10,
    boxSizing: "border-box",
  },
  confirmBtn: {
    flex: 1,
    padding: "8px 0",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    padding: "8px 0",
    background: "#f0f2f5",
    color: "#666",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
  },
  emptyRequests: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#999",
  },
};

// Add keyframes for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);