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

/* ── Status config ── */
const statusConfig = (item) => {
  if (item.status === "LEAVING" && item.vacate_status === "requested") {
    return { label: "Pending", color: "#64748b", bg: "#f1f5f9" };
  }

  if (item.refund_status === "approved") {
    return { label: "Awaiting", color: "#d97706", bg: "#fef3c7" };
  }

  if (item.refund_status === "pending" && item.user_approval === "accepted") {
    return { label: "Ready", color: "#4f46e5", bg: "#eef2ff" };
  }

  if (item.refund_status === "paid") {
    return { label: "Paid", color: "#16a34a", bg: "#dcfce7" };
  }

  if (item.refund_status === "rejected") {
    return { label: "Rejected", color: "#dc2626", bg: "#fee2e2" };
  }

  return { label: "Pending", color: "#64748b", bg: "#f1f5f9" };
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
    case "pending": 
      return item.refund_status === "pending" && 
        (!item.user_approval || item.user_approval === "pending");
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

  const canApprove =
    item.refund_status !== "paid" &&
    item.user_approval !== "accepted";

  const canMarkPaid = item.refund_status === "pending" && item.user_approval === "accepted";

  const canReject =
    item.refund_status !== "paid" &&
    item.user_approval !== "accepted";

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button onClick={() => setOpen((o) => !o)} style={s.actionBtn}>⋮</button>
      {open && (
        <div style={s.dropdown}>
          {canApprove && (
            <button style={s.menuItem} onClick={() => { setShowForm(true); setOpen(false); }} disabled={loadingId === item.booking_id}>
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
            <button style={{ ...s.menuItem, color: "#ef4444" }} onClick={() => { onReject(item.booking_id); setOpen(false); }} disabled={loadingId === item.booking_id}>
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
   REQUEST CARD
══════════════════════════════════════════════ */
const RequestCard = ({ item, damage, dues, setDamage, setDues, loadingId, onApprove, onReject, onMarkPaid }) => {
  const st = statusConfig(item);
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.avatar}>{item.user_name?.[0]?.toUpperCase() || "U"}</div>
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
   PG SELECTION SCREEN
══════════════════════════════════════════════ */
const PGSelectionScreen = ({ pgList, pgStats, view, setView, onSelect, onRefresh }) => {
  const totalRequests = pgList.reduce((sum, pg) => sum + pg.totalRequests, 0);
  const totalPending = Object.values(pgStats).reduce((sum, s) => sum + s.pending, 0);

  return (
    <div style={s.container}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Vacate Requests</h1>
          <p style={s.pageSubtitle}>{pgList.length} properties · {totalRequests} total · {totalPending} pending</p>
        </div>
        <button onClick={onRefresh} style={s.refreshBtn}>Refresh</button>
      </div>

      {/* Active/History Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button 
          onClick={() => setView("active")}
          style={{
            padding: "8px 20px",
            borderRadius: 24,
            border: "none",
            background: view === "active" ? "#4f46e5" : "#e5e7eb",
            color: view === "active" ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Active
        </button>
        <button 
          onClick={() => setView("history")}
          style={{
            padding: "8px 20px",
            borderRadius: 24,
            border: "none",
            background: view === "history" ? "#4f46e5" : "#e5e7eb",
            color: view === "history" ? "#fff" : "#333",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          History
        </button>
      </div>

      <div style={s.pgGrid}>
        {pgList.map((pg) => {
          const stats = pgStats[pg.name] || {};
          return (
            <div key={pg.name} style={s.pgCard} onClick={() => onSelect(pg.name)}>
              <div style={s.pgCardHeader}>
                <div style={s.pgAvatar}>{pg.name[0]?.toUpperCase() || "P"}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.pgName}>{pg.name}</div>
                  <div style={s.pgTotal}>{pg.totalRequests} request{pg.totalRequests !== 1 ? "s" : ""}</div>
                </div>
                <span style={s.arrowIcon}>›</span>
              </div>
              <div style={s.pgStatRow}>
                {stats.pending > 0 && <span style={{ ...s.pgBadge, background: "#fef3c7", color: "#92400e" }}>Pending {stats.pending}</span>}
                {stats.awaiting > 0 && <span style={{ ...s.pgBadge, background: "#fffbeb", color: "#b45309" }}>Awaiting {stats.awaiting}</span>}
                {stats.ready > 0 && <span style={{ ...s.pgBadge, background: "#eef2ff", color: "#3730a3" }}>Ready {stats.ready}</span>}
                {stats.paid > 0 && <span style={{ ...s.pgBadge, background: "#dcfce7", color: "#166534" }}>Paid {stats.paid}</span>}
                {stats.rejected > 0 && <span style={{ ...s.pgBadge, background: "#fee2e2", color: "#991b1b" }}>Rejected {stats.rejected}</span>}
                {pg.totalRequests === 0 && <span style={{ ...s.pgBadge, background: "#f1f5f9", color: "#64748b" }}>No requests</span>}
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
const PGDetailScreen = ({ pgName, requests, pgStats, view, damage, dues, setDamage, setDues, loadingId, onApprove, onReject, onMarkPaid, onBack }) => {
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
      <div style={s.detailHeader}>
        <button onClick={onBack} style={s.backBtn}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 style={s.pageTitle}>{pgName}</h1>
          <p style={s.pageSubtitle}>{requests.length} total request{requests.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Active/History Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button 
          disabled
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            border: "none",
            background: view === "active" ? "#4f46e5" : "#e5e7eb",
            color: view === "active" ? "#fff" : "#333",
            fontWeight: 500,
            fontSize: 13,
            cursor: "default",
            opacity: 0.7,
          }}
        >
          {view === "active" ? "Active View" : "History View"}
        </button>
      </div>

      <div style={s.summaryRow}>
        {stats.pending > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #d97706" }}><div style={s.summaryNum}>{stats.pending}</div><div style={s.summaryLabel}>Pending</div></div>}
        {stats.awaiting > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #f59e0b" }}><div style={s.summaryNum}>{stats.awaiting}</div><div style={s.summaryLabel}>Awaiting</div></div>}
        {stats.ready > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #4f46e5" }}><div style={s.summaryNum}>{stats.ready}</div><div style={s.summaryLabel}>Ready</div></div>}
        {stats.paid > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #16a34a" }}><div style={s.summaryNum}>{stats.paid}</div><div style={s.summaryLabel}>Paid</div></div>}
        {stats.rejected > 0 && <div style={{ ...s.summaryCard, borderLeft: "3px solid #dc2626" }}><div style={s.summaryNum}>{stats.rejected}</div><div style={s.summaryLabel}>Rejected</div></div>}
      </div>

      <div style={s.filterRow}>
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ ...s.filterChip, ...(filter === f.key ? s.filterChipActive : {}) }}>
            {f.label}
            {counts[f.key] > 0 && <span style={{ ...s.chipCount, ...(filter === f.key ? s.chipCountActive : {}) }}>{counts[f.key]}</span>}
          </button>
        ))}
      </div>

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
  const [view, setView] = useState("active"); // active | history

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

  // ✅ STEP 1: Keep only latest record per booking (no duplicates)
  const uniqueRequests = useMemo(() => {
    const map = new Map();
    
    requests.forEach((r) => {
      // Always keep latest row (based on id or created_at)
      if (!map.has(r.booking_id) || map.get(r.booking_id).id < r.id) {
        map.set(r.booking_id, r);
      }
    });
    
    return Array.from(map.values());
  }, [requests]);

  // ✅ STEP 2: Active requests (LEAVING or not paid/completed)
  const activeRequests = useMemo(() => {
    return uniqueRequests.filter(
      (r) =>
        r.status === "LEAVING" ||
        (r.refund_status !== "paid" && r.vacate_status !== "completed")
    );
  }, [uniqueRequests]);

  // ✅ STEP 3: History requests (paid OR completed)
  const historyRequests = useMemo(() => {
    return uniqueRequests.filter(
      (r) =>
        r.refund_status === "paid" ||
        (r.status === "LEFT" && r.vacate_status === "completed")
    );
  }, [uniqueRequests]);

  // ✅ STEP 4: Display based on view
  const displayRequests = view === "active" ? activeRequests : historyRequests;

  // Group by PG name using display requests
  const pgGroups = useMemo(() => {
    const groups = {};
    displayRequests.forEach(req => {
      const name = req.pg_name || "Unknown PG";
      if (!groups[name]) groups[name] = [];
      groups[name].push(req);
    });
    return groups;
  }, [displayRequests]);

  const pgStats = useMemo(() => {
    const stats = {};
    Object.keys(pgGroups).forEach(pgName => {
      const reqs = pgGroups[pgName];
      stats[pgName] = {
        total: reqs.length,
        pending: reqs.filter(r => r.refund_status === "pending" && (!r.user_approval || r.user_approval === "pending")).length,
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
      await loadRequests();
    } catch { alert("Approval failed"); } finally { setLoadingId(null); }
  };

  const handleReject = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await user.getIdToken();
      await api.post(`/owner/refund/reject/${bookingId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Refund Rejected");
      await loadRequests();
    } catch { alert("Reject failed"); } finally { setLoadingId(null); }
  };

  const handleMarkPaid = async (bookingId) => {
    try {
      setLoadingId(bookingId);
      const token = await user.getIdToken();
      await api.post(`/owner/refund/mark-paid/${bookingId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert("Payment Completed");
      await loadRequests();
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
        view={view}
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
      view={view}
      setView={setView}
      onSelect={setSelectedPG}
      onRefresh={loadRequests}
    />
  );
};

export default OwnerVacateRequests;

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const s = {
  container: {
    minHeight: "100vh",
    background: "#f0f2f5",
    padding: "24px",
    maxWidth: 900,
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 12,
  },
  detailHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#666",
    margin: "4px 0 0",
  },
  refreshBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
    cursor: "pointer",
  },
  backBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  pgGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  pgCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  pgCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  pgAvatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  pgName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: 2,
  },
  pgTotal: {
    fontSize: 12,
    color: "#94a3b8",
  },
  arrowIcon: {
    fontSize: 20,
    color: "#cbd5e1",
    fontWeight: 300,
  },
  pgStatRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  pgBadge: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  },
  summaryRow: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "12px 18px",
    border: "1px solid #e5e7eb",
    minWidth: 80,
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a2e",
    lineHeight: 1.1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
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
  cardsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
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
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginBottom: 14,
  },
  detailBox: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "10px",
    textAlign: "center",
  },
  detailLabel: {
    display: "block",
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 4,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  bankSection: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: "12px",
  },
  bankHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bankTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
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
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "6px 12px",
    flex: 1,
    minWidth: 90,
  },
  bankLabel: {
    display: "block",
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 2,
  },
  bankValue: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  reasonBox: {
    marginTop: 12,
    padding: "10px 12px",
    background: "#fefce8",
    borderRadius: 10,
    fontSize: 12,
    color: "#78350f",
  },
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
    color: "#64748b",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    marginBottom: 10,
    boxSizing: "border-box",
    outline: "none",
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
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#64748b",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94a3b8",
  },
};