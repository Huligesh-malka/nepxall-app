import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box } from "@mui/material";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";

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

/* ── Status config (aligned with backend) ── */
const statusConfig = (item) => {
  // Backend status "completed" = paid
  if (item.refund_status === "completed") {
    return { label: "Paid", color: "#10b981", bg: "rgba(16,185,129,0.12)", glow: "0 0 8px rgba(16,185,129,0.3)" };
  }
  if (item.refund_status === "approved") {
    return { label: "Approved", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", glow: "0 0 8px rgba(245,158,11,0.3)" };
  }
  if (item.refund_status === "pending" && item.user_approval === "accepted") {
    return { label: "Ready", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", glow: "0 0 8px rgba(139,92,246,0.3)" };
  }
  if (item.refund_status === "rejected") {
    return { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.12)", glow: "0 0 8px rgba(239,68,68,0.3)" };
  }
  if (item.status === "LEAVING" && item.vacate_status === "requested") {
    return { label: "Pending", color: "#64748b", bg: "rgba(100,116,139,0.1)", glow: "none" };
  }
  return { label: "Pending", color: "#64748b", bg: "rgba(100,116,139,0.1)", glow: "none" };
};

/* ── Filter definitions ── */
const FILTERS = [
  { key: "all", label: "All", icon: "⊚" },
  { key: "pending", label: "Pending", icon: "⏳" },
  { key: "approved", label: "Approved", icon: "✓" },
  { key: "ready", label: "Ready", icon: "⚡" },
  { key: "completed", label: "Paid", icon: "💰" },
  { key: "rejected", label: "Rejected", icon: "✕" },
];

const matchesFilter = (item, key) => {
  switch (key) {
    case "all": return true;
    case "pending": 
      return item.refund_status === "pending" && 
        (!item.user_approval || item.user_approval === "pending");
    case "approved": return item.refund_status === "approved";
    case "ready": return item.refund_status === "pending" && item.user_approval === "accepted";
    case "completed": return item.refund_status === "completed";
    case "rejected": return item.refund_status === "rejected" || item.user_approval === "rejected";
    default: return true;
  }
};

/* ══════════════════════════════════════════════
   GLASS CONFIRMATION MODAL
══════════════════════════════════════════════ */
const GlassModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;
  return (
    <div style={s.modalOverlay}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={s.modalContent}
      >
        <div style={s.modalIcon}>⚠️</div>
        <h3 style={s.modalTitle}>{title}</h3>
        <p style={s.modalMessage}>{message}</p>
        <div style={s.modalActions}>
          <button onClick={onClose} style={s.modalCancelBtn} disabled={loading}>Cancel</button>
          <button onClick={onConfirm} style={s.modalConfirmBtn} disabled={loading}>
            {loading ? "..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   FLOATING ACTION MENU
══════════════════════════════════════════════ */
const FloatingActionMenu = ({ item, onApprove, onReject, onMarkPaid, loadingId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [damage, setDamage] = useState("");
  const [dues, setDues] = useState("");
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setIsOpen(false));

  const canApprove = item.refund_status !== "completed" && item.user_approval !== "accepted";
  const canMarkPaid = item.refund_status === "pending" && item.user_approval === "accepted";
  const canReject = item.refund_status !== "completed" && item.user_approval !== "accepted";

  const handleApproveClick = () => {
    setIsOpen(false);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = () => {
    onApprove(item, { damage_amount: Number(damage) || 0, pending_dues: Number(dues) || 0 });
    setShowApproveModal(false);
    setDamage("");
    setDues("");
  };

  const handleRejectClick = () => {
    setIsOpen(false);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    onReject(item);
    setShowRejectModal(false);
  };

  const handleMarkPaidClick = () => {
    setIsOpen(false);
    onMarkPaid(item);
  };

  const refundPreview = () => {
    const deposit = item.security_deposit || 0;
    const damageAmt = Number(damage) || 0;
    const duesAmt = Number(dues) || 0;
    const refund = deposit - damageAmt - duesAmt;
    return refund > 0 ? refund : 0;
  };

  return (
    <div style={s.fabContainer} ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={s.fabButton}
      >
        <span style={{ ...s.fabDot, transform: isOpen ? "rotate(45deg)" : "none" }}>+</span>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            style={s.fabMenu}
          >
            {canApprove && (
              <button onClick={handleApproveClick} style={s.fabMenuItem} disabled={loadingId === item.id}>
                <span style={{ ...s.fabMenuIcon, background: "linear-gradient(135deg, #10b981, #059669)" }}>✓</span>
                Approve
              </button>
            )}
            {canMarkPaid && (
              <button onClick={handleMarkPaidClick} style={s.fabMenuItem} disabled={loadingId === item.id}>
                <span style={{ ...s.fabMenuIcon, background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>₹</span>
                Mark Paid
              </button>
            )}
            {canReject && (
              <button onClick={handleRejectClick} style={{ ...s.fabMenuItem, color: "#ef4444" }} disabled={loadingId === item.id}>
                <span style={{ ...s.fabMenuIcon, background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>✕</span>
                Reject
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Modal with Financial Input */}
      <GlassModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleConfirmApprove}
        title="Approve Vacate Request"
        message="Enter damage charges and pending dues"
        loading={loadingId === item.id}
      />
      
      {/* Inline Financial Input inside modal overlay (custom) */}
      {showApproveModal && (
        <div style={s.financialOverlay}>
          <div style={s.financialCard}>
            <div style={s.financialHeader}>
              <span>💰 Financial Adjustment</span>
            </div>
            <div style={s.financialRow}>
              <label>Security Deposit</label>
              <span style={s.financialValue}>₹{item.security_deposit || 0}</span>
            </div>
            <div style={s.financialRow}>
              <label>Damage Charges</label>
              <input 
                type="number" 
                placeholder="0" 
                value={damage} 
                onChange={(e) => setDamage(e.target.value)} 
                style={s.financialInput}
              />
            </div>
            <div style={s.financialRow}>
              <label>Pending Dues</label>
              <input 
                type="number" 
                placeholder="0" 
                value={dues} 
                onChange={(e) => setDues(e.target.value)} 
                style={s.financialInput}
              />
            </div>
            <div style={s.financialPreview}>
              <span>Refund Amount</span>
              <strong>₹{refundPreview()}</strong>
            </div>
          </div>
        </div>
      )}

      <GlassModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        title="Reject Refund"
        message="Are you sure you want to reject this refund request? This action cannot be undone."
        loading={loadingId === item.id}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════
   BANK DETAILS (Backend-controlled masking)
══════════════════════════════════════════════ */
const BankDetails = ({ item }) => {
  // Backend already sends FULL for approved, MASKED for completed/others
  // Frontend just displays as-is - no toggle override
  return (
    <div style={s.bankSection}>
      <div style={s.bankHeader}>
        <span style={s.bankTitle}>🏦 Bank Details</span>
        <span style={s.bankSecureBadge}>🔒 Secured</span>
      </div>
      <div style={s.bankRow}>
        <div style={s.bankChip}>
          <span style={s.bankLabel}>Account</span>
          <span style={s.bankValue}>{item.account_number || "N/A"}</span>
        </div>
        <div style={s.bankChip}>
          <span style={s.bankLabel}>IFSC</span>
          <span style={s.bankValue}>{item.ifsc_code || "N/A"}</span>
        </div>
        <div style={s.bankChip}>
          <span style={s.bankLabel}>UPI</span>
          <span style={s.bankValue}>{item.upi_id || "N/A"}</span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   REQUEST CARD
══════════════════════════════════════════════ */
const RequestCard = ({ item, loadingId, onApprove, onReject, onMarkPaid }) => {
  const st = statusConfig(item);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{ ...s.card, boxShadow: st.glow !== "none" ? `0 8px 24px ${st.glow}` : "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      <div style={s.cardTop}>
        <div style={{ ...s.avatar, background: `linear-gradient(135deg, #8b5cf6, #6366f1)` }}>
          {item.user_name?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={s.tenantName}>{item.user_name}</div>
          <div style={s.bookingId}>Booking #{item.booking_id}</div>
        </div>
        <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>{st.label}</span>
        <FloatingActionMenu 
          item={item} 
          onApprove={onApprove} 
          onReject={onReject} 
          onMarkPaid={onMarkPaid} 
          loadingId={loadingId}
        />
      </div>

      <div style={s.detailGrid}>
        <div style={s.detailBox}>
          <span style={s.detailLabel}>📅 Move Out</span>
          <span style={s.detailVal}>{formatDate(item.move_out_date)}</span>
        </div>
        <div style={s.detailBox}>
          <span style={s.detailLabel}>🏦 Deposit</span>
          <span style={s.detailVal}>₹{item.security_deposit || 0}</span>
        </div>
        <div style={s.detailBox}>
          <span style={s.detailLabel}>💸 Refund</span>
          <span style={s.detailVal}>₹{item.refund_amount || 0}</span>
        </div>
        <div style={s.detailBox}>
          <span style={s.detailLabel}>⚠️ Damage</span>
          <span style={s.detailVal}>₹{item.damage_amount || 0}</span>
        </div>
      </div>

      <BankDetails item={item} />
      
      {item.reason && (
        <div style={s.reasonBox}>
          <span style={{ fontWeight: 500 }}>📝 Reason:</span> {item.reason}
        </div>
      )}
    </motion.div>
  );
};

/* ══════════════════════════════════════════════
   PG SELECTION SCREEN (Dashboard)
══════════════════════════════════════════════ */
const PGSelectionScreen = ({ pgList, pgStats, view, setView, onSelect, onRefresh }) => {
  const totalRequests = pgList.reduce((sum, pg) => sum + pg.totalRequests, 0);
  const totalPending = Object.values(pgStats).reduce((sum, s) => sum + s.pending, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div style={s.container}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Vacate Requests</h1>
          <p style={s.pageSubtitle}>{pgList.length} properties · {totalRequests} total · {totalPending} pending</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRefresh} style={s.refreshBtn}>
          ↻ Refresh
        </motion.button>
      </div>

      {/* Active/History Tabs */}
      <div style={s.tabContainer}>
        <button 
          onClick={() => setView("active")}
          style={{ ...s.tabButton, ...(view === "active" ? s.tabButtonActive : {}) }}
        >
          🔥 Active
          {view === "active" && <span style={s.tabActiveIndicator} />}
        </button>
        <button 
          onClick={() => setView("history")}
          style={{ ...s.tabButton, ...(view === "history" ? s.tabButtonActive : {}) }}
        >
          📜 History
          {view === "history" && <span style={s.tabActiveIndicator} />}
        </button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={s.pgGrid}
      >
        {pgList.map((pg) => {
          const stats = pgStats[pg.name] || {};
          return (
            <motion.div
              key={pg.name}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={s.pgCard}
              onClick={() => onSelect(pg.name)}
            >
              <div style={s.pgCardHeader}>
                <div style={s.pgAvatar}>{pg.name[0]?.toUpperCase() || "P"}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.pgName}>{pg.name}</div>
                  <div style={s.pgTotal}>{pg.totalRequests} request{pg.totalRequests !== 1 ? "s" : ""}</div>
                </div>
                <span style={s.arrowIcon}>→</span>
              </div>
              <div style={s.pgStatRow}>
                {stats.pending > 0 && <span style={{ ...s.pgBadge, background: "rgba(100,116,139,0.12)", color: "#64748b" }}>⏳ {stats.pending}</span>}
                {stats.approved > 0 && <span style={{ ...s.pgBadge, background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>✓ {stats.approved}</span>}
                {stats.ready > 0 && <span style={{ ...s.pgBadge, background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>⚡ {stats.ready}</span>}
                {stats.completed > 0 && <span style={{ ...s.pgBadge, background: "rgba(16,185,129,0.12)", color: "#10b981" }}>💰 {stats.completed}</span>}
                {stats.rejected > 0 && <span style={{ ...s.pgBadge, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>✕ {stats.rejected}</span>}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {pgList.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={s.emptyState}
        >
          <div style={s.emptyIllustration}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="50" stroke="#e2e8f0" strokeWidth="2" fill="#f8fafc"/>
              <path d="M60 30 L60 50 M60 70 L60 90 M40 60 L50 60 M70 60 L80 60" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="60" cy="60" r="4" fill="#94a3b8"/>
            </svg>
          </div>
          <div style={s.emptyTitle}>All caught up</div>
          <div style={s.emptySubtitle}>No vacate requests at the moment</div>
        </motion.div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   PG DETAIL SCREEN
══════════════════════════════════════════════ */
const PGDetailScreen = ({ pgName, requests, pgStats, view, loadingId, onApprove, onReject, onMarkPaid, onBack }) => {
  const [filter, setFilter] = useState("all");
  const stats = pgStats[pgName] || {};

  const counts = useMemo(() => {
    const c = { all: requests.length };
    FILTERS.forEach(f => { if (f.key !== "all") c[f.key] = requests.filter(r => matchesFilter(r, f.key)).length; });
    return c;
  }, [requests]);

  const filtered = useMemo(() => requests.filter(r => matchesFilter(r, filter)), [requests, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={s.container}
    >
      <div style={s.detailHeader}>
        <motion.button whileHover={{ x: -4 }} whileTap={{ scale: 0.98 }} onClick={onBack} style={s.backBtn}>
          ← Back
        </motion.button>
        <div style={{ flex: 1 }}>
          <h1 style={s.pageTitle}>{pgName}</h1>
          <p style={s.pageSubtitle}>{requests.length} total request{requests.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Summary Stats with animation */}
      <div style={s.summaryRow}>
        {stats.pending > 0 && <div style={s.summaryCard}><div style={s.summaryNum}>{stats.pending}</div><div style={s.summaryLabel}>Pending</div></div>}
        {stats.approved > 0 && <div style={s.summaryCard}><div style={s.summaryNum}>{stats.approved}</div><div style={s.summaryLabel}>Approved</div></div>}
        {stats.ready > 0 && <div style={s.summaryCard}><div style={s.summaryNum}>{stats.ready}</div><div style={s.summaryLabel}>Ready</div></div>}
        {stats.completed > 0 && <div style={s.summaryCard}><div style={s.summaryNum}>{stats.completed}</div><div style={s.summaryLabel}>Paid</div></div>}
        {stats.rejected > 0 && <div style={s.summaryCard}><div style={s.summaryNum}>{stats.rejected}</div><div style={s.summaryLabel}>Rejected</div></div>}
      </div>

      {/* Filter Chips */}
      <div style={s.filterRow}>
        {FILTERS.map((f) => (
          <motion.button
            key={f.key}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setFilter(f.key)}
            style={{ ...s.filterChip, ...(filter === f.key ? s.filterChipActive : {}) }}
          >
            <span style={s.filterIcon}>{f.icon}</span>
            {f.label}
            {counts[f.key] > 0 && (
              <span style={{ ...s.chipCount, ...(filter === f.key ? s.chipCountActive : {}) }}>{counts[f.key]}</span>
            )}
          </motion.button>
        ))}
      </div>

      <div style={s.cardsList}>
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.emptyState}>
            <div style={s.emptyIllustration}>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="30" y="35" width="40" height="40" rx="8" stroke="#cbd5e1" strokeWidth="2" fill="#f8fafc"/>
                <path d="M45 50 L55 60 M55 50 L45 60" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={s.emptyTitle}>No matching requests</div>
            <div style={s.emptySubtitle}>Try a different filter</div>
          </motion.div>
        ) : (
          filtered.map((item) => (
            <RequestCard 
              key={item.id} 
              item={item} 
              loadingId={loadingId} 
              onApprove={onApprove} 
              onReject={onReject} 
              onMarkPaid={onMarkPaid} 
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const OwnerVacateRequests = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedPG, setSelectedPG] = useState(null);
  const [view, setView] = useState("active");

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

  // Keep only latest record per booking
  const uniqueRequests = useMemo(() => {
    const map = new Map();
    requests.forEach((r) => {
      if (!map.has(r.booking_id) || map.get(r.booking_id).id < r.id) {
        map.set(r.booking_id, r);
      }
    });
    return Array.from(map.values());
  }, [requests]);

  // Active requests (not completed/paid)
  const activeRequests = useMemo(() => {
    return uniqueRequests.filter(
      (r) => r.refund_status !== "completed" && r.vacate_status !== "completed"
    );
  }, [uniqueRequests]);

  // History requests (completed/paid)
  const historyRequests = useMemo(() => {
    return uniqueRequests.filter(
      (r) => r.refund_status === "completed" || r.vacate_status === "completed"
    );
  }, [uniqueRequests]);

  const displayRequests = view === "active" ? activeRequests : historyRequests;

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
        approved: reqs.filter(r => r.refund_status === "approved").length,
        ready: reqs.filter(r => r.refund_status === "pending" && r.user_approval === "accepted").length,
        completed: reqs.filter(r => r.refund_status === "completed").length,
        rejected: reqs.filter(r => r.refund_status === "rejected" || r.user_approval === "rejected").length,
      };
    });
    return stats;
  }, [pgGroups]);

  const pgList = useMemo(() => Object.keys(pgGroups).map(name => ({ name, totalRequests: pgGroups[name].length })), [pgGroups]);

  // Approve uses booking_id
  const handleApprove = async (item, financials) => {
    const bookingId = item.booking_id;
    try {
      setLoadingId(item.id);
      const token = await user.getIdToken();
      const res = await api.post(
        `/owner/vacate/approve/${bookingId}`,
        { damage_amount: financials.damage_amount, pending_dues: financials.pending_dues },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Approved! Refund: ₹${res.data.refundAmount}`);
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Approval failed");
    } finally { 
      setLoadingId(null); 
    }
  };

  // Reject uses booking_id
  const handleReject = async (item) => {
    const bookingId = item.booking_id;
    try {
      setLoadingId(item.id);
      const token = await user.getIdToken();
      await api.post(
        `/owner/refund/reject/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Refund Rejected");
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Reject failed");
    } finally { 
      setLoadingId(null); 
    }
  };

  // Mark Paid uses refund.id
  const handleMarkPaid = async (item) => {
    const refundId = item.id;
    try {
      setLoadingId(refundId);
      const token = await user.getIdToken();
      await api.post(
        `/owner/refund/mark-paid/${refundId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Payment Completed");
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Payment failed");
    } finally { 
      setLoadingId(null); 
    }
  };

  if (authLoading || pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div style={s.skeletonLoader}>
          <div style={s.skeletonCard} />
          <div style={s.skeletonCard} />
          <div style={s.skeletonCard} />
        </div>
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  if (selectedPG) {
    return (
      <PGDetailScreen
        pgName={selectedPG}
        requests={pgGroups[selectedPG] || []}
        pgStats={pgStats}
        view={view}
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
   STYLES - Premium SaaS Design
══════════════════════════════════════════════ */
const s = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fb 0%, #eef2f6 100%)",
    padding: "28px 24px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 16,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    background: "linear-gradient(135deg, #1e293b, #334155)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: "6px 0 0",
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(203,213,225,0.5)",
    borderRadius: 40,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  backBtn: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(203,213,225,0.5)",
    borderRadius: 40,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  tabContainer: {
    display: "flex",
    gap: 8,
    marginBottom: 28,
    background: "rgba(255,255,255,0.5)",
    borderRadius: 60,
    padding: 4,
    width: "fit-content",
  },
  tabButton: {
    padding: "10px 28px",
    borderRadius: 60,
    border: "none",
    background: "transparent",
    fontSize: 14,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
  },
  tabButtonActive: {
    background: "#ffffff",
    color: "#4f46e5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  tabActiveIndicator: {
    position: "absolute",
    bottom: -2,
    left: "20%",
    width: "60%",
    height: 2,
    background: "#4f46e5",
    borderRadius: 2,
  },
  pgGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
  },
  pgCard: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    borderRadius: 24,
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.5)",
    cursor: "pointer",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
  },
  pgCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  pgAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 600,
    color: "#fff",
    flexShrink: 0,
    boxShadow: "0 8px 16px -4px rgba(99,102,241,0.3)",
  },
  pgName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 2,
  },
  pgTotal: {
    fontSize: 12,
    color: "#94a3b8",
  },
  arrowIcon: {
    fontSize: 18,
    color: "#cbd5e1",
    fontWeight: 500,
  },
  pgStatRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  pgBadge: {
    padding: "4px 12px",
    borderRadius: 30,
    fontSize: 11,
    fontWeight: 600,
  },
  summaryRow: {
    display: "flex",
    gap: 12,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  summaryCard: {
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "14px 22px",
    border: "1px solid rgba(255,255,255,0.6)",
    minWidth: 90,
    transition: "all 0.2s",
  },
  summaryNum: {
    fontSize: 28,
    fontWeight: 700,
    background: "linear-gradient(135deg, #1e293b, #475569)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1.1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  filterRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 18px",
    borderRadius: 40,
    border: "1px solid rgba(203,213,225,0.6)",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(4px)",
    fontSize: 13,
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterChipActive: {
    background: "#4f46e5",
    borderColor: "#4f46e5",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
  },
  filterIcon: {
    fontSize: 12,
  },
  chipCount: {
    background: "rgba(0,0,0,0.08)",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  },
  chipCountActive: {
    background: "rgba(255,255,255,0.25)",
  },
  cardsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: "20px",
    border: "1px solid rgba(226,232,240,0.8)",
    transition: "all 0.25s ease",
    position: "relative",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 600,
    color: "#fff",
    flexShrink: 0,
    boxShadow: "0 6px 12px -4px rgba(99,102,241,0.25)",
  },
  tenantName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
  },
  bookingId: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
    fontFamily: "monospace",
  },
  statusBadge: {
    padding: "5px 14px",
    borderRadius: 40,
    fontSize: 12,
    fontWeight: 600,
    backdropFilter: "blur(4px)",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 18,
  },
  detailBox: {
    background: "#f8fafc",
    borderRadius: 14,
    padding: "10px 8px",
    textAlign: "center",
    transition: "all 0.2s",
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
    color: "#0f172a",
  },
  bankSection: {
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    borderRadius: 16,
    padding: "14px",
    marginBottom: 12,
  },
  bankHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bankTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
  },
  bankSecureBadge: {
    fontSize: 10,
    color: "#10b981",
    background: "rgba(16,185,129,0.12)",
    padding: "2px 8px",
    borderRadius: 30,
  },
  bankRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  bankChip: {
    background: "#ffffff",
    borderRadius: 12,
    padding: "8px 12px",
    flex: 1,
    minWidth: 90,
    border: "1px solid #e2e8f0",
  },
  bankLabel: {
    display: "block",
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 3,
  },
  bankValue: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
    fontFamily: "monospace",
  },
  reasonBox: {
    marginTop: 12,
    padding: "10px 14px",
    background: "rgba(245,158,11,0.06)",
    borderRadius: 14,
    fontSize: 12,
    color: "#78350f",
    borderLeft: "3px solid #f59e0b",
  },
  fabContainer: {
    position: "relative",
  },
  fabButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(79,70,229,0.4)",
    transition: "all 0.2s",
  },
  fabDot: {
    fontSize: 20,
    fontWeight: 600,
    color: "#fff",
    display: "inline-block",
    transition: "transform 0.2s",
  },
  fabMenu: {
    position: "absolute",
    right: 0,
    bottom: "calc(100% + 8px)",
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
    border: "1px solid rgba(226,232,240,0.8)",
    minWidth: 140,
    overflow: "hidden",
    zIndex: 100,
  },
  fabMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "#334155",
    textAlign: "left",
    transition: "background 0.15s",
  },
  fabMenuIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    flexShrink: 0,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "rgba(255,255,255,0.98)",
    borderRadius: 32,
    padding: "28px",
    width: "90%",
    maxWidth: 400,
    textAlign: "center",
    boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.5)",
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#0f172a",
    margin: "0 0 8px",
  },
  modalMessage: {
    fontSize: 14,
    color: "#64748b",
    margin: "0 0 24px",
  },
  modalActions: {
    display: "flex",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: 40,
    border: "1px solid #e2e8f0",
    background: "#f1f5f9",
    fontSize: 14,
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
  },
  modalConfirmBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: 40,
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
  },
  financialOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
  },
  financialCard: {
    background: "#ffffff",
    borderRadius: 28,
    padding: "24px",
    width: "90%",
    maxWidth: 340,
    boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
  },
  financialHeader: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "1px solid #e2e8f0",
  },
  financialRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  financialValue: {
    fontWeight: 600,
    color: "#0f172a",
  },
  financialInput: {
    width: 120,
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    textAlign: "right",
  },
  financialPreview: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTop: "2px dashed #e2e8f0",
    fontSize: 16,
    fontWeight: 600,
    color: "#4f46e5",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyIllustration: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  skeletonLoader: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    padding: 24,
  },
  skeletonCard: {
    height: 200,
    background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: 24,
  },
};

// Add keyframe animation for skeleton
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(styleSheet);