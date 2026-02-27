import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { adminPGAPI } from "../../api/api";
import { API_CONFIG } from "../../config";

const FILES_BASE =
  API_CONFIG?.FILES_URL ||
  process.env.REACT_APP_FILES_URL ||
  "https://nepxall-backend.onrender.com";

const AdminPGDetails = () => {
  const { id } = useParams();

  const [pg, setPG] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  /* ================= LOAD PG ================= */

  const loadPG = useCallback(async () => {
    try {
      setLoading(true);

      const res = await adminPGAPI.getPGById(id);

      const data = res.data.data;

      setPG(data);
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      console.error("Load PG error:", err);
      alert("Failed to load PG details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* ================= AUTH READY ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return setLoading(false);
      loadPG();
    });

    return () => unsub();
  }, [loadPG]);

  /* ================= ACTIONS ================= */

  const approve = async () => {
    if (!window.confirm("Approve this property?")) return;

    try {
      setActionLoading(true);
      await adminPGAPI.approvePG(id);
      await loadPG();
    } catch {
      alert("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return alert("Enter rejection reason");

    try {
      setActionLoading(true);
      await adminPGAPI.rejectPG(id, rejectReason);
      setShowReject(false);
      setRejectReason("");
      await loadPG();
    } catch {
      alert("Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= UI ================= */

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!pg) return <div className="p-10 text-center">No data found</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6 space-y-8">

        <Section title="Property Summary">
          <Row label="Property Name" value={pg.pg_name} />
          <Row label="Category" value={pg.pg_category} />
          <Row label="Type" value={pg.pg_type} />
          <Row label="Status" value={pg.status} />
        </Section>

        <Section title="Photos">
          {photos.length === 0 ? (
            <p>No photos</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((img, i) => (
                <img
                  key={i}
                  src={`${FILES_BASE}${img}`}
                  alt=""
                  className="h-40 w-full object-cover rounded"
                />
              ))}
            </div>
          )}
        </Section>

        {pg.status === "pending" && (
          <div className="flex justify-end gap-4 border-t pt-4">

            <button
              disabled={actionLoading}
              onClick={() => setShowReject(true)}
              className="border px-5 py-2 text-red-600"
            >
              Reject
            </button>

            <button
              disabled={actionLoading}
              onClick={approve}
              className="bg-blue-600 text-white px-5 py-2"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
          </div>
        )}

        {showReject && (
          <div className="border-t pt-4 space-y-3">
            <textarea
              placeholder="Enter rejection reason"
              className="w-full border p-2 rounded"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <button
              onClick={reject}
              className="bg-red-600 text-white px-5 py-2"
            >
              Submit Rejection
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

/* UI helpers */

const Section = ({ title, children }) => (
  <div>
    <h3 className="font-semibold mb-3">{title}</h3>
    <div className="grid md:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b pb-1">
    <span>{label}</span>
    <span>{value || "—"}</span>
  </div>
);

export default AdminPGDetails;